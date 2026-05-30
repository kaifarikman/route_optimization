import requests
from fastapi.testclient import TestClient

from backend.api.geocode import get_uow
from backend.main import app
from backend.services.geocoding import reset_geocoding_rate_limit


class FakeGeocodeCacheRepository:
    def __init__(self):
        self.items = {}

    def get(self, cache_key: str):
        return self.items.get(cache_key)

    def set(self, cache_key: str, query: str, provider: str, results: list[dict]):
        self.items[cache_key] = {
            "cache_key": cache_key,
            "query": query,
            "provider": provider,
            "results": results,
        }
        return self.items[cache_key]


class FakeUoW:
    def __init__(self):
        self.geocode_cache = FakeGeocodeCacheRepository()
        self.committed = False

    def commit(self):
        self.committed = True

    def rollback(self):
        return None


class FakeResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload if payload is not None else []

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"HTTP {self.status_code}")


def _override_uow(holder: dict):
    def _get_fake_uow():
        if "uow" not in holder:
            holder["uow"] = FakeUoW()
        yield holder["uow"]

    return _get_fake_uow


def _sample_payload():
    return [
        {
            "lat": "55.75393",
            "lon": "37.62080",
            "display_name": "Красная площадь, Москва, Россия",
            "place_id": 123,
            "category": "place",
            "type": "square",
            "importance": 0.9,
        }
    ]


def setup_function():
    reset_geocoding_rate_limit()
    app.dependency_overrides.clear()


def teardown_function():
    app.dependency_overrides.clear()
    reset_geocoding_rate_limit()


def test_geocode_endpoint_returns_normalized_results(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.services.geocoding.requests.get",
        lambda *args, **kwargs: FakeResponse(payload=_sample_payload()),
    )

    response = TestClient(app).post("/geocode", json={"query": "Красная площадь", "limit": 5})

    assert response.status_code == 200
    assert response.json() == {
        "results": [
            {
                "lat": 55.75393,
                "lon": 37.6208,
                "display_name": "Красная площадь, Москва, Россия",
                "provider": "nominatim",
                "place_id": "123",
                "category": "place",
                "type": "square",
                "importance": 0.9,
            }
        ]
    }
    assert holder["uow"].committed is True


def test_geocode_endpoint_rejects_invalid_request():
    response = TestClient(app).post("/geocode", json={"query": "  ", "limit": 6})

    assert response.status_code == 422


def test_geocode_endpoint_returns_empty_results(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.services.geocoding.requests.get",
        lambda *args, **kwargs: FakeResponse(payload=[]),
    )

    response = TestClient(app).post("/geocode", json={"query": "not found"})

    assert response.status_code == 200
    assert response.json() == {"results": []}


def test_geocode_endpoint_maps_provider_timeout(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)

    def _timeout(*args, **kwargs):
        raise requests.Timeout()

    monkeypatch.setattr("backend.services.geocoding.requests.get", _timeout)

    response = TestClient(app).post("/geocode", json={"query": "Москва"})

    assert response.status_code == 504


def test_geocode_endpoint_maps_upstream_rate_limit(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.services.geocoding.requests.get",
        lambda *args, **kwargs: FakeResponse(status_code=429),
    )

    response = TestClient(app).post("/geocode", json={"query": "Москва"})

    assert response.status_code == 429


def test_geocode_endpoint_maps_local_rate_limit(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.services.geocoding.requests.get",
        lambda *args, **kwargs: FakeResponse(payload=_sample_payload()),
    )
    client = TestClient(app)

    first = client.post("/geocode", json={"query": "Москва"})
    second = client.post("/geocode", json={"query": "Санкт-Петербург"})

    assert first.status_code == 200
    assert second.status_code == 429


def test_geocode_endpoint_cache_hit_bypasses_outbound_request(monkeypatch):
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(holder)
    calls = {"count": 0}

    def _fake_get(*args, **kwargs):
        calls["count"] += 1
        return FakeResponse(payload=_sample_payload())

    monkeypatch.setattr("backend.services.geocoding.requests.get", _fake_get)
    client = TestClient(app)

    first = client.post("/geocode", json={"query": "Москва"})
    second = client.post("/geocode", json={"query": "Москва"})

    assert first.status_code == 200
    assert second.status_code == 200
    assert calls["count"] == 1

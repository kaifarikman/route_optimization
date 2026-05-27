from fastapi.testclient import TestClient

from backend.api.dependencies import get_user_uow
from backend.domain.point import Point
from backend.main import app

USER_HEADERS = {"X-User-Id": "user-1"}


class FakePointRepository:
    def __init__(self, points: list[Point] | None = None):
        self._points = list(points or [])
        self._next_id = max([point.id for point in self._points], default=0) + 1

    def add(self, lat: float, lon: float) -> Point:
        point = Point(id=self._next_id, lat=lat, lon=lon)
        self._next_id += 1
        self._points.append(point)
        return point

    def list(self) -> list[Point]:
        return list(self._points)

    def count(self) -> int:
        return len(self._points)

    def clear_all(self) -> None:
        self._points.clear()


class FakeRouteRepository:
    def __init__(self):
        self.items = [{"id": 1}]
        self.clear_count = 0

    def clear_all(self) -> None:
        self.items.clear()
        self.clear_count += 1


class FakeUoW:
    def __init__(self, points: list[Point] | None = None):
        self.points = FakePointRepository(points)
        self.routes = FakeRouteRepository()
        self.committed = False

    def commit(self):
        self.committed = True

    def rollback(self):
        return None


def _override_uow(holder: dict, points: list[Point] | None = None):
    def _get_fake_uow():
        if "uow" not in holder:
            holder["uow"] = FakeUoW(points)
        yield holder["uow"]

    return _get_fake_uow


def test_generate_points_wraps_response(monkeypatch):
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.api.points.generate_points",
        lambda **kwargs: [{"id": 1, "lat": 55.75, "lon": 37.61}],
    )

    client = TestClient(app)
    response = client.post(
        "/points/generate",
        json={"center_lat": 55.75, "center_lon": 37.61, "radius_km": 1, "count": 1},
        headers=USER_HEADERS,
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.61}]}


def test_add_point_endpoint_returns_point_and_clears_routes():
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)

    client = TestClient(app)
    response = client.post("/points", json={"lat": 55.75, "lon": 37.62}, headers=USER_HEADERS)
    points_response = client.get("/points", headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"point": {"id": 1, "lat": 55.75, "lon": 37.62}}
    assert points_response.status_code == 200
    assert points_response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.62}]}
    assert holder["uow"].routes.items == []
    assert holder["uow"].routes.clear_count == 1
    assert holder["uow"].committed is True


def test_add_point_endpoint_returns_validation_error_for_invalid_latitude():
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)

    client = TestClient(app)
    response = client.post("/points", json={"lat": 900, "lon": 37.62}, headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 422


def test_add_point_endpoint_returns_400_when_limit_reached():
    holder = {}
    existing_points = [Point(id=index + 1, lat=55.75, lon=37.62) for index in range(50)]
    app.dependency_overrides[get_user_uow] = _override_uow(holder, existing_points)

    client = TestClient(app)
    response = client.post("/points", json={"lat": 55.76, "lon": 37.63}, headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {"detail": "Количество точек: не больше 50"}


def test_generate_points_returns_400_when_service_fails(monkeypatch):
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)

    def _raise_error(**kwargs):
        raise ValueError("boom")

    monkeypatch.setattr("backend.api.points.generate_points", _raise_error)

    client = TestClient(app)
    response = client.post(
        "/points/generate",
        json={"center_lat": 55.75, "center_lon": 37.61, "radius_km": 1, "count": 1},
        headers=USER_HEADERS,
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert response.json() == {"detail": "boom"}


def test_get_points_wraps_response(monkeypatch):
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)
    monkeypatch.setattr(
        "backend.api.points.get_points",
        lambda **kwargs: [{"id": 1, "lat": 55.75, "lon": 37.61}],
    )

    client = TestClient(app)
    response = client.get("/points", headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.61}]}


def test_get_points_returns_500_when_service_fails(monkeypatch):
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)

    def _raise_error(**kwargs):
        raise RuntimeError("storage unavailable")

    monkeypatch.setattr("backend.api.points.get_points", _raise_error)

    client = TestClient(app)
    response = client.get("/points", headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json() == {"detail": "storage unavailable"}


def test_clear_points_wraps_response(monkeypatch):
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(holder)
    monkeypatch.setattr("backend.api.points.clear_all_points", lambda **kwargs: 3)

    client = TestClient(app)
    response = client.delete("/points", headers=USER_HEADERS)

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"status": "cleared", "message": "Удалено точек: 3"}


def test_data_endpoint_requires_user_id_header():
    client = TestClient(app)
    response = client.get("/points")

    assert response.status_code == 400
    assert response.json() == {"error": "X-User-Id header is required"}


def test_import_points_endpoint_replaces_points_and_clears_routes():
    holder = {}
    app.dependency_overrides[get_user_uow] = _override_uow(
        holder,
        [Point(id=1, lat=55.75, lon=37.62)],
    )

    client = TestClient(app)
    response = client.post(
        "/points/import",
        json={"points": [{"lat": 55.76, "lon": 37.63}, {"lat": 55.77, "lon": 37.64}]},
        headers=USER_HEADERS,
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "points": [
            {"id": 2, "lat": 55.76, "lon": 37.63},
            {"id": 3, "lat": 55.77, "lon": 37.64},
        ]
    }
    assert holder["uow"].routes.items == []
    assert holder["uow"].routes.clear_count == 1
    assert holder["uow"].committed is True

from fastapi.testclient import TestClient

from backend.main import app


def test_generate_points_wraps_response(monkeypatch):
    monkeypatch.setattr(
        "backend.api.points.generate_points",
        lambda **kwargs: [{"id": 1, "lat": 55.75, "lon": 37.61}],
    )

    client = TestClient(app)
    response = client.post(
        "/points/generate",
        json={"center_lat": 55.75, "center_lon": 37.61, "radius_km": 1, "count": 1},
    )

    assert response.status_code == 200
    assert response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.61}]}


def test_generate_points_returns_400_when_service_fails(monkeypatch):
    def _raise_error(**kwargs):
        raise ValueError("boom")

    monkeypatch.setattr("backend.api.points.generate_points", _raise_error)

    client = TestClient(app)
    response = client.post(
        "/points/generate",
        json={"center_lat": 55.75, "center_lon": 37.61, "radius_km": 1, "count": 1},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "boom"}


def test_get_points_wraps_response(monkeypatch):
    monkeypatch.setattr(
        "backend.api.points.get_points",
        lambda **kwargs: [{"id": 1, "lat": 55.75, "lon": 37.61}],
    )

    client = TestClient(app)
    response = client.get("/points")

    assert response.status_code == 200
    assert response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.61}]}


def test_get_points_returns_500_when_service_fails(monkeypatch):
    def _raise_error(**kwargs):
        raise RuntimeError("storage unavailable")

    monkeypatch.setattr("backend.api.points.get_points", _raise_error)

    client = TestClient(app)
    response = client.get("/points")

    assert response.status_code == 500
    assert response.json() == {"detail": "storage unavailable"}


def test_clear_points_wraps_response(monkeypatch):
    monkeypatch.setattr("backend.api.points.clear_all_points", lambda **kwargs: 3)

    client = TestClient(app)
    response = client.delete("/points")

    assert response.status_code == 200
    assert response.json() == {"status": "cleared", "message": "Удалено точек: 3"}
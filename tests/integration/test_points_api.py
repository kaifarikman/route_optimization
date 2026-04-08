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


def test_get_points_wraps_response(monkeypatch):
    monkeypatch.setattr(
        "backend.api.points.get_points",
        lambda **kwargs: [{"id": 1, "lat": 55.75, "lon": 37.61}],
    )

    client = TestClient(app)
    response = client.get("/points")

    assert response.status_code == 200
    assert response.json() == {"points": [{"id": 1, "lat": 55.75, "lon": 37.61}]}

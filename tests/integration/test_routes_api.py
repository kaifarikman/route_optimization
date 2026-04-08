from fastapi.testclient import TestClient

from backend.main import app


def test_get_all_routes_wraps_response(monkeypatch):
    monkeypatch.setattr(
        "backend.api.routes.get_all_routes",
        lambda **kwargs: [
            {
                "id": 1,
                "points": [1, 2],
                "distance_km": 2.5,
                "duration_minutes": 3.75,
                "coordinates": [[55.75, 37.61], [55.76, 37.62]],
            }
        ],
    )

    client = TestClient(app)
    response = client.get("/routes")

    assert response.status_code == 200
    assert response.json() == {
        "routes": [
            {
                "id": 1,
                "points": [1, 2],
                "distance_km": 2.5,
                "duration_minutes": 3.75,
                "coordinates": [[55.75, 37.61], [55.76, 37.62]],
            }
        ],
        "total": 1,
    }

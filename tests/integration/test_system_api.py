from fastapi.testclient import TestClient

from backend.main import app


def test_health_endpoint_returns_ok():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Сервер запущен"}


def test_config_endpoint_returns_runtime_config():
    client = TestClient(app)

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json() == {
        "routing_api": "osrm",
        "version": "1.0.0",
        "cors_enabled": True,
        "database": "sqlite",
    }
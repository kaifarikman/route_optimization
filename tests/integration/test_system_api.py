from fastapi.testclient import TestClient

from backend.main import app
from backend.config import ROUTING_PROVIDER


def test_health_endpoint_returns_ok():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Сервер запущен"}


def test_config_endpoint_returns_runtime_config():
    client = TestClient(app)

    response = client.get("/config")

    assert response.status_code == 200
    data = response.json()
    assert data["routing_api"] == ROUTING_PROVIDER
    assert data["version"] == "1.0.0"
    assert data["cors_enabled"] is True
    assert data["database"] == "sqlite"
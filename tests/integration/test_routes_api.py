from fastapi.testclient import TestClient
from types import SimpleNamespace

from backend.domain.point import Point
from backend.main import app
from backend.api.routes import get_uow


class FakePointRepository:
    def __init__(self, points: list[Point]):
        self._points = {point.id: point for point in points}

    def get(self, point_id: int) -> Point | None:
        return self._points.get(point_id)

    def get_by_ids(self, point_ids: list[int]) -> list[Point]:
        return [self._points[point_id] for point_id in point_ids if point_id in self._points]


class FakeRouteRepository:
    def __init__(self):
        self._routes = []
        self._next_id = 1

    def add(
        self,
        points: list[int],
        coordinates: list[list[float]],
        geometry: list[list[float]],
        distance_km: float,
        duration_minutes: float,
        provider: str,
        is_fallback: bool,
        geometry_type: str,
        transport_type: str,
    ):
        route = {
            "id": self._next_id,
            "points": points,
            "coordinates": [tuple(item) for item in coordinates],
            "geometry": [tuple(item) for item in geometry],
            "distance_km": distance_km,
            "duration_minutes": duration_minutes,
            "provider": provider,
            "is_fallback": is_fallback,
            "geometry_type": geometry_type,
            "transport_type": transport_type,
        }
        self._next_id += 1
        self._routes.append(route)
        return SimpleNamespace(**route)

    def get(self, route_id: int):
        route = next((item for item in self._routes if item["id"] == route_id), None)
        return SimpleNamespace(**route) if route else None

    def list(self):
        return [SimpleNamespace(**route) for route in self._routes]


class FakeUoW:
    def __init__(self, points: list[Point]):
        self.points = FakePointRepository(points)
        self.routes = FakeRouteRepository()
        self.committed = False

    def commit(self):
        self.committed = True

    def rollback(self):
        return None


def _override_uow(points: list[Point], holder: dict):
    def _get_fake_uow():
        if "uow" not in holder:
            holder["uow"] = FakeUoW(points)
        yield holder["uow"]

    return _get_fake_uow


def test_build_base_route_endpoint_returns_route():
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(
        [
            Point(id=1, lat=55.75, lon=37.61),
            Point(id=2, lat=55.76, lon=37.62),
            Point(id=3, lat=55.77, lon=37.63),
        ],
        holder,
    )

    client = TestClient(app)
    response = client.post("/routes/base", json={"point_ids": [1, 2, 3]})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()["route"]
    assert data["points"] == [1, 2, 3]
    assert data["coordinates"] == [[55.75, 37.61], [55.76, 37.62], [55.77, 37.63]]
    assert data["distance_km"] > 0
    assert data["duration_minutes"] > 0

    assert len(data["geometry"]) == len(data["coordinates"])
    assert data["provider"] in ["osrm", "haversine"]
    assert isinstance(data["is_fallback"], bool)
    assert data["geometry_type"] in ["full", "straight"]
    assert data["transport_type"] == "driving"
    assert holder["uow"].committed is True


def test_optimize_route_endpoint_returns_route():
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(
        [
            Point(id=1, lat=55.75, lon=37.61),
            Point(id=2, lat=55.80, lon=37.80),
            Point(id=3, lat=55.751, lon=37.611),
            Point(id=4, lat=55.752, lon=37.612),
        ],
        holder,
    )

    client = TestClient(app)
    response = client.post("/routes/optimize", json={"point_ids": [1, 2, 3, 4]})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()["route"]
    assert data["points"][0] == 1
    assert sorted(data["points"]) == [1, 2, 3, 4]
    assert len(data["coordinates"]) == 4
    assert data["distance_km"] > 0
    assert data["duration_minutes"] > 0

    assert isinstance(data["geometry"], list)
    assert len(data["geometry"]) == len(data["coordinates"])
    assert data["provider"] in ["osrm", "haversine"]
    assert isinstance(data["is_fallback"], bool)
    assert data["geometry_type"] in ["full", "straight"]
    assert data["transport_type"] == "driving"
    assert holder["uow"].committed is True


def test_get_route_endpoint_returns_404_for_unknown_route():
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow([Point(id=1, lat=55.75, lon=37.61)], holder)

    client = TestClient(app)
    response = client.get("/routes/999")

    app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json() == {"detail": "Маршрут не найден"}


def test_get_all_routes_endpoint_returns_saved_routes():
    holder = {}
    app.dependency_overrides[get_uow] = _override_uow(
        [Point(id=1, lat=55.75, lon=37.61), Point(id=2, lat=55.76, lon=37.62)],
        holder,
    )

    client = TestClient(app)
    build_response = client.post("/routes/base", json={"point_ids": [1, 2]})
    list_response = client.get("/routes")

    app.dependency_overrides.clear()

    assert build_response.status_code == 200
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    route = list_response.json()["routes"][0]
    assert "id" in route
    assert "points" in route
    assert "coordinates" in route
    assert "geometry" in route
    assert "distance_km" in route
    assert "duration_minutes" in route
    assert "provider" in route
    assert "is_fallback" in route
    assert "geometry_type" in route
    assert "transport_type" in route
    assert list_response.json()["routes"][0]["points"] == [1, 2]
    assert isinstance(route["geometry"], list)
    assert isinstance(route["provider"], str)
    assert isinstance(route["is_fallback"], bool)
    assert isinstance(route["geometry_type"], str)
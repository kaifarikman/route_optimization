from types import SimpleNamespace

import pytest

from backend.domain.point import Point
from backend.services.route import build_base_route, get_all_routes, get_route_by_id, optimize_route


class FakePointRepository:
    def __init__(self, points: list[Point]):
        self._points = {point.id: point for point in points}

    def get(self, point_id: int) -> Point | None:
        return self._points.get(point_id)

    def get_by_ids(self, point_ids: list[int]) -> list[Point]:
        return [self._points[point_id] for point_id in point_ids if point_id in self._points]


class FakeRouteRepository:
    def __init__(self):
        self.items = []
        self.next_id = 1

    def add(self, points: list[int], coordinates: list[list[float]], distance_km: float, duration_minutes: float):
        route = SimpleNamespace(
            id=self.next_id,
            points=points,
            coordinates=[tuple(item) for item in coordinates],
            distance_km=distance_km,
            duration_minutes=duration_minutes,
        )
        self.next_id += 1
        self.items.append(route)
        return route

    def get(self, route_id: int):
        return next((route for route in self.items if route.id == route_id), None)

    def list(self):
        return list(self.items)


class FakeUoW:
    def __init__(self, points: list[Point]):
        self.points = FakePointRepository(points)
        self.routes = FakeRouteRepository()
        self.committed = False

    def commit(self):
        self.committed = True

    def rollback(self):
        return None


def test_build_base_route_saves_requested_order_and_commits():
    uow = FakeUoW(
        [
            Point(id=1, lat=55.75, lon=37.61),
            Point(id=2, lat=55.76, lon=37.62),
            Point(id=3, lat=55.77, lon=37.63),
        ]
    )

    route = build_base_route([3, 1, 2], uow)

    assert route.points == [3, 1, 2]
    assert route.coordinates == [(55.77, 37.63), (55.75, 37.61), (55.76, 37.62)]
    assert route.distance_km > 0
    assert route.duration_minutes > 0
    assert uow.committed is True


def test_build_base_route_raises_for_missing_points():
    uow = FakeUoW([Point(id=1, lat=55.75, lon=37.61)])

    with pytest.raises(ValueError, match=r"Точки не найдены: \[2\]"):
        build_base_route([1, 2], uow)


def test_optimize_route_raises_for_missing_points():
    uow = FakeUoW([Point(id=1, lat=55.75, lon=37.61)])

    with pytest.raises(ValueError, match=r"Точки не найдены: \[2\]"):
        optimize_route([1, 2], uow)


def test_get_route_by_id_and_get_all_routes_return_dicts():
    uow = FakeUoW(
        [Point(id=1, lat=55.75, lon=37.61), Point(id=2, lat=55.76, lon=37.62)]
    )
    route = build_base_route([1, 2], uow)

    single = get_route_by_id(route.id, uow)
    all_routes = get_all_routes(uow)

    assert single is not None
    assert single["id"] == route.id
    assert single["points"] == [1, 2]
    assert len(all_routes) == 1
    assert all_routes[0]["coordinates"] == [(55.75, 37.61), (55.76, 37.62)]
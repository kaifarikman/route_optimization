from backend.domain.point import Point
from backend.services.routing_service import build_nearest_neighbor_route


def test_nearest_neighbor_keeps_starting_point_and_visits_all_points():
    points = [
        Point(id=1, lat=55.75, lon=37.61),
        Point(id=2, lat=55.80, lon=37.80),
        Point(id=3, lat=55.751, lon=37.611),
        Point(id=4, lat=55.752, lon=37.612),
    ]

    route = build_nearest_neighbor_route(points)

    assert route[0].id == 1
    assert [point.id for point in route] == [1, 3, 4, 2]


def test_nearest_neighbor_returns_copy_for_short_routes():
    points = [Point(id=1, lat=55.75, lon=37.61), Point(id=2, lat=55.76, lon=37.62)]

    route = build_nearest_neighbor_route(points)

    assert route == points
    assert route is not points

import pytest

from backend.domain.point import Point
from backend.services.routing_service import (
    build_nearest_neighbor_route,
    build_two_opt_route,
    optimize_points,
)
from backend.utils.geo import calculate_distance


def _route_length(route):
    return sum(
        calculate_distance(route[i].lat, route[i].lon, route[i + 1].lat, route[i + 1].lon)
        for i in range(len(route) - 1)
    )


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


def _sample_points():
    return [
        Point(id=1, lat=55.75, lon=37.61),
        Point(id=2, lat=55.80, lon=37.80),
        Point(id=3, lat=55.751, lon=37.611),
        Point(id=4, lat=55.752, lon=37.612),
        Point(id=5, lat=55.79, lon=37.78),
        Point(id=6, lat=55.753, lon=37.613),
    ]


def test_two_opt_keeps_start_and_visits_all_points():
    points = _sample_points()

    route = build_two_opt_route(points)

    assert route[0].id == 1
    assert sorted(point.id for point in route) == [1, 2, 3, 4, 5, 6]


def test_two_opt_is_not_worse_than_nearest_neighbor():
    points = _sample_points()

    nn_length = _route_length(build_nearest_neighbor_route(points))
    two_opt_length = _route_length(build_two_opt_route(points))

    assert two_opt_length <= nn_length + 1e-9


def test_two_opt_handles_short_routes():
    points = [
        Point(id=1, lat=55.75, lon=37.61),
        Point(id=2, lat=55.76, lon=37.62),
        Point(id=3, lat=55.77, lon=37.63),
    ]

    route = build_two_opt_route(points)

    assert sorted(point.id for point in route) == [1, 2, 3]
    assert route[0].id == 1


def test_optimize_points_dispatches_by_algorithm():
    points = _sample_points()

    assert optimize_points(points, "nearest_neighbor") == build_nearest_neighbor_route(points)
    assert optimize_points(points, "two_opt") == build_two_opt_route(points)


def test_optimize_points_rejects_unknown_algorithm():
    with pytest.raises(ValueError):
        optimize_points(_sample_points(), "unknown")

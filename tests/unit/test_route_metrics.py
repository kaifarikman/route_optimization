import pytest

from backend.domain.point import Point
from backend.services.routing_providers.haversine_provider import HaversineRoutingProvider


def test_calculate_route_distance_sums_neighbor_segments():
    provider = HaversineRoutingProvider()
    points = [
        Point(id=1, lat=55.75, lon=37.61),
        Point(id=2, lat=55.76, lon=37.62),
        Point(id=3, lat=55.77, lon=37.63),
    ]

    distance = provider.calculate_route_distance(points)

    assert distance > 0
    assert distance == pytest.approx(2.5517595589197573, rel=1e-6)


def test_calculate_route_duration_uses_fixed_speed():
    provider = HaversineRoutingProvider()
    duration = provider.calculate_route_duration(40)

    assert duration == 60

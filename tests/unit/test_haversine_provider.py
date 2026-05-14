import pytest
from backend.services.routing_providers.haversine_provider import HaversineRoutingProvider


class TestHaversineRoutingProvider:
    @pytest.fixture
    def provider(self):
        return HaversineRoutingProvider()

    @pytest.fixture
    def sample_points(self):
        return [{"lat": 55.7558, "lon": 37.6173}, {"lat": 55.7658, "lon": 37.6273}]

    @pytest.fixture
    def three_points(self):
        return [
            {"lat": 55.7558, "lon": 37.6173},
            {"lat": 55.7589, "lon": 37.6231},
            {"lat": 55.7570, "lon": 37.6200},
        ]

    def test_returns_provider_name(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        assert result["provider"] == "haversine"

    def test_returns_geometry_type_straight(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        assert result["geometry_type"] == "straight"

    def test_returns_transport_type_default(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        assert result["transport_type"] == "driving"

    def test_geometry_returns_list_of_coordinates(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        geometry = result["geometry"]
        assert isinstance(geometry, list)
        assert len(geometry) == len(sample_points)
        for point in geometry:
            assert isinstance(point, list)
            assert len(point) == 2
            assert isinstance(point[0], float)
            assert isinstance(point[1], float)

    def test_geometry_matches_input_order(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        assert result["geometry"] == [
            [sample_points[0]["lat"], sample_points[0]["lon"]],
            [sample_points[1]["lat"], sample_points[1]["lon"]],
        ]

    def test_distance_computed_correctly(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        assert 1.2 <= result["distance_km"] <= 1.4

    def test_duration_on_40kmh(self, provider, sample_points):
        result = provider.calculate_route(sample_points)
        expected_duration_sec = (result["distance_km"] / 40.0) * 3600.0
        assert result["duration_sec"] == pytest.approx(expected_duration_sec, rel=1e-6)
        assert 100 <= result["duration_sec"] <= 130

    def test_three_points_distance_is_sum_of_segments(self, provider, three_points):
        result = provider.calculate_route(three_points)
        seg1 = provider.calculate_distance(
            three_points[0]["lat"], three_points[0]["lon"],
            three_points[1]["lat"], three_points[1]["lon"],
        )
        seg2 = provider.calculate_distance(
            three_points[1]["lat"], three_points[1]["lon"],
            three_points[2]["lat"], three_points[2]["lon"],
        )
        assert result["distance_km"] == pytest.approx(seg1 + seg2, rel=1e-6)

    def test_works_without_internet(self, provider, sample_points, monkeypatch):
        def block_network(*args, **kwargs):
            raise RuntimeError("Network blocked")
        monkeypatch.setattr("socket.socket", block_network)
        result = provider.calculate_route(sample_points)
        assert result["provider"] == "haversine"
        assert "distance_km" in result

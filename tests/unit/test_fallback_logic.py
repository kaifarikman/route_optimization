import pytest
from backend.services.routing_router import RoutingRouter
from backend.services.routing_providers.base import RoutingResult
from backend.services.routing_providers.haversine_provider import HaversineRoutingProvider
from backend.services.routing_providers.osrm_provider import OSRMRoutingProvider
from backend.schemas.point import Point


class TestFallbackLogic:
    @pytest.fixture
    def sample_points(self):
        return [Point(id=1, lat=55.7558, lon=37.6173), Point(id=2, lat=55.7658, lon=37.6273)]

    @pytest.fixture
    def router_with_failing_osrm(self, mocker, sample_points):
        osrm_mock = mocker.Mock(spec=OSRMRoutingProvider)
        osrm_mock.build_route = mocker.Mock()
        osrm_mock.build_route.side_effect = Exception("OSRM service unavailable")

        haversine_mock = mocker.Mock(spec=HaversineRoutingProvider)
        haversine_mock.build_route = mocker.Mock()
        haversine_mock.build_route.return_value = HaversineRoutingProvider().build_route(sample_points)

        return RoutingRouter(primary_provider=osrm_mock, fallback_provider=haversine_mock)

    def test_fallback_triggers_when_osrm_fails(self, router_with_failing_osrm, sample_points):
        result = router_with_failing_osrm.build_route(sample_points)
        assert result.provider == "haversine"
        assert result.geometry == [[55.7558, 37.6173], [55.7658, 37.6273]]
        assert result.is_fallback is True

    def test_fallback_does_not_trigger_when_osrm_succeeds(self, mocker, sample_points):
        osrm_mock = mocker.Mock(spec=OSRMRoutingProvider)
        osrm_mock.build_route = mocker.Mock()
        osrm_mock.build_route.return_value = RoutingResult(
            provider="osrm",
            distance_km=1.5,
            duration_minutes=2.25,
            geometry=[[55.7558, 37.6173], [59.9311, 30.3609]],
            geometry_type="full",
            transport_type="driving",
            is_fallback=False,
        )

        haversine_mock = mocker.Mock(spec=HaversineRoutingProvider)
        router = RoutingRouter(primary_provider=osrm_mock, fallback_provider=haversine_mock)

        result = router.build_route(sample_points)

        assert result.provider == "osrm"
        assert result.is_fallback is False
        haversine_mock.build_route.assert_not_called()

    def test_fallback_also_handles_errors_gracefully(self, mocker, sample_points):
        osrm_mock = mocker.Mock(spec=OSRMRoutingProvider)
        osrm_mock.build_route = mocker.Mock()
        osrm_mock.build_route.side_effect = Exception("OSRM error")

        haversine_mock = mocker.Mock(spec=HaversineRoutingProvider)
        haversine_mock.build_route = mocker.Mock()
        haversine_mock.build_route.side_effect = Exception("Haversine also failed")

        router = RoutingRouter(primary_provider=osrm_mock, fallback_provider=haversine_mock)

        with pytest.raises(Exception) as exc:
            router.build_route(sample_points)

        assert "Haversine also failed" in str(exc.value)

    def test_fallback_preserves_input_points_order(self, mocker, sample_points):
        osrm_mock = mocker.Mock(spec=OSRMRoutingProvider)
        osrm_mock.build_route = mocker.Mock()
        osrm_mock.build_route.side_effect = Exception("OSRM failed")

        expected_geometry = [[p.lat, p.lon] for p in sample_points]
        haversine_mock = mocker.Mock(spec=HaversineRoutingProvider)
        haversine_mock.build_route = mocker.Mock()
        haversine_mock.build_route.return_value = HaversineRoutingProvider().build_route(sample_points)

        router = RoutingRouter(primary_provider=osrm_mock, fallback_provider=haversine_mock)
        result = router.build_route(sample_points)

        assert result.geometry == expected_geometry
        assert result.geometry[0] == [sample_points[0].lat, sample_points[0].lon]
        assert result.geometry[-1] == [sample_points[-1].lat, sample_points[-1].lon]

    def test_fallback_triggers_when_osrm_ok_route_is_unusable(self, mocker, sample_points):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "code": "Ok",
            "routes": [{
                "distance": 0,
                "duration": 0,
                "geometry": {"type": "LineString", "coordinates": []},
            }],
        }
        mock_get.return_value.raise_for_status = lambda: None

        router = RoutingRouter(
            primary_provider=OSRMRoutingProvider(),
            fallback_provider=HaversineRoutingProvider(),
        )

        result = router.build_route(sample_points)

        assert result.provider == "haversine"
        assert result.is_fallback is True
        assert result.geometry_type == "straight"
        assert result.distance_km > 0

import pytest
import json
from backend.services.routing_providers.osrm_provider import OSRMRoutingProvider


class TestOSRMRoutingProvider:
    @pytest.fixture
    def provider(self):
        return OSRMRoutingProvider()

    @pytest.fixture
    def sample_points(self):
        return [{"lat": 55.7558, "lon": 37.6173}, {"lat": 55.7658, "lon": 37.6273}]

    @pytest.fixture
    def mock_osrm_response_valid(self):
        return {
            "code": "Ok",
            "routes": [{
                "distance": 1500.0,
                "duration": 135.0,
                "geometry": "some_encoded_polyline"
            }],
            "waypoints": [
                {"location": [37.6173, 55.7558]},
                {"location": [37.6273, 55.7658]}
            ]
        }

    @pytest.fixture
    def mock_osrm_response_no_route(self):
        return {"code": "NoRoute", "message": "No route found"}

    @pytest.fixture
    def mock_osrm_response_invalid(self):
        return {"code": "InvalidUrl"}

    def test_coordinate_conversion_lon_lat_to_lat_lon(self, provider, sample_points, mock_osrm_response_valid, mocker):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = mock_osrm_response_valid
        provider.calculate_route(sample_points)
        call_url = mock_get.call_args[0][0]
        assert "37.6173,55.7558" in call_url or "37.6173%2C55.7558" in call_url
        assert "37.6273,55.7658" in call_url or "37.6273%2C55.7658" in call_url
        assert "55.7558,37.6173" not in call_url

    def test_parses_mocked_response_correctly(self, provider, sample_points, mock_osrm_response_valid, mocker):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = mock_osrm_response_valid
        mock_get.return_value.raise_for_status = lambda: None
        result = provider.calculate_route(sample_points)
        assert result["provider"] == "osrm"
        assert result["distance_km"] == pytest.approx(1.5)
        assert result["duration_sec"] == 135.0
        assert "geometry" in result
        assert len(result["geometry"]) > 0

    def test_handles_osrm_error(self, provider, sample_points, mock_osrm_response_no_route, mocker):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = mock_osrm_response_no_route
        mock_get.return_value.raise_for_status = lambda: None
        # Заменить Exception на конкретный класс, например OSRMError, когда он появится
        with pytest.raises(Exception) as exc_info:
            provider.calculate_route(sample_points)
        assert "NoRoute" in str(exc_info.value)

    def test_handles_http_error(self, provider, sample_points, mocker):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 500
        mock_get.return_value.raise_for_status.side_effect = Exception("HTTP 500 Server Error")
        with pytest.raises(Exception):
            provider.calculate_route(sample_points)

    def test_not_use_network_calls(self, provider, sample_points, mocker):
        mock_get = mocker.patch("requests.get")
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"code": "Ok", "routes": [{
                "distance": 1500,
                "duration": 135,
                "geometry": "mock_encoded_polyline"
            }]
        }
        mock_get.return_value.raise_for_status = lambda: None
        provider.calculate_route(sample_points)
        mock_get.assert_called_once()
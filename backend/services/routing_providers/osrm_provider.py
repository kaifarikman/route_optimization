import math
import requests
from backend.config import OSRM_BASE_URL, ROUTING_TIMEOUT_SECONDS
from backend.domain.point import Point
from backend.services.routing_providers.base import RoutingResult
from backend.services.routing_providers.exceptions import RoutingProviderError


def _has_distinct_points(points: list[Point]) -> bool:
    return len({(point.lat, point.lon) for point in points}) > 1


def _valid_number(value) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


class OSRMRoutingProvider:
    def build_route(self, points: list[Point], transport_type: str = "driving") -> RoutingResult:
        coords = ";".join(f"{p.lon},{p.lat}" for p in points)
        url = f"{OSRM_BASE_URL}/route/v1/{transport_type}/{coords}?geometries=geojson&overview=full"

        response = requests.get(url, timeout=ROUTING_TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok":
            raise RoutingProviderError(f"OSRM error: {data.get('code')}: {data.get('message', '')}")

        routes = data.get("routes") or []
        if not routes:
            raise RoutingProviderError("OSRM returned no routes")

        route = routes[0]
        distance_m = route.get("distance")
        duration_sec = route.get("duration")
        if not _valid_number(distance_m) or not _valid_number(duration_sec):
            raise RoutingProviderError("OSRM returned invalid route metrics")

        distance_km = distance_m / 1000
        duration_min = duration_sec / 60
        
        route_geometry = route.get("geometry") or {}
        geometry_coords = route_geometry.get("coordinates") or []
        if not all(isinstance(coord, list) and len(coord) >= 2 for coord in geometry_coords):
            raise RoutingProviderError("OSRM returned invalid route geometry")
        geometry = [[coord[1], coord[0]] for coord in geometry_coords]
        distinct_points = _has_distinct_points(points)
        if distinct_points and (distance_km <= 0 or len(geometry) < 2):
            raise RoutingProviderError("OSRM returned unusable route geometry")

        return RoutingResult(
            provider="osrm",
            distance_km=distance_km,
            duration_minutes=duration_min,
            geometry=geometry,
            geometry_type="full",
            transport_type=transport_type,
            is_fallback=False,
        )

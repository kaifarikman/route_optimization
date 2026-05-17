import requests
from typing import List
from backend.config import OSRM_BASE_URL, ROUTING_TIMEOUT_SECONDS
from backend.domain.point import Point
from backend.services.routing_providers.base import RoutingResult


class OSRMRoutingProvider:
    def build_route(self, points: List[Point], transport_type: str = "driving") -> RoutingResult:
        coords = ";".join(f"{p.lon},{p.lat}" for p in points)
        url = f"{OSRM_BASE_URL}/route/v1/{transport_type}/{coords}?geometries=geojson&overview=full"

        response = requests.get(url, timeout=ROUTING_TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok":
            raise Exception(f"OSRM error: {data.get('code')}: {data.get('message', '')}")

        route = data["routes"][0]
        distance_km = route["distance"] / 1000
        duration_min = route["duration"] / 60
        
        geometry_coords = route.get("geometry", {}).get("coordinates", [])
        geometry = [[coord[1], coord[0]] for coord in geometry_coords]

        return RoutingResult(
            provider="osrm",
            distance_km=distance_km,
            duration_minutes=duration_min,
            geometry=geometry,
            geometry_type="full",
            transport_type=transport_type,
            is_fallback=False,
        )


# Alias для обратной совместимости
OsrmRoutingProvider = OSRMRoutingProvider

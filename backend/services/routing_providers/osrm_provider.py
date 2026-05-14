import requests
from backend.config import OSRM_BASE_URL, ROUTING_TIMEOUT_SECONDS


class OSRMRoutingProvider:
    def calculate_route(self, points: list[dict], transport_type: str = "driving") -> dict:
        coords = ";".join(f"{p['lon']},{p['lat']}" for p in points)
        url = f"{OSRM_BASE_URL}/route/v1/{transport_type}/{coords}"

        response = requests.get(url, timeout=ROUTING_TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()

        if data.get("code") != "Ok":
            raise Exception(f"OSRM error: {data.get('code')}: {data.get('message', '')}")

        route = data["routes"][0]
        distance_km = route["distance"] / 1000
        duration_sec = route["duration"]

        waypoints = data.get("waypoints", [])
        geometry = [[w["location"][1], w["location"][0]] for w in waypoints]

        return {
            "provider": "osrm",
            "distance_km": distance_km,
            "duration_sec": duration_sec,
            "geometry": geometry,
            "geometry_type": "full",
            "transport_type": transport_type,
            "is_fallback": False,
        }


# Alias для обратной совместимости
OsrmRoutingProvider = OSRMRoutingProvider

class RoutingRouter:
    def __init__(self, primary_provider, fallback_provider):
        self._primary = primary_provider
        self._fallback = fallback_provider

    def get_route(self, points: list[dict], transport_type: str = "driving") -> dict:
        try:
            return self._primary.calculate_route(points, transport_type)
        except Exception:
            return self._fallback.calculate_route(points, transport_type)

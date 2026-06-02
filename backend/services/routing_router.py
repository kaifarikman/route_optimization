class RoutingRouter:
    def __init__(self, primary_provider, fallback_provider):
        self._primary = primary_provider
        self._fallback = fallback_provider

    def build_route(self, points, transport_type: str = "driving"):
        try:
            return self._primary.build_route(points, transport_type)
        except Exception:
            result = self._fallback.build_route(points, transport_type)
            result.is_fallback = True
            return result

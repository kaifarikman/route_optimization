from backend.config import ROUTING_PROVIDER
from backend.services.routing_providers.base import RoutingProvider
from backend.services.routing_providers.exceptions import RoutingProviderError
from backend.services.routing_providers.haversine_provider import HaversineRoutingProvider
from backend.services.routing_providers.osrm_provider import OSRMRoutingProvider
from backend.services.routing_router import RoutingRouter

def get_routing_provider() -> RoutingProvider:
    if ROUTING_PROVIDER.lower() == 'haversine':
        return HaversineRoutingProvider()
    elif ROUTING_PROVIDER.lower() == 'osrm':
        return RoutingRouter(
            primary_provider=OSRMRoutingProvider(),
            fallback_provider=HaversineRoutingProvider(),
        )
    else:
        raise RoutingProviderError("Неизвестный routing provider")

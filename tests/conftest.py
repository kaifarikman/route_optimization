import os
import sys

import pytest


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


@pytest.fixture(autouse=True)
def use_network_free_route_provider(monkeypatch):
    from backend.services.routing_providers.haversine_provider import HaversineRoutingProvider
    import backend.services.route as route_service

    monkeypatch.setattr(route_service, "get_routing_provider", HaversineRoutingProvider)

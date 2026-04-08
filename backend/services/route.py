from typing import Dict, List

from backend.db.uow import AbstractUnitOfWork
from backend.domain.route import Route


def _route_to_dict(route: Route) -> Dict:
    return {
        "id": route.id,
        "points": route.points,
        "distance_km": route.distance_km,
        "duration_minutes": route.duration_minutes,
        "coordinates": route.coordinates,
    }


def build_base_route(point_ids: List[int], uow: AbstractUnitOfWork) -> Dict:
    raise NotImplementedError()


def optimize_route(point_ids: List[int], uow: AbstractUnitOfWork) -> Dict:
    raise NotImplementedError()


def get_route_by_id(route_id: int, uow: AbstractUnitOfWork) -> Dict | None:
    route = uow.routes.get(route_id)
    return _route_to_dict(route) if route else None


def get_all_routes(uow: AbstractUnitOfWork) -> List[Dict]:
    return [_route_to_dict(route) for route in uow.routes.list()]

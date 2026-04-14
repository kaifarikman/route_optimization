from typing import Dict, List

from backend.db.uow import AbstractUnitOfWork
from backend.domain.route import Route
from backend.domain.point import Point
from backend.utils.geo import calculate_distance


def calculate_route_distance(points: list[Point]) -> float:
    """
    Рассчитывает длину пути через заданные точки 
    """
    path_length = 0
    for i in range(len(points) - 1):
        point1, point2 = points[i], points[i + 1]
        lat1, lon1 = point1.lat, point1.lon
        lat2, lon2 = point2.lat, point2.lon

        path_length += calculate_distance(lat1, lon1, lat2, lon2)

    return path_length


def calculate_route_duration(distance_km: float) -> float:
    """
    Рассчитывает время пути в минутах
    """
    speed_km_h = 40
    time_hours = distance_km / speed_km_h
    time_minutes = time_hours * 60

    return time_minutes


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

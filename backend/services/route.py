from typing import Dict, List

from backend.db.uow import AbstractUnitOfWork
from backend.domain.route import Route
from backend.domain.point import Point
from backend.services.routing import build_nearest_neighbor_route
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


def build_base_route(point_ids: list[int], uow: AbstractUnitOfWork) -> Route:
    """
    Строит базовый маршрут и записывает его в БД
    """
    points = [uow.points.get(point_id) for point_id in point_ids]

    distance_km = calculate_route_distance(points)
    duration_minutes = calculate_route_duration(distance_km)

    coordinates = [list(point.lat, point.lon) for point in points]

    return uow.routes.add(
        points=point_ids,
        distance_km=distance_km,
        duration_minutes=duration_minutes,
        coordinates=coordinates
    )


def optimize_route(point_ids: List[int], uow: AbstractUnitOfWork) -> Route:
    """
    Оптимизирует маршрут из заданных точек
    """
    points = uow.points.get_by_ids(point_ids)
    optimized_points = build_nearest_neighbor_route(points)

    coords = [[point.lat, point.lon] for point in optimized_points]
    distance_km = calculate_route_distance(optimized_points)
    duration_mins = calculate_route_duration(distance_km)

    route = uow.routes.add(
        points=optimized_points,
        distance_km=distance_km,
        duration_minutes=duration_mins,
        coordinates=coords
    )
    uow.commit()

    return route


def _route_to_dict(route: Route) -> Dict:
    return {
        "id": route.id,
        "points": route.points,
        "distance_km": route.distance_km,
        "duration_minutes": route.duration_minutes,
        "coordinates": route.coordinates,
    }


def get_route_by_id(route_id: int, uow: AbstractUnitOfWork) -> Dict | None:
    route = uow.routes.get(route_id)
    return _route_to_dict(route) if route else None


def get_all_routes(uow: AbstractUnitOfWork) -> List[Dict]:
    return [_route_to_dict(route) for route in uow.routes.list()]

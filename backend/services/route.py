from typing import Dict, List

from backend.db.uow import AbstractUnitOfWork
from backend.domain.route import Route
from backend.domain.point import Point
from backend.services.routing_providers.factory import get_routing_provider
from backend.services.routing_service import build_nearest_neighbor_route
from backend.utils.geo import calculate_distance


def _get_points_in_requested_order(point_ids: list[int], uow: AbstractUnitOfWork) -> list[Point]:
    points = [uow.points.get(point_id) for point_id in point_ids]
    missing_ids = [point_id for point_id, point in zip(point_ids, points) if point is None]

    if missing_ids:
        raise ValueError(f"Точки не найдены: {missing_ids}")

    return points


def build_base_route(point_ids: list[int], uow: AbstractUnitOfWork) -> Route:
    """
    Строит базовый маршрут и записывает его в БД
    """
    provider = get_routing_provider()

    points = _get_points_in_requested_order(point_ids, uow)
    routing_result = provider.build_route(points)

    coordinates = [[point.lat, point.lon] for point in points]

    route = uow.routes.add(
        points=[point.id for point in points],
        distance_km=routing_result.distance_km,
        duration_minutes=routing_result.duration_minutes,
        coordinates=coordinates,
    )
    uow.commit()
    return route


def optimize_route(point_ids: List[int], uow: AbstractUnitOfWork) -> Route:
    """
    Оптимизирует маршрут из заданных точек
    """
    points = uow.points.get_by_ids(point_ids)
    points_by_id = {point.id: point for point in points}
    missing_ids = [point_id for point_id in point_ids if point_id not in points_by_id]

    if missing_ids:
        raise ValueError(f"Точки не найдены: {missing_ids}")

    ordered_points = [points_by_id[point_id] for point_id in point_ids]
    optimized_points = build_nearest_neighbor_route(ordered_points)

    provider = get_routing_provider()

    coords = [[point.lat, point.lon] for point in optimized_points]
    routing_result = provider.build_route(optimized_points)

    route = uow.routes.add(
        points=[point.id for point in optimized_points],
        distance_km=routing_result.distance_km,
        duration_minutes=routing_result.duration_mins,
        coordinates=coords,
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

import secrets

from backend.db.uow import AbstractUnitOfWork
from backend.domain.route import Route
from backend.domain.point import Point
from backend.services.routing_providers.factory import get_routing_provider
from backend.services.routing_service import optimize_points


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
        geometry=routing_result.geometry,
        provider=routing_result.provider,
        is_fallback=routing_result.is_fallback,
        geometry_type=routing_result.geometry_type,
        transport_type=routing_result.transport_type,
    )
    uow.commit()
    return route


def optimize_route(
    point_ids: list[int],
    uow: AbstractUnitOfWork,
    algorithm: str = "nearest_neighbor",
) -> Route:
    """
    Оптимизирует маршрут из заданных точек выбранным алгоритмом
    """
    points = uow.points.get_by_ids(point_ids)
    points_by_id = {point.id: point for point in points}
    missing_ids = [point_id for point_id in point_ids if point_id not in points_by_id]

    if missing_ids:
        raise ValueError(f"Точки не найдены: {missing_ids}")

    ordered_points = [points_by_id[point_id] for point_id in point_ids]
    optimized_points = optimize_points(ordered_points, algorithm)

    provider = get_routing_provider()

    coords = [[point.lat, point.lon] for point in optimized_points]
    routing_result = provider.build_route(optimized_points)

    route = uow.routes.add(
        points=[point.id for point in optimized_points],
        distance_km=routing_result.distance_km,
        duration_minutes=routing_result.duration_minutes,
        coordinates=coords,
        geometry=routing_result.geometry,
        provider=routing_result.provider,
        is_fallback=routing_result.is_fallback,
        geometry_type=routing_result.geometry_type,
        transport_type=routing_result.transport_type,
    )
    uow.commit()

    return route


def _route_to_dict(route: Route) -> dict:
    return {
        "id": route.id,
        "points": route.points,
        "distance_km": route.distance_km,
        "duration_minutes": route.duration_minutes,
        "coordinates": route.coordinates,
        "geometry": route.geometry,
        "provider": route.provider,
        "is_fallback": route.is_fallback,
        "geometry_type": route.geometry_type,
        "transport_type": route.transport_type,
    }


def _route_to_share_dict(route: Route, index_by_id: dict[int, int]) -> dict:
    route_data = _route_to_dict(route)
    route_data["points"] = [index_by_id[point_id] for point_id in route.points if point_id in index_by_id]
    return route_data


def create_route_share(base_route_id: int, optimized_route_id: int, uow: AbstractUnitOfWork) -> dict:
    base_route = uow.routes.get(base_route_id)
    optimized_route = uow.routes.get(optimized_route_id)

    if base_route is None or optimized_route is None:
        raise ValueError("Маршрут не найден")

    current_points = uow.points.list()
    points_by_id = {point.id: point for point in current_points}
    ordered_point_ids = []
    for point_id in [*base_route.points, *optimized_route.points]:
        if point_id in points_by_id and point_id not in ordered_point_ids:
            ordered_point_ids.append(point_id)

    index_by_id = {
        point_id: index + 1
        for index, point_id in enumerate(ordered_point_ids)
    }
    share_points = [
        {
            "id": index_by_id[point_id],
            "lat": points_by_id[point_id].lat,
            "lon": points_by_id[point_id].lon,
            "address": points_by_id[point_id].address,
            "geocoding_provider": points_by_id[point_id].geocoding_provider,
            "geocoding_place_id": points_by_id[point_id].geocoding_place_id,
        }
        for point_id in ordered_point_ids
    ]

    snapshot = {
        "version": 1,
        "points": share_points,
        "base_route": _route_to_share_dict(base_route, index_by_id),
        "optimized_route": _route_to_share_dict(optimized_route, index_by_id),
    }

    token = secrets.token_urlsafe(16)
    uow.shares.add(token=token, snapshot=snapshot)
    uow.commit()
    return {"token": token, "share": snapshot}


def get_route_share(token: str, uow: AbstractUnitOfWork) -> dict | None:
    share = uow.shares.get(token)
    return share["snapshot"] if share else None


def get_route_by_id(route_id: int, uow: AbstractUnitOfWork) -> dict | None:
    route = uow.routes.get(route_id)
    return _route_to_dict(route) if route else None


def get_all_routes(uow: AbstractUnitOfWork) -> list[dict]:
    return [_route_to_dict(route) for route in uow.routes.list()]

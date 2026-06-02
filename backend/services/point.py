import math
import random

from backend.db.uow import AbstractUnitOfWork
from backend.domain.point import Point

MAX_POINTS = 50


def _point_to_dict(point: Point) -> dict:
    data = {
        "id": point.id,
        "lat": float(point.lat),
        "lon": float(point.lon),
    }
    if point.address is not None:
        data["address"] = point.address
    if point.geocoding_provider is not None:
        data["geocoding_provider"] = point.geocoding_provider
    if point.geocoding_place_id is not None:
        data["geocoding_place_id"] = point.geocoding_place_id
    return data


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def add_point(
    lat: float,
    lon: float,
    uow: AbstractUnitOfWork,
    address: str | None = None,
    geocoding_provider: str | None = None,
    geocoding_place_id: str | None = None,
) -> dict:
    if lat < -90 or lat > 90:
        raise ValueError("Широта: от -90 до 90")
    if lon < -180 or lon > 180:
        raise ValueError("Долгота: от -180 до 180")
    if uow.points.count() >= MAX_POINTS:
        raise ValueError(f"Количество точек: не больше {MAX_POINTS}")

    uow.routes.clear_all()
    metadata = {
        "address": _clean_optional_text(address),
        "geocoding_provider": _clean_optional_text(geocoding_provider),
        "geocoding_place_id": _clean_optional_text(geocoding_place_id),
    }
    metadata = {key: value for key, value in metadata.items() if value is not None}
    point = uow.points.add(
        float(lat),
        float(lon),
        **metadata,
    )
    uow.commit()
    return _point_to_dict(point)


def generate_points(
    center_lat: float,
    center_lon: float,
    radius_km: float,
    count: int,
    uow: AbstractUnitOfWork,
) -> list[dict]:
    # Generation replaces the current working set of points and routes.
    uow.routes.clear_all()
    uow.points.clear_all()

    lat_deg_per_km = 1 / 111.0
    lon_deg_per_km = 1 / (111.0 * math.cos(math.radians(center_lat)))

    points = []
    for _ in range(count):
        angle = random.uniform(0, 2 * math.pi)
        # sqrt нужен, чтобы точки равномерно распределялись по площади круга.
        distance = math.sqrt(random.uniform(0, 1)) * radius_km
        delta_lat_km = distance * math.cos(angle)
        delta_lon_km = distance * math.sin(angle)
        lat = center_lat + delta_lat_km * lat_deg_per_km
        lon = center_lon + delta_lon_km * lon_deg_per_km
        point = uow.points.add(float(lat), float(lon))
        points.append(_point_to_dict(point))
    uow.commit()
    return points


def import_points(points_data: list[dict], uow: AbstractUnitOfWork) -> list[dict]:
    uow.routes.clear_all()
    uow.points.clear_all()

    points = []
    for item in points_data[:MAX_POINTS]:
        metadata = {
            "address": _clean_optional_text(item.get("address")),
            "geocoding_provider": _clean_optional_text(item.get("geocoding_provider")),
            "geocoding_place_id": _clean_optional_text(item.get("geocoding_place_id")),
        }
        metadata = {key: value for key, value in metadata.items() if value is not None}
        point = uow.points.add(float(item["lat"]), float(item["lon"]), **metadata)
        points.append(_point_to_dict(point))
    uow.commit()
    return points


def get_points(uow: AbstractUnitOfWork) -> list[dict]:
    return [_point_to_dict(point) for point in uow.points.list()]


def clear_all_points(uow: AbstractUnitOfWork) -> int:
    current_points = uow.points.list()
    count = len(current_points)
    uow.routes.clear_all()
    uow.points.clear_all()
    uow.commit()
    return count

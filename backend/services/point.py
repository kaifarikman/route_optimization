from typing import Dict, List

import numpy as np

from backend.db.uow import AbstractUnitOfWork
from backend.domain.point import Point


def _point_to_dict(point: Point) -> Dict:
    return {"id": point.id, "lat": float(point.lat), "lon": float(point.lon)}


def generate_points(
    center_lat: float,
    center_lon: float,
    radius_km: float,
    count: int,
    uow: AbstractUnitOfWork,
) -> List[Dict]:
    # Generation replaces the current working set of points and routes.
    uow.routes.clear_all()
    uow.points.clear_all()

    lat_deg_per_km = 1 / 111.0
    lon_deg_per_km = 1 / (111.0 * np.cos(np.radians(center_lat)))

    angles = np.random.uniform(0, 2 * np.pi, count)
    distances = np.sqrt(np.random.uniform(0, 1, count)) * radius_km

    delta_lat_km = distances * np.cos(angles)
    delta_lon_km = distances * np.sin(angles)

    delta_lat_deg = delta_lat_km * lat_deg_per_km
    delta_lon_deg = delta_lon_km * lon_deg_per_km

    lats = center_lat + delta_lat_deg
    lons = center_lon + delta_lon_deg

    points = []
    for lat, lon in zip(lats, lons):
        point = uow.points.add(float(lat), float(lon))
        points.append(_point_to_dict(point))
    uow.commit()
    return points


def get_points(uow: AbstractUnitOfWork) -> List[Dict]:
    return [_point_to_dict(point) for point in uow.points.list()]


def clear_all_points(uow: AbstractUnitOfWork) -> int:
    current_points = uow.points.list()
    count = len(current_points)
    uow.routes.clear_all()
    uow.points.clear_all()
    uow.commit()
    return count

from typing import List, Dict
from app.db import add_point, clear_points, get_all_points

def generate_points(center_lat: float, center_lon: float, radius_km: float, count: int) -> List[Dict]:
    # генерирует точки, кладет их в бд, возвращает список словарей.
    # Каждый словарь - точка, которая выглядит так:
    # {
    #    "id": point_id,
    #    "lat": round(random_lat, 6),
    #    "lon": round(random_lon, 6)
    # }
    pass

def get_points() -> List[Dict]:
    """Получить все текущие точки"""
    return get_all_points()

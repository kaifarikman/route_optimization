from typing import List, Tuple, Dict
from app.db import add_route, get_all_points, get_route

def build_base_route(point_ids: List[int]) -> Dict:
    pass
    # строит базовый маршрут, кладет его в бд и
    # возвращает маршрут в виде такого слоаваря:
    '''return {
        "id": route_id,
        "points": point_ids,
        "distance_km": round(total_distance, 2),
        "duration_minutes": round(duration_minutes, 2),
        "coordinates": coordinates
    }'''

def optimize_route(point_ids: List[int]) -> Dict:
    pass
    #вызывает алгоритмы оптимизации, выстраивает новый маршрут, кладет его в бд
    # и возвращает новый маршрут в таком же формате как в build_base_route
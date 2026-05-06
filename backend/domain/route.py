from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class Route:
    id: int
    points: List[int]
    distance_km: float
    duration_minutes: float
    coordinates: List[Tuple[float, float]]
    geometry: List[Tuple[float, float]]
    provider: str
    is_fallback:bool
    geometry_type:str
    transport_type: str

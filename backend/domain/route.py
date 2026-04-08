from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class Route:
    id: int
    points: List[int]
    distance_km: float
    duration_minutes: float
    coordinates: List[Tuple[float, float]]

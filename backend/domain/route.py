from dataclasses import dataclass


@dataclass
class Route:
    id: int
    points: list[int]
    distance_km: float
    duration_minutes: float
    coordinates: list[tuple[float, float]]
    geometry: list[tuple[float, float]]
    provider: str
    is_fallback:bool
    geometry_type:str
    transport_type: str

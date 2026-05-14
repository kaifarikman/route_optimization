from dataclasses import dataclass
from typing import List, Protocol, Tuple
from backend.domain.point import Point

@dataclass
class RoutingResult():
    """Модель результата маршрутизации"""
    distance_km: float
    duration_minutes: float
    geometry: List[Tuple[float, float]]  # [[lat,lon], ...]
    provider: str
    is_fallback: bool
    geometry_type: str
    transport_type: str


class RoutingProvider(Protocol):
    def build_route(self, points: List[Point], transport_type="driving") -> RoutingResult:
        ...
from pydantic import BaseModel
from typing import List, Tuple

class RouteRequest(BaseModel):
    """Запрос на построение маршрута"""
    point_ids: List[int]

class Route(BaseModel):
    """Модель маршрута"""
    id: int
    points: List[int]  # список ID точек в порядке маршрута
    distance_km: float
    duration_minutes: float
    coordinates: List[Tuple[float, float]]  # [[lat,lon], ...]
    
    class Config:
        from_attributes = True

class RouteResponse(BaseModel):
    """Ответ с одним маршрутом"""
    route: Route

class RoutesResponse(BaseModel):
    """Ответ со списком маршрутов"""
    routes: List[Route]
    total: int

class HealthResponse(BaseModel):
    """Ответ на health check"""
    status: str
    message: str = ""

class ConfigResponse(BaseModel):
    """Ответ конфига"""
    routing_api: str
    version: str
    cors_enabled: bool
    database: str
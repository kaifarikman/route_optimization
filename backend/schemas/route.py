from pydantic import BaseModel, ConfigDict, Field
from typing import Any

class RouteRequest(BaseModel):
    """Запрос на построение маршрута"""
    point_ids: list[int] = Field(min_length=2, max_length=50)
    algorithm: str = Field(default="nearest_neighbor", pattern="^(nearest_neighbor|two_opt)$")

class Route(BaseModel):
    """Модель маршрута"""
    id: int
    points: list[int]  # список ID точек в порядке маршрута
    distance_km: float
    duration_minutes: float
    coordinates: list[tuple[float, float]]  # [[lat,lon], ...]
    geometry: list[tuple[float, float]]
    provider: str
    is_fallback:bool
    geometry_type:str
    transport_type: str

    model_config = ConfigDict(from_attributes=True)

class RouteResponse(BaseModel):
    """Ответ с одним маршрутом"""
    route: Route

class RoutesResponse(BaseModel):
    """Ответ со списком маршрутов"""
    routes: list[Route]
    total: int

class RouteShareRequest(BaseModel):
    """Запрос на создание публичной ссылки маршрута"""
    base_route_id: int
    optimized_route_id: int

class RouteShareCreateResponse(BaseModel):
    """Ответ создания публичной ссылки маршрута"""
    share_url: str
    token: str

class RouteShareResponse(BaseModel):
    """Ответ публичного просмотра маршрута"""
    share: dict[str, Any]

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

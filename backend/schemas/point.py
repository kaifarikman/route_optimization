from pydantic import BaseModel
from typing import List


class Point(BaseModel):
    """Модель точки на карте"""
    id: int
    lat: float
    lon: float

    class Config:
        from_attributes = True


class PointGenerationRequest(BaseModel):
    """Запрос на генерацию точек"""
    center_lat: float
    center_lon: float
    radius_km: float
    count: int  # количество точек


class PointsResponse(BaseModel):
    """Ответ со списком точек"""
    points: List[Point]


class ClearResponse(BaseModel):
    """Ответ на очистку точек"""
    status: str
    message: str = ""

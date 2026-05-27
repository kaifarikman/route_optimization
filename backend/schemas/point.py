from pydantic import BaseModel, ConfigDict, Field
from typing import List


class Point(BaseModel):
    """Модель точки на карте"""
    id: int
    lat: float
    lon: float

    model_config = ConfigDict(from_attributes=True)


class PointGenerationRequest(BaseModel):
    """Запрос на генерацию точек"""
    center_lat: float
    center_lon: float
    radius_km: float
    count: int  # количество точек


class PointCreateRequest(BaseModel):
    """Запрос на ручное добавление точки"""
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class PointsImportRequest(BaseModel):
    """Запрос на импорт набора точек"""
    points: List[PointCreateRequest]


class PointResponse(BaseModel):
    """Ответ с одной точкой"""
    point: Point


class PointsResponse(BaseModel):
    """Ответ со списком точек"""
    points: List[Point]


class ClearResponse(BaseModel):
    """Ответ на очистку точек"""
    status: str
    message: str = ""

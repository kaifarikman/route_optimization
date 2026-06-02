from pydantic import BaseModel, ConfigDict, Field


class Point(BaseModel):
    """Модель точки на карте"""
    id: int
    lat: float
    lon: float
    address: str | None = None
    geocoding_provider: str | None = None
    geocoding_place_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PointGenerationRequest(BaseModel):
    """Запрос на генерацию точек"""
    center_lat: float = Field(ge=-90, le=90)
    center_lon: float = Field(ge=-180, le=180)
    radius_km: float = Field(gt=0, le=50)
    count: int = Field(ge=2, le=50)  # количество точек


class PointCreateRequest(BaseModel):
    """Запрос на ручное добавление точки"""
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    address: str | None = Field(default=None, max_length=500)
    geocoding_provider: str | None = Field(default=None, max_length=50)
    geocoding_place_id: str | None = Field(default=None, max_length=100)


class PointsImportRequest(BaseModel):
    """Запрос на импорт набора точек"""
    points: list[PointCreateRequest]


class PointResponse(BaseModel):
    """Ответ с одной точкой"""
    point: Point


class PointsResponse(BaseModel):
    """Ответ со списком точек"""
    points: list[Point]


class ClearResponse(BaseModel):
    """Ответ на очистку точек"""
    status: str
    message: str = ""

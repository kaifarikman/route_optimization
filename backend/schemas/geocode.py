from pydantic import BaseModel, Field


class GeocodeRequest(BaseModel):
    query: str = Field(min_length=3, max_length=300)
    limit: int = Field(default=5, ge=1, le=5)


class ReverseGeocodeRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class GeocodeResult(BaseModel):
    lat: float
    lon: float
    display_name: str
    provider: str
    place_id: str | None = None
    category: str | None = None
    type: str | None = None
    importance: float | None = None


class GeocodeResponse(BaseModel):
    results: list[GeocodeResult]


class ReverseGeocodeResponse(BaseModel):
    result: GeocodeResult | None = None

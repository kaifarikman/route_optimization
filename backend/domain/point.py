from dataclasses import dataclass


@dataclass
class Point:
    id: int
    lat: float
    lon: float
    address: str | None = None
    geocoding_provider: str | None = None
    geocoding_place_id: str | None = None

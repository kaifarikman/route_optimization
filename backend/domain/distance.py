from dataclasses import dataclass


@dataclass
class Distance:
    from_point_id: int
    to_point_id: int
    distance_km: float
    duration_minutes: float

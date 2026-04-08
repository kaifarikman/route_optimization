from dataclasses import dataclass


@dataclass
class RoutePoint:
    route_id: int
    point_id: int
    sequence: int

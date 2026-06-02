from backend.domain.point import Point
from backend.services.routing_providers.base import RoutingResult
from backend.utils.geo import calculate_distance


class HaversineRoutingProvider:
    def calculate_route_distance(self, points: list[Point]) -> float:
        """
        Рассчитывает длину пути через заданные точки 
        """
        path_length = 0.0
        for i in range(len(points) - 1):
            point1, point2 = points[i], points[i + 1]
            lat1, lon1 = point1.lat, point1.lon
            lat2, lon2 = point2.lat, point2.lon

            path_length += calculate_distance(lat1, lon1, lat2, lon2)

        return path_length


    def calculate_route_duration(self, distance_km: float) -> float:
        """
        Рассчитывает время пути в минутах
        """
        speed_km_h = 40
        time_hours = distance_km / speed_km_h
        time_minutes = time_hours * 60

        return time_minutes
    
    def build_route(self, points: list[Point], transport_type: str = "driving") -> RoutingResult:
        distance = self.calculate_route_distance(points)
        duration = self.calculate_route_duration(distance)
        geometry = [[point.lat, point.lon] for point in points]
        return RoutingResult(
            distance_km=distance,
            duration_minutes=duration,
            geometry=geometry,
            provider="haversine",
            is_fallback=False,
            geometry_type="straight",
            transport_type=transport_type,
        )

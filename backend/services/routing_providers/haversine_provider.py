import math
from backend.domain.point import Point
from backend.services.routing_providers.base import RoutingResult

class HaversineRoutingProvider:
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Расчитывает кратчайшее расстояние между 2 точками по формуле гаверсинусов
        """
        R_earth  = 6371.0

        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = math.sin(delta_lat / 2)**2 + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(delta_lon / 2)**2
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R_earth * c
    

    def calculate_route_distance(self, points: list[Point]) -> float:
        """
        Рассчитывает длину пути через заданные точки 
        """
        path_length = 0.0
        for i in range(len(points) - 1):
            point1, point2 = points[i], points[i + 1]
            lat1, lon1 = point1.lat, point1.lon
            lat2, lon2 = point2.lat, point2.lon

            path_length += self.calculate_distance(lat1, lon1, lat2, lon2)

        return path_length


    def calculate_route_duration(self, distance_km: float) -> float:
        """
        Рассчитывает время пути в минутах
        """
        speed_km_h = 40
        time_hours = distance_km / speed_km_h
        time_minutes = time_hours * 60

        return time_minutes
    
    def build_route(self, points: list[Point], transport_type="driving") -> RoutingResult:
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
            transport_type=transport_type
        )
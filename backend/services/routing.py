from backend.domain.point import Point
from backend.utils.geo import calculate_distance

def build_nearest_neighbor_route(points: list[Point]):
    if len(points) <= 2:
        return points[:]
    
    unvisited = list(points[1:])
    optimized_route = [points[0]]
    current_point = points[0]
    
    while unvisited:
        nearest_point = min(
            unvisited,
            key=lambda x: calculate_distance(current_point, x)
        )
        optimized_route.append(nearest_point)
        unvisited.remove(nearest_point)
        current_point = nearest_point
    
    return optimized_route


def get_route_geometry(*args, **kwargs):
    raise NotImplementedError()
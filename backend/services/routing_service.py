from backend.domain.point import Point
from backend.utils.geo import calculate_distance


def _distance_between(first: Point, second: Point) -> float:
    return calculate_distance(first.lat, first.lon, second.lat, second.lon)


def build_nearest_neighbor_route(points: list[Point]):
    if len(points) <= 2:
        return points[:]

    unvisited = list(points[1:])
    optimized_route = [points[0]]
    current_point = points[0]

    while unvisited:
        nearest_point = min(
            unvisited,
            key=lambda point: _distance_between(current_point, point),
        )
        optimized_route.append(nearest_point)
        unvisited.remove(nearest_point)
        current_point = nearest_point

    return optimized_route


def _route_length(route: list[Point]) -> float:
    return sum(
        _distance_between(route[i], route[i + 1])
        for i in range(len(route) - 1)
    )


def build_two_opt_route(points: list[Point]):
    """
    Улучшает маршрут разворотом сегментов, если так путь становится короче.
    Стартовая точка фиксируется, возврата в начало нет.
    """
    if len(points) <= 3:
        return build_nearest_neighbor_route(points)

    epsilon = 1e-9
    route = build_nearest_neighbor_route(points)

    improved = True
    while improved:
        improved = False
        for i in range(1, len(route) - 1):
            for j in range(i + 1, len(route)):
                a, b = route[i - 1], route[i]
                c = route[j]
                d = route[j + 1] if j + 1 < len(route) else None

                before = _distance_between(a, b)
                after = _distance_between(a, c)
                if d is not None:
                    before += _distance_between(c, d)
                    after += _distance_between(b, d)

                if after + epsilon < before:
                    route[i:j + 1] = reversed(route[i:j + 1])
                    improved = True

    return route


OPTIMIZERS = {
    "nearest_neighbor": build_nearest_neighbor_route,
    "two_opt": build_two_opt_route,
}


def optimize_points(points: list[Point], algorithm: str = "nearest_neighbor"):
    optimizer = OPTIMIZERS.get(algorithm)
    if optimizer is None:
        raise ValueError(f"Неизвестный алгоритм оптимизации: {algorithm}")
    return optimizer(points)

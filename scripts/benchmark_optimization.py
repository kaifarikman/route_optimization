"""Замер качества оптимизации маршрута.

Сравнивает три варианта порядка обхода точек:
  - исходный (тот, в котором точки сгенерированы) — это базовый маршрут;
  - ближайший сосед;
  - 2-opt.

Длины считаются по прямой (haversine) — это та же метрика, которую
минимизируют сами алгоритмы. Точки генерируются так же, как в приложении:
равномерно по площади круга вокруг центра.

Запуск:
    python3 scripts/benchmark_optimization.py
"""

import math
import random
import statistics
import sys
from pathlib import Path

# Чтобы скрипт работал из любой директории — добавляем корень проекта в путь.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.domain.point import Point
from backend.services.routing_service import (
    build_nearest_neighbor_route,
    build_two_opt_route,
)
from backend.utils.geo import calculate_distance

TRIALS = 500          # прогонов на каждое число точек
RADIUS_KM = 10.0
CENTER_LAT = 55.75
CENTER_LON = 37.62
POINT_COUNTS = (5, 10, 15, 20, 30, 50)


def route_length(points: list[Point]) -> float:
    return sum(
        calculate_distance(points[i].lat, points[i].lon, points[i + 1].lat, points[i + 1].lon)
        for i in range(len(points) - 1)
    )


def generate_points(count: int, rng: random.Random) -> list[Point]:
    points = []
    for i in range(count):
        angle = rng.uniform(0, 2 * math.pi)
        # sqrt — чтобы точки были равномерны по площади круга, а не толпились в центре
        distance = math.sqrt(rng.uniform(0, 1)) * RADIUS_KM
        delta_lat = distance * math.cos(angle) / 111.0
        delta_lon = distance * math.sin(angle) / (111.0 * math.cos(math.radians(CENTER_LAT)))
        points.append(Point(id=i + 1, lat=CENTER_LAT + delta_lat, lon=CENTER_LON + delta_lon))
    return points


def percent(before: float, after: float) -> float:
    return (before - after) / before * 100 if before else 0.0


def main() -> None:
    print(f"{'Точек':>6} | {'NN vs исходный':>15} | {'2-opt vs исходный':>18} | {'2-opt доп. к NN':>16}")
    print("-" * 66)

    summary = {}
    for count in POINT_COUNTS:
        nn_gain, two_opt_gain, extra_gain = [], [], []
        for trial in range(TRIALS):
            rng = random.Random(trial * 1000 + count)
            points = generate_points(count, rng)
            base = route_length(points)
            if base == 0:
                continue
            nn = route_length(build_nearest_neighbor_route(points))
            two_opt = route_length(build_two_opt_route(points))
            nn_gain.append(percent(base, nn))
            two_opt_gain.append(percent(base, two_opt))
            extra_gain.append(percent(nn, two_opt))

        summary[count] = (
            statistics.mean(nn_gain),
            statistics.mean(two_opt_gain),
            statistics.mean(extra_gain),
        )
        print(
            f"{count:>6} | {summary[count][0]:>13.1f}% | "
            f"{summary[count][1]:>16.1f}% | {summary[count][2]:>14.1f}%"
        )

    print("-" * 66)
    big = [c for c in POINT_COUNTS if c >= 10]
    print(
        f"Среднее по {min(big)}..{max(big)} точек:  "
        f"NN ~{statistics.mean(summary[c][0] for c in big):.0f}%, "
        f"2-opt ~{statistics.mean(summary[c][1] for c in big):.0f}%, "
        f"2-opt доп. ~{statistics.mean(summary[c][2] for c in big):.1f}%"
    )
    print(f"Параметры: {TRIALS} прогонов на каждое N, радиус {RADIUS_KM:.0f} км.")


if __name__ == "__main__":
    main()

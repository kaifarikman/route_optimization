import os
import sys
import unittest
from unittest.mock import Mock

import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PROJECT_ROOT)

from backend.domain.point import Point
from backend.services.point import clear_all_points, generate_points, get_points


class FakeUoW:
    def __init__(self, points_repo, routes_repo=None):
        self.points = points_repo
        self.routes = routes_repo or Mock()
        self.committed = False
        self.rolled_back = False

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True


class TestPoints(unittest.TestCase):
    def setUp(self):
        self.points_repo = Mock()
        self.uow = FakeUoW(self.points_repo)

    def test_generate_points_returns_list(self):
        self.points_repo.add.side_effect = [
            Point(id=1, lat=58.0, lon=62.0),
            Point(id=2, lat=58.1, lon=62.1),
            Point(id=3, lat=58.2, lon=62.2),
            Point(id=4, lat=58.3, lon=62.3),
            Point(id=5, lat=58.4, lon=62.4),
        ]
        points = generate_points(58.5, 62.73, 10.1, 5, uow=self.uow)
        self.assertIsInstance(points, list)
        self.assertEqual(len(points), 5)

    def test_generate_points_creates_correct_number_of_points(self):
        count = 10
        self.points_repo.add.side_effect = [
            Point(id=index + 1, lat=58.0 + index, lon=62.0 + index) for index in range(count)
        ]
        points = generate_points(58.5, 62.73, 10.1, count, uow=self.uow)
        self.assertEqual(len(points), count)
        self.assertEqual(self.points_repo.add.call_count, count)
        self.assertTrue(self.uow.committed)

    def test_generate_points_each_point_has_required_fields(self):
        self.points_repo.add.side_effect = [
            Point(id=1, lat=58.1, lon=62.1),
            Point(id=2, lat=58.2, lon=62.2),
            Point(id=3, lat=58.3, lon=62.3),
        ]
        points = generate_points(58.5, 62.73, 10.1, 3, uow=self.uow)
        for point in points:
            self.assertIn("id", point)
            self.assertIn("lat", point)
            self.assertIn("lon", point)
            self.assertIsInstance(point["id"], int)
            self.assertIsInstance(point["lat"], float)
            self.assertIsInstance(point["lon"], float)

    def test_generate_points_zero_count(self):
        points = generate_points(58.5, 62.73, 10.1, 0, uow=self.uow)
        self.assertEqual(len(points), 0)
        self.assertEqual(self.points_repo.add.call_count, 0)

    def test_generate_points_points_are_within_radius(self):
        count = 20
        self.points_repo.add.side_effect = [
            Point(id=index + 1, lat=58.5, lon=62.73) for index in range(count)
        ]
        points = generate_points(58.5, 62.73, 10.1, count, uow=self.uow)
        for point in points:
            distance = self.calculate_distance(58.5, 62.73, point["lat"], point["lon"])
            self.assertLessEqual(distance, 10.1 + 0.01)

    def test_get_points_returns_points(self):
        self.points_repo.list.return_value = [
            Point(id=1, lat=58.5, lon=62.73),
            Point(id=2, lat=58.6, lon=62.74),
        ]
        points = get_points(uow=self.uow)
        self.assertEqual(points, [{"id": 1, "lat": 58.5, "lon": 62.73}, {"id": 2, "lat": 58.6, "lon": 62.74}])
        self.points_repo.list.assert_called_once()

    def test_clear_all_points_returns_count(self):
        self.points_repo.list.return_value = [
            Point(id=1, lat=58.5, lon=62.73),
            Point(id=2, lat=58.6, lon=62.74),
            Point(id=3, lat=58.7, lon=62.75),
        ]
        deleted_count = clear_all_points(uow=self.uow)
        self.assertEqual(deleted_count, 3)
        self.points_repo.clear_all.assert_called_once()
        self.assertTrue(self.uow.committed)

    def test_clear_all_points_empty_database(self):
        self.points_repo.list.return_value = []
        deleted_count = clear_all_points(uow=self.uow)
        self.assertEqual(deleted_count, 0)
        self.points_repo.clear_all.assert_called_once()

    def test_clear_all_points_also_clears_routes(self):
        call_order = []
        self.points_repo.list.return_value = [Point(id=1, lat=58.5, lon=62.73)]
        self.uow.routes.clear_all.side_effect = lambda: call_order.append("routes")
        self.points_repo.clear_all.side_effect = lambda: call_order.append("points")

        deleted_count = clear_all_points(uow=self.uow)

        self.assertEqual(deleted_count, 1)
        self.uow.routes.clear_all.assert_called_once()
        self.points_repo.clear_all.assert_called_once()
        self.assertEqual(call_order, ["routes", "points"])

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        radius = 6371
        lat1, lon1 = np.radians(lat1), np.radians(lon1)
        lat2, lon2 = np.radians(lat2), np.radians(lon2)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
        c = 2 * np.arcsin(np.sqrt(a))
        return radius * c

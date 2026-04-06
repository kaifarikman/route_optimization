import sys
import os
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))
sys.path.insert(0, backend_path)
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, src_path)
import unittest
from unittest.mock import patch
import numpy as np
from src.backend.app.generation import generate_points, get_points, clear_all_points


class TestPoints(unittest.TestCase):
    def setUp(self):
        self.add_point_patcher = patch('src.backend.app.generation.add_point')
        self.clear_points_patcher = patch('src.backend.app.generation.clear_points')
        self.get_all_points_patcher = patch('src.backend.app.generation.get_all_points')
        self.mock_add_point = self.add_point_patcher.start()
        self.mock_clear_points = self.clear_points_patcher.start()
        self.mock_get_all_points = self.get_all_points_patcher.start()
        self.mock_add_point.return_value = 1
        self.mock_get_all_points.return_value = []

    def tearDown(self):
        self.add_point_patcher.stop()
        self.clear_points_patcher.stop()
        self.get_all_points_patcher.stop()

    def test_generate_points_returns_list(self):
        points = generate_points(58.5, 62.73, 10.1, 5)
        self.assertIsInstance(points, list)
        self.assertEqual(len(points), 5)

    def test_generate_points_creates_correct_number_of_points(self):
        count = 10
        points = generate_points(58.5, 62.73, 10.1, count)
        self.assertEqual(len(points), count)
        self.assertEqual(self.mock_add_point.call_count, count)

    def test_generate_points_each_point_has_required_fields(self):
        points = generate_points(58.5, 62.73, 10.1, 3)
        for point in points:
            self.assertIn('id', point)
            self.assertIn('lat', point)
            self.assertIn('lon', point)
            self.assertIsInstance(point['id'], int)
            self.assertIsInstance(point['lat'], float)
            self.assertIsInstance(point['lon'], float)

    def test_generate_points_zero_count(self):
        points = generate_points(58.5, 62.73, 10.1, 0)
        self.assertEqual(len(points), 0)
        self.assertEqual(self.mock_add_point.call_count, 0)

    def test_generate_points_points_are_within_radius(self):
        center_lat = 58.5
        center_lon = 62.73
        radius_km = 10.1
        count = 20
        points = generate_points(center_lat, center_lon, radius_km, count)
        for point in points:
            distance = self.calculate_distance(
                center_lat, center_lon,
                point['lat'], point['lon']
            )
            self.assertLessEqual(distance, radius_km + 0.01)

    def test_get_points_returns_points(self):
        test_points = [
            {'id': 1, 'lat': 58.5, 'lon': 62.73},
            {'id': 2, 'lat': 58.6, 'lon': 62.74}
        ]
        self.mock_get_all_points.return_value = test_points
        points = get_points()
        self.assertEqual(points, test_points)
        self.mock_get_all_points.assert_called_once()

    def test_clear_all_points_returns_count(self):
        test_points = [
            {'id': 1, 'lat': 58.5, 'lon': 62.73},
            {'id': 2, 'lat': 58.6, 'lon': 62.74},
            {'id': 3, 'lat': 58.7, 'lon': 62.75}
        ]
        self.mock_get_all_points.return_value = test_points
        deleted_count = clear_all_points()
        self.assertEqual(deleted_count, 3)
        self.mock_clear_points.assert_called_once()

    def test_clear_all_points_empty_database(self):
        self.mock_get_all_points.return_value = []
        deleted_count = clear_all_points()
        self.assertEqual(deleted_count, 0)
        self.mock_clear_points.assert_called_once()

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        R = 6371
        lat1, lon1 = np.radians(lat1), np.radians(lon1)
        lat2, lon2 = np.radians(lat2), np.radians(lon2)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
        c = 2 * np.arcsin(np.sqrt(a))
        return R * c

    def test_generate_points_diversity(self):
        center_lat = 58.5
        center_lon = 62.73
        radius_km = 10.1
        count = 20
        points = generate_points(center_lat, center_lon, radius_km, count)
        sum_div = 0
        sdist_list = []
        for point in points:
            distance = self.calculate_distance(
                center_lat, center_lon,
                point['lat'], point['lon']
            )
            sdist_list.append(distance)
        sr_ar = sum(sdist_list)/len(sdist_list)
        for i in sdist_list:
            sum_div += (i - sr_ar)**2
        disp = sum_div/len(sdist_list)
        self.assertGreater(disp, 0)


    def test_generate_points_disp_lat(self):
        center_lat = 58.5
        center_lon = 62.73
        radius_km = 10.1
        count = 20
        points = generate_points(center_lat, center_lon, radius_km, count)
        lat_list = []
        for point in points:
            lat_list.append(point['lat'])
        sr_ar = sum(lat_list) / len(lat_list)
        sum_div = 0
        for el in lat_list:
            sum_div += (el - sr_ar) ** 2
        disp = sum_div / len(lat_list)
        a = center_lat - radius_km / 111.0
        b = center_lat + radius_km / 111.0
        norm = ((b - a) ** 2) / 12
        self.assertLessEqual(disp, norm * 1.5)
        self.assertGreaterEqual(disp, norm * 0.5)

    def test_generate_points_disp_lat(self):
        center_lat = 58.5
        center_lon = 62.73
        radius_km = 10.1
        count = 20
        points = generate_points(center_lat, center_lon, radius_km, count)
        lat_list = []
        for point in points:
            lat_list.append(point['lat'])
        sr_ar = sum(lat_list) / len(lat_list)
        sum_div = 0
        for el in lat_list:
            sum_div += (el - sr_ar) ** 2
        disp = sum_div / len(lat_list)
        a = center_lat - radius_km / 111.0
        b = center_lat + radius_km / 111.0
        norm = ((b - a) ** 2) / 12
        self.assertLessEqual(disp, norm * 1.5)
        self.assertGreaterEqual(disp, norm * 0.5)



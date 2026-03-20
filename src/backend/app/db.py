import sqlite3
from typing import List, Dict

DB_FILE = "database.db"

def get_connection():
    """Получить подключение к БД"""
    return sqlite3.connect(DB_FILE)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Таблица точек
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lon REAL NOT NULL
    )
    ''')
    
    # Таблица маршрутов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        points TEXT NOT NULL,
        coordinates TEXT NOT NULL,
        distance_km REAL NOT NULL,
        duration_minutes REAL NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

    print("База данных инициализирована")

def clear_points():
    """Очистить таблицу точек"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM points')
    conn.commit()
    conn.close()

def add_point(lat: float, lon: float) -> int:
    """Добавить точку и вернуть ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO points (lat, lon) VALUES (?, ?)', (lat, lon))
    conn.commit()
    point_id = cursor.lastrowid
    conn.close()
    return point_id

def get_all_points() -> List[Dict]:
    """Получить все точки"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, lat, lon FROM points')
    rows = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "lat": row[1], "lon": row[2]} for row in rows]

def add_route(points_list: List[int], coordinates: List, distance_km: float, duration_minutes: float) -> int:
    import json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO routes (points, coordinates, distance_km, duration_minutes)
    VALUES (?, ?, ?, ?)
    ''', (json.dumps(points_list), json.dumps(coordinates), distance_km, duration_minutes))
    conn.commit()
    route_id = cursor.lastrowid
    conn.close()
    return route_id

def get_route(route_id: int) -> Dict:
    import json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT id, points, coordinates, distance_km, duration_minutes 
    FROM routes WHERE id = ?
    ''', (route_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "id": row[0],
        "points": json.loads(row[1]),
        "coordinates": json.loads(row[2]),
        "distance_km": row[3],
        "duration_minutes": row[4]
    }

def get_all_routes() -> List[Dict]:
    """Получить все маршруты"""
    import json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT id, points, coordinates, distance_km, duration_minutes 
    FROM routes
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    routes = []
    for row in rows:
        routes.append({
            "id": row[0],
            "points": json.loads(row[1]),
            "coordinates": json.loads(row[2]),
            "distance_km": row[3],
            "duration_minutes": row[4]
        })
    return routes
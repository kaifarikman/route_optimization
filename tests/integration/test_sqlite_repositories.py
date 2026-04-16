from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from backend.db.base import Base
from backend.db.models import PointModel
from backend.db.session import init_db
from backend.repositories.point import PointRepository
from backend.repositories.route import RouteRepository


def test_init_db_removes_legacy_tables(monkeypatch, tmp_path: Path):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)

    with engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE route_points (id INTEGER PRIMARY KEY)")
        connection.exec_driver_sql("CREATE TABLE distances (id INTEGER PRIMARY KEY)")

    monkeypatch.setattr("backend.db.session.engine", engine)

    init_db()

    table_names = sorted(inspect(engine).get_table_names())
    assert table_names == ["points", "routes"]


def test_sqlite_repositories_roundtrip(tmp_path: Path):
    db_path = tmp_path / "repo.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()

    points = PointRepository(session)
    routes = RouteRepository(session)

    first = points.add(55.75, 37.61)
    second = points.add(55.76, 37.62)
    route = routes.add(
        points=[first.id, second.id],
        coordinates=[[first.lat, first.lon], [second.lat, second.lon]],
        distance_km=1.5,
        duration_minutes=2.25,
    )
    session.commit()

    stored_route = routes.get(route.id)
    stored_points = points.list()

    assert [point.id for point in stored_points] == [first.id, second.id]
    assert stored_route is not None
    assert stored_route.points == [first.id, second.id]
    assert stored_route.coordinates == [(55.75, 37.61), (55.76, 37.62)]

    session.close()

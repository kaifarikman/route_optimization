from pathlib import Path
from datetime import datetime, timedelta

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from backend.db.base import Base
from backend.db.models import PointModel, RouteModel
from backend.db.session import init_db
from backend.db.uow import SqlAlchemyUnitOfWork
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
    assert table_names == ["geocode_cache", "points", "route_shares", "routes"]
    assert {"user_id", "last_accessed_at"}.issubset(
        {column["name"] for column in inspect(engine).get_columns("points")}
    )
    assert {"address", "geocoding_provider", "geocoding_place_id"}.issubset(
        {column["name"] for column in inspect(engine).get_columns("points")}
    )
    assert {"user_id", "last_accessed_at"}.issubset(
        {column["name"] for column in inspect(engine).get_columns("routes")}
    )


def test_sqlite_repositories_roundtrip(tmp_path: Path):
    db_path = tmp_path / "repo.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()

    points = PointRepository(session)
    routes = RouteRepository(session)

    first = points.add(
        55.75,
        37.61,
        address="Москва, Красная площадь",
        geocoding_provider="nominatim",
        geocoding_place_id="123",
    )
    second = points.add(55.76, 37.62)
    route = routes.add(
        points=[first.id, second.id],
        coordinates=[[first.lat, first.lon], [second.lat, second.lon]],
        distance_km=1.5,
        duration_minutes=2.25,
        geometry=[[first.lat, first.lon], [second.lat, second.lon]],
        provider="haversine",
        is_fallback=False,
        geometry_type="straight",
        transport_type="driving",
    )
    session.commit()

    stored_route = routes.get(route.id)
    stored_points = points.list()

    assert [point.id for point in stored_points] == [first.id, second.id]
    assert stored_points[0].address == "Москва, Красная площадь"
    assert stored_points[0].geocoding_provider == "nominatim"
    assert stored_points[0].geocoding_place_id == "123"
    assert points.count() == 2
    assert stored_route is not None
    assert stored_route.points == [first.id, second.id]
    assert stored_route.coordinates == [(55.75, 37.61), (55.76, 37.62)]

    session.close()


def test_point_repository_get_by_ids_preserves_requested_order(tmp_path: Path):
    db_path = tmp_path / "ordered.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()

    points = PointRepository(session)
    first = points.add(55.75, 37.61)
    second = points.add(55.76, 37.62)
    third = points.add(55.77, 37.63)
    session.commit()

    ordered = points.get_by_ids([third.id, first.id, second.id])

    assert [point.id for point in ordered] == [third.id, first.id, second.id]

    session.close()


def test_repositories_scope_records_by_user_id(tmp_path: Path):
    db_path = tmp_path / "scoped.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)()

    user_one_points = PointRepository(session, user_id="user-1")
    user_two_points = PointRepository(session, user_id="user-2")
    first = user_one_points.add(55.75, 37.61)
    user_two_points.add(55.76, 37.62)
    session.commit()

    assert [point.id for point in user_one_points.list()] == [first.id]
    assert user_one_points.count() == 1
    assert user_one_points.get(first.id) == first
    assert user_two_points.get(first.id) is None

    session.close()


def test_unit_of_work_cleanup_removes_stale_user_records(tmp_path: Path):
    db_path = tmp_path / "ttl.db"
    engine = create_engine(f"sqlite:///{db_path}", future=True)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    old_time = datetime.utcnow() - timedelta(hours=25)
    fresh_time = datetime.utcnow()

    session = session_factory()
    session.add_all(
        [
            PointModel(lat=55.75, lon=37.61, user_id="stale", last_accessed_at=old_time),
            PointModel(lat=55.76, lon=37.62, user_id="active", last_accessed_at=fresh_time),
            RouteModel(
                points=[1],
                coordinates=[[55.75, 37.61]],
                distance_km=1,
                duration_minutes=1,
                geometry=[[55.75, 37.61]],
                provider="haversine",
                is_fallback=False,
                geometry_type="straight",
                transport_type="driving",
                user_id="stale",
                last_accessed_at=old_time,
            ),
        ]
    )
    session.commit()
    session.close()

    with SqlAlchemyUnitOfWork(session_factory=session_factory, user_id="active") as uow:
        uow.cleanup_expired_users()
        uow.commit()

    session = session_factory()
    assert session.query(PointModel).filter(PointModel.user_id == "stale").count() == 0
    assert session.query(RouteModel).filter(RouteModel.user_id == "stale").count() == 0
    assert session.query(PointModel).filter(PointModel.user_id == "active").count() == 1
    session.close()

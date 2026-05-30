from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.config import DATABASE_URL
from backend.db.base import Base
import backend.db.models  # noqa: F401

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _table_columns(connection, table_name):
    return {
        row[1]
        for row in connection.exec_driver_sql(f"PRAGMA table_info({table_name})").fetchall()
    }


def _ensure_point_address_columns(connection):
    columns = _table_columns(connection, "points")
    if "address" not in columns:
        connection.exec_driver_sql("ALTER TABLE points ADD COLUMN address VARCHAR")
    if "geocoding_provider" not in columns:
        connection.exec_driver_sql("ALTER TABLE points ADD COLUMN geocoding_provider VARCHAR")
    if "geocoding_place_id" not in columns:
        connection.exec_driver_sql("ALTER TABLE points ADD COLUMN geocoding_place_id VARCHAR")


def _ensure_geocode_cache_table(connection):
    table_names = {
        row[0]
        for row in connection.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }
    if "geocode_cache" not in table_names:
        return

    columns = _table_columns(connection, "geocode_cache")
    if {"cache_key", "query", "provider", "results", "created_at"}.issubset(columns):
        return

    connection.exec_driver_sql("DROP TABLE geocode_cache")
    Base.metadata.tables["geocode_cache"].create(bind=connection)


def _ensure_sqlite_migrations(connection):
    for table_name in ("points", "routes"):
        columns = _table_columns(connection, table_name)
        if "user_id" not in columns:
            connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN user_id VARCHAR")
        if "last_accessed_at" not in columns:
            connection.exec_driver_sql(
                f"ALTER TABLE {table_name} ADD COLUMN last_accessed_at DATETIME"
            )
    _ensure_point_address_columns(connection)
    _ensure_geocode_cache_table(connection)


def init_db():
    with engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS route_points")
        connection.exec_driver_sql("DROP TABLE IF EXISTS distances")
        Base.metadata.create_all(bind=connection)
        _ensure_sqlite_migrations(connection)

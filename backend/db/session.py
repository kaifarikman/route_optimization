from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.config import DATABASE_URL
from backend.db.base import Base
import backend.db.models  # noqa: F401

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _ensure_user_scope_columns(connection):
    for table_name in ("points", "routes"):
        columns = {
            row[1]
            for row in connection.exec_driver_sql(f"PRAGMA table_info({table_name})").fetchall()
        }
        if "user_id" not in columns:
            connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN user_id VARCHAR")
        if "last_accessed_at" not in columns:
            connection.exec_driver_sql(
                f"ALTER TABLE {table_name} ADD COLUMN last_accessed_at DATETIME"
            )


def init_db():
    with engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS route_points")
        connection.exec_driver_sql("DROP TABLE IF EXISTS distances")
        Base.metadata.create_all(bind=connection)
        _ensure_user_scope_columns(connection)

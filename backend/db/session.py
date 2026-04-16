from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.config import DATABASE_URL
from backend.db.base import Base
import backend.db.models  # noqa: F401

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db():
    with engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE IF EXISTS route_points")
        connection.exec_driver_sql("DROP TABLE IF EXISTS distances")
        Base.metadata.create_all(bind=connection)

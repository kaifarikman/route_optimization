from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from backend.db.base import Base


class PointModel(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)


class RouteModel(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    points: Mapped[list[int]] = mapped_column(JSON, nullable=False)
    coordinates: Mapped[list[list[float]]] = mapped_column(JSON, nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[float] = mapped_column(Float, nullable=False)


class RoutePointModel(Base):
    __tablename__ = "route_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), nullable=False)
    point_id: Mapped[int] = mapped_column(ForeignKey("points.id"), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)


class DistanceModel(Base):
    __tablename__ = "distances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_point_id: Mapped[int] = mapped_column(ForeignKey("points.id"), nullable=False)
    to_point_id: Mapped[int] = mapped_column(ForeignKey("points.id"), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[float] = mapped_column(Float, nullable=False)

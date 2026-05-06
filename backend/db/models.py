from sqlalchemy import Float, Integer, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from typing import List, Tuple

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
    geometry: Mapped[List[Tuple[float, float]]] = mapped_column(JSON, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    is_fallback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    geometry_type: Mapped[str] = mapped_column(String, nullable=False)
    transport_type: Mapped[str] = mapped_column(String, nullable=False)
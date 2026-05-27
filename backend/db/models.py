from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from typing import List, Tuple

from backend.db.base import Base


class PointModel(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


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
    user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class RouteShareModel(Base):
    __tablename__ = "route_shares"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    owner_user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

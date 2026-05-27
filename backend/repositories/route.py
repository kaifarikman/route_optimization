from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Tuple

from backend.db.models import RouteModel
from backend.domain.route import Route


class RouteRepository:
    def __init__(self, session: Session, user_id: str | None = None):
        self.session = session
        self.user_id = user_id

    def _query(self):
        query = self.session.query(RouteModel)
        if self.user_id is not None:
            query = query.filter(RouteModel.user_id == self.user_id)
        return query

    def add(
            self, points: list[int], coordinates: list[list[float]], distance_km: float, duration_minutes: float,
            geometry: List[Tuple[float, float]], provider: str, is_fallback: bool, geometry_type: str, transport_type: str
            ) -> Route:
        model = RouteModel(
            points=points,
            coordinates=coordinates,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
            geometry=geometry,
            provider=provider,
            is_fallback=is_fallback,
            geometry_type=geometry_type,
            transport_type=transport_type,
            user_id=self.user_id,
            last_accessed_at=datetime.utcnow(),
        )
        self.session.add(model)
        self.session.flush()
        return Route(
            id=model.id,
            points=model.points,
            coordinates=[tuple(item) for item in model.coordinates],
            distance_km=model.distance_km,
            duration_minutes=model.duration_minutes,
            geometry=[tuple(item) for item in model.geometry],
            provider=model.provider,
            is_fallback=model.is_fallback,
            geometry_type=model.geometry_type,
            transport_type=model.transport_type
        )

    def get(self, route_id: int) -> Route | None:
        row = self._query().filter(RouteModel.id == route_id).first()
        if row is None:
            return None
        return Route(
            id=row.id,
            points=row.points,
            coordinates=[tuple(item) for item in row.coordinates],
            distance_km=row.distance_km,
            duration_minutes=row.duration_minutes,
            geometry=[tuple(item) for item in row.geometry],
            provider=row.provider,
            is_fallback=row.is_fallback,
            geometry_type=row.geometry_type,
            transport_type=row.transport_type
        )

    def list(self) -> list[Route]:
        rows = self._query().all()
        return [
            Route(
                id=row.id,
                points=row.points,
                coordinates=[tuple(item) for item in row.coordinates],
                distance_km=row.distance_km,
                duration_minutes=row.duration_minutes,
                geometry=[tuple(item) for item in row.geometry],
                provider=row.provider,
                is_fallback=row.is_fallback,
                geometry_type=row.geometry_type,
                transport_type=row.transport_type
            )
            for row in rows
        ]

    def clear_all(self) -> None:
        self._query().delete(synchronize_session=False)

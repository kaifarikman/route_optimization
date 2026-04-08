from sqlalchemy.orm import Session

from backend.db.models import RouteModel
from backend.domain.route import Route


class RouteRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, points: list[int], coordinates: list[list[float]], distance_km: float, duration_minutes: float) -> Route:
        model = RouteModel(
            points=points,
            coordinates=coordinates,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
        )
        self.session.add(model)
        self.session.flush()
        return Route(
            id=model.id,
            points=list(model.points),
            coordinates=[tuple(item) for item in model.coordinates],
            distance_km=model.distance_km,
            duration_minutes=model.duration_minutes,
        )

    def get(self, route_id: int) -> Route | None:
        row = self.session.get(RouteModel, route_id)
        if row is None:
            return None
        return Route(
            id=row.id,
            points=list(row.points),
            coordinates=[tuple(item) for item in row.coordinates],
            distance_km=row.distance_km,
            duration_minutes=row.duration_minutes,
        )

    def list(self) -> list[Route]:
        rows = self.session.query(RouteModel).all()
        return [
            Route(
                id=row.id,
                points=list(row.points),
                coordinates=[tuple(item) for item in row.coordinates],
                distance_km=row.distance_km,
                duration_minutes=row.duration_minutes,
            )
            for row in rows
        ]

    def clear_all(self) -> None:
        self.session.query(RouteModel).delete()

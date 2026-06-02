from datetime import UTC, datetime
from sqlalchemy.orm import Session

from backend.db.models import PointModel
from backend.domain.point import Point


class PointRepository:
    def __init__(self, session: Session, user_id: str | None = None):
        self.session = session
        self.user_id = user_id

    def _query(self):
        query = self.session.query(PointModel)
        if self.user_id is not None:
            query = query.filter(PointModel.user_id == self.user_id)
        return query

    def add(
        self,
        lat: float,
        lon: float,
        address: str | None = None,
        geocoding_provider: str | None = None,
        geocoding_place_id: str | None = None,
    ) -> Point:
        model = PointModel(
            lat=lat,
            lon=lon,
            address=address,
            geocoding_provider=geocoding_provider,
            geocoding_place_id=geocoding_place_id,
            user_id=self.user_id,
            last_accessed_at=datetime.now(UTC),
        )
        self.session.add(model)
        self.session.flush()
        return self._to_domain(model)

    def _to_domain(self, row: PointModel) -> Point:
        return Point(
            id=row.id,
            lat=row.lat,
            lon=row.lon,
            address=row.address,
            geocoding_provider=row.geocoding_provider,
            geocoding_place_id=row.geocoding_place_id,
        )

    def get(self, point_id: int) -> Point | None:
        row = self._query().filter(PointModel.id == point_id).first()
        if row is None:
            return None
        return self._to_domain(row)

    def get_by_ids(self, point_ids: list[int]) -> list[Point]:
        rows = self._query().filter(PointModel.id.in_(point_ids)).all()
        rows_by_id = {
            row.id: self._to_domain(row)
            for row in rows
        }
        return [rows_by_id[point_id] for point_id in point_ids if point_id in rows_by_id]

    def list(self) -> list[Point]:
        rows = self._query().all()
        return [self._to_domain(row) for row in rows]

    def count(self) -> int:
        return self._query().count()

    def clear_all(self) -> None:
        self._query().delete(synchronize_session=False)

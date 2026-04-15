from sqlalchemy.orm import Session
from typing import List

from backend.db.models import PointModel
from backend.domain.point import Point


class PointRepository:
    def __init__(self, session: Session):
        self.session = session

    def add(self, lat: float, lon: float) -> Point:
        model = PointModel(lat=lat, lon=lon)
        self.session.add(model)
        self.session.flush()
        return Point(id=model.id, lat=model.lat, lon=model.lon)
    
    def get(self, point_id: int) -> Point | None:
        row = self.session.get(PointModel, point_id)
        if row is None:
            return None
        return Point(
            id=row.id,
            lat=row.lat,
            lon=row.lon,
        )
    
    def get_by_ids(self, point_ids: List[int]) -> List[Point]:
        rows = self.session.query(PointModel).filter(PointModel.id.in_(point_ids)).all()
        return [Point(id=row.id, lat=row.lat, lon=row.lon) for row in rows]

    def list(self) -> List[Point]:
        rows = self.session.query(PointModel).all()
        return [Point(id=row.id, lat=row.lat, lon=row.lon) for row in rows]

    def clear_all(self) -> None:
        self.session.query(PointModel).delete()

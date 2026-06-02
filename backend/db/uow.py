from abc import ABC, abstractmethod
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Callable

from sqlalchemy.orm import Session

from backend.db.models import PointModel, RouteModel
from backend.db.session import SessionLocal
from backend.repositories.geocode_cache import GeocodeCacheRepository
from backend.repositories.point import PointRepository
from backend.repositories.route import RouteRepository
from backend.repositories.share import RouteShareRepository


class AbstractUnitOfWork(ABC):
    points: PointRepository
    routes: RouteRepository
    shares: RouteShareRepository
    geocode_cache: GeocodeCacheRepository

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.rollback()

    @abstractmethod
    def commit(self):
        raise NotImplementedError

    @abstractmethod
    def rollback(self):
        raise NotImplementedError


class SqlAlchemyUnitOfWork(AbstractUnitOfWork):
    def __init__(
        self,
        session_factory: Callable[[], Session] = SessionLocal,
        user_id: str | None = None,
    ):
        self.session_factory = session_factory
        self.user_id = user_id
        self.session: Session | None = None

    def __enter__(self):
        self.session = self.session_factory()
        self.points = PointRepository(self.session, user_id=self.user_id)
        self.routes = RouteRepository(self.session, user_id=self.user_id)
        self.shares = RouteShareRepository(self.session, owner_user_id=self.user_id)
        self.geocode_cache = GeocodeCacheRepository(self.session)
        return super().__enter__()

    def __exit__(self, exc_type, exc, tb):
        try:
            super().__exit__(exc_type, exc, tb)
        finally:
            if self.session is not None:
                self.session.close()

    def commit(self):
        if self.session is None:
            raise RuntimeError("Unit of work session is not initialized")
        self.session.commit()

    def rollback(self):
        if self.session is None:
            return
        self.session.rollback()

    def cleanup_expired_users(self, ttl_hours: int = 24):
        if self.session is None:
            raise RuntimeError("Unit of work session is not initialized")
        cutoff = datetime.now(UTC) - timedelta(hours=ttl_hours)
        for model in (RouteModel, PointModel):
            self.session.query(model).filter(
                model.user_id.isnot(None),
                model.last_accessed_at.isnot(None),
                model.last_accessed_at < cutoff,
            ).delete(synchronize_session=False)

    def touch_current_user(self):
        if self.session is None:
            raise RuntimeError("Unit of work session is not initialized")
        if self.user_id is None:
            return
        now = datetime.now(UTC)
        for model in (PointModel, RouteModel):
            self.session.query(model).filter(model.user_id == self.user_id).update(
                {"last_accessed_at": now},
                synchronize_session=False,
            )


def get_uow() -> Iterator[AbstractUnitOfWork]:
    with SqlAlchemyUnitOfWork() as uow:
        yield uow

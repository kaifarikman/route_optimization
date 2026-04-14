from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import Callable

from sqlalchemy.orm import Session

from backend.db.session import SessionLocal
from backend.repositories.point import PointRepository
from backend.repositories.route import RouteRepository


class AbstractUnitOfWork(ABC):
    points: PointRepository
    routes: RouteRepository

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
    def __init__(self, session_factory: Callable[[], Session] = SessionLocal):
        self.session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self):
        self.session = self.session_factory()
        self.points = PointRepository(self.session)
        self.routes = RouteRepository(self.session)
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


def get_uow() -> Iterator[AbstractUnitOfWork]:
    with SqlAlchemyUnitOfWork() as uow:
        yield uow

from collections.abc import Iterator

from fastapi import Header

from backend.db.uow import AbstractUnitOfWork, SqlAlchemyUnitOfWork


class UserIdHeaderRequired(Exception):
    pass


def require_user_id(x_user_id: str | None = Header(default=None, alias="X-User-Id")) -> str:
    if x_user_id is None or not x_user_id.strip():
        raise UserIdHeaderRequired()
    return x_user_id.strip()


def get_user_uow(user_id: str | None = Header(default=None, alias="X-User-Id")) -> Iterator[AbstractUnitOfWork]:
    user_id = require_user_id(user_id)
    with SqlAlchemyUnitOfWork(user_id=user_id) as uow:
        uow.cleanup_expired_users()
        uow.commit()
        try:
            yield uow
        except Exception:
            raise
        else:
            uow.touch_current_user()
            uow.commit()

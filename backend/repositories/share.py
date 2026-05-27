from datetime import datetime

from sqlalchemy.orm import Session

from backend.db.models import RouteShareModel


class RouteShareRepository:
    def __init__(self, session: Session, owner_user_id: str | None = None):
        self.session = session
        self.owner_user_id = owner_user_id

    def add(self, token: str, snapshot: dict) -> dict:
        model = RouteShareModel(
            token=token,
            owner_user_id=self.owner_user_id,
            snapshot=snapshot,
            created_at=datetime.utcnow(),
        )
        self.session.add(model)
        self.session.flush()
        return self._to_dict(model)

    def get(self, token: str) -> dict | None:
        row = self.session.get(RouteShareModel, token)
        return self._to_dict(row) if row else None

    def _to_dict(self, row: RouteShareModel) -> dict:
        return {
            "token": row.token,
            "owner_user_id": row.owner_user_id,
            "snapshot": row.snapshot,
            "created_at": row.created_at,
        }

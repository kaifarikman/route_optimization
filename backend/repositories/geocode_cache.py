from datetime import UTC, datetime

from sqlalchemy.orm import Session

from backend.db.models import GeocodeCacheModel


class GeocodeCacheRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, cache_key: str) -> dict | None:
        row = self.session.get(GeocodeCacheModel, cache_key)
        if row is None:
            return None
        return {
            "cache_key": row.cache_key,
            "query": row.query,
            "provider": row.provider,
            "results": row.results,
            "created_at": row.created_at,
        }

    def set(self, cache_key: str, query: str, provider: str, results: list[dict]) -> dict:
        row = self.session.get(GeocodeCacheModel, cache_key)
        if row is None:
            row = GeocodeCacheModel(
                cache_key=cache_key,
                query=query,
                provider=provider,
                results=results,
                created_at=datetime.now(UTC),
            )
            self.session.add(row)
        else:
            row.query = query
            row.provider = provider
            row.results = results
            row.created_at = datetime.now(UTC)
        self.session.flush()
        return self.get(cache_key)

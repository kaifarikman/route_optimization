import math
import re
import threading
import time
from urllib.parse import urljoin

import requests

from backend.config import (
    GEOCODING_ACCEPT_LANGUAGE,
    GEOCODING_BASE_URL,
    GEOCODING_PROVIDER,
    GEOCODING_TIMEOUT_SECONDS,
    GEOCODING_USER_AGENT,
)
from backend.db.uow import AbstractUnitOfWork


class GeocodingError(Exception):
    pass


class GeocodingProviderError(GeocodingError):
    pass


class GeocodingRateLimitError(GeocodingError):
    pass


class GeocodingTimeoutError(GeocodingError):
    pass


_rate_limit_lock = threading.Lock()
_last_outbound_request_at = 0.0


def reset_geocoding_rate_limit() -> None:
    global _last_outbound_request_at
    with _rate_limit_lock:
        _last_outbound_request_at = 0.0


def _normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.strip()).lower()


def _cache_key(query: str, limit: int) -> str:
    language = GEOCODING_ACCEPT_LANGUAGE or ""
    return f"{GEOCODING_PROVIDER.lower()}:{GEOCODING_BASE_URL.rstrip('/')}:{language}:{limit}:{_normalize_query(query)}"


def _valid_number(value) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(value)


def _parse_float(value) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


class NominatimGeocodingProvider:
    provider_name = "nominatim"

    def search(self, query: str, limit: int) -> list[dict]:
        self._enforce_rate_limit()

        headers = {"User-Agent": GEOCODING_USER_AGENT}
        if GEOCODING_ACCEPT_LANGUAGE:
            headers["Accept-Language"] = GEOCODING_ACCEPT_LANGUAGE

        params = {
            "q": query,
            "format": "jsonv2",
            "limit": limit,
            "addressdetails": 1,
            "layer": "address",
        }

        try:
            response = requests.get(
                urljoin(GEOCODING_BASE_URL.rstrip("/") + "/", "search"),
                params=params,
                headers=headers,
                timeout=GEOCODING_TIMEOUT_SECONDS,
            )
        except requests.Timeout as exc:
            raise GeocodingTimeoutError("Geocoding provider timed out") from exc
        except requests.RequestException as exc:
            raise GeocodingProviderError("Geocoding provider is unavailable") from exc

        if response.status_code == 429:
            raise GeocodingRateLimitError("Geocoding provider rate limit exceeded")

        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise GeocodingProviderError(f"Geocoding provider returned HTTP {response.status_code}") from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise GeocodingProviderError("Geocoding provider returned invalid JSON") from exc
        if not isinstance(data, list):
            raise GeocodingProviderError("Geocoding provider returned invalid response")

        return self._normalize_results(data, limit)

    def _enforce_rate_limit(self) -> None:
        global _last_outbound_request_at
        with _rate_limit_lock:
            now = time.monotonic()
            if now - _last_outbound_request_at < 1.0:
                raise GeocodingRateLimitError("Geocoding is limited to 1 request per second")
            _last_outbound_request_at = now

    def _normalize_results(self, items: list[dict], limit: int) -> list[dict]:
        results = []
        for item in items[:limit]:
            lat = _parse_float(item.get("lat"))
            lon = _parse_float(item.get("lon"))
            display_name = str(item.get("display_name") or "").strip()
            if lat is None or lon is None or not display_name:
                continue

            importance = _parse_float(item.get("importance"))
            if importance is not None and not _valid_number(importance):
                importance = None

            results.append(
                {
                    "lat": lat,
                    "lon": lon,
                    "display_name": display_name,
                    "provider": self.provider_name,
                    "place_id": str(item.get("place_id")) if item.get("place_id") is not None else None,
                    "category": item.get("category") or item.get("class"),
                    "type": item.get("type"),
                    "importance": importance,
                }
            )
        return results


def get_geocoding_provider() -> NominatimGeocodingProvider:
    if GEOCODING_PROVIDER.lower() in {"nominatim", "nominatim-compatible"}:
        return NominatimGeocodingProvider()
    raise GeocodingProviderError("Unknown geocoding provider")


def geocode_address(query: str, limit: int, uow: AbstractUnitOfWork) -> list[dict]:
    normalized_query = _normalize_query(query)
    if not normalized_query:
        raise ValueError("Введите адрес")

    cache_key = _cache_key(normalized_query, limit)
    cached = uow.geocode_cache.get(cache_key)
    if cached is not None:
        return cached["results"]

    provider = get_geocoding_provider()
    results = provider.search(normalized_query, limit)
    uow.geocode_cache.set(cache_key, normalized_query, provider.provider_name, results)
    uow.commit()
    return results

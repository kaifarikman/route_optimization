from fastapi import APIRouter, Depends, HTTPException

from backend.db.uow import AbstractUnitOfWork, get_uow
from backend.schemas.geocode import (
    GeocodeRequest,
    GeocodeResponse,
    ReverseGeocodeRequest,
    ReverseGeocodeResponse,
)
from backend.services.geocoding import (
    GeocodingProviderError,
    GeocodingRateLimitError,
    GeocodingTimeoutError,
    geocode_address,
    reverse_geocode,
)

router = APIRouter()


@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_endpoint(
    request: GeocodeRequest,
    uow: AbstractUnitOfWork = Depends(get_uow),
):
    try:
        results = geocode_address(request.query, request.limit, uow=uow)
        return {"results": results}
    except GeocodingRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except GeocodingTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except GeocodingProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/geocode/reverse", response_model=ReverseGeocodeResponse)
async def reverse_geocode_endpoint(
    request: ReverseGeocodeRequest,
    uow: AbstractUnitOfWork = Depends(get_uow),
):
    try:
        result = reverse_geocode(request.lat, request.lon, uow=uow)
        return {"result": result}
    except GeocodingRateLimitError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except GeocodingTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except GeocodingProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException

from backend.api.dependencies import get_user_uow
from backend.db.uow import AbstractUnitOfWork
from backend.schemas.point import (
    ClearResponse,
    PointCreateRequest,
    PointGenerationRequest,
    PointResponse,
    PointsImportRequest,
    PointsResponse,
)
from backend.services.point import add_point, clear_all_points, generate_points, get_points, import_points

router = APIRouter()


@router.post("/points/generate", response_model=PointsResponse, response_model_exclude_none=True)
async def generate_points_endpoint(
    request: PointGenerationRequest,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        points = generate_points(
            center_lat=request.center_lat,
            center_lon=request.center_lon,
            radius_km=request.radius_km,
            count=request.count,
            uow=uow,
        )
        return {"points": points}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/points", response_model=PointResponse, response_model_exclude_none=True)
async def add_point_endpoint(
    request: PointCreateRequest,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        point = add_point(
            lat=request.lat,
            lon=request.lon,
            uow=uow,
            address=request.address,
            geocoding_provider=request.geocoding_provider,
            geocoding_place_id=request.geocoding_place_id,
        )
        return {"point": point}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/points/import", response_model=PointsResponse, response_model_exclude_none=True)
async def import_points_endpoint(
    request: PointsImportRequest,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        points = import_points(
            [
                {
                    "lat": point.lat,
                    "lon": point.lon,
                    "address": point.address,
                    "geocoding_provider": point.geocoding_provider,
                    "geocoding_place_id": point.geocoding_place_id,
                }
                for point in request.points
            ],
            uow=uow,
        )
        return {"points": points}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/points", response_model=PointsResponse, response_model_exclude_none=True)
async def get_points_endpoint(uow: AbstractUnitOfWork = Depends(get_user_uow)):
    try:
        points = get_points(uow=uow)
        return {"points": points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/points", response_model=ClearResponse)
async def clear_points_endpoint(uow: AbstractUnitOfWork = Depends(get_user_uow)):
    try:
        deleted_count = clear_all_points(uow=uow)
        return {
            "status": "cleared",
            "message": f"Удалено точек: {deleted_count}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

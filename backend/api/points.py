from fastapi import APIRouter, Depends, HTTPException

from backend.db.uow import AbstractUnitOfWork, get_uow
from backend.schemas.point import ClearResponse, PointGenerationRequest, PointsResponse
from backend.services.point import clear_all_points, generate_points, get_points

router = APIRouter()


@router.post("/points/generate", response_model=PointsResponse)
async def generate_points_endpoint(
    request: PointGenerationRequest,
    uow: AbstractUnitOfWork = Depends(get_uow),
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


@router.get("/points", response_model=PointsResponse)
async def get_points_endpoint(uow: AbstractUnitOfWork = Depends(get_uow)):
    try:
        points = get_points(uow=uow)
        return {"points": points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/points", response_model=ClearResponse)
async def clear_points_endpoint(uow: AbstractUnitOfWork = Depends(get_uow)):
    try:
        deleted_count = clear_all_points(uow=uow)
        return {
            "status": "cleared",
            "message": f"Удалено точек: {deleted_count}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

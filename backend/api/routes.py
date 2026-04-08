from fastapi import APIRouter, Depends, HTTPException

from backend.db.uow import AbstractUnitOfWork, get_uow
from backend.schemas.route import RouteRequest, RouteResponse, RoutesResponse
from backend.services.route import (
    build_base_route,
    get_all_routes,
    get_route_by_id,
    optimize_route,
)

router = APIRouter()


@router.post("/routes/base", response_model=RouteResponse)
async def build_base_route_endpoint(
    request: RouteRequest,
    uow: AbstractUnitOfWork = Depends(get_uow),
):
    try:
        route = build_base_route(request.point_ids, uow=uow)
        return {"route": route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/routes/optimize", response_model=RouteResponse)
async def optimize_route_endpoint(
    request: RouteRequest,
    uow: AbstractUnitOfWork = Depends(get_uow),
):
    try:
        optimized_route = optimize_route(request.point_ids, uow=uow)
        return {"route": optimized_route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route_endpoint(route_id: int, uow: AbstractUnitOfWork = Depends(get_uow)):
    try:
        route = get_route_by_id(route_id, uow=uow)
        if not route:
            raise HTTPException(status_code=404, detail="Маршрут не найден")
        return {"route": route}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routes", response_model=RoutesResponse)
async def get_all_routes_endpoint(uow: AbstractUnitOfWork = Depends(get_uow)):
    try:
        routes = get_all_routes(uow=uow)
        return {"routes": routes, "total": len(routes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

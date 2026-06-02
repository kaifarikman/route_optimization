from fastapi import APIRouter, Depends, HTTPException, Request

from backend.api.dependencies import get_user_uow
from backend.db.uow import AbstractUnitOfWork, get_uow
from backend.schemas.route import (
    RouteRequest,
    RouteResponse,
    RouteShareCreateResponse,
    RouteShareRequest,
    RouteShareResponse,
    RoutesResponse,
)
from backend.services.route import (
    build_base_route,
    create_route_share,
    get_all_routes,
    get_route_by_id,
    get_route_share,
    optimize_route,
)

router = APIRouter()


@router.post("/routes/base", response_model=RouteResponse)
async def build_base_route_endpoint(
    request: RouteRequest,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        route = build_base_route(request.point_ids, uow=uow)
        return {"route": route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/routes/optimize", response_model=RouteResponse)
async def optimize_route_endpoint(
    request: RouteRequest,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        optimized_route = optimize_route(request.point_ids, uow=uow, algorithm=request.algorithm)
        return {"route": optimized_route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/routes/share", response_model=RouteShareCreateResponse)
async def create_route_share_endpoint(
    request_body: RouteShareRequest,
    request: Request,
    uow: AbstractUnitOfWork = Depends(get_user_uow),
):
    try:
        result = create_route_share(
            base_route_id=request_body.base_route_id,
            optimized_route_id=request_body.optimized_route_id,
            uow=uow,
        )
        forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        forwarded_host = request.headers.get(
            "x-forwarded-host",
            request.headers.get("host", request.url.netloc),
        )
        origin = f"{forwarded_proto}://{forwarded_host}"
        return {
            "share_url": f"{origin}/?share={result['token']}",
            "token": result["token"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/routes/share/{token}", response_model=RouteShareResponse)
async def get_route_share_endpoint(
    token: str,
    uow: AbstractUnitOfWork = Depends(get_uow),
):
    try:
        share = get_route_share(token, uow=uow)
        if not share:
            raise HTTPException(status_code=404, detail="Ссылка на маршрут не найдена")
        return {"share": share}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route_endpoint(route_id: int, uow: AbstractUnitOfWork = Depends(get_user_uow)):
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
async def get_all_routes_endpoint(uow: AbstractUnitOfWork = Depends(get_user_uow)):
    try:
        routes = get_all_routes(uow=uow)
        return {"routes": routes, "total": len(routes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from app.models.route import RouteRequest, RouteResponse, RoutesResponse
from app.optimization import build_base_route, optimize_route
from app.db import get_route, get_all_routes

router = APIRouter()

@router.post("/routes/base", response_model=RouteResponse)
async def build_base_route_endpoint(request: RouteRequest):
    """
    Построить базовый маршрут
    
    Пример запроса:
    {
        "point_ids": [1, 2, 3, 4, 5]
    }
    """
    try:
        route = build_base_route(request.point_ids)
        return {"route": route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/routes/optimize", response_model=RouteResponse)
async def optimize_route_endpoint(request: RouteRequest):
    """
    Оптимизировать маршрут по точкам
    
    Пример запроса:
    {
        "point_ids": [1, 2, 3, 4, 5]
    }
    """
    try:
        route = build_base_route(request.point_ids)  # строим базовый
        optimized_route = optimize_route(request.point_ids)  # оптимизируем
        return {"route": optimized_route}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/routes/{route_id}", response_model=RouteResponse)
async def get_route_endpoint(route_id: int):
    """Получить маршрут по ID"""
    try:
        route = get_route(route_id)
        if not route:
            raise HTTPException(status_code=404, detail="Маршрут не найден")
        return {"route": route}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/routes", response_model=RoutesResponse)
async def get_all_routes_endpoint():
    """Получить все маршруты"""
    try:
        routes = get_all_routes()
        return {
            "routes": routes,
            "total": len(routes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
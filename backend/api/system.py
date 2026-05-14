from fastapi import APIRouter

from backend.config import ROUTING_PROVIDER
from backend.schemas.route import ConfigResponse, HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "Сервер запущен"}


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    return {
        "routing_api": ROUTING_PROVIDER,
        "version": "1.0.0",
        "cors_enabled": True,
        "database": "sqlite",
    }

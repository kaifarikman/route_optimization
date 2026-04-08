from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import points, routes as routes_api, system
from backend.config import BACKEND_HOST, BACKEND_PORT, BACKEND_RELOAD, CORS_ALLOW_ORIGINS
from backend.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="route_optimization",
    description="API для оптимизации городских маршрутов доставки",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(points.router, tags=["Points"])
app.include_router(routes_api.router, tags=["Routes"])
app.include_router(system.router, tags=["System"])


@app.get("/")
async def root():
    return {
        "message": "route_optimization",
        "docs": "/docs",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=BACKEND_RELOAD,
    )

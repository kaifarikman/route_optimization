import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR / "frontend"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'database.db'}")
APP_ENV = os.getenv("APP_ENV", "development")
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
BACKEND_RELOAD = os.getenv("BACKEND_RELOAD", "false").lower() == "true"
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "8080"))
FRONTEND_API_BASE_URL = os.getenv("FRONTEND_API_BASE_URL", "/api")
ROUTING_PROVIDER = os.getenv("ROUTING_PROVIDER", "osrm")
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
ROUTING_TIMEOUT_SECONDS = int(os.getenv("ROUTING_TIMEOUT_SECONDS", "10"))
DEFAULT_TRANSPORT_TYPE = os.getenv("DEFAULT_TRANSPORT_TYPE", "driving")
GEOCODING_PROVIDER = os.getenv("GEOCODING_PROVIDER", "nominatim")
GEOCODING_BASE_URL = os.getenv("GEOCODING_BASE_URL", "https://nominatim.openstreetmap.org")
GEOCODING_TIMEOUT_SECONDS = int(os.getenv("GEOCODING_TIMEOUT_SECONDS", "10"))
GEOCODING_USER_AGENT = os.getenv("GEOCODING_USER_AGENT", "route-optimization-demo/1.0")
GEOCODING_ACCEPT_LANGUAGE = os.getenv("GEOCODING_ACCEPT_LANGUAGE", "ru,en")
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", f"http://localhost:{FRONTEND_PORT}").split(",")
    if origin.strip()
]

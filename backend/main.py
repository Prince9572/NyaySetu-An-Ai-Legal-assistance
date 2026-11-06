"""
NyaySetu AI — FastAPI Application Entry Point
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from api.core.config import settings
from api.core.database import init_db
from api.routers import conversations, assistant
from api.routers.misc import router as health_router, profile_router, message_router, legal_router, document_router

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.is_development else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info(f"Starting NyaySetu AI backend ({settings.environment})")
    logger.info(f"AI Provider: {settings.ai_provider} | Model: {settings.ai_model}")
    logger.info(f"AI configured: {bool(settings.ai_api_key)}")
    logger.info(f"CORS origins: {settings.allowed_origins_list}")

    # Initialize DB tables (development convenience)
    if settings.is_development:
        try:
            await init_db()
            logger.info("Database tables initialized (development mode)")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")

    # Warm up AI provider
    try:
        from api.services.ai_service import get_provider
        provider = get_provider()
        logger.info(f"AI provider ready: {type(provider).__name__}")
    except Exception as e:
        logger.warning(f"AI provider initialization warning: {e}")

    yield

    logger.info("NyaySetu AI backend shutting down")


# ─── Application ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="NyaySetu AI API",
    description=(
        "NyaySetu AI backend API — Indian legal information assistant.\n\n"
        "**Important:** All responses are general legal information, not legal advice. "
        "Always consult a qualified Indian lawyer for important legal matters."
    ),
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# ─── Global Exception Handlers ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health_router)
app.include_router(profile_router)
app.include_router(message_router)
app.include_router(legal_router)
app.include_router(document_router)
app.include_router(conversations.router)
app.include_router(assistant.router)


@app.get("/")
async def root():
    return {
        "service": "NyaySetu AI API",
        "version": "0.1.0",
        "docs": "/docs" if settings.is_development else "disabled",
        "health": "/health",
        "disclaimer": "General legal information only. Not legal advice.",
    }

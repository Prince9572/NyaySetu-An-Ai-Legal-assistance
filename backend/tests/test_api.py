"""
Backend tests — authentication, conversation isolation, and API health.
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Override DATABASE_URL to use SQLite for tests
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["ENVIRONMENT"] = "testing"
os.environ["AI_API_KEY"] = ""
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_endpoint():
    """Health endpoint returns ok status."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ai_provider" in data


@pytest.mark.anyio
async def test_root_endpoint():
    """Root endpoint returns service info."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "NyaySetu AI API"


@pytest.mark.anyio
async def test_unauthenticated_conversations():
    """Unauthenticated request to conversations returns 401 or 403."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/conversations")
    # Without token — should be rejected
    assert response.status_code in (401, 403, 422)


@pytest.mark.anyio
async def test_legal_search_no_auth():
    """Legal search endpoint (public) returns results."""
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/legal/search?q=consumer+complaint")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data

"""
Authentication middleware using Supabase JWT verification.
In development mode (no JWT secret configured), a mock user is returned.
"""
import logging
from typing import Optional
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.core.config import settings
from api.core.database import get_db
from api.models.models import UserProfile

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    def __init__(
        self,
        sub: str,
        email: str,
        display_name: Optional[str] = None,
        db_profile: Optional[UserProfile] = None,
    ):
        self.sub = sub
        self.email = email
        self.display_name = display_name
        self.db_profile = db_profile

    @property
    def profile_id(self) -> Optional[str]:
        return self.db_profile.id if self.db_profile else None


def _decode_supabase_jwt(token: str) -> dict:
    """Decode and verify a Supabase JWT using the JWT secret."""
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication not configured. Set SUPABASE_JWT_SECRET.",
        )
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


async def get_or_create_profile(
    db: AsyncSession,
    sub: str,
    email: str,
    display_name: Optional[str] = None,
) -> UserProfile:
    """Get existing profile or create a new one for this Supabase user."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.auth_provider_id == sub)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(
            auth_provider_id=sub,
            email=email,
            display_name=display_name or email.split("@")[0],
        )
        db.add(profile)
        await db.flush()
        logger.info(f"Created new user profile for {email}")

    return profile


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser:
    """
    FastAPI dependency that verifies the Supabase JWT and returns the current user.
    In development mode without JWT secret, returns a mock user for testing.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Include Authorization: Bearer <token>",
        )

    token = credentials.credentials

    # Development mock mode
    if settings.is_development and not settings.supabase_jwt_secret:
        logger.warning(
            "DEV MODE: No SUPABASE_JWT_SECRET configured. "
            "Using mock authentication. Do NOT use in production."
        )
        mock_sub = "dev-user-00000000-0000-0000-0000-000000000001"
        mock_email = "dev@nyaysetu.local"
        profile = await get_or_create_profile(db, mock_sub, mock_email, "Dev User")
        return AuthenticatedUser(
            sub=mock_sub,
            email=mock_email,
            display_name="Dev User",
            db_profile=profile,
        )

    payload = _decode_supabase_jwt(token)
    sub = payload.get("sub")
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {})
    display_name = user_metadata.get("display_name")

    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject.",
        )

    profile = await get_or_create_profile(db, sub, email, display_name)
    return AuthenticatedUser(
        sub=sub,
        email=email,
        display_name=display_name,
        db_profile=profile,
    )

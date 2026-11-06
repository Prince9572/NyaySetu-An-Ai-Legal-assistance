"""
Profile, messages, legal, documents, and health routers.
"""
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.core.database import get_db
from api.core.config import settings
from api.middleware.auth import get_current_user, AuthenticatedUser
from api.models.models import Message, Feedback, UploadedDocument, DocumentStatus
from api.schemas.schemas import (
    UserProfileRead, UserProfileUpdate, FeedbackCreate,
    UploadedDocumentRead, HealthResponse,
)
from api.services.legal_service import search_legal_knowledge, get_all_sources

router = APIRouter(tags=["misc"])
logger = logging.getLogger(__name__)

# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        ai_provider=settings.ai_provider,
        ai_configured=bool(settings.ai_api_key),
        database="connected",
    )


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {e}")


# ─── Profile ──────────────────────────────────────────────────────────────────

profile_router = APIRouter(prefix="/api/profile", tags=["profile"])


@profile_router.get("", response_model=UserProfileRead)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    from api.models.models import UserProfile
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == user.profile_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return UserProfileRead.model_validate(profile)


@profile_router.patch("")
async def update_profile(
    body: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    from api.models.models import UserProfile
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == user.profile_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    if body.display_name is not None:
        profile.display_name = body.display_name
    if body.preferred_language is not None:
        profile.preferred_language = body.preferred_language
    if body.theme_preference is not None:
        profile.theme_preference = body.theme_preference

    return {"message": "Profile updated successfully."}


@profile_router.delete("")
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Account deletion: removes profile and all associated data.
    Requires re-authentication confirmation in production.
    """
    from api.models.models import UserProfile
    result = await db.execute(
        select(UserProfile).where(UserProfile.id == user.profile_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    await db.delete(profile)
    logger.info(f"Account deleted: {user.email}")
    return {"message": "Account and all associated data deleted successfully."}


# ─── Messages (feedback) ──────────────────────────────────────────────────────

message_router = APIRouter(prefix="/api/messages", tags=["messages"])


@message_router.post("/{message_id}/feedback")
async def submit_feedback(
    message_id: str,
    body: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    # Verify message exists and belongs to user's conversation
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.conversation))
        .where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    if not message or message.conversation.user_id != user.profile_id:
        raise HTTPException(status_code=404, detail="Message not found.")

    fb = Feedback(
        user_id=user.profile_id,
        conversation_id=message.conversation_id,
        message_id=message_id,
        rating=body.rating,
        feedback_text=body.feedback_text,
    )
    db.add(fb)
    return {"message": "Feedback recorded. Thank you."}


# ─── Legal Sources ─────────────────────────────────────────────────────────────

legal_router = APIRouter(prefix="/api/legal", tags=["legal"])


@legal_router.get("/search")
async def search_legal(
    q: str = Query(..., min_length=2, max_length=500),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    results = await search_legal_knowledge(q, db, limit=limit)
    return {"results": [r.model_dump() for r in results]}


@legal_router.get("/sources")
async def list_legal_sources(db: AsyncSession = Depends(get_db)):
    sources = await get_all_sources(db)
    return {"sources": sources}


# ─── Document Upload ──────────────────────────────────────────────────────────

document_router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@document_router.post("/upload", response_model=UploadedDocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    # Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, TXT, MD, DOC, DOCX",
        )

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
        )

    # Extract text from PDF
    extracted_text = None
    if file.content_type == "application/pdf":
        try:
            import io
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            extracted_text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        except Exception as e:
            logger.warning(f"PDF extraction failed: {e}")
    elif file.content_type in ("text/plain", "text/markdown"):
        extracted_text = content.decode("utf-8", errors="replace")

    # Save to DB
    doc = UploadedDocument(
        user_id=user.profile_id,
        conversation_id=conversation_id or None,
        storage_path=f"uploads/{user.profile_id}/{file.filename}",
        original_filename=file.filename or "document",
        mime_type=file.content_type,
        file_size=len(content),
        processing_status=DocumentStatus.ready if extracted_text else DocumentStatus.pending,
        extracted_text=extracted_text,
    )
    db.add(doc)
    await db.flush()

    return UploadedDocumentRead.model_validate(doc)


@document_router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedDocument).where(
            UploadedDocument.id == document_id,
            UploadedDocument.user_id == user.profile_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    await db.delete(doc)
    return {"message": "Document deleted."}

"""
Conversations router — CRUD with strict user-level isolation.
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from api.core.database import get_db
from api.middleware.auth import get_current_user, AuthenticatedUser
from api.models.models import Conversation, Message
from api.schemas.schemas import (
    ConversationCreate, ConversationUpdate, ConversationRead, PaginatedConversations
)

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
logger = logging.getLogger(__name__)


async def _get_owned_conversation(
    conversation_id: str,
    db: AsyncSession,
    user: AuthenticatedUser,
) -> Conversation:
    """Fetch a conversation — raises 404 if not found OR not owned by user."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.profile_id,
            Conversation.archived_at.is_(None),
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


@router.get("", response_model=PaginatedConversations)
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all conversations for the current user, newest first."""
    offset = (page - 1) * page_size

    count_result = await db.execute(
        select(func.count()).select_from(Conversation).where(
            Conversation.user_id == user.profile_id,
            Conversation.archived_at.is_(None),
        )
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.user_id == user.profile_id,
            Conversation.archived_at.is_(None),
        )
        .order_by(desc(Conversation.is_pinned), desc(Conversation.updated_at))
        .offset(offset)
        .limit(page_size)
    )
    convs = result.scalars().all()

    return PaginatedConversations(
        items=[ConversationRead.model_validate(c) for c in convs],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(convs)) < total,
    )


@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    conv = Conversation(user_id=user.profile_id, title=body.title or "New Conversation")
    db.add(conv)
    await db.flush()
    return ConversationRead.model_validate(conv)


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    conv = await _get_owned_conversation(conversation_id, db, user)
    return ConversationRead.model_validate(conv)


@router.patch("/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    conv = await _get_owned_conversation(conversation_id, db, user)
    if body.title is not None:
        conv.title = body.title
    if body.is_pinned is not None:
        conv.is_pinned = body.is_pinned
    await db.flush()
    return ConversationRead.model_validate(conv)


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    conv = await _get_owned_conversation(conversation_id, db, user)
    await db.delete(conv)
    return {"message": "Conversation deleted successfully."}


@router.get("/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """List all messages in a conversation (verifying ownership)."""
    from api.schemas.schemas import MessageRead
    from sqlalchemy.orm import selectinload

    await _get_owned_conversation(conversation_id, db, user)

    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sources))
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return [MessageRead.model_validate(m) for m in messages]

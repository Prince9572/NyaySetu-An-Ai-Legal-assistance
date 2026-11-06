"""
Assistant streaming router — SSE-based real-time AI response streaming.
"""
import json
import logging
import asyncio
from typing import AsyncIterator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.core.database import get_db
from api.middleware.auth import get_current_user, AuthenticatedUser
from api.models.models import Conversation, Message, MessageSource
from api.models.models import MessageRole, MessageStatus
from api.schemas.schemas import ChatRequest, MessageRead
from api.services.ai_service import get_provider, LEGAL_SYSTEM_PROMPT
from api.services.legal_service import search_legal_knowledge

router = APIRouter(prefix="/api/assistant", tags=["assistant"])
logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 20


async def _get_owned_conversation(
    conversation_id: str, db: AsyncSession, user: AuthenticatedUser
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user.profile_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return conv


async def _build_message_history(
    conversation_id: str, db: AsyncSession
) -> list[dict]:
    """Retrieve recent messages for context window."""
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.status == MessageStatus.completed,
        )
        .order_by(Message.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
    )
    messages = result.scalars().all()
    messages.reverse()

    return [
        {"role": m.role.value if hasattr(m.role, "value") else m.role, "content": m.content}
        for m in messages
        if m.content
    ]


def _sse_chunk(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


@router.post("/stream")
async def stream_chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    SSE endpoint that streams an AI response.
    Protocol: text/event-stream; each event is `data: <json>\n\n`
    Chunk types: text | sources | follow_ups | error | done
    """
    conv = await _get_owned_conversation(body.conversation_id, db, user)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.user,
        content=body.content,
        status=MessageStatus.completed,
    )
    db.add(user_msg)

    # Create streaming assistant message placeholder
    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.assistant,
        content="",
        status=MessageStatus.streaming,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    assistant_msg_id = assistant_msg.id

    # Search legal knowledge for context
    search_results = await search_legal_knowledge(body.content, db, limit=5)

    # Build RAG context
    rag_context = ""
    if search_results:
        rag_context = "\n\n---\n**Retrieved Legal Sources:**\n"
        for r in search_results:
            rag_context += f"- [{r.title}]({r.url}): {r.excerpt[:300]}\n"
        rag_context += "---\n\n"

    # Build message history for context
    history = await _build_message_history(conv.id, db)

    # Augment the last user message with RAG context
    augmented_content = body.content
    if rag_context:
        augmented_content = f"{body.content}\n\n{rag_context}"

    messages_for_ai = history + [{"role": "user", "content": augmented_content}]

    # Commit to DB before streaming
    await db.commit()

    async def generate() -> AsyncIterator[str]:
        provider = get_provider()
        accumulated = []
        has_error = False

        try:
            async for token in provider.stream_response(messages_for_ai, LEGAL_SYSTEM_PROMPT):
                accumulated.append(token)
                yield _sse_chunk({"type": "text", "content": token})

        except Exception as e:
            has_error = True
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield _sse_chunk({"type": "error", "error": str(e)})

        # Send sources
        if search_results and not has_error:
            sources_data = [
                {
                    "id": f"src-{i}",
                    "messageId": assistant_msg_id,
                    "sourceUrl": r.url,
                    "sourceTitle": r.title,
                    "relevantExcerpt": r.excerpt[:300],
                    "citationMetadata": {},
                }
                for i, r in enumerate(search_results)
            ]
            yield _sse_chunk({"type": "sources", "sources": sources_data})

        # Send follow-ups
        if not has_error:
            yield _sse_chunk({
                "type": "follow_ups",
                "followUps": [
                    {"id": "fu1", "text": "What documents will I need?"},
                    {"id": "fu2", "text": "What is the usual procedure?"},
                    {"id": "fu3", "text": "Which authority should I approach?"},
                ],
            })

        # Update message in DB
        full_content = "".join(accumulated)
        async with db.begin():
            # Re-fetch to avoid stale state
            result = await db.execute(
                select(Message).where(Message.id == assistant_msg_id)
            )
            msg = result.scalar_one_or_none()
            if msg:
                msg.content = full_content
                msg.status = MessageStatus.error if has_error else MessageStatus.completed

                # Save sources to DB
                if search_results and not has_error:
                    for r in search_results:
                        source = MessageSource(
                            message_id=msg.id,
                            source_url=r.url,
                            source_title=r.title,
                            relevant_excerpt=r.excerpt[:500],
                            citation_metadata={"relevance_score": r.relevance_score},
                        )
                        db.add(source)

        # Generate title if this is the first exchange
        result = await db.execute(
            select(Message)
            .where(
                Message.conversation_id == conv.id,
                Message.status == MessageStatus.completed,
            )
            .limit(3)
        )
        msg_count = len(result.scalars().all())

        if msg_count <= 2:
            try:
                title = await provider.generate_title(body.content)
                conv_result = await db.execute(
                    select(Conversation).where(Conversation.id == conv.id)
                )
                conv_obj = conv_result.scalar_one_or_none()
                if conv_obj:
                    conv_obj.title = title
                    await db.commit()
            except Exception:
                pass

        yield _sse_chunk({"type": "done"})
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
import uuid


# ─── Shared ───────────────────────────────────────────────────────────────────

class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


# ─── User Profile ─────────────────────────────────────────────────────────────

class UserProfileRead(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    preferred_language: str
    theme_preference: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    preferred_language: Optional[str] = None
    theme_preference: Optional[str] = None


# ─── Conversation ─────────────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    title: str = Field(default="New Conversation", max_length=255)


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    is_pinned: Optional[bool] = None


class ConversationRead(BaseModel):
    id: str
    user_id: str
    title: str
    is_pinned: bool
    archived_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedConversations(BaseModel):
    items: List[ConversationRead]
    total: int
    page: int
    page_size: int
    has_more: bool


# ─── Message Source ───────────────────────────────────────────────────────────

class MessageSourceRead(BaseModel):
    id: str
    message_id: str
    source_url: str
    source_title: str
    relevant_excerpt: Optional[str]
    citation_metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


# ─── Message ──────────────────────────────────────────────────────────────────

class MessageRead(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    status: str
    model_name: Optional[str]
    sources: List[MessageSourceRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Chat / Streaming ─────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    conversation_id: str
    content: str = Field(..., min_length=1, max_length=10000)
    document_ids: List[str] = []


# ─── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=-1, le=1)
    feedback_text: Optional[str] = Field(default=None, max_length=2000)


# ─── Legal ────────────────────────────────────────────────────────────────────

class LegalSourceRead(BaseModel):
    id: str
    title: str
    official_url: str
    document_type: str
    issuing_authority: Optional[str]
    current_status: str
    last_verified_at: Optional[datetime]

    class Config:
        from_attributes = True


class LegalSearchResult(BaseModel):
    document_id: str
    chunk_id: str
    title: str
    url: str
    excerpt: str
    relevance_score: float


# ─── Document Upload ──────────────────────────────────────────────────────────

class UploadedDocumentRead(BaseModel):
    id: str
    user_id: str
    conversation_id: Optional[str]
    original_filename: str
    mime_type: str
    file_size: int
    processing_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    environment: str
    ai_provider: str
    ai_configured: bool
    database: str


# ─── Error ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None

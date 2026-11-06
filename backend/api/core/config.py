from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "NyaySetu AI"
    environment: str = "development"
    debug: bool = False
    secret_key: str = "change-this-in-production-to-random-secret"

    # AI Provider
    ai_provider: str = "gemini"
    ai_model: str = "gemini-2.0-flash"
    ai_api_key: Optional[str] = None
    embedding_model: str = "text-embedding-004"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nyaysetu"
    vector_database_url: Optional[str] = None

    # Supabase
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    supabase_jwt_secret: Optional[str] = None

    # CORS
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # File upload
    storage_bucket: str = "nyaysetu-documents"
    max_upload_size_mb: int = 10

    # Rate limiting
    rate_limit_per_minute: int = 30

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ishkeen"
    ENVIRONMENT: str = "development"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "ishkeen"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "sqlite:///./dev.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "https://ishkeen.pages.dev", "https://ishkeen.akashchauhan325069.workers.dev"]
    
    # Auth & Sessions
    SESSION_COOKIE_NAME: str = "ishkeen_session"
    SESSION_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    @property
    def SESSION_COOKIE_SECURE(self) -> bool:
        # Secure=True is required by browsers for SameSite=None across cross-site domains
        return True

    # Storage
    UPLOAD_DIR: str = "private_uploads"

    # Email
    EMAIL_PROVIDER: str = "console"
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str = "noreply@ishkeen.com"
    APP_URL: str = "http://localhost:5173"

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = "https://ishkeen.akashchauhan325069.workers.dev/auth/google/callback"

    # Admin Bootstrapping
    ADMIN_EMAIL: str | None = "admin@example.com"
    ADMIN_PASSWORD: str | None = "AdminPassword123!"

    # Gemini
    GEMINI_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

# Resolve the upload path safely relative to the current working directory
from pathlib import Path
import os
UPLOAD_PATH = Path(os.getcwd()) / settings.UPLOAD_DIR
# Ensure it exists
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

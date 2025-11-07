from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.core.constants import Environment


class CustomBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

class Settings(CustomBaseSettings):
    # Database
    DATABASE_URL: PostgresDsn
    DATABASE_POOL_SIZE: int = 16
    DATABASE_POOL_TTL: int = 60 * 20  # 20 minutes
    DATABASE_POOL_PRE_PING: bool = True

    # Redis
    REDIS_URL: str

    # Application
    ENVIRONMENT: Environment = Environment.LOCAL
    
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ORIGINS_REGEX: str | None = None
    CORS_HEADERS: list[str] = ["*"]
    FRONTEND_URL: str = "http://localhost:5173"

    # Security
    SECRET_KEY: str
    SECURITY_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 360
    REFRESH_TOKEN_EXPIRES: int = 30 # Days
    
    # Email
    MAIL_USER: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: str
    MAIL_HOST: str
    MAIL_FROM_NAME: str
    
settings = Settings() 
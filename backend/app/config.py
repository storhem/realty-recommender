from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/realty"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    RECOMMENDATIONS_CACHE_TTL: int = 3600
    STATS_SERVICE_URL: str = "http://stats-service:8080"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

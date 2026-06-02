import asyncio
import os

import pytest
import pytest_asyncio
from geoalchemy2.functions import ST_GeogFromText
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.property import Property
from app.models.user import User

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/realty_test",
)

# NullPool отключает переиспользование соединений — каждый запрос
# получает свежее asyncpg-соединение, что исключает "another operation
# is in progress" при параллельных или следующих друг за другом тестах.
engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", loop_scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def _truncate_all() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE users, properties RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def reset_tables():
    """Очищает все таблицы и сбрасывает Redis-синглтон между тестами.

    _redis хранит соединение, привязанное к event loop создавшего его теста.
    pytest-asyncio создаёт новый loop для каждого теста, поэтому без сброса
    следующий тест получает «Future attached to a different loop».
    Синхронный asyncio.run() запускает очистку БД в изолированном loop.
    """
    import app.core.cache as _cache
    _cache._redis = None          # каждый тест начинает с чистого соединения
    yield
    _cache._redis = None          # не держим стало соединение после теста
    asyncio.run(_truncate_all())


@pytest_asyncio.fixture(loop_scope="function", autouse=True)
async def cleanup_redis():
    """Закрывает Redis-соединение до завершения event loop теста.

    Без явного aclose() деструктор соединения вызывается GC уже после
    закрытия loop и генерирует PytestUnraisableExceptionWarning.
    """
    yield
    import app.core.cache as _cache
    if _cache._redis is not None:
        await _cache._redis.aclose()


@pytest_asyncio.fixture(loop_scope="function")
async def db() -> AsyncSession:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(loop_scope="function")
async def client():
    # Каждый HTTP-запрос получает собственную сессию —
    # это предотвращает "another operation is in progress" в asyncpg.
    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(loop_scope="function")
async def test_user(db):
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        name="Test User",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture(loop_scope="function")
async def auth_headers(client):
    await client.post(
        "/auth/register",
        json={"email": "auth@example.com", "password": "password123", "name": "Auth User"},
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "auth@example.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture(loop_scope="function")
async def test_property(db):
    prop = Property(
        title="Тестовая квартира",
        type="apartment",
        price=5_000_000,
        area=54.0,
        rooms=2,
        address="Москва, ул. Тверская, 1",
        location=ST_GeogFromText("POINT(37.618423 55.751244)"),
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return prop

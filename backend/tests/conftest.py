import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db
from app.main import app
from app.core.security import hash_password
from app.models.user import User
from app.models.property import Property
from geoalchemy2.functions import ST_GeogFromText

TEST_DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/realty_test"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db):
    user = User(email="test@example.com", hashed_password=hash_password("password123"), name="Test User")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(client):
    await client.post("/auth/register", json={
        "email": "auth@example.com", "password": "password123", "name": "Auth User"
    })
    resp = await client.post("/auth/login", json={"email": "auth@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
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

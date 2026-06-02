import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import (
    auth,
    favorites,
    properties,
    ratings,
    recommendations,
    saved_searches,
    stats,
    uploads,
    users,
)

app = FastAPI(
    title="Рекомендательная система недвижимости",
    description="API для подбора объектов недвижимости на основе предпочтений пользователя",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(recommendations.router)
app.include_router(users.router)
app.include_router(ratings.router)
app.include_router(favorites.router)
app.include_router(stats.router)
app.include_router(uploads.router)
app.include_router(saved_searches.router)

_UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))
try:
    _UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(_UPLOAD_DIR), check_dir=False), name="uploads")
except (OSError, PermissionError):
    pass


@app.get("/health", tags=["Система"])
async def health():
    return {"status": "ok"}

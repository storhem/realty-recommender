from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, properties, recommendations, users, ratings, favorites

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
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(recommendations.router)
app.include_router(users.router)
app.include_router(ratings.router)
app.include_router(favorites.router)


@app.get("/health", tags=["Система"])
async def health():
    return {"status": "ok"}

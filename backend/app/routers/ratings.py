from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_delete
from app.database import get_db
from app.models.rating import Rating
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/ratings", tags=["Оценки"])


@router.post("", response_model=RatingResponse, status_code=201)
async def rate_property(
    body: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rating).where(Rating.user_id == current_user.id, Rating.property_id == body.property_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.score = body.score
        await db.commit()
        await db.refresh(existing)
        rating = existing
    else:
        rating = Rating(user_id=current_user.id, property_id=body.property_id, score=body.score)
        db.add(rating)
        await db.commit()
        await db.refresh(rating)

    await cache_delete(f"rec:{current_user.id}")
    return rating

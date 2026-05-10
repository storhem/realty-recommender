from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get, cache_set
from app.database import get_db
from app.models.property import Property
from app.models.user import User
from app.routers.properties import _to_response
from app.schemas.property import PropertyResponse
from app.services.auth import get_current_user
from app.services.recommender import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["Рекомендации"])


@router.get("", response_model=list[PropertyResponse])
async def recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"rec:{current_user.id}"
    cached = await cache_get(cache_key)

    if cached:
        property_ids = cached
    else:
        property_ids = await get_recommendations(current_user.id, db)
        if property_ids:
            await cache_set(cache_key, property_ids)

    if not property_ids:
        return []

    result = await db.execute(select(Property).where(Property.id.in_(property_ids)))
    props = {p.id: p for p in result.scalars().all()}
    return [_to_response(props[pid]) for pid in property_ids if pid in props]

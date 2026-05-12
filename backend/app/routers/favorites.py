from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.favorite import Favorite
from app.models.property import Property
from app.models.user import User
from app.routers.properties import _to_response
from app.schemas.favorite import FavoriteCreate, FavoriteResponse
from app.schemas.property import PropertyResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["Избранное"])


@router.get("", response_model=list[PropertyResponse])
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id).order_by(Favorite.added_at.desc())
    )
    favs = result.scalars().all()
    if not favs:
        return []

    prop_ids = [f.property_id for f in favs]
    props_result = await db.execute(select(Property).where(Property.id.in_(prop_ids)))
    props = {p.id: p for p in props_result.scalars().all()}
    return [_to_response(props[pid]) for pid in prop_ids if pid in props]


@router.post("", response_model=FavoriteResponse, status_code=201)
async def add_favorite(
    body: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == body.property_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Объект уже в избранном")

    fav = Favorite(user_id=current_user.id, property_id=body.property_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)
    return fav


@router.delete("/{property_id}", status_code=204)
async def remove_favorite(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id, Favorite.property_id == property_id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Объект не найден в избранном")
    await db.delete(fav)
    await db.commit()

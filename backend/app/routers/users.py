from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.view import View
from app.models.property import Property
from app.routers.properties import _to_response
from app.schemas.property import PropertyResponse
from app.schemas.user import UserResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Пользователи"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/history", response_model=list[PropertyResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(View)
        .where(View.user_id == current_user.id)
        .order_by(View.viewed_at.desc())
        .limit(50)
    )
    views = result.scalars().all()
    if not views:
        return []

    prop_ids = [v.property_id for v in views]
    props_result = await db.execute(select(Property).where(Property.id.in_(prop_ids)))
    props = {p.id: p for p in props_result.scalars().all()}
    return [_to_response(props[pid]) for pid in prop_ids if pid in props]

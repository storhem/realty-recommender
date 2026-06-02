from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.property import Property
from app.models.saved_search import SavedSearch
from app.models.user import User
from app.schemas.saved_search import SavedSearchCreate, SavedSearchResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/saved-searches", tags=["Сохранённые поиски"])


def _build_filters(params: dict):
    filters = []
    if t := params.get("type"):
        filters.append(Property.type == t)
    if dt := params.get("deal_type"):
        filters.append(Property.deal_type == dt)
    if (pmin := params.get("price_min")) is not None:
        filters.append(Property.price >= float(pmin))
    if (pmax := params.get("price_max")) is not None:
        filters.append(Property.price <= float(pmax))
    if (r := params.get("rooms")) is not None:
        filters.append(Property.rooms == int(r))
    if q := params.get("q"):
        pattern = f"%{q}%"
        filters.append(
            Property.title.ilike(pattern)
            | Property.address.ilike(pattern)
            | Property.description.ilike(pattern)
        )
    return filters


async def _count_new(db: AsyncSession, ss: SavedSearch) -> int:
    filters = _build_filters(ss.params or {})
    filters.append(Property.created_at > ss.last_seen_at)
    result = await db.execute(
        select(func.count()).select_from(Property).where(and_(*filters))
    )
    return int(result.scalar_one())


@router.get("", response_model=list[SavedSearchResponse])
async def list_my_searches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(SavedSearch)
            .where(SavedSearch.user_id == current_user.id)
            .order_by(SavedSearch.created_at.desc())
        )
    ).scalars().all()

    out = []
    for ss in rows:
        new_count = await _count_new(db, ss)
        out.append(
            SavedSearchResponse(
                id=ss.id,
                name=ss.name,
                params=ss.params,
                created_at=ss.created_at,
                last_seen_at=ss.last_seen_at,
                new_count=new_count,
            )
        )
    return out


@router.post("", response_model=SavedSearchResponse, status_code=201)
async def create_search(
    body: SavedSearchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = SavedSearch(user_id=current_user.id, name=body.name, params=body.params)
    db.add(ss)
    await db.commit()
    await db.refresh(ss)
    return SavedSearchResponse(
        id=ss.id, name=ss.name, params=ss.params,
        created_at=ss.created_at, last_seen_at=ss.last_seen_at, new_count=0,
    )


@router.post("/{ss_id}/seen", response_model=SavedSearchResponse)
async def mark_seen(
    ss_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = await _get_my(db, ss_id, current_user)
    ss.last_seen_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ss)
    return SavedSearchResponse(
        id=ss.id, name=ss.name, params=ss.params,
        created_at=ss.created_at, last_seen_at=ss.last_seen_at, new_count=0,
    )


@router.delete("/{ss_id}", status_code=204)
async def delete_search(
    ss_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ss = await _get_my(db, ss_id, current_user)
    await db.delete(ss)
    await db.commit()


async def _get_my(db: AsyncSession, ss_id: int, user: User) -> SavedSearch:
    result = await db.execute(
        select(SavedSearch).where(
            SavedSearch.id == ss_id, SavedSearch.user_id == user.id
        )
    )
    ss = result.scalar_one_or_none()
    if ss is None:
        raise HTTPException(404, "Поиск не найден")
    return ss

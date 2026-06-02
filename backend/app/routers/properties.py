from fastapi import APIRouter, Depends, HTTPException, Query, Response
from geoalchemy2.functions import ST_GeogFromText
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.property import Property
from app.models.user import User
from app.models.view import View
from app.schemas.property import (
    PropertyCreate,
    PropertyGeoResponse,
    PropertyResponse,
    SortBy,
)
from app.services.auth import get_current_user, get_optional_user
from app.services.geo import count_by_radius, search_by_radius

router = APIRouter(prefix="/properties", tags=["Объекты недвижимости"])


_SORT_COLUMNS = {
    SortBy.created_desc: Property.created_at.desc(),
    SortBy.price_asc: Property.price.asc(),
    SortBy.price_desc: Property.price.desc(),
    SortBy.area_desc: Property.area.desc(),
    SortBy.area_asc: Property.area.asc(),
    SortBy.price_per_m_asc: (Property.price / func.nullif(Property.area, 0)).asc(),
}


@router.get("", response_model=list[PropertyResponse])
async def list_properties(
    response: Response,
    type: str | None = None,
    deal_type: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    rooms: int | None = None,
    q: str | None = None,
    sort: SortBy = SortBy.created_desc,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    base = select(Property)
    if type:
        base = base.where(Property.type == type)
    if deal_type:
        base = base.where(Property.deal_type == deal_type)
    if price_min is not None:
        base = base.where(Property.price >= price_min)
    if price_max is not None:
        base = base.where(Property.price <= price_max)
    if rooms is not None:
        base = base.where(Property.rooms == rooms)
    if q:
        pattern = f"%{q}%"
        base = base.where(
            Property.title.ilike(pattern)
            | Property.address.ilike(pattern)
            | Property.description.ilike(pattern)
        )

    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    response.headers["X-Total-Count"] = str(total or 0)

    order = _SORT_COLUMNS.get(sort, _SORT_COLUMNS[SortBy.created_desc])
    result = await db.execute(base.order_by(order).limit(limit).offset(offset))
    return [_to_response(p) for p in result.scalars().all()]


@router.get("/geo", response_model=list[PropertyGeoResponse])
async def geo_search(
    response: Response,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius: float = Query(5000, gt=0, le=300000),
    type: str | None = None,
    deal_type: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    rooms: int | None = None,
    q: str | None = None,
    sort: SortBy = SortBy.distance_asc,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    rows = await search_by_radius(
        db, lat, lon, radius,
        type_=type, deal_type=deal_type,
        price_min=price_min, price_max=price_max, rooms=rooms,
        q=q, sort=sort.value, limit=limit, offset=offset,
    )
    total = await count_by_radius(
        db, lat, lon, radius,
        type_=type, deal_type=deal_type,
        price_min=price_min, price_max=price_max, rooms=rooms, q=q,
    )
    response.headers["X-Total-Count"] = str(total)
    return rows


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    prop = await _get_or_404(db, property_id)
    if current_user is not None:
        db.add(View(user_id=current_user.id, property_id=property_id))
        await db.commit()
    return _to_response(prop)


@router.get("/{property_id}/similar", response_model=list[PropertyResponse])
async def similar_properties(
    property_id: int,
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Похожие объекты: тот же тип сделки и тип, близкая цена/площадь/комнаты."""
    base = await _get_or_404(db, property_id)

    price_low, price_high = base.price * 0.7, base.price * 1.3
    area_low, area_high = base.area * 0.6, base.area * 1.4

    query = (
        select(Property)
        .where(Property.id != base.id)
        .where(Property.deal_type == base.deal_type)
        .where(Property.type == base.type)
        .where(Property.price.between(price_low, price_high))
        .where(Property.area.between(area_low, area_high))
        .order_by(func.abs(Property.price - base.price))
        .limit(limit)
    )
    result = await db.execute(query)
    return [_to_response(p) for p in result.scalars().all()]


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(
    body: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = body.model_dump(exclude={"latitude", "longitude"})
    if data.get("renovation") is not None:
        data["renovation"] = data["renovation"].value if hasattr(data["renovation"], "value") else data["renovation"]
    if hasattr(data.get("deal_type"), "value"):
        data["deal_type"] = data["deal_type"].value
    prop = Property(
        **data,
        owner_id=current_user.id,
        location=ST_GeogFromText(f"POINT({body.longitude} {body.latitude})"),
    )
    db.add(prop)
    await db.commit()
    await db.refresh(prop)
    return _to_response(prop)


async def _get_or_404(db: AsyncSession, property_id: int) -> Property:
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()
    if prop is None:
        raise HTTPException(status_code=404, detail="Объект не найден")
    return prop


def _to_response(prop: Property) -> dict:
    from geoalchemy2.shape import to_shape
    point = to_shape(prop.location)
    data = {c.name: getattr(prop, c.name) for c in prop.__table__.columns if c.name != "location"}
    data["latitude"] = point.y
    data["longitude"] = point.x
    return data

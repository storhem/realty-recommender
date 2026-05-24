from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.functions import ST_GeogFromText
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.property import Property
from app.models.user import User
from app.models.view import View
from app.schemas.property import PropertyCreate, PropertyGeoResponse, PropertyResponse
from app.services.auth import get_current_user
from app.services.geo import search_by_radius

router = APIRouter(prefix="/properties", tags=["Объекты недвижимости"])


@router.get("", response_model=list[PropertyResponse])
async def list_properties(
    type: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    rooms: int | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Property)
    if type:
        query = query.where(Property.type == type)
    if price_min is not None:
        query = query.where(Property.price >= price_min)
    if price_max is not None:
        query = query.where(Property.price <= price_max)
    if rooms is not None:
        query = query.where(Property.rooms == rooms)

    result = await db.execute(query.order_by(Property.created_at.desc()).limit(limit).offset(offset))
    props = result.scalars().all()
    return [_to_response(p) for p in props]


@router.get("/geo", response_model=list[PropertyGeoResponse])
async def geo_search(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius: float = Query(5000, gt=0, le=50000),
    db: AsyncSession = Depends(get_db),
):
    rows = await search_by_radius(db, lat, lon, radius)
    return rows


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prop = await _get_or_404(db, property_id)
    db.add(View(user_id=current_user.id, property_id=property_id))
    await db.commit()
    return _to_response(prop)


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(
    body: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    prop = Property(
        **body.model_dump(exclude={"latitude", "longitude"}),
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

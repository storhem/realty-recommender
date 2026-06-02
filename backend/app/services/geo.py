from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_SORT_SQL = {
    "created_desc": "created_at DESC",
    "price_asc": "price ASC",
    "price_desc": "price DESC",
    "area_desc": "area DESC",
    "area_asc": "area ASC",
    "price_per_m_asc": "(price / NULLIF(area,0)) ASC",
    "distance_asc": "distance_m ASC",
}


def _build_where_and_params(
    point: str,
    radius_m: float,
    type_: str | None,
    deal_type: str | None,
    price_min: float | None,
    price_max: float | None,
    rooms: int | None,
    q: str | None,
) -> tuple[list[str], dict]:
    where = ["ST_DWithin(location, ST_GeogFromText(:point), :radius)"]
    params: dict = {"point": point, "radius": radius_m}
    if type_:
        where.append("type = :type_")
        params["type_"] = type_
    if deal_type:
        where.append("deal_type = :deal_type")
        params["deal_type"] = deal_type
    if price_min is not None:
        where.append("price >= :price_min")
        params["price_min"] = price_min
    if price_max is not None:
        where.append("price <= :price_max")
        params["price_max"] = price_max
    if rooms is not None:
        where.append("rooms = :rooms")
        params["rooms"] = rooms
    if q:
        where.append("(title ILIKE :q OR address ILIKE :q OR description ILIKE :q)")
        params["q"] = f"%{q}%"
    return where, params


async def search_by_radius(
    db: AsyncSession,
    lat: float,
    lon: float,
    radius_m: float,
    type_: str | None = None,
    deal_type: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    rooms: int | None = None,
    q: str | None = None,
    sort: str = "distance_asc",
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    point = f"POINT({lon} {lat})"
    where, params = _build_where_and_params(
        point, radius_m, type_, deal_type, price_min, price_max, rooms, q
    )
    params["limit"] = limit
    params["offset"] = offset
    order = _SORT_SQL.get(sort, _SORT_SQL["distance_asc"])

    # фрагменты WHERE — внутренние литералы из _build_where_and_params,
    # ORDER BY — из whitelist _SORT_SQL; пользовательские значения уходят
    # через bind-параметры (:point, :radius, :type_, :price_min, ...).
    sql = text(f"""
        SELECT
            id, title, type, price, area, rooms, address,
            description, photos, created_at,
            floor, total_floors, year_built, renovation,
            deal_type, owner_id, seller_name, seller_phone,
            ST_Y(location::geometry) AS latitude,
            ST_X(location::geometry) AS longitude,
            ST_Distance(location, ST_GeogFromText(:point)) AS distance_m
        FROM properties
        WHERE {' AND '.join(where)}
        ORDER BY {order}
        LIMIT :limit OFFSET :offset
    """)  # nosec B608
    result = await db.execute(sql, params)
    return [dict(row._mapping) for row in result.fetchall()]


async def count_by_radius(
    db: AsyncSession,
    lat: float,
    lon: float,
    radius_m: float,
    type_: str | None = None,
    deal_type: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    rooms: int | None = None,
    q: str | None = None,
) -> int:
    point = f"POINT({lon} {lat})"
    where, params = _build_where_and_params(
        point, radius_m, type_, deal_type, price_min, price_max, rooms, q
    )
    # См. пояснение в search_by_radius: WHERE — литералы, значения — bind.
    sql = text(f"SELECT COUNT(*) FROM properties WHERE {' AND '.join(where)}")  # nosec B608
    result = await db.execute(sql, params)
    return int(result.scalar_one())

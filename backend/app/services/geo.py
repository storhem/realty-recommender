from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def search_by_radius(
    db: AsyncSession,
    lat: float,
    lon: float,
    radius_m: float,
) -> list[dict]:
    sql = text("""
        SELECT
            id, title, type, price, area, rooms, address,
            description, photos, created_at,
            ST_Y(location::geometry) AS latitude,
            ST_X(location::geometry) AS longitude,
            ST_Distance(location, ST_GeogFromText(:point)) AS distance_m
        FROM properties
        WHERE ST_DWithin(location, ST_GeogFromText(:point), :radius)
        ORDER BY distance_m
    """)
    result = await db.execute(
        sql,
        {"point": f"POINT({lon} {lat})", "radius": radius_m},
    )
    return [dict(row._mapping) for row in result.fetchall()]

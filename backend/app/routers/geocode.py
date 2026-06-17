import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/geocode", tags=["Геокодирование"])

_NOMINATIM = "https://nominatim.openstreetmap.org/search"
_HEADERS = {"User-Agent": "realty-recommender/1.0 (geocoder)"}


@router.get("")
async def geocode(q: str = Query(..., min_length=3, description="Адрес для геокодирования")):
    """Определяет координaты по текстовому адресу через OpenStreetMap (Nominatim)."""
    params = {"q": q, "format": "json", "limit": 1, "countrycodes": "ru"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(_NOMINATIM, params=params, headers=_HEADERS)
    except httpx.HTTPError as e:
        raise HTTPException(502, "Сервис геокодирования недоступен") from e

    if resp.status_code != 200:
        raise HTTPException(502, "Сервис геокодирования недоступен")

    data = resp.json()
    if not data:
        raise HTTPException(404, "Адрес не найден")

    item = data[0]
    return {
        "lat": float(item["lat"]),
        "lon": float(item["lon"]),
        "display_name": item.get("display_name", ""),
    }

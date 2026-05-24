import os

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/stats", tags=["Статистика"])

STATS_SERVICE_URL = os.getenv("STATS_SERVICE_URL", "http://stats-service:8080")


@router.get("", summary="Статистика платформы (Go-сервис)")
async def get_stats():
    """Проксирует запрос к Go-микросервису статистики."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{STATS_SERVICE_URL}/stats")
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=f"Stats service unavailable: {exc}") from exc

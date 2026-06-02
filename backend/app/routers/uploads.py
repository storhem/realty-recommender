import os
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["Загрузка файлов"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads")) / "photos"
PUBLIC_PREFIX = "/api/uploads/photos"
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_BYTES = 5 * 1024 * 1024


@router.post("/photos", status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
) -> dict:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "Допустимы только jpg/jpeg/png/webp")

    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    except (OSError, PermissionError) as e:
        raise HTTPException(500, "Хранилище недоступно") from e

    name = f"{secrets.token_hex(16)}{ext}"
    dest = UPLOAD_DIR / name

    size = 0
    with dest.open("wb") as fh:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_BYTES:
                fh.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "Файл больше 5 МБ")
            fh.write(chunk)

    return {"url": f"{PUBLIC_PREFIX}/{name}"}

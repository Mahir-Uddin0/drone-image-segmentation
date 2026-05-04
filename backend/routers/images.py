from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

import db.history_repo as repo
from db.database import get_db
from models.schemas import ImageRecord

router = APIRouter()


async def _db():
    async with get_db() as db:
        yield db


@router.get("/images", response_model=list[ImageRecord])
async def list_images(db=Depends(_db)):
    """List all registered images (FR-UPLOAD-05: sample images dropdown)."""
    rows = await repo.list_images(db)
    return [
        ImageRecord(
            image_id=r[0], filename=r[1],
            width=r[3], height=r[4],
            size_bytes=r[5],
            latitude=r[6], longitude=r[7],
            sw_lng=r[8], sw_lat=r[9],
            ne_lng=r[10], ne_lat=r[11],
            created_at=r[12],
        )
        for r in rows
    ]


@router.get("/images/{image_id}")
async def get_image(image_id: str, db=Depends(_db)):
    """Serve original drone image bytes (SRS §6.4)."""
    row = await repo.get_image(db, image_id)
    if not row:
        raise HTTPException(404, f"Image '{image_id}' not found")
    filepath = Path(row[2])
    if not filepath.exists():
        raise HTTPException(404, "Image file missing from disk")
    return FileResponse(filepath)

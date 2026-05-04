import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from PIL import Image

import db.history_repo as repo
from config import UPLOAD_DIR, MAX_UPLOAD_B
from db.database import get_db
from models.schemas import UploadResponse

router = APIRouter()


async def _db():
    async with get_db() as db:
        yield db


@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile, db=Depends(_db)):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(422, "Only JPEG/PNG images are accepted")

    content = await file.read()
    if len(content) > MAX_UPLOAD_B:
        raise HTTPException(422, f"File exceeds {MAX_UPLOAD_B // (1024*1024)} MB limit")

    ext      = ".jpg" if file.content_type == "image/jpeg" else ".png"
    image_id = str(uuid.uuid4())
    filepath = UPLOAD_DIR / f"{image_id}{ext}"
    filepath.write_bytes(content)

    img          = Image.open(filepath)
    width, height = img.size

    from services.metadata_service import extract_metadata
    geo = extract_metadata(str(filepath))
    
    lat, lng = (geo['latitude'], geo['longitude']) if geo else (None, None)
    sw_lng, sw_lat = (geo['sw_lng'], geo['sw_lat']) if geo else (None, None)
    ne_lng, ne_lat = (geo['ne_lng'], geo['ne_lat']) if geo else (None, None)

    await repo.save_image(
        db, image_id, file.filename or "", str(filepath), width, height, len(content),
        lat, lng, sw_lng, sw_lat, ne_lng, ne_lat
    )

    return UploadResponse(
        image_id=image_id, filename=file.filename or "",
        width=width, height=height, size_bytes=len(content),
        latitude=lat, longitude=lng,
        sw_lng=sw_lng, sw_lat=sw_lat, ne_lng=ne_lng, ne_lat=ne_lat
    )

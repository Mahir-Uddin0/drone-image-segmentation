import base64
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from PIL import Image as PILImage

import db.history_repo as repo
from config import OUTPUT_DIR, UPLOAD_DIR
from db.database import get_db
from models.schemas import Detection, DetectionResponse

router = APIRouter()


async def _db():
    async with get_db() as db:
        yield db


async def _parse_multipart(request: Request, db) -> tuple[str, str, float]:
    """Handle FR-DETECT-07: multipart/form-data upload + detect in one shot."""
    form      = await request.form()
    file      = form.get("file")
    threshold = float(form.get("confidence_threshold", 0.5))

    if not file:
        raise HTTPException(422, "Field 'file' is required for multipart detect")
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(422, "Only JPEG/PNG images are accepted")

    content  = await file.read()
    ext      = ".jpg" if file.content_type == "image/jpeg" else ".png"
    image_id = str(uuid.uuid4())
    filepath = UPLOAD_DIR / f"{image_id}{ext}"
    filepath.write_bytes(content)

    img = PILImage.open(filepath)
    w, h = img.size
    
    from services.metadata_service import extract_metadata
    geo = extract_metadata(str(filepath))
    
    lat, lng = (geo['latitude'], geo['longitude']) if geo else (None, None)
    sw_lng, sw_lat = (geo['sw_lng'], geo['sw_lat']) if geo else (None, None)
    ne_lng, ne_lat = (geo['ne_lng'], geo['ne_lat']) if geo else (None, None)

    await repo.save_image(
        db, image_id, file.filename or "", str(filepath), w, h, len(content),
        lat, lng, sw_lng, sw_lat, ne_lng, ne_lat
    )
    return image_id, str(filepath), threshold


async def _parse_json(request: Request, db) -> tuple[str, str, float]:
    """Handle FR-DETECT-01: JSON body {image_id, confidence_threshold}."""
    body      = await request.json()
    image_id  = body.get("image_id")
    threshold = float(body.get("confidence_threshold", 0.5))

    if not image_id:
        raise HTTPException(422, "Field 'image_id' is required")
    if not (0.0 <= threshold <= 1.0):
        raise HTTPException(422, "confidence_threshold must be 0.0–1.0")

    row = await repo.get_image(db, image_id)
    if not row:
        raise HTTPException(404, f"Image '{image_id}' not found")
    return image_id, row[2], threshold


@router.post("/detect", response_model=DetectionResponse)
async def detect(request: Request, db=Depends(_db)):
    seg = request.app.state.seg_service
    if seg is None:
        raise HTTPException(503, "Segmentation model is not loaded")

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        image_id, filepath, threshold = await _parse_multipart(request, db)
    else:
        image_id, filepath, threshold = await _parse_json(request, db)

    # Fetch image bounds for response
    img_row = await repo.get_image(db, image_id)
    # Default to Kafrul/Dhaka if no geo data
    bounds = [90.354, 23.778, 90.358, 23.782]
    if img_row and img_row[8] is not None:
        bounds = [img_row[8], img_row[9], img_row[10], img_row[11]]

    result = seg.segment(filepath, threshold)

    detection_id  = str(uuid.uuid4())
    mask_filename = f"{detection_id}_mask.png"
    mask_path     = OUTPUT_DIR / mask_filename
    mask_path.write_bytes(result["mask_png"])

    # FR-DETECT-03: include base64-encoded mask in response
    mask_b64 = "data:image/png;base64," + base64.b64encode(result["mask_png"]).decode()

    await repo.save_detection(
        db, detection_id, image_id, seg.MODEL_ID,
        result["detections"], str(mask_path),
        result["inference_time_ms"], threshold,
    )

    return DetectionResponse(
        detection_id=detection_id,
        image_id=image_id,
        model_used=seg.MODEL_ID,
        inference_time_ms=result["inference_time_ms"],
        image_width=result["image_width"],
        image_height=result["image_height"],
        detections=[Detection(**d) for d in result["detections"]],
        mask_url=f"/api/masks/{mask_filename}",
        mask_base64=mask_b64,
        image_bounds=bounds,
    )

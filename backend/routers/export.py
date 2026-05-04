import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

import db.history_repo as repo
from db.database import get_db
from services import geojson_service

router = APIRouter()


async def _db():
    async with get_db() as db:
        yield db


@router.get("/export/geojson/{detection_id}")
async def export_geojson(detection_id: str, db=Depends(_db)):
    det_row = await repo.get_detection(db, detection_id)
    if not det_row:
        raise HTTPException(404, f"Detection '{detection_id}' not found")

    img_row = await repo.get_image(db, det_row[1])   # det_row[1] = image_id
    if not img_row:
        raise HTTPException(404, f"Source image not found for detection '{detection_id}'")

    detections = json.loads(det_row[3])               # detections_json
    
    # Default to Kafrul/Dhaka if no geo data
    bounds = [90.354, 23.778, 90.358, 23.782]
    if img_row[8] is not None:
        bounds = [img_row[8], img_row[9], img_row[10], img_row[11]]

    geojson = geojson_service.build_geojson(detections, img_row[3], img_row[4], bounds)   # width, height, bounds

    return JSONResponse(content=geojson, media_type="application/geo+json")

import json

from fastapi import APIRouter, Depends, HTTPException, Query

import db.history_repo as repo
from db.database import get_db
from models.schemas import HistoryItem, HistoryResponse

router = APIRouter()


async def _db():
    async with get_db() as db:
        yield db


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    page:     int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db=Depends(_db),
):
    total, rows = await repo.list_detections(db, page, per_page)
    items = [
        HistoryItem(
            detection_id=row[0],
            image_id=row[1],
            model_used=row[2],
            class_count=len(json.loads(row[3])),
            detected_classes=[d["label"] for d in json.loads(row[3])],
            image_thumbnail_url=f"/api/images/{row[1]}",   # FR-HIST-02
            timestamp=row[7],
        )
        for row in rows
    ]
    return HistoryResponse(total=total, page=page, items=items)


@router.delete("/history/{detection_id}", status_code=204)
async def delete_history(detection_id: str, db=Depends(_db)):
    deleted = await repo.delete_detection(db, detection_id)
    if not deleted:
        raise HTTPException(404, f"Detection '{detection_id}' not found")

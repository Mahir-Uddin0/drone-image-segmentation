import json
from datetime import datetime, timezone

import aiosqlite


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def save_image(
    db: aiosqlite.Connection,
    image_id: str, filename: str, filepath: str,
    width: int, height: int, size_bytes: int,
    lat: float = None, lng: float = None,
    sw_lng: float = None, sw_lat: float = None,
    ne_lng: float = None, ne_lat: float = None,
) -> None:
    await db.execute(
        "INSERT INTO images VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (image_id, filename, filepath, width, height, size_bytes,
         lat, lng, sw_lng, sw_lat, ne_lng, ne_lat, _now()),
    )
    await db.commit()


async def get_image(db: aiosqlite.Connection, image_id: str):
    async with db.execute(
        "SELECT * FROM images WHERE image_id = ?", (image_id,)
    ) as cur:
        return await cur.fetchone()


async def list_images(db: aiosqlite.Connection) -> list:
    async with db.execute(
        "SELECT * FROM images ORDER BY created_at DESC"
    ) as cur:
        return await cur.fetchall()


async def save_detection(
    db: aiosqlite.Connection,
    detection_id: str, image_id: str, model_used: str,
    detections: list, mask_path: str,
    inference_time_ms: int, confidence_threshold: float,
) -> None:
    await db.execute(
        "INSERT INTO detections VALUES (?,?,?,?,?,?,?,?)",
        (detection_id, image_id, model_used, json.dumps(detections),
         mask_path, inference_time_ms, confidence_threshold, _now()),
    )
    await db.commit()


async def get_detection(db: aiosqlite.Connection, detection_id: str):
    async with db.execute(
        "SELECT * FROM detections WHERE detection_id = ?", (detection_id,)
    ) as cur:
        return await cur.fetchone()


async def list_detections(
    db: aiosqlite.Connection, page: int, per_page: int
) -> tuple[int, list]:
    async with db.execute("SELECT COUNT(*) FROM detections") as cur:
        total = (await cur.fetchone())[0]
    offset = (page - 1) * per_page
    async with db.execute(
        "SELECT * FROM detections ORDER BY created_at DESC LIMIT ? OFFSET ?",
        (per_page, offset),
    ) as cur:
        rows = await cur.fetchall()
    return total, rows


async def delete_detection(db: aiosqlite.Connection, detection_id: str) -> bool:
    async with db.execute(
        "SELECT COUNT(*) FROM detections WHERE detection_id = ?", (detection_id,)
    ) as cur:
        exists = (await cur.fetchone())[0]
    if not exists:
        return False
    await db.execute("DELETE FROM detections WHERE detection_id = ?", (detection_id,))
    await db.commit()
    return True

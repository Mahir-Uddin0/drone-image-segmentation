import aiosqlite
from config import DB_PATH

_SCHEMA = """
CREATE TABLE IF NOT EXISTS images (
    image_id   TEXT PRIMARY KEY,
    filename   TEXT NOT NULL,
    filepath   TEXT NOT NULL,
    width      INTEGER,
    height     INTEGER,
    size_bytes INTEGER,
    latitude   REAL,
    longitude  REAL,
    sw_lng     REAL,
    sw_lat     REAL,
    ne_lng     REAL,
    ne_lat     REAL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS detections (
    detection_id         TEXT PRIMARY KEY,
    image_id             TEXT NOT NULL REFERENCES images(image_id),
    model_used           TEXT NOT NULL,
    detections_json      TEXT NOT NULL,
    mask_path            TEXT,
    inference_time_ms    INTEGER,
    confidence_threshold REAL,
    created_at           TEXT NOT NULL
);
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


def get_db():
    return aiosqlite.connect(DB_PATH)

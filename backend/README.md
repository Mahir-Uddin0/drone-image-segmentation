# DroneSeg — Backend

FastAPI backend for drone imagery semantic segmentation.

## Stack
| Package | Version | Role |
|---|---|---|
| FastAPI | 0.111 | Async REST framework |
| Uvicorn | 0.29 | ASGI server |
| HuggingFace Transformers | 4.40 | SegFormer-B2 model |
| PyTorch | 2.3 | Inference runtime |
| OpenCV (headless) | 4.9 | Connected-component bbox extraction |
| Pillow | 10.3 | Image I/O + mask colorization |
| aiosqlite | 0.20 | Async SQLite |

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` (all values are optional — defaults shown):
```
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
DB_PATH=droneseg.db
MODEL_ID=nvidia/segformer-b2-finetuned-ade-512-512
MAX_UPLOAD_SIZE_MB=50
CORS_ORIGINS=http://localhost:3000
OPENAI_API_KEY=sk-...           # only required for LLM mode
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

First run auto-downloads SegFormer-B2 weights (~85 MB) from HuggingFace Hub.  
SQLite database is created automatically on startup.

## Seed Sample Images

Place the three DJI images in `uploads/` then run:
```bash
python seed_images.py
```
Outputs the `image_id` for each — paste into the frontend dropdown config.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload drone image (JPEG/PNG ≤ 50 MB) |
| `POST` | `/api/detect` | Run SegFormer inference (JSON or multipart) |
| `GET` | `/api/images` | List all registered images |
| `GET` | `/api/images/{image_id}` | Serve original image bytes |
| `GET` | `/api/masks/{filename}` | Serve segmentation mask PNG |
| `GET` | `/api/history` | Paginated detection history |
| `DELETE` | `/api/history/{id}` | Delete a detection record |
| `GET` | `/api/export/geojson/{id}` | GeoJSON FeatureCollection export |

Interactive docs: http://localhost:8000/docs

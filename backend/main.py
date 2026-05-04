from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS, OUTPUT_DIR, UPLOAD_DIR
from db.database import init_db
from routers import detect, export, history, images, upload
from services.segformer_service import SegformerService


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    await init_db()
    app.state.seg_service = SegformerService()   # loaded once; NFR-REL-01 propagates on OOM
    yield


app = FastAPI(title="DroneSeg API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Routers registered before StaticFiles so /api/images/{id} route takes precedence
app.include_router(upload.router,  prefix="/api")
app.include_router(images.router,  prefix="/api")   # GET /api/images + /api/images/{id}
app.include_router(detect.router,  prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(export.router,  prefix="/api")

# Masks served as static files (filename includes extension so no ambiguity)
app.mount("/api/masks", StaticFiles(directory=str(OUTPUT_DIR)), name="masks")

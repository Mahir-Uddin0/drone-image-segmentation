import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR      = Path(os.getenv("UPLOAD_DIR",  "uploads"))
OUTPUT_DIR      = Path(os.getenv("OUTPUT_DIR",  "outputs"))
DB_PATH         = Path(os.getenv("DB_PATH",     "droneseg.db"))
MODEL_ID        = os.getenv("MODEL_ID", "nvidia/segformer-b2-finetuned-ade-512-512")
MAX_UPLOAD_B    = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50")) * 1024 * 1024
CORS_ORIGINS    = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")

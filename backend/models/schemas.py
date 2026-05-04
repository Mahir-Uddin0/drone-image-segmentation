from pydantic import BaseModel, Field
from typing import Optional


class UploadResponse(BaseModel):
    image_id:   str
    filename:   str
    width:      int
    height:     int
    size_bytes: int
    latitude:   Optional[float] = None
    longitude:  Optional[float] = None
    sw_lng:     Optional[float] = None
    sw_lat:     Optional[float] = None
    ne_lng:     Optional[float] = None
    ne_lat:     Optional[float] = None


class ImageRecord(BaseModel):
    image_id:   str
    filename:   str
    width:      int
    height:     int
    size_bytes: int
    latitude:   Optional[float] = None
    longitude:  Optional[float] = None
    sw_lng:     Optional[float] = None
    sw_lat:     Optional[float] = None
    ne_lng:     Optional[float] = None
    ne_lat:     Optional[float] = None
    created_at: str


class DetectRequest(BaseModel):
    image_id:             str
    confidence_threshold: float = Field(default=0.5, ge=0.0, le=1.0)


class Detection(BaseModel):
    label:      str
    confidence: float
    bbox:       list[int]   # [x_min, y_min, x_max, y_max]
    pixel_area: int
    color:      str         # hex


class DetectionResponse(BaseModel):
    detection_id:      str
    image_id:          str
    model_used:        str
    inference_time_ms: int
    image_width:       int
    image_height:      int
    detections:        list[Detection]
    mask_url:          str
    mask_base64:       Optional[str] = None
    image_bounds:      Optional[list[float]] = None  # [sw_lng, sw_lat, ne_lng, ne_lat]


class HistoryItem(BaseModel):
    detection_id:      str
    image_id:          str
    timestamp:         str
    model_used:        str
    class_count:       int
    image_thumbnail_url: str              # FR-HIST-02
    detected_classes:  list[str]


class HistoryResponse(BaseModel):
    total: int
    page:  int
    items: list[HistoryItem]

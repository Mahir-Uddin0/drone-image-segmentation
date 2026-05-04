import io
import time

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

from config import MODEL_ID

# Key ADE20K class colors (SRS §14.1); unknown classes auto-generated
_FIXED: dict[int, str] = {
    1:  "#FF6B6B",  # building
    3:  "#87CEEB",  # sky
    4:  "#4CAF50",  # tree
    6:  "#9E9E9E",  # road
    9:  "#8BC34A",  # grass
    12: "#795548",  # sidewalk
    17: "#33691E",  # vegetation
    20: "#FF9800",  # car
    21: "#2196F3",  # water
    29: "#BDBDBD",  # fence
}


def _color(cls_id: int) -> str:
    if cls_id in _FIXED:
        return _FIXED[cls_id]
    rng = np.random.default_rng(cls_id * 37)
    r, g, b = rng.integers(60, 230, 3)
    return f"#{r:02X}{g:02X}{b:02X}"


class SegformerService:
    MODEL_ID = MODEL_ID
    MAX_SIDE = 2048

    def __init__(self) -> None:
        self.processor = SegformerImageProcessor.from_pretrained(self.MODEL_ID)
        self.model     = SegformerForSemanticSegmentation.from_pretrained(self.MODEL_ID)
        self.model.eval()
        self.device    = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.id2label  = self.model.config.id2label  # {int: str}

    # ------------------------------------------------------------------
    def segment(self, filepath: str, confidence_threshold: float = 0.5) -> dict:
        image = Image.open(filepath).convert("RGB")
        if max(image.size) > self.MAX_SIDE:
            image.thumbnail((self.MAX_SIDE, self.MAX_SIDE))

        W, H = image.size
        t0   = time.perf_counter()

        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)

        # Upsample logits → original size, then softmax for per-pixel confidence
        logits   = outputs.logits                                               # (1, C, h, w)
        upsampled = F.interpolate(logits, size=(H, W), mode="bilinear", align_corners=False)
        probs    = torch.softmax(upsampled, dim=1).squeeze(0).cpu().numpy()    # (C, H, W)
        seg_map  = probs.argmax(axis=0).astype(np.int32)                       # (H, W)

        elapsed_ms = int((time.perf_counter() - t0) * 1000)

        return {
            "detections":       self._extract(seg_map, probs, confidence_threshold),
            "mask_png":         self._colorize(seg_map),
            "inference_time_ms": elapsed_ms,
            "image_width":      W,
            "image_height":     H,
        }

    # ------------------------------------------------------------------
    def _extract(self, seg_map: np.ndarray, probs: np.ndarray, threshold: float) -> list[dict]:
        results = []
        for cls_id in np.unique(seg_map):
            class_mask = (seg_map == cls_id).astype(np.uint8)
            pixel_area = int(class_mask.sum())
            confidence = float(probs[cls_id][class_mask.astype(bool)].mean())

            if confidence < threshold:
                continue

            n, _, stats, _ = cv2.connectedComponentsWithStats(class_mask, connectivity=8)
            if n < 2:
                continue

            s     = stats[1:]  # drop background row
            x_min = int(s[:, cv2.CC_STAT_LEFT].min())
            y_min = int(s[:, cv2.CC_STAT_TOP].min())
            x_max = int((s[:, cv2.CC_STAT_LEFT] + s[:, cv2.CC_STAT_WIDTH]).max())
            y_max = int((s[:, cv2.CC_STAT_TOP]  + s[:, cv2.CC_STAT_HEIGHT]).max())

            results.append({
                "label":      self.id2label[cls_id],
                "confidence": round(confidence, 4),
                "bbox":       [x_min, y_min, x_max, y_max],
                "pixel_area": pixel_area,
                "color":      _color(cls_id),
            })

        return sorted(results, key=lambda d: d["pixel_area"], reverse=True)

    # ------------------------------------------------------------------
    def _colorize(self, seg_map: np.ndarray) -> bytes:
        H, W  = seg_map.shape
        rgba  = np.zeros((H, W, 4), dtype=np.uint8)
        for cls_id in np.unique(seg_map):
            c = _color(cls_id)
            rgba[seg_map == cls_id] = [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 180]
        buf = io.BytesIO()
        Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
        return buf.getvalue()

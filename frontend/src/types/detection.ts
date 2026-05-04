export interface Detection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x_min, y_min, x_max, y_max]
  pixel_area: number;
  color: string;
}

export interface DetectionResponse {
  detection_id: string;
  image_id: string;
  model_used: string;
  inference_time_ms: number;
  image_width: number;
  image_height: number;
  detections: Detection[];
  mask_url: string;
  mask_base64?: string;
  image_bounds?: [number, number, number, number];
}

export interface ImageRecord {
  image_id: string;
  filename: string;
  width: number;
  height: number;
  size_bytes: number;
  latitude?: number;
  longitude?: number;
  sw_lng?: number;
  sw_lat?: number;
  ne_lng?: number;
  ne_lat?: number;
  created_at: string;
}

export interface HistoryItem {
  detection_id: string;
  image_id: string;
  timestamp: string;
  model_used: string;
  class_count: number;
  image_thumbnail_url: string;
  detected_classes: string[];
}

export interface HistoryResponse {
  total: number;
  page: number;
  items: HistoryItem[];
}

def _pixel_to_coords(bbox: list[int], img_w: int, img_h: int, bounds: list[float]) -> list[list[float]]:
    """Map pixel bbox → closed GeoJSON ring [[lng,lat], ...]."""
    x1, y1, x2, y2 = bbox
    sw_lng, sw_lat, ne_lng, ne_lat = bounds
    
    lng_span = ne_lng - sw_lng
    lat_span = ne_lat - sw_lat

    lng1 = sw_lng + (x1 / img_w) * lng_span
    lng2 = sw_lng + (x2 / img_w) * lng_span
    lat1 = ne_lat - (y1 / img_h) * lat_span   # image top → north
    lat2 = ne_lat - (y2 / img_h) * lat_span

    return [[lng1, lat1], [lng2, lat1], [lng2, lat2], [lng1, lat2], [lng1, lat1]]


def build_geojson(detections: list[dict], img_width: int, img_height: int, bounds: list[float]) -> dict:
    """Return a GeoJSON FeatureCollection (SRS §6.7)."""
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [_pixel_to_coords(d["bbox"], img_width, img_height, bounds)],
            },
            "properties": {
                "class":      d["label"],
                "confidence": d["confidence"],
                "pixel_area": d["pixel_area"],
                "color":      d["color"],
            },
        }
        for d in detections
    ]
    return {"type": "FeatureCollection", "features": features}

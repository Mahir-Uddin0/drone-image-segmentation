import re
import math
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def _get_exif_data(image):
    """Extract EXIF data from PIL image."""
    exif_data = {}
    info = image._getexif()
    if info:
        for tag, value in info.items():
            decoded = TAGS.get(tag, tag)
            if decoded == "GPSInfo":
                gps_data = {}
                for t in value:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_data[sub_tag] = value[t]
                exif_data[decoded] = gps_data
            else:
                exif_data[decoded] = value
    return exif_data

def _convert_to_degrees(value):
    """Helper to convert GPS coordinates to degrees."""
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)

def _get_xmp_metadata(image_path):
    """Extract XMP metadata from image file."""
    with open(image_path, 'rb') as f:
        content = f.read()
    
    start = content.find(b'<x:xmpmeta')
    end = content.find(b'</x:xmpmeta>')
    if start == -1 or end == -1:
        return {}
    
    xmp_str = content[start:end+12].decode('utf-8', errors='ignore')
    
    metadata = {}
    # Simple regex extraction for DJI tags
    tags = [
        'GpsLatitude', 'GpsLongitude', 'RelativeAltitude', 
        'GimbalPitchDegree', 'CalibratedFocalLength'
    ]
    for tag in tags:
        match = re.search(f'drone-dji:{tag}="([^"]+)"', xmp_str)
        if match:
            metadata[tag] = float(match.group(1))
            
    return metadata

def extract_metadata(image_path: str):
    """Extract GPS and calculate footprint from drone image."""
    img = Image.open(image_path)
    width, height = img.size
    
    # Try XMP first (more precise for DJI)
    xmp = _get_xmp_metadata(image_path)
    exif = _get_exif_data(img)
    
    lat = xmp.get('GpsLatitude')
    lng = xmp.get('GpsLongitude')
    alt = xmp.get('RelativeAltitude')
    focal_len = xmp.get('CalibratedFocalLength')
    
    # Fallback to EXIF for basic GPS
    if lat is None or lng is None:
        gps_info = exif.get('GPSInfo')
        if gps_info:
            lat = _convert_to_degrees(gps_info.get('GPSLatitude'))
            if gps_info.get('GPSLatitudeRef') == 'S': lat = -lat
            lng = _convert_to_degrees(gps_info.get('GPSLongitude'))
            if gps_info.get('GPSLongitudeRef') == 'W': lng = -lng
            
    # Default fallbacks if no GPS found
    if lat is None or lng is None:
        return None

    # Calculate footprint
    # Default values if missing from metadata
    if alt is None: alt = 50.0  # Assume 50m
    if focal_len is None:
        # Try to estimate from focal length in 35mm
        f35 = exif.get('FocalLengthIn35mmFilm', 24)
        # Focal length in pixels approx: (f35 / 36) * width
        focal_len = (f35 / 36.0) * width
        
    gsd = alt / focal_len
    ground_w = gsd * width
    ground_h = gsd * height
    
    # Meters to degrees (approximate)
    lat_deg = ground_h / 111111.0
    lng_deg = ground_w / (111111.0 * math.cos(math.radians(lat)))
    
    sw_lat = lat - (lat_deg / 2)
    sw_lng = lng - (lng_deg / 2)
    ne_lat = lat + (lat_deg / 2)
    ne_lng = lng + (lng_deg / 2)
    
    return {
        "latitude": lat,
        "longitude": lng,
        "sw_lng": sw_lng,
        "sw_lat": sw_lat,
        "ne_lng": ne_lng,
        "ne_lat": ne_lat
    }

'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Source, Layer, MapRef, LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Detection } from '@/types/detection';
import SegMaskOverlay from './SegMaskOverlay';
import BBoxOverlay from './BBoxOverlay';

interface MapViewerProps {
  imageBounds?: [number, number, number, number]; // [SW_lng, SW_lat, NE_lng, NE_lat]
  imageUrl?: string;
  maskUrl?: string;
  detections?: Detection[];
  opacity?: number;
  confidenceThreshold?: number;
  visibleClasses?: Set<string>;
}

const DEFAULT_BOUNDS: [number, number, number, number] = [90.354, 23.778, 90.358, 23.782];

export default function MapViewer({
  imageBounds = DEFAULT_BOUNDS,
  imageUrl,
  maskUrl,
  detections = [],
  opacity = 0.85,
  confidenceThreshold = 0.5,
  visibleClasses = new Set(),
}: MapViewerProps) {
  const mapRef = useRef<MapRef>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: (imageBounds[0] + imageBounds[2]) / 2,
    latitude: (imageBounds[1] + imageBounds[3]) / 2,
    zoom: 16,
  });

  const mapStyle = useMemo(() => ({
    version: 8 as const,
    sources: {
      'osm-raster': {
        type: 'raster' as const,
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'osm-raster-layer',
        type: 'raster' as const,
        source: 'osm-raster',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  }), []);

  useEffect(() => {
    if (imageBounds && imageBounds.length === 4 && mapRef.current) {
      mapRef.current.getMap().fitBounds(
        [
          [imageBounds[0], imageBounds[1]], // SW
          [imageBounds[2], imageBounds[3]], // NE
        ],
        { padding: 100, duration: 2000 }
      );
    }
  }, [imageBounds]);

  const droneImageLayer: LayerProps = useMemo(() => ({
    id: 'drone-image-layer',
    type: 'raster',
    paint: {
      'raster-opacity': opacity,
    },
  }), [opacity]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0b] overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        onStyleData={() => setIsStyleLoaded(true)}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        {isStyleLoaded && imageUrl && (
          <Source
            id="drone-image"
            type="image"
            url={imageUrl}
            coordinates={[
              [imageBounds[0], imageBounds[3]], // Top Left
              [imageBounds[2], imageBounds[3]], // Top Right
              [imageBounds[2], imageBounds[1]], // Bottom Right
              [imageBounds[0], imageBounds[1]], // Bottom Left
            ]}
          >
            <Layer {...droneImageLayer} />
          </Source>
        )}

        {isStyleLoaded && maskUrl && (
          <SegMaskOverlay 
            maskUrl={maskUrl} 
            imageBounds={imageBounds} 
            opacity={opacity * 0.7} // Scaled by global opacity
          />
        )}

        {isStyleLoaded && (
          <BBoxOverlay 
            detections={detections}
            imageBounds={imageBounds}
            confidenceThreshold={confidenceThreshold}
            visibleClasses={visibleClasses}
          />
        )}
      </Map>

      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="glass-dark px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          Map Engine Live
        </div>
      </div>
    </div>
  );
}

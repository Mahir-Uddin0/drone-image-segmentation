'use client';

import React, { useMemo } from 'react';
import { Source, Layer, LayerProps } from 'react-map-gl/maplibre';

interface SegMaskOverlayProps {
  maskUrl: string;
  imageBounds: [number, number, number, number];
  opacity?: number;
}

export default function SegMaskOverlay({
  maskUrl,
  imageBounds,
  opacity = 0.6,
}: SegMaskOverlayProps) {
  const maskLayer: LayerProps = useMemo(() => ({
    id: 'seg-mask-layer',
    type: 'raster',
    paint: {
      'raster-opacity': opacity,
    },
  }), [opacity]);

  return (
    <Source
      id="seg-mask-source"
      type="image"
      url={maskUrl}
      coordinates={[
        [imageBounds[0], imageBounds[3]], // Top Left
        [imageBounds[2], imageBounds[3]], // Top Right
        [imageBounds[2], imageBounds[1]], // Bottom Right
        [imageBounds[0], imageBounds[1]], // Bottom Left
      ]}
    >
      <Layer {...maskLayer} />
    </Source>
  );
}

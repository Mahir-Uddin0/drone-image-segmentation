'use client';

import React, { useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { Detection } from '@/types/detection';

interface BBoxOverlayProps {
  detections: Detection[];
  imageBounds: [number, number, number, number]; // [SW_lng, SW_lat, NE_lng, NE_lat]
  confidenceThreshold: number;
  visibleClasses: Set<string>;
}

export default function BBoxOverlay({
  detections,
  imageBounds,
  confidenceThreshold,
  visibleClasses,
}: BBoxOverlayProps) {
  const { current: map } = useMap();

  const filteredDetections = useMemo(() => {
    return detections.filter(d => 
      d.confidence >= confidenceThreshold && 
      (visibleClasses.size === 0 || visibleClasses.has(d.label))
    );
  }, [detections, confidenceThreshold, visibleClasses]);

  if (!map) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full">
        {filteredDetections.map((d, i) => {
          // Pixel bbox: [x_min, y_min, x_max, y_max]
          const [x1, y1, x2, y2] = d.bbox;
          
          // Note: In a real app, we would need the image width/height to normalize.
          // For now, we assume d.bbox is normalized 0-1 or we use the image metadata.
          // Let's assume the backend returns absolute pixel coords and we have 
          // the image resolution from the detection result.
          
          // This is a simplified projection assuming linear mapping across bounds.
          const lng1 = imageBounds[0] + (x1 / 2048) * (imageBounds[2] - imageBounds[0]);
          const lng2 = imageBounds[0] + (x2 / 2048) * (imageBounds[2] - imageBounds[0]);
          const lat1 = imageBounds[3] - (y1 / 1534) * (imageBounds[3] - imageBounds[1]);
          const lat2 = imageBounds[3] - (y2 / 1534) * (imageBounds[3] - imageBounds[1]);

          const p1 = map.project([lng1, lat1]);
          const p2 = map.project([lng2, lat2]);

          const width = Math.abs(p2.x - p1.x);
          const height = Math.abs(p2.y - p1.y);
          const left = Math.min(p1.x, p2.x);
          const top = Math.min(p1.y, p2.y);

          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={left}
                y={top}
                width={width}
                height={height}
                fill="none"
                stroke={d.color}
                strokeWidth="2"
                className="transition-all duration-300"
                style={{ filter: `drop-shadow(0 0 4px ${d.color}40)` }}
              />
              <foreignObject x={left} y={top - 24} width={width} height={24}>
                <div 
                  className="px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap rounded-t-md uppercase tracking-wider"
                  style={{ backgroundColor: d.color }}
                >
                  {d.label} {Math.round(d.confidence * 100)}%
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

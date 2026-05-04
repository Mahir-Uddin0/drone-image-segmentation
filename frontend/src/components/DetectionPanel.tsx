'use client';

import React from 'react';
import ConfidenceSlider from './ConfidenceSlider';
import { Detection, DetectionResponse } from '@/types/detection';
import { 
  Zap, 
  BarChart3, 
  Clock, 
  Layers, 
  Download, 
  Eye, 
  EyeOff,
  Cpu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DetectionPanelProps {
  result: DetectionResponse | null;
  confidenceThreshold: number;
  setConfidenceThreshold: (val: number) => void;
  visibleClasses: Set<string>;
  toggleVisibleClass: (label: string) => void;
  onExport: () => void;
  isDetecting: boolean;
}

export default function DetectionPanel({
  result,
  confidenceThreshold,
  setConfidenceThreshold,
  visibleClasses,
  toggleVisibleClass,
  onExport,
  isDetecting,
}: DetectionPanelProps) {
  if (isDetecting) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gradient">Analyzing Imagery</h3>
          <p className="text-sm text-muted-foreground">Running SegFormer-B2 inference...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center gap-6 opacity-60">
        <div className="p-4 rounded-3xl bg-secondary/50 border border-white/5">
          <Layers className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">No Detections Yet</h3>
          <p className="text-sm text-muted-foreground">Upload or select an image to run semantic analysis.</p>
        </div>
      </div>
    );
  }

  const filteredDetections = result.detections.filter(d => d.confidence >= confidenceThreshold);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Stats */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Detection Results</h2>
          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            {result.model_used.split('/').pop()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase">Latency</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{result.inference_time_ms}ms</p>
          </div>
          <div className="glass p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase">Objects</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{filteredDetections.length}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6">
        <ConfidenceSlider 
          value={confidenceThreshold} 
          onChange={setConfidenceThreshold} 
        />
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
        {result.detections.map((detection, idx) => {
          const isVisible = visibleClasses.size === 0 || visibleClasses.has(detection.label);
          const isFiltered = detection.confidence < confidenceThreshold;

          return (
            <div
              key={`${detection.label}-${idx}`}
              onClick={() => !isFiltered && toggleVisibleClass(detection.label)}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all cursor-pointer",
                !isVisible || isFiltered 
                  ? "bg-transparent border-white/5 opacity-40 grayscale" 
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm" 
                    style={{ backgroundColor: detection.color }} 
                  />
                  <span className="font-bold text-sm uppercase tracking-tight">{detection.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    {Math.round(detection.confidence * 100)}%
                  </span>
                  {isVisible && !isFiltered ? (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  <span>Coverage</span>
                  <span>{detection.pixel_area.toLocaleString()} px²</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ 
                      width: `${detection.confidence * 100}%`,
                      backgroundColor: detection.color 
                    }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <button
          onClick={onExport}
          className="w-full py-4 px-4 bg-primary hover:bg-blue-600 active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-lg shadow-primary/20"
        >
          <Download className="w-4 h-4" />
          Export GeoJSON Results
        </button>
      </div>
    </div>
  );
}

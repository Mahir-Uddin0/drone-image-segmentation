'use client';

import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Filter } from 'lucide-react';

interface ConfidenceSliderProps {
  value: number;
  onChange: (val: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="w-4 h-4 text-primary" />
          Confidence Threshold
        </div>
        <span className="text-sm font-mono font-bold text-primary">
          {Math.round(value * 100)}%
        </span>
      </div>
      
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        max={1}
        step={0.01}
      >
        <Slider.Track className="bg-white/5 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-primary rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 bg-white shadow-xl rounded-full focus:outline-none ring-4 ring-primary/20 transition-all hover:scale-110 active:scale-95"
          aria-label="Confidence threshold"
        />
      </Slider.Root>
    </div>
  );
}

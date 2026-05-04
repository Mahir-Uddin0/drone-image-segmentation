'use client';

import React from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ModelType = 'segformer' | 'gpt-4o-mini' | 'gpt-4.1-mini';

interface LLMModelSelectorProps {
  selectedModel: ModelType;
  onSelect: (model: ModelType) => void;
}

export default function LLMModelSelector({ selectedModel, onSelect }: LLMModelSelectorProps) {
  const models = [
    { id: 'segformer', name: 'SegFormer-B2', provider: 'HuggingFace', description: 'Pixel-accurate semantic segmentation' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Vision-language region analysis' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', description: 'Advanced AI spatial reasoning' },
  ] as const;

  return (
    <div className="relative group">
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass hover:bg-white/10 transition-all cursor-pointer border-white/10">
        <div className="p-1.5 rounded-lg bg-primary/20">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Engine</span>
          <span className="text-sm font-bold leading-tight">{models.find(m => m.id === selectedModel)?.name}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
      </div>

      <div className="absolute top-full left-0 mt-2 w-72 glass-dark rounded-3xl border border-white/10 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[100] overflow-hidden">
        <div className="p-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={cn(
                "w-full p-4 rounded-2xl text-left transition-all flex flex-col gap-1 group/item",
                selectedModel === model.id ? "bg-primary/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-bold text-sm",
                  selectedModel === model.id ? "text-primary" : "text-foreground"
                )}>
                  {model.name}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-white/5">
                  {model.provider}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{model.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, 
  X, 
  History, 
  Plus, 
  Zap, 
  Info, 
  LayoutDashboard,
  ExternalLink,
  FileImage,
  Layers,
  Sparkles
} from 'lucide-react';
import MapViewer from '@/components/MapViewer';
import DetectionPanel from '@/components/DetectionPanel';
import UploadZone from '@/components/UploadZone';
import LLMModelSelector, { ModelType } from '@/components/LLMModelSelector';
import * as api from '@/lib/api';
import { DetectionResponse, ImageRecord, HistoryItem } from '@/types/detection';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DroneSegPlatform() {
  // UI State
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('segformer');

  // App State
  const [currentImage, setCurrentImage] = useState<ImageRecord | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [visibleClasses, setVisibleClasses] = useState<Set<string>>(new Set());
  const [isDetecting, setIsDetecting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sampleImages, setSampleImages] = useState<ImageRecord[]>([]);
  const [mapOpacity, setMapOpacity] = useState(0.85);

  // Initialize
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, imagesData] = await Promise.all([
          api.getHistory(),
          api.getImages()
        ]);
        setHistory(historyData.items);
        setSampleImages(imagesData);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchData();
  }, []);

  const handleUploadSuccess = async (file: File) => {
    try {
      const img = await api.uploadImage(file);
      setCurrentImage(img);
      setDetectionResult(null);
      setVisibleClasses(new Set());
      await runAnalysis(img.image_id);
    } catch (err) {
      console.error("Upload failed", err);
      throw err;
    }
  };

  const runAnalysis = async (imageId: string) => {
    setIsDetecting(true);
    try {
      if (selectedModel === 'segformer') {
        const result = await api.runDetection(imageId, 0.1);
        setDetectionResult(result);
      } else {
        // LLM Mode: Fetch image bytes then analyze
        // This is a simplified path for the demo
        const imgUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/images/${imageId}`;
        const resp = await fetch(imgUrl);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          const llmResp = await fetch('/api/llm', {
            method: 'POST',
            body: JSON.stringify({ image_base_64: base64data, model: selectedModel }),
          });
          const result = await llmResp.json();
          setDetectionResult({
            ...result,
            detection_id: 'llm-result',
            image_id: imageId,
            model_used: selectedModel,
            inference_time_ms: 0,
            image_width: 2048,
            image_height: 1534,
            mask_url: '',
          });
        };
      }
      
      const historyData = await api.getHistory();
      setHistory(historyData.items);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleVisibleClass = (label: string) => {
    setVisibleClasses(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const selectHistoryItem = async (item: HistoryItem) => {
    setIsDetecting(true);
    try {
      const result = await api.runDetection(item.image_id, 0.1);
      setDetectionResult(result);
      setCurrentImage({
        image_id: item.image_id,
        filename: 'Restored Image',
        width: 2048,
        height: 1534,
        size_bytes: 0,
        created_at: item.timestamp
      });
      setIsHistoryOpen(false);
    } catch (err) {
      console.error("Failed to restore history item", err);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-20 glass-dark border-r border-white/5 flex flex-col items-center py-8 gap-10 z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-transform">
            <Zap className="text-white w-6 h-6 fill-current" />
          </div>
        </div>

        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => { setActiveTab('upload'); setIsHistoryOpen(false); }}
            className={cn(
              "p-3.5 rounded-2xl transition-all",
              activeTab === 'upload' && !isHistoryOpen ? "bg-white/10 text-primary" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className={cn(
              "p-3.5 rounded-2xl transition-all",
              isHistoryOpen ? "bg-white/10 text-primary" : "text-muted-foreground hover:bg-white/5"
            )}
          >
            <History className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-6 text-muted-foreground">
          <button className="p-3.5 rounded-2xl hover:bg-white/5 transition-all">
            <Info className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Map Engine */}
        <div className="flex-1 relative">
          <MapViewer 
            imageUrl={currentImage ? `${process.env.NEXT_PUBLIC_API_URL}/api/images/${currentImage.image_id}` : undefined}
            maskUrl={detectionResult?.mask_url ? `${process.env.NEXT_PUBLIC_API_URL}${detectionResult.mask_url}` : undefined}
            detections={detectionResult?.detections}
            imageBounds={detectionResult?.image_bounds}
            confidenceThreshold={confidenceThreshold}
            visibleClasses={visibleClasses}
            opacity={mapOpacity}
          />

          {/* Top Floating Toolbar */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <div className="glass px-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-2xl">
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold tracking-tight text-gradient">DroneSeg Platform</h1>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Vision Node</p>
                </div>
              </div>
              <LLMModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              {selectedModel !== 'segformer' && (
                <div className="glass-dark px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary tracking-tight">AI Vision Mode Active</span>
                </div>
              )}
              {currentImage && (
                <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold border-white/10">
                  <FileImage className="w-4 h-4 text-primary" />
                  {currentImage.filename}
                </div>
              )}
            </div>
          </div>

          {/* Opacity Control - FR-MAP-04 */}
          <div className="absolute bottom-6 right-6 glass-dark p-2 rounded-2xl border-white/10 flex items-center gap-3 pointer-events-auto shadow-2xl">
            <div className="p-2 rounded-xl bg-white/5">
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.01" 
              value={mapOpacity} 
              onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-[10px] font-bold text-muted-foreground w-8 uppercase">{Math.round(mapOpacity * 100)}%</span>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="w-96 glass-dark border-l border-white/5 transition-all duration-500 z-40">
          <div className="h-full flex flex-col">
            {!currentImage && !detectionResult ? (
              <div className="p-8 h-full flex flex-col gap-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Project Node</h2>
                  <p className="text-sm text-muted-foreground">Upload drone imagery for segmentation.</p>
                </div>
                
                <UploadZone onUploadSuccess={handleUploadSuccess} />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <ExternalLink className="w-3 h-3" />
                    Available Samples
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {sampleImages.map((img) => (
                      <button
                        key={img.image_id}
                        onClick={() => { setCurrentImage(img); runAnalysis(img.image_id); }}
                        className="glass p-4 rounded-2xl text-left hover:bg-white/5 transition-all group border-white/5"
                      >
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">{img.filename}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                          {(img.size_bytes / 1024 / 1024).toFixed(1)}MB
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => { setCurrentImage(null); setDetectionResult(null); }}
                    className="text-xs font-bold text-muted-foreground hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                    Reset Workspace
                  </button>
                </div>
                <DetectionPanel 
                  result={detectionResult}
                  confidenceThreshold={confidenceThreshold}
                  setConfidenceThreshold={setConfidenceThreshold}
                  visibleClasses={visibleClasses}
                  toggleVisibleClass={toggleVisibleClass}
                  onExport={() => detectionResult && api.exportGeoJSON(detectionResult.detection_id)}
                  isDetecting={isDetecting}
                />
              </div>
            )}
          </div>
        </aside>

        {/* History Drawer */}
        {isHistoryOpen && (
          <div className="absolute inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsHistoryOpen(false)} />
            <aside className="relative w-[480px] bg-background border-r border-white/10 flex flex-col shadow-2xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">History</h2>
                <button onClick={() => setIsHistoryOpen(false)} className="p-3 rounded-2xl hover:bg-white/5 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {history.map((item) => (
                  <div
                    key={item.detection_id}
                    onClick={() => selectHistoryItem(item)}
                    className="glass group p-5 rounded-3xl cursor-pointer hover:border-primary/30 transition-all border-white/5"
                  >
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-secondary overflow-hidden relative">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL}${item.image_thumbnail_url}`}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
                          alt="Thumb"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-sm font-bold mb-1 truncate">Task {item.detection_id.slice(0, 8)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadZoneProps {
  onUploadSuccess: (file: File) => void;
  className?: string;
}

export default function UploadZone({ onUploadSuccess, className }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      await onUploadSuccess(file);
      setStatus('success');
      setTimeout(() => {
        setFile(null);
        setStatus('idle');
      }, 2000);
    } catch (error) {
      setStatus('error');
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setStatus('idle');
  };

  return (
    <div className={cn("w-full h-full", className)}>
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative w-full h-full border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center gap-6 cursor-pointer p-8 group overflow-hidden",
            isDragActive 
              ? "border-primary bg-primary/5 ring-8 ring-primary/5" 
              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className={cn(
              "relative p-5 rounded-2xl bg-secondary/80 border border-white/5 transition-transform duration-500",
              isDragActive ? "scale-110" : "group-hover:scale-105"
            )}>
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-1.5 text-center">
            <p className="text-lg font-bold tracking-tight">Drop drone image here</p>
            <p className="text-sm text-muted-foreground font-medium">
              JPEG or PNG up to 50MB
            </p>
          </div>

          {isDragActive && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-sm">
              <p className="text-primary font-bold text-lg animate-bounce">Release to Upload</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full glass rounded-3xl p-6 flex flex-col items-center justify-center gap-6 border-white/10">
          <div className="relative p-5 rounded-2xl bg-secondary/80 border border-white/5">
            <FileImage className="w-8 h-8 text-primary" />
            <button 
              onClick={clearFile}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-white hover:scale-110 transition-transform shadow-xl"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={status === 'uploading' || status === 'success'}
            className={cn(
              "w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5",
              status === 'idle' && "bg-primary hover:bg-blue-600 shadow-lg shadow-primary/20",
              status === 'uploading' && "bg-secondary cursor-not-allowed",
              status === 'success' && "bg-green-600 text-white",
              status === 'error' && "bg-destructive text-white"
            )}
          >
            {status === 'idle' && (
              <>
                <Upload className="w-4 h-4" />
                Upload & Process
              </>
            )}
            {status === 'uploading' && (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Success
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle className="w-4 h-4" />
                Failed
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

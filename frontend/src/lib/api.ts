import axios from 'axios';
import { DetectionResponse, HistoryResponse, ImageRecord } from '@/types/detection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadImage = async (file: File): Promise<ImageRecord> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ImageRecord>('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const runDetection = async (imageId: string, confidenceThreshold: number): Promise<DetectionResponse> => {
  const response = await api.post<DetectionResponse>('/api/detect', {
    image_id: imageId,
    confidence_threshold: confidenceThreshold,
  });
  return response.data;
};

export const getHistory = async (page = 1, perPage = 20): Promise<HistoryResponse> => {
  const response = await api.get<HistoryResponse>('/api/history', {
    params: { page, per_page: perPage },
  });
  return response.data;
};

export const getImages = async (): Promise<ImageRecord[]> => {
  const response = await api.get<ImageRecord[]>('/api/images');
  return response.data;
};

export const exportGeoJSON = async (detectionId: string) => {
  const response = await api.get(`/api/export/geojson/${detectionId}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `detection-${detectionId}.geojson`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default api;

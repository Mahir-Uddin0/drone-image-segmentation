# DroneSeg Vision Platform - Frontend

Advanced land-cover identification platform for aerial imagery using SegFormer-B2 and AI Vision.

## 🚀 Features

- **Interactive Map Engine**: Built with MapLibre GL JS and OpenStreetMap.
- **Drone Raster Overlays**: High-performance rendering of 12MP+ drone images.
- **Semantic Segmentation Masks**: Real-time visualization of pixel-accurate land-cover masks.
- **Dynamic Bounding Boxes**: Synchronized SVG overlays for detected objects with confidence labels.
- **AI Vision Mode**: Integrated with GPT-4o-mini and GPT-4.1-mini for natural language spatial analysis.
- **Detection History**: Persistent storage and retrieval of past analysis nodes.
- **GeoJSON Export**: Standard GIS format export for integration with QGIS/ArcGIS.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Map Engine**: MapLibre GL JS
- **UI Components**: Radix UI, Lucide React
- **API Client**: Axios

## 🚦 Getting Started

### Prerequisites
- Node.js 18.17.0 or later
- Access to the DroneSeg Backend API (running on port 8000)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   OPENAI_API_KEY=your_openai_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

## 🗺 Map Interactions
- **Drag**: Pan the map.
- **Scroll**: Zoom in/out.
- **Opacity Slider**: Adjust transparency of the drone and mask overlays.
- **Confidence Slider**: Filter detections in real-time.

## 📄 License
Technical Assessment Project - April 2026.

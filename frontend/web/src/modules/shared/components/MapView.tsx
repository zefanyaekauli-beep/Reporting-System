// frontend/web/src/modules/shared/components/MapView.tsx

import { useEffect, useRef, useState } from "react";

const defaultTheme = {
  colors: {
    primary: "#0d9488",
    success: "#10b981",
    danger: "#ef4444",
    border: "#e5e7eb",
    bgSecondary: "#f9fafb",
    textSoft: "#6b7280",
  },
};

let theme: any;
try {
  theme = require("./theme").theme;
} catch {
  theme = defaultTheme;
}

// Tile layer configurations
const TILE_LAYERS = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: "Streets",
    icon: "🗺️",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    name: "Satellite",
    icon: "🛰️",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    name: "Terrain",
    icon: "⛰️",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: "Dark",
    icon: "🌙",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    name: "Light",
    icon: "☀️",
  },
};

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string | number;
    position: [number, number];
    label?: string;
    color?: string;
    value?: number;
    size?: number;
    metadata?: {
      title?: string;
      value?: number;
      valueLabel?: string;
      timestamp?: string;
      location?: string;
      activity?: string;
    };
  }>;
  tracks?: Array<{
    id: string | number;
    positions: Array<[number, number]>;
    color?: string;
  }>;
  height?: string;
  onMarkerClick?: (markerId: string | number) => void;
  initialLayer?: keyof typeof TILE_LAYERS;
}

export function MapView({
  center = [-6.2088, 106.8456],
  zoom = 13,
  markers = [],
  tracks = [],
  height = "400px",
  onMarkerClick,
  initialLayer = "streets",
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tracksRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState<keyof typeof TILE_LAYERS>(initialLayer);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if ((window as any).L) {
          setMapLoaded(true);
          return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.crossOrigin = "";
        script.onload = () => setMapLoaded(true);
        script.onerror = () => setMapError("Failed to load map library");
        document.body.appendChild(script);
      } catch (err) {
        setMapError("Failed to initialize map");
      }
    };
    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Clean up existing map
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    // Wait for container
    const initMap = () => {
      if (!mapRef.current) return;
      
      const rect = mapRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
          setTimeout(initMap, 100);
        return;
      }

      try {
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: true,
        });

        map.setView(center, zoom);
        mapInstanceRef.current = map;

        // Add initial tile layer
        const layerConfig = TILE_LAYERS[currentLayer];
        tileLayerRef.current = L.tileLayer(layerConfig.url, {
          attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Add markers after map is ready
        map.whenReady(() => {
          addMarkersToMap(map, L);
        });

      } catch (err) {
        console.error("Error initializing map:", err);
        setMapError("Failed to initialize map");
      }
    };

    setTimeout(initMap, 50);

    return () => {
      markersRef.current = [];
      tracksRef.current = [];
      if (mapInstanceRef.current) {
        try {
            mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Function to add markers
  const addMarkersToMap = (map: any, L: any) => {
    if (!map || !L) return;

    // Clear existing markers
    markersRef.current.forEach(m => {
      try { map.removeLayer(m); } catch (e) {}
        });
        markersRef.current = [];

    // Clear existing tracks
    tracksRef.current.forEach(t => {
      try { map.removeLayer(t); } catch (e) {}
        });
        tracksRef.current = [];

    // Add markers
    markers.forEach((marker) => {
          try {
        const size = marker.size || 20;
        const pulseSize = size + 12;

      const markerIcon = L.divIcon({
          className: "custom-marker-v2",
          html: `
            <div class="marker-wrapper" style="width:${pulseSize}px;height:${pulseSize}px;">
              <div class="marker-pulse-ring" style="
                background:${marker.color || theme.colors.primary};
                width:${pulseSize}px;
                height:${pulseSize}px;
              "></div>
              <div class="marker-core" style="
                background:${marker.color || theme.colors.primary};
                width:${size}px;
                height:${size}px;
                box-shadow: 0 4px 14px ${marker.color || theme.colors.primary}50;
              "></div>
            </div>
          `,
          iconSize: [pulseSize, pulseSize],
          iconAnchor: [pulseSize / 2, pulseSize / 2],
      });

      const leafletMarker = L.marker(marker.position, { icon: markerIcon }).addTo(map);
      
        // Popup
        if (marker.metadata || marker.label) {
          const meta = marker.metadata || {};
          const popupHtml = `
            <div class="map-popup-content">
              <div class="popup-header" style="border-color:${marker.color || theme.colors.primary}">
                ${meta.title || meta.location || '📍 Location'}
              </div>
              ${meta.value !== undefined ? `
                <div class="popup-value-box" style="background:${marker.color || theme.colors.primary}15">
                  <span class="popup-value" style="color:${marker.color || theme.colors.primary}">${meta.value}</span>
                  <span class="popup-label">${meta.valueLabel || 'Activities'}</span>
                </div>
              ` : ''}
              ${meta.activity ? `<div class="popup-info"><span class="info-label">Type:</span> ${meta.activity}</div>` : ''}
              ${meta.location ? `<div class="popup-info"><span class="info-label">📍</span> ${meta.location}</div>` : ''}
            </div>
          `;
          leafletMarker.bindPopup(popupHtml, { maxWidth: 280, className: 'modern-popup' });
      }

      if (onMarkerClick) {
        leafletMarker.on("click", () => onMarkerClick(marker.id));
            }

            markersRef.current.push(leafletMarker);
          } catch (err) {
            console.error("Error adding marker:", err);
      }
    });

    // Add tracks
    tracks.forEach((track) => {
          try {
      if (track.positions.length > 1) {
              const polyline = L.polyline(track.positions, {
          color: track.color || theme.colors.primary,
            weight: 4,
            opacity: 0.8,
        }).addTo(map);
              tracksRef.current.push(polyline);
            }
          } catch (err) {
            console.error("Error adding track:", err);
      }
    });

    // Fit bounds
    if (markers.length > 0 || tracks.length > 0) {
          try {
      const bounds = L.latLngBounds([]);
      markers.forEach((m) => bounds.extend(m.position));
      tracks.forEach((t) => t.positions.forEach((p) => bounds.extend(p)));
            if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
          } catch (err) {
            map.setView(center, zoom);
      }
    }
  };

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    addMarkersToMap(mapInstanceRef.current, (window as any).L);
  }, [markers, tracks]);

  // Change tile layer
  const changeLayer = (layerKey: keyof typeof TILE_LAYERS) => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Remove old layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add new layer
    const layerConfig = TILE_LAYERS[layerKey];
    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    setCurrentLayer(layerKey);
    setShowLayerControl(false);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!mapRef.current?.parentElement) return;
    
    if (!isFullscreen) {
      mapRef.current.parentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (mapError) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", borderRadius: 12 }}>
        <span style={{ color: "#ef4444" }}>⚠️ {mapError}</span>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderRadius: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div className="map-loader"></div>
          <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      {/* Map container */}
    <div
      ref={mapRef}
      style={{
          height: "100%",
        width: "100%",
          borderRadius: 12,
        overflow: "hidden",
        }}
      />

      {/* Layer Control Button */}
      <div style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        gap: 8,
      }}>
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "none",
            background: "white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? "⛶" : "⛶"}
        </button>

        {/* Layer switcher */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowLayerControl(!showLayerControl)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "none",
              background: "white",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Change Map Style"
          >
            {TILE_LAYERS[currentLayer].icon}
          </button>

          {/* Layer dropdown */}
          {showLayerControl && (
            <div style={{
              position: "absolute",
              top: 48,
              right: 0,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              padding: 8,
              minWidth: 140,
            }}>
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => changeLayer(key as keyof typeof TILE_LAYERS)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: 8,
                    background: currentLayer === key ? `${theme.colors.primary}15` : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    color: currentLayer === key ? theme.colors.primary : "#374151",
                    fontWeight: currentLayer === key ? 600 : 400,
                    transition: "all 0.2s",
      }}
                >
                  <span style={{ fontSize: 18 }}>{layer.icon}</span>
                  {layer.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marker count badge */}
      {markers.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          zIndex: 1000,
          background: "white",
          borderRadius: 20,
          padding: "8px 16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: theme.colors.primary,
            animation: "pulse-dot 2s infinite",
          }}></span>
          {markers.length} location{markers.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Enhanced styles
if (typeof document !== 'undefined' && !document.getElementById('mapview-v2-styles')) {
  const style = document.createElement('style');
  style.id = 'mapview-v2-styles';
  style.textContent = `
    .custom-marker-v2 {
      background: transparent !important;
      border: none !important;
    }

    .marker-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .marker-pulse-ring {
      position: absolute;
      border-radius: 50%;
      opacity: 0.3;
      animation: marker-pulse 2s ease-out infinite;
    }

    .marker-core {
      position: relative;
      border-radius: 50%;
      border: 3px solid white;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .marker-wrapper:hover .marker-core {
      transform: scale(1.15);
    }

    @keyframes marker-pulse {
      0% { transform: scale(0.8); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 0.2; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .modern-popup .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      padding: 0;
      overflow: hidden;
    }

    .modern-popup .leaflet-popup-content {
      margin: 0;
    }

    .modern-popup .leaflet-popup-tip {
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .map-popup-content {
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 180px;
    }

    .popup-header {
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
      padding-bottom: 10px;
      margin-bottom: 12px;
      border-bottom: 2px solid;
    }

    .popup-value-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 10px;
    }

    .popup-value {
      font-size: 28px;
      font-weight: 800;
    }

    .popup-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .popup-info {
      font-size: 13px;
      color: #4b5563;
      margin-bottom: 6px;
    }

    .info-label {
      color: #9ca3af;
      margin-right: 4px;
    }

    .map-loader {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #0d9488;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12) !important;
      border-radius: 10px !important;
      overflow: hidden;
    }

    .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      color: #374151 !important;
      background: white !important;
      border: none !important;
      transition: all 0.2s !important;
    }

    .leaflet-control-zoom a:hover {
      background: #0d9488 !important;
      color: white !important;
    }

    .leaflet-control-zoom-in {
      border-radius: 10px 10px 0 0 !important;
    }

    .leaflet-control-zoom-out {
      border-radius: 0 0 10px 10px !important;
    }
  `;
  document.head.appendChild(style);
}

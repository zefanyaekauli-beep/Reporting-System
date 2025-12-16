// frontend/web/src/modules/shared/components/MapView.tsx

import { useEffect, useRef, useState } from "react";
// Import theme if available, otherwise use default colors
const defaultTheme = {
  colors: {
    primary: "#3b82f6",
    success: "#10b981",
    danger: "#ef4444",
    border: "#e5e7eb",
  },
};

let theme: any;
try {
  theme = require("./theme").theme;
} catch {
  theme = defaultTheme;
}

interface MapViewProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  markers?: Array<{
    id: string | number;
    position: [number, number];
    label?: string;
    color?: string;
  }>;
  tracks?: Array<{
    id: string | number;
    positions: Array<[number, number]>;
    color?: string;
  }>;
  height?: string;
  onMarkerClick?: (markerId: string | number) => void;
}

export function MapView({
  center = [-6.2088, 106.8456], // Default to Jakarta
  zoom = 13,
  markers = [],
  tracks = [],
  height = "400px",
  onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Load Leaflet CSS and JS
    const loadLeaflet = async () => {
      try {
        // Check if Leaflet is already loaded
        if ((window as any).L) {
          setMapLoaded(true);
          return;
        }

        // Load Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "";
        script.onload = () => {
          setMapLoaded(true);
        };
        script.onerror = () => {
          setMapError("Failed to load map library");
        };
        document.body.appendChild(script);
      } catch (err) {
        setMapError("Failed to initialize map");
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const markerIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: ${marker.color || theme.colors.primary};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const leafletMarker = L.marker(marker.position, { icon: markerIcon }).addTo(map);
      
      if (marker.label) {
        leafletMarker.bindPopup(marker.label);
      }

      if (onMarkerClick) {
        leafletMarker.on("click", () => onMarkerClick(marker.id));
      }
    });

    // Add tracks (polylines)
    tracks.forEach((track) => {
      if (track.positions.length > 1) {
        L.polyline(track.positions, {
          color: track.color || theme.colors.primary,
          weight: 3,
          opacity: 0.7,
        }).addTo(map);
      }
    });

    // Fit bounds if markers or tracks exist
    if (markers.length > 0 || tracks.length > 0) {
      const bounds = L.latLngBounds([]);
      markers.forEach((m) => bounds.extend(m.position));
      tracks.forEach((t) => t.positions.forEach((p) => bounds.extend(p)));
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    return () => {
      map.remove();
    };
  }, [mapLoaded, center, zoom, markers, tracks, onMarkerClick]);

  if (mapError) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bgSecondary,
          borderRadius: 8,
          color: theme.colors.textSoft,
        }}
      >
        {mapError}
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.bgSecondary,
          borderRadius: 8,
          color: theme.colors.textSoft,
        }}
      >
        Loading map...
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        height,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${theme.colors.border}`,
      }}
    />
  );
}


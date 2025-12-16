// frontend/web/src/modules/shared/components/CCTVViewer.tsx

import { useState, useEffect, useRef } from "react";
import { theme } from "./theme";

interface CCTVViewerProps {
  streamUrl: string;
  cameraName?: string;
  width?: string;
  height?: string;
  showControls?: boolean;
  autoPlay?: boolean;
}

export function CCTVViewer({
  streamUrl,
  cameraName,
  width = "100%",
  height = "300px",
  showControls = true,
  autoPlay = true,
}: CCTVViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setLoading(false);
      setError(null);
    };

    const handleError = () => {
      setLoading(false);
      setError("Failed to load video stream");
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
    };
  }, [streamUrl]);

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: "#000",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {cameraName && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 12,
            zIndex: 10,
          }}
        >
          {cameraName}
        </div>
      )}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontSize: 14,
            zIndex: 5,
          }}
        >
          Loading stream...
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: theme.colors.danger,
            fontSize: 14,
            textAlign: "center",
            padding: 16,
            zIndex: 5,
          }}
        >
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        src={streamUrl}
        controls={showControls}
        autoPlay={autoPlay}
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {showControls && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "flex",
            gap: 8,
            zIndex: 10,
          }}
        >
          <button
            onClick={handleFullscreen}
            style={{
              padding: "6px 12px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      )}
    </div>
  );
}


// frontend/web/src/modules/shared/components/ImageModal.tsx

import { useEffect } from "react";
import { theme } from "./theme";

interface ImageModalProps {
  imageUrl: string;
  alt?: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt = "Image", onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: -40,
            right: 0,
            background: "none",
            border: "none",
            color: "#FFFFFF",
            fontSize: 32,
            cursor: "pointer",
            padding: 8,
            lineHeight: 1,
          }}
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "90vh",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
}


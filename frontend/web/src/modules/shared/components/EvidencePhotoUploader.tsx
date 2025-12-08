// frontend/web/src/modules/shared/components/EvidencePhotoUploader.tsx

import { useRef, useState, ChangeEvent } from "react";

import { theme } from "./theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { ImageModal } from "./ImageModal";

export interface EvidencePhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface EvidencePhotoUploaderProps {
  label?: string;
  maxPhotos?: number;
  photos: EvidencePhoto[];
  onChange: (photos: EvidencePhoto[]) => void;
}

export function EvidencePhotoUploader({
  label = "Foto Bukti",
  maxPhotos = 5,
  photos,
  onChange,
}: EvidencePhotoUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, setTick] = useState(0); // force re-render if needed
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existingCount = photos.length;
    const remainingSlots = maxPhotos - existingCount;
    const selected = Array.from(files).slice(0, remainingSlots);

    const newItems: EvidencePhoto[] = selected.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...photos, ...newItems]);

    // small trick to ensure rerender
    setTick((x) => x + 1);

    // reset value so same file can be selected again later if needed
    e.target.value = "";
  };

  const handleRemove = (id: string) => {
    const remaining = photos.filter((p) => p.id !== id);
    onChange(remaining);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 6,
          color: theme.colors.textMain,
        }}
      >
        {label}{" "}
        <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
          ({photos.length}/{maxPhotos})
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              position: "relative",
              width: 80,
              height: 80,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: theme.shadowSoft,
              backgroundColor: "#000",
            }}
          >
            <img
              src={photo.previewUrl}
              alt="evidence"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                backgroundColor: "rgba(15,23,42,0.8)",
                color: "#FFF",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              border: `1px dashed ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: theme.colors.textMuted,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>＋</div>
            <div>Tambah Foto</div>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div
        style={{
          fontSize: 11,
          color: theme.colors.textSoft,
          marginTop: 4,
        }}
      >
        Foto akan diunggah saat Anda mengirim formulir. Maks {maxPhotos} foto.
      </div>
      {previewImage && (
        <ImageModal
          imageUrl={previewImage}
          alt="Photo preview"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}


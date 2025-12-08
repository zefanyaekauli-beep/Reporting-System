// frontend/web/src/modules/parking/pages/ParkingEntryPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import {
  EvidencePhoto,
  EvidencePhotoUploader,
} from "../../shared/components/EvidencePhotoUploader";

type VehicleType = "car" | "motorcycle" | "truck";

export function ParkingEntryPage() {
  const navigate = useNavigate();

  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setSubmitting(true);

    // TODO: call /api/parking/entry
    console.log("Parking entry:", {
      plate,
      vehicleType,
      photosCount: photos.length,
    });

    setTimeout(() => {
      setSubmitting(false);
      navigate("/parking/dashboard");
    }, 500);
  };

  return (
    <MobileLayout title="Parking Entry">
      <form onSubmit={handleSubmit}>
        {/* Plate */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            License Plate
          </label>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. B 1234 CD"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
              textTransform: "uppercase",
            }}
          />
        </div>

        {/* Vehicle type */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Vehicle Type
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "car", label: "Car" },
              { value: "motorcycle", label: "Motorcycle" },
              { value: "truck", label: "Truck" },
            ].map((opt) => {
              const active = vehicleType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVehicleType(opt.value as VehicleType)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 9999,
                    border: `1px solid ${
                      active ? theme.colors.primary : theme.colors.border
                    }`,
                    backgroundColor: active
                      ? theme.colors.primary
                      : "#FFFFFF",
                    color: active ? "#FFFFFF" : theme.colors.textMain,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Evidence photo */}
        <EvidencePhotoUploader
          label="Vehicle Photo"
          maxPhotos={2}
          photos={photos}
          onChange={setPhotos}
        />

        {/* Info */}
        <div
          style={{
            fontSize: 11,
            color: theme.colors.textSoft,
            marginBottom: 12,
          }}
        >
          Entry time will be recorded as current time on the server.
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9999,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: "#FFFFFF",
              color: theme.colors.textMain,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !plate.trim()}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9999,
              border: "none",
              backgroundColor: submitting
                ? "#9CA3AF"
                : theme.colors.success,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              opacity: submitting || !plate.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Saving..." : "Confirm Entry"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}


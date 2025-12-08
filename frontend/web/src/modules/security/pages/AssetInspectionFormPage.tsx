// frontend/web/src/modules/security/pages/AssetInspectionFormPage.tsx

import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import {
  EvidencePhoto,
  EvidencePhotoUploader,
} from "../../shared/components/EvidencePhotoUploader";
import api from "../../../api/client";

interface Asset {
  id: number;
  asset_code: string;
  name: string;
  location_id: number | null;
}

export function AssetInspectionFormPage() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [condition, setCondition] = useState("OK");
  const [pressureOk, setPressureOk] = useState<boolean | null>(null);
  const [sealIntact, setSealIntact] = useState<boolean | null>(null);
  const [labelVisible, setLabelVisible] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const { data } = await api.get("/security/assets");
      setAssets(data);
    } catch (err) {
      console.error("Failed to load assets:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    setSubmitting(true);
    try {
      await api.post("/security/assets/inspections", {
        asset_id: parseInt(selectedAssetId),
        inspection_date: new Date().toISOString(),
        condition: condition,
        pressure_ok: pressureOk,
        seal_intact: sealIntact,
        label_visible: labelVisible,
        notes: notes || null,
        photo_url: photos.length > 0 ? photos[0].previewUrl : null, // TODO: upload actual file
      });
      navigate("/security/dashboard");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to save inspection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Asset Inspection">
      <form onSubmit={handleSubmit}>
        {/* Asset Selection */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Asset *
          </label>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          >
            <option value="">Select asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_code} - {asset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Condition *
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["OK", "Not OK", "Needs Maintenance"].map((opt) => {
              const active = condition === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCondition(opt)}
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
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Checklist (optional)
          </div>
          <div
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadowSoft,
              padding: 8,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 4px",
              }}
            >
              <input
                type="checkbox"
                checked={pressureOk === true}
                onChange={(e) =>
                  setPressureOk(e.target.checked ? true : null)
                }
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 13 }}>Pressure OK</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 4px",
              }}
            >
              <input
                type="checkbox"
                checked={sealIntact === true}
                onChange={(e) =>
                  setSealIntact(e.target.checked ? true : null)
                }
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 13 }}>Seal Intact</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 4px",
              }}
            >
              <input
                type="checkbox"
                checked={labelVisible === true}
                onChange={(e) =>
                  setLabelVisible(e.target.checked ? true : null)
                }
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 13 }}>Label Visible</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
              resize: "vertical",
            }}
          />
        </div>

        {/* Photo */}
        <EvidencePhotoUploader
          label="Inspection Photo"
          maxPhotos={1}
          photos={photos}
          onChange={setPhotos}
        />

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
            disabled={submitting || !selectedAssetId}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 9999,
              border: "none",
              backgroundColor: submitting
                ? "#9CA3AF"
                : theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              opacity: submitting || !selectedAssetId ? 0.8 : 1,
            }}
          >
            {submitting ? "Saving..." : "Save Inspection"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}


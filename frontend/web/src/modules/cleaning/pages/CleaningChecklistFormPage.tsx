// frontend/web/src/modules/cleaning/pages/CleaningChecklistFormPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import {
  EvidencePhoto,
  EvidencePhotoUploader,
} from "../../shared/components/EvidencePhotoUploader";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: "floor", label: "Floor is clean", checked: false },
  { id: "trash", label: "Trash bin emptied", checked: false },
  { id: "sink", label: "Sink & surfaces cleaned", checked: false },
  { id: "odor", label: "No bad odor", checked: false },
];

export function CleaningChecklistFormPage() {
  const navigate = useNavigate();

  const [area, setArea] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!area.trim()) return;

    setSubmitting(true);

    // TODO: send to backend /api/cleaning/checklists
    console.log("Submitting cleaning checklist:", {
      area,
      items,
      notes,
      photosCount: photos.length,
    });

    setTimeout(() => {
      setSubmitting(false);
      navigate("/cleaning/dashboard");
    }, 500);
  };

  return (
    <MobileLayout title="Cleaning Checklist">
      <form onSubmit={handleSubmit}>
        {/* Area */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Area
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          >
            <option value="">Select area</option>
            {/* TODO: load from API */}
            <option value="toilet-mess">Mess Toilet</option>
            <option value="office">Office</option>
            <option value="warehouse">Warehouse</option>
          </select>
        </div>

        {/* Checklist items */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Checklist
          </div>
          <div
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              boxShadow: theme.shadowSoft,
              padding: 8,
            }}
          >
            {items.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                  style={{ marginRight: 8 }}
                />
                <span style={{ fontSize: 13 }}>{item.label}</span>
              </label>
            ))}
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
            placeholder="Additional notes or findings..."
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

        {/* Photos */}
        <EvidencePhotoUploader
          label="Evidence Photos"
          maxPhotos={5}
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
            disabled={submitting || !area.trim()}
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
              opacity: submitting || !area.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}


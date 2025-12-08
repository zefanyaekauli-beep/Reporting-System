// frontend/web/src/modules/parking/pages/ParkingExitPage.tsx

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";

export function ParkingExitPage() {
  const navigate = useNavigate();

  const [plate, setPlate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState(""); // e.g. "1h 20m" optional
  const [fee, setFee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) return;

    setSubmitting(true);

    // TODO: call /api/parking/exit (server computes actual duration & fee)
    console.log("Parking exit:", {
      plate,
      estimatedDuration,
      fee,
    });

    setTimeout(() => {
      setSubmitting(false);
      navigate("/parking/dashboard");
    }, 500);
  };

  return (
    <MobileLayout title="Parking Exit">
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

        {/* Optional manual duration / fee (can be auto from backend later) */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Duration (optional, display only)
          </label>
          <input
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="Server will calculate actual duration"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Fee (optional)
          </label>
          <input
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="Server can calculate fee based on rules"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        <div
          style={{
            fontSize: 11,
            color: theme.colors.textSoft,
            marginBottom: 12,
          }}
        >
          In production, the server should compute duration & fee using entry
          time and tariff rules. This form just confirms which active session to
          close.
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
                : theme.colors.danger,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              opacity: submitting || !plate.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Saving..." : "Confirm Exit"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}


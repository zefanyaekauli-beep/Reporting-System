// frontend/web/src/modules/security/pages/LeaveRequestFormPage.tsx

import { FormEvent, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

export function LeaveRequestFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [siteId, setSiteId] = useState("");
  const [requestType, setRequestType] = useState("permission");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from URL params (from shift calendar)
  useEffect(() => {
    const shiftDate = searchParams.get("shift_date");
    const shiftId = searchParams.get("shift_id");
    if (shiftDate) {
      setStartDate(shiftDate);
      setEndDate(shiftDate); // Default to same day for single shift
      if (shiftId) {
        setReason(`Permohonan izin untuk shift ID: ${shiftId}`);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;

    setSubmitting(true);
    try {
      await api.post("/security/leave-requests", {
        site_id: parseInt(siteId) || null,
        request_type: requestType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });
      navigate("/security/leave-requests");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Leave Request">
      <form onSubmit={handleSubmit}>
        {/* Site */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Site
          </label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          >
            <option value="">Select site</option>
            <option value="1">Site A</option>
            <option value="2">Site B</option>
          </select>
        </div>

        {/* Request Type */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Request Type *
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { value: "permission", label: "Permission" },
              { value: "leave", label: "Leave" },
              { value: "sick", label: "Sick" },
              { value: "other", label: "Other" },
            ].map((opt) => {
              const active = requestType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRequestType(opt.value)}
                  style={{
                    flex: 1,
                    minWidth: "80px",
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

        {/* Start Date */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        {/* End Date */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            End Date *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              fontSize: 13,
            }}
          />
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain your request..."
            rows={4}
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
            disabled={submitting || !startDate || !endDate || !reason.trim()}
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
              opacity:
                submitting || !startDate || !endDate || !reason.trim() ? 0.8 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </MobileLayout>
  );
}


// frontend/web/src/modules/security/pages/VisitorLogListPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

interface Visitor {
  id: number;
  visitor_name: string;
  nik: string | null;
  vehicle_plate: string | null;
  purpose: string;
  time_in: string;
  time_out: string | null;
}

export function VisitorLogListPage() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await api.get("/security/visitors", {
        params: { visit_date: today },
      });
      setVisitors(data);
    } catch (err) {
      console.error("Failed to load visitors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOut = async (visitorId: number) => {
    try {
      await api.patch(`/security/visitors/${visitorId}`, {
        time_out: new Date().toISOString(),
      });
      loadVisitors();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to mark visitor out");
    }
  };

  return (
    <MobileLayout title="Visitor Log">
      {/* New Visitor Button */}
      <button
        onClick={() => navigate("/security/visitors/new")}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 9999,
          border: "none",
          backgroundColor: theme.colors.primary,
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        + New Visitor Entry
      </button>

      {/* Visitors List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
      ) : visitors.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: theme.colors.textMuted,
          }}
        >
          No visitors today
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visitors.map((visitor) => (
            <div
              key={visitor.id}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 12,
                boxShadow: theme.shadowSoft,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {visitor.visitor_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                {visitor.purpose}
                {visitor.vehicle_plate && ` • ${visitor.vehicle_plate}`}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: theme.colors.textSoft,
                  marginBottom: 8,
                }}
              >
                In: {new Date(visitor.time_in).toLocaleString()}
                {visitor.time_out && (
                  <> • Out: {new Date(visitor.time_out).toLocaleString()}</>
                )}
              </div>
              {!visitor.time_out && (
                <button
                  onClick={() => handleMarkOut(visitor.id)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: theme.colors.danger,
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  Mark as Out
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}


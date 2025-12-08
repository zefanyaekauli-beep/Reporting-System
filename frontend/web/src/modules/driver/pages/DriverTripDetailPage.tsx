// frontend/web/src/modules/driver/pages/DriverTripDetailPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import {
  getTrip,
  startTrip,
  endTrip,
  getPreTripChecklist,
  getPostTripChecklist,
  completeChecklistItem,
  DriverTripWithDetails,
  TripChecklist,
  ChecklistItem,
} from "../../../api/driverApi";
import { theme } from "../../shared/components/theme";

export function DriverTripDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const { showToast } = useToast();
  const [trip, setTrip] = useState<DriverTripWithDetails | null>(null);
  const [preTripChecklist, setPreTripChecklist] = useState<TripChecklist | null>(null);
  const [postTripChecklist, setPostTripChecklist] = useState<TripChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [completingItem, setCompletingItem] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "pre-trip" | "post-trip">("info");

  useEffect(() => {
    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  async function loadTrip() {
    if (!tripId) return;
    try {
      setLoading(true);
      const { data } = await getTrip(parseInt(tripId));
      setTrip(data);
      
      // Load checklists if needed
      if (data.status === "PLANNED" || data.status === "IN_PROGRESS") {
        try {
          const preTrip = await getPreTripChecklist(parseInt(tripId));
          setPreTripChecklist(preTrip.data);
        } catch (err) {
          // Checklist might not exist yet
        }
      }
      
      if (data.status === "IN_PROGRESS" || data.status === "COMPLETED") {
        try {
          const postTrip = await getPostTripChecklist(parseInt(tripId));
          setPostTripChecklist(postTrip.data);
        } catch (err) {
          // Checklist might not exist yet
        }
      }
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal memuat trip", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrip() {
    if (!tripId || !trip) return;
    
    if (!trip.pre_trip_completed) {
      showToast("Pre-trip checklist harus diselesaikan terlebih dahulu", "error");
      setActiveTab("pre-trip");
      return;
    }

    try {
      setActionLoading(true);
      await startTrip(parseInt(tripId));
      showToast("Trip dimulai", "success");
      await loadTrip();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal memulai trip", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndTrip() {
    if (!tripId || !trip) return;
    
    if (!trip.post_trip_completed) {
      showToast("Post-trip checklist harus diselesaikan terlebih dahulu", "error");
      setActiveTab("post-trip");
      return;
    }

    try {
      setActionLoading(true);
      await endTrip(parseInt(tripId));
      showToast("Trip selesai", "success");
      await loadTrip();
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal mengakhiri trip", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteChecklistItem(
    checklistId: number,
    item: ChecklistItem,
    status: string
  ) {
    try {
      setCompletingItem(item.id);
      await completeChecklistItem(checklistId, item.id, { status });
      showToast("Tugas diperbarui", "success");
      
      // Reload appropriate checklist
      if (tripId) {
        if (activeTab === "pre-trip") {
          const preTrip = await getPreTripChecklist(parseInt(tripId));
          setPreTripChecklist(preTrip.data);
        } else if (activeTab === "post-trip") {
          const postTrip = await getPostTripChecklist(parseInt(tripId));
          setPostTripChecklist(postTrip.data);
        }
        await loadTrip();
      }
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Gagal memperbarui tugas", "error");
    } finally {
      setCompletingItem(null);
    }
  }

  if (loading || !trip) {
    return (
      <MobileLayout title="Detail Trip">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            {t("common.loading")}
          </div>
        </div>
      </MobileLayout>
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PLANNED":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "info";
    }
  }

  return (
    <MobileLayout title="Detail Trip">
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Trip Info Card */}
        <Card style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: theme.colors.text }}>
                {trip.vehicle?.plate_number || `Trip #${trip.id}`}
              </h3>
              <div
                style={{
                  fontSize: "14px",
                  color: theme.colors.textSecondary,
                  marginTop: "4px",
                }}
              >
                {trip.vehicle?.make} {trip.vehicle?.model}
              </div>
            </div>
            <StatusBadge status={getStatusColor(trip.status)}>
              {trip.status}
            </StatusBadge>
          </div>

          <div
            style={{
              paddingTop: "12px",
              borderTop: `1px solid ${theme.colors.border}`,
              fontSize: "14px",
              color: theme.colors.textSecondary,
            }}
          >
            <div>
              <strong>Tanggal:</strong> {new Date(trip.trip_date).toLocaleDateString("id-ID")}
            </div>
            {trip.planned_start_time && (
              <div>
                <strong>Waktu:</strong> {trip.planned_start_time} - {trip.planned_end_time}
              </div>
            )}
            {trip.stops.length > 0 && (
              <div>
                <strong>Stops:</strong> {trip.stops.length}
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        {trip.status === "PLANNED" && (
          <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
            <button
              onClick={handleStartTrip}
              disabled={actionLoading || !trip.pre_trip_completed}
              style={{
                flex: 1,
                padding: "12px",
                background: trip.pre_trip_completed ? theme.colors.primary : theme.colors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: trip.pre_trip_completed && !actionLoading ? "pointer" : "not-allowed",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "Memproses..." : "Mulai Trip"}
            </button>
          </div>
        )}

        {trip.status === "IN_PROGRESS" && (
          <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
            <button
              onClick={handleEndTrip}
              disabled={actionLoading || !trip.post_trip_completed}
              style={{
                flex: 1,
                padding: "12px",
                background: trip.post_trip_completed ? "#dc2626" : theme.colors.textSecondary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: trip.post_trip_completed && !actionLoading ? "pointer" : "not-allowed",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "Memproses..." : "Akhiri Trip"}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => setActiveTab("info")}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === "info" ? theme.colors.primary : theme.colors.backgroundSecondary,
              color: activeTab === "info" ? "white" : theme.colors.text,
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Info
          </button>
          {(trip.status === "PLANNED" || trip.status === "IN_PROGRESS") && (
            <button
              onClick={() => setActiveTab("pre-trip")}
              style={{
                flex: 1,
                padding: "10px",
                background: activeTab === "pre-trip" ? theme.colors.primary : theme.colors.backgroundSecondary,
                color: activeTab === "pre-trip" ? "white" : theme.colors.text,
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Pre-Trip {trip.pre_trip_completed ? "✓" : ""}
            </button>
          )}
          {(trip.status === "IN_PROGRESS" || trip.status === "COMPLETED") && (
            <button
              onClick={() => setActiveTab("post-trip")}
              style={{
                flex: 1,
                padding: "10px",
                background: activeTab === "post-trip" ? theme.colors.primary : theme.colors.backgroundSecondary,
                color: activeTab === "post-trip" ? "white" : theme.colors.text,
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Post-Trip {trip.post_trip_completed ? "✓" : ""}
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <Card>
            <h4 style={{ margin: "0 0 12px", color: theme.colors.text }}>
              Stops
            </h4>
            {trip.stops.length === 0 ? (
              <div style={{ color: theme.colors.textSecondary }}>
                Tidak ada stops
              </div>
            ) : (
              trip.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  style={{
                    padding: "12px",
                    background: theme.colors.backgroundSecondary,
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>
                    {stop.sequence}. {stop.name}
                  </div>
                  {stop.address && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: theme.colors.textSecondary,
                        marginTop: "4px",
                      }}
                    >
                      {stop.address}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === "pre-trip" && preTripChecklist && (
          <div>
            {preTripChecklist.items.map((item) => (
              <Card key={item.id} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: theme.colors.text }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: theme.colors.textSecondary,
                          marginTop: "4px",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.status === "COMPLETED" && (
                    <div
                      style={{
                        padding: "4px 8px",
                        background: theme.colors.success,
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>

                {item.status !== "COMPLETED" && (
                  <button
                    onClick={() =>
                      handleCompleteChecklistItem(preTripChecklist.id, item, "COMPLETED")
                    }
                    disabled={completingItem === item.id}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: theme.colors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: completingItem === item.id ? "not-allowed" : "pointer",
                      opacity: completingItem === item.id ? 0.6 : 1,
                    }}
                  >
                    {completingItem === item.id ? "Menyimpan..." : "Selesai"}
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}

        {activeTab === "post-trip" && postTripChecklist && (
          <div>
            {postTripChecklist.items.map((item) => (
              <Card key={item.id} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: theme.colors.text }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: theme.colors.textSecondary,
                          marginTop: "4px",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.status === "COMPLETED" && (
                    <div
                      style={{
                        padding: "4px 8px",
                        background: theme.colors.success,
                        color: "white",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>

                {item.status !== "COMPLETED" && (
                  <button
                    onClick={() =>
                      handleCompleteChecklistItem(postTripChecklist.id, item, "COMPLETED")
                    }
                    disabled={completingItem === item.id}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: theme.colors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: completingItem === item.id ? "not-allowed" : "pointer",
                      opacity: completingItem === item.id ? 0.6 : 1,
                    }}
                  >
                    {completingItem === item.id ? "Menyimpan..." : "Selesai"}
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}


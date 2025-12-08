// frontend/web/src/modules/security/pages/SecurityShiftCalendarPage.tsx

import { useEffect, useMemo, useState } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { Card } from "../../shared/components/Card";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { theme } from "../../shared/components/theme";
import api from "../../../api/client";

type ShiftStatus = "ASSIGNED" | "OPEN" | "EXCHANGE_REQUESTED" | "TAKEN";

interface Shift {
  id: number;
  start: string;
  end: string;
  siteId: number;
  siteName: string;
  roleType: "SECURITY" | "CLEANING" | "DRIVER";
  status: ShiftStatus;
  isMine: boolean;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildMonthMatrix(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const matrix: Date[][] = [];
  let currentDay = 1 - firstWeekday;

  for (let week = 0; week < 6; week++) {
    const row: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(year, month, currentDay);
      row.push(date);
      currentDay++;
    }
    matrix.push(row);
  }
  return matrix;
}

function ShiftPill({
  shift,
  onClick,
}: {
  shift: Shift;
  onClick: () => void;
}) {
  const start = new Date(shift.start);
  const end = new Date(shift.end);
  const timeLabel = `${start.toTimeString().slice(0, 5)}–${end.toTimeString().slice(0, 5)}`;

  let bgColor = theme.colors.primary; // Blue for assigned
  if (shift.status === "OPEN") bgColor = theme.colors.warning; // Yellow
  if (shift.status === "EXCHANGE_REQUESTED") bgColor = theme.colors.danger; // Red

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: "4px",
        padding: "4px 6px",
        fontSize: "10px",
        color: "white",
        backgroundColor: bgColor,
        border: "none",
        cursor: "pointer",
        marginBottom: "2px",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {shift.siteName} ({shift.roleType})
      </div>
      <div style={{ fontSize: "9px", opacity: 0.9 }}>{timeLabel}</div>
      {!shift.isMine && (
        <div style={{ fontSize: "8px", fontStyle: "italic" }}>
          {shift.status === "OPEN" ? "Shift Terbuka" : "Lainnya"}
        </div>
      )}
    </button>
  );
}

function ShiftDetailModal({
  shift,
  onClose,
  onAction,
  actionLoading,
}: {
  shift: Shift;
  onClose: () => void;
  onAction: (shiftId: number, action: string) => Promise<void>;
  actionLoading: boolean;
}) {
  const { t } = useTranslation();
  const start = new Date(shift.start);
  const end = new Date(shift.end);
  const dateLabel = start.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = `${start.toTimeString().slice(0, 5)} – ${end.toTimeString().slice(0, 5)}`;

  const canOfferOpen = shift.isMine && shift.status === "ASSIGNED";
  const canRequestExchange = shift.isMine && shift.status === "ASSIGNED";
  const canTakeOpen = !shift.isMine && shift.status === "OPEN";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <Card
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "16px",
          marginTop: "20px",
          marginBottom: "20px",
          position: "sticky",
          top: "20px",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            Detail Shift
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: theme.colors.textSecondary,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: "14px", marginBottom: "16px", lineHeight: "1.6" }}>
          <div>
            <span style={{ fontWeight: 600 }}>Situs:</span> {shift.siteName}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Role:</span> {shift.roleType}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Tanggal:</span> {dateLabel}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Waktu:</span> {timeLabel}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Status:</span> {shift.status}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Ditugaskan ke Anda:</span>{" "}
            {shift.isMine ? "Ya" : "Tidak"}
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${theme.colors.border}`,
            paddingTop: "12px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
            Aksi
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {canRequestExchange && (
              <button
                disabled={actionLoading}
                onClick={() => onAction(shift.id, "request-exchange")}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#FF6B35",
                  color: "white",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  width: "100%",
                }}
              >
                🔄 Minta Tukar Shift
              </button>
            )}
            {canRequestExchange && (
              <button
                disabled={actionLoading}
                onClick={() => {
                  // Navigate to leave request form with pre-filled shift date
                  const shiftDate = new Date(shift.start).toISOString().split("T")[0];
                  navigate(`/security/leave-requests/new?shift_date=${shiftDate}&shift_id=${shift.id}`);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: theme.colors.primary,
                  color: "white",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  width: "100%",
                }}
              >
                📝 Permohonan Izin
              </button>
            )}
            {canOfferOpen && (
              <button
                disabled={actionLoading}
                onClick={() => onAction(shift.id, "offer-open")}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: theme.colors.warning,
                  color: "white",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  width: "100%",
                }}
              >
                🔓 Tawarkan sebagai Shift Terbuka
              </button>
            )}
            {canTakeOpen && (
              <button
                disabled={actionLoading}
                onClick={() => onAction(shift.id, "take-open")}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  backgroundColor: theme.colors.success,
                  color: "white",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  width: "100%",
                }}
              >
                ✅ Ambil Shift Terbuka Ini
              </button>
            )}
            {!canOfferOpen && !canRequestExchange && !canTakeOpen && (
              <span style={{ fontSize: "11px", color: theme.colors.textSecondary }}>
                Tidak ada aksi tersedia untuk shift ini.
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
      <span
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export function SecurityShiftCalendarPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const monthMatrix = useMemo(() => buildMonthMatrix(year, month), [year, month]);

  const [rangeStart, rangeEnd] = useMemo(() => {
    const first = monthMatrix[0][0];
    const last = monthMatrix[monthMatrix.length - 1][6];
    return [toISODate(first), toISODate(last)];
  }, [monthMatrix]);

  useEffect(() => {
    loadShifts();
  }, [rangeStart, rangeEnd]);

  async function loadShifts() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/security/shifts/calendar?start=${rangeStart}&end=${rangeEnd}`);
      setShifts(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat shift");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  function nextMonth() {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  const shiftsByDay = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of shifts) {
      const dateStr = toISODate(new Date(s.start));
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(s);
    }
    return map;
  }, [shifts]);

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));

  async function callShiftAction(shiftId: number, action: string) {
    try {
      setActionLoading(true);
      await api.post(`/security/shifts/${shiftId}/${action}`);
      showToast("Aksi berhasil", "success");
      await loadShifts();
      setSelectedShift((prev) => (prev ? shifts.find((s) => s.id === prev!.id) || null : null));
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || "Aksi gagal", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <MobileLayout title={t("security.shifts") || "Kalender Shift"}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Header with navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
              Kalender Shift
            </h1>
            <p style={{ fontSize: "12px", color: theme.colors.textSecondary, margin: "4px 0 0 0" }}>
              Lihat shift yang ditugaskan, terbuka, dan permintaan tukar dalam kalender.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={prevMonth}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <div style={{ fontWeight: 600, fontSize: "14px", minWidth: "150px", textAlign: "center" }}>
              {monthLabel}
            </div>
            <button
              onClick={nextMonth}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <Legend color={theme.colors.primary} label="Shift Saya" />
          <Legend color={theme.colors.warning} label="Shift Terbuka" />
          <Legend color={theme.colors.danger} label="Permintaan Tukar" />
        </div>

        {/* Calendar */}
        <Card style={{ overflow: "hidden", padding: 0 }}>
          <table
            style={{
              width: "100%",
              tableLayout: "fixed",
              fontSize: "12px",
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ backgroundColor: theme.colors.backgroundSecondary }}>
              <tr>
                {weekDays.map((d) => (
                  <th
                    key={d}
                    style={{
                      padding: "8px 4px",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: "11px",
                    }}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthMatrix.map((week, wi) => (
                <tr key={wi} style={{ verticalAlign: "top" }}>
                  {week.map((date, di) => {
                    const dateStr = toISODate(date);
                    const dayShifts = shiftsByDay[dateStr] || [];
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <td
                        key={di}
                        style={{
                          height: "100px",
                          borderBottom: `1px solid ${theme.colors.border}`,
                          borderRight: di < 6 ? `1px solid ${theme.colors.border}` : "none",
                          padding: "4px",
                          verticalAlign: "top",
                          backgroundColor: !isCurrentMonth ? theme.colors.backgroundSecondary : "transparent",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: isToday ? 700 : 400,
                              color: isToday ? theme.colors.primary : theme.colors.text,
                            }}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {dayShifts.map((shift) => (
                            <ShiftPill
                              key={shift.id}
                              shift={shift}
                              onClick={() => setSelectedShift(shift)}
                            />
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                fontSize: "12px",
                color: theme.colors.textSecondary,
              }}
            >
              Memuat shift...
            </div>
          )}
          {error && (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                fontSize: "12px",
                color: theme.colors.danger,
              }}
            >
              {error}
            </div>
          )}
        </Card>

        {selectedShift && (
          <ShiftDetailModal
            shift={selectedShift}
            onClose={() => setSelectedShift(null)}
            onAction={callShiftAction}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </MobileLayout>
  );
}


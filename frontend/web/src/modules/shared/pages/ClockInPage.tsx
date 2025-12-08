// frontend/web/src/modules/shared/pages/ClockInPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../components/MobileLayout";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import api from "../../../api/client";
import { getAttendanceStatus } from "../../../api/attendanceApi";

type RoleType = "SECURITY" | "CLEANING" | "DRIVER" | "PARKING";

interface ClockInPageProps {
  roleType?: RoleType;
  siteName?: string;
}

// Simple shift config: adjust start times to your rules
const SHIFT_CONFIG = [
  { id: "0", label: "Shift 0 (00:00–08:00)", start: "00:00" },
  { id: "1", label: "Shift 1 (08:00–16:00)", start: "08:00" },
  { id: "2", label: "Shift 2 (16:00–00:00)", start: "16:00" },
  { id: "3", label: "Shift 3 (00:00–08:00)", start: "00:00" },
];

const LATE_GRACE_MINUTES = 10; // how many minutes after start before it's "late"

function getShiftStartToday(shiftId: string): Date | null {
  const cfg = SHIFT_CONFIG.find((s) => s.id === shiftId);
  if (!cfg) return null;

  const [hh, mm] = cfg.start.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

export function ClockInPage({ roleType = "SECURITY", siteName = "Site" }: ClockInPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState<"loading" | "not_clocked_in" | "on_shift">("loading");
  const [lastRecord, setLastRecord] = useState<any>(null);
  const [shiftId, setShiftId] = useState("");
  const [gps, setGps] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    state: "idle" | "getting" | "ready" | "error";
    error: string;
  }>({
    latitude: null,
    longitude: null,
    accuracy: null,
    state: "idle",
    error: "",
  });
  const [isLate, setIsLate] = useState(false);
  const [lateMinutes, setLateMinutes] = useState(0);
  const [lateReason, setLateReason] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Timer
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load current status once
  useEffect(() => {
    loadStatus();
    refreshGps();
  }, [roleType]);

  // Recompute late when shift or time changes
  useEffect(() => {
    if (!shiftId) {
      setIsLate(false);
      setLateMinutes(0);
      return;
    }

    const start = getShiftStartToday(shiftId);
    if (!start) {
      setIsLate(false);
      setLateMinutes(0);
      return;
    }

    const minutesLate = diffMinutes(now, start);
    if (minutesLate > LATE_GRACE_MINUTES) {
      setIsLate(true);
      setLateMinutes(minutesLate);
    } else {
      setIsLate(false);
      setLateMinutes(0);
    }
  }, [shiftId, now]);

  const loadStatus = async () => {
    try {
      const data = await getAttendanceStatus(roleType);
      setStatus(data.status === "on_shift" ? "on_shift" : "not_clocked_in");
      setLastRecord(data.current_attendance || null);
    } catch (err) {
      console.error(err);
      setStatus("not_clocked_in");
    }
  };

  const refreshGps = () => {
    if (!navigator.geolocation) {
      setGps({
        latitude: null,
        longitude: null,
        accuracy: null,
        state: "error",
        error: "Browser/device tidak mendukung GPS",
      });
      return;
    }

    setGps((g) => ({ ...g, state: "getting", error: "" }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          state: "ready",
          error: "",
        });
      },
      (err) => {
        setGps({
          latitude: null,
          longitude: null,
          accuracy: null,
          state: "error",
          error: err.message || "Gagal mengambil koordinat",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setEvidenceFile(file);
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (status === "on_shift") {
      setErrorMsg("Anda sudah dalam status ON SHIFT. Gunakan halaman pulang / checkout.");
      return;
    }

    if (!shiftId) {
      setErrorMsg("Pilih shift terlebih dahulu.");
      return;
    }

    if (gps.state !== "ready") {
      setErrorMsg("Koordinat belum siap. Tekan Refresh GPS terlebih dahulu.");
      return;
    }

    if (isLate && !lateReason.trim()) {
      setErrorMsg("Karyawan terlambat. Alasan wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("shift_id", shiftId);
      formData.append("latitude", String(gps.latitude));
      formData.append("longitude", String(gps.longitude));
      formData.append("accuracy", String(gps.accuracy));
      formData.append("is_late", isLate ? "true" : "false");
      formData.append("late_reason", lateReason || "");
      formData.append("client_time", now.toISOString());
      formData.append("role_type", roleType);

      if (evidenceFile) {
        formData.append("evidence", evidenceFile);
      }

      const res = await api.post("/attendance/clock-in", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;

      setSuccessMsg(
        `Clock-in berhasil pada ${new Date(data.clock_in_time).toLocaleTimeString()} di lokasi ${data.site_name || "-"}`
      );

      setStatus("on_shift");
      setLastRecord(data);
      setEvidenceFile(null);
      setLateReason("");

      // Reload status after success
      setTimeout(() => {
        loadStatus();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.detail || err?.message || "Clock-in gagal";
      setErrorMsg(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gpsText =
    gps.state === "ready"
      ? `${gps.latitude?.toFixed(6)}, ${gps.longitude?.toFixed(6)} (±${Math.round(gps.accuracy || 0)} m)`
      : gps.state === "getting"
      ? "Mengambil koordinat…"
      : gps.state === "error"
      ? `GPS error: ${gps.error}`
      : "Belum diambil";

  return (
    <MobileLayout title="Clock In" showBottomNav={false}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {/* Status card */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            border: `1px solid ${theme.colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: theme.shadowCard,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
              Status
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: theme.radius.pill,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: status === "on_shift" ? theme.colors.success + "20" : theme.colors.border + "40",
                color: status === "on_shift" ? theme.colors.success : theme.colors.textMain,
                marginTop: 4,
              }}
            >
              {status === "on_shift" ? "On Shift" : "Belum Clock In"}
            </div>
            {lastRecord && (
              <div style={{ marginTop: 8, fontSize: 11, color: theme.colors.textMuted }}>
                Terakhir masuk: {new Date(lastRecord.checkin_time || lastRecord.clock_in_time).toLocaleString()}
                {lastRecord.checkout_time || lastRecord.clock_out_time && (
                  <>
                    <br />
                    Terakhir pulang: {new Date(lastRecord.checkout_time || lastRecord.clock_out_time).toLocaleString()}
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={loadStatus}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMain,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Current time display */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            border: `1px solid ${theme.colors.border}`,
            textAlign: "right",
            boxShadow: theme.shadowCard,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
            {now.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
            {now.toLocaleDateString()}
          </div>
        </div>

        {/* Shift + late status */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadowCard,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Shift
              </label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: theme.colors.textMain,
                }}
              >
                <option value="">Pilih shift…</option>
                {SHIFT_CONFIG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: "140px", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Status Waktu</div>
              {shiftId ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 8px",
                    borderRadius: theme.radius.pill,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: isLate ? theme.colors.warning + "20" : theme.colors.success + "20",
                    color: isLate ? theme.colors.warning : theme.colors.success,
                  }}
                >
                  {isLate ? `Terlambat ${lateMinutes} mnt` : "Tepat waktu / dalam toleransi"}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: theme.colors.textSoft }}>Pilih shift dulu</div>
              )}
            </div>
          </div>
        </div>

        {/* GPS card */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            border: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: theme.shadowCard,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
              Koordinat Saat Ini
            </div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: theme.colors.textMain }}>
              {gpsText}
            </div>
          </div>
          <button
            onClick={refreshGps}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: theme.radius.pill,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textMain,
              cursor: "pointer",
            }}
          >
            Refresh GPS
          </button>
        </div>

        {/* Late reason & evidence */}
        {isLate && (
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 12,
              marginBottom: 12,
              border: `1px solid ${theme.colors.warning}`,
              boxShadow: theme.shadowCard,
            }}
          >
            <div style={{ fontSize: 11, color: theme.colors.warning, fontWeight: 600, marginBottom: 8 }}>
              Clock-in terlambat. Alasan wajib diisi.
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>
                Alasan keterlambatan
              </label>
              <textarea
                rows={3}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: theme.colors.textMain,
                  resize: "vertical",
                }}
                placeholder="Contoh: macet karena kecelakaan di jalan utama, laporan ke supervisor jam 07:45..."
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                Evidence (opsional, foto / file)
                {evidenceFile && (
                  <span style={{ marginLeft: 4, color: theme.colors.success }}>• {evidenceFile.name}</span>
                )}
              </div>
              <label
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMain,
                  cursor: "pointer",
                }}
              >
                Pilih File
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleEvidenceChange}
                />
              </label>
            </div>
          </div>
        )}

        {/* Messages */}
        {successMsg && (
          <div
            style={{
              backgroundColor: theme.colors.success + "20",
              border: `1px solid ${theme.colors.success}`,
              color: theme.colors.success,
              fontSize: 12,
              borderRadius: theme.radius.card,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              backgroundColor: theme.colors.danger + "20",
              border: `1px solid ${theme.colors.danger}`,
              color: theme.colors.danger,
              fontSize: 12,
              borderRadius: theme.radius.card,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: theme.radius.card,
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: isSubmitting ? theme.colors.textSoft : theme.colors.primary,
            color: "#fff",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
            boxShadow: theme.shadowSoft,
          }}
        >
          {isSubmitting ? "Memproses..." : "Clock In Sekarang"}
        </button>
      </div>
    </MobileLayout>
  );
}


// frontend/web/src/modules/security/pages/SecurityAttendancePage.tsx

import { useState, useEffect } from "react";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useToast } from "../../shared/components/Toast";
import { useSite } from "../../shared/contexts/SiteContext";
import { AttendanceCheckInForm } from "../../shared/components/AttendanceCheckInForm";
import { AttendanceCheckOutForm } from "../../shared/components/AttendanceCheckOutForm";
import { getCurrentAttendance } from "../../../api/attendanceApi";

export function SecurityAttendancePage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { selectedSite } = useSite();
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getCurrentAttendance();
      if (result.attendance) {
        setAttendanceId(result.attendance.id);
      } else {
        setAttendanceId(null);
      }
    } catch (err: any) {
      console.error("Failed to load attendance:", err);
      setAttendanceId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedSite]);

  const handleCheckInSuccess = (id: number) => {
    setAttendanceId(id);
    showToast("Check-in berhasil", "success");
  };

  const handleCheckOutSuccess = () => {
    setAttendanceId(null);
    showToast("Check-out berhasil", "success");
  };

  if (loading) {
    return (
      <MobileLayout title={t("security.attendance") || "Absensi"}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ color: theme.colors.textSecondary }}>
            {t("common.loading")}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title={t("security.attendance") || "Absensi"}>
      <div style={{ padding: "16px", paddingBottom: "80px" }}>
        {!attendanceId ? (
          <AttendanceCheckInForm
            roleType="SECURITY"
            onSuccess={handleCheckInSuccess}
          />
        ) : (
          <AttendanceCheckOutForm
            attendanceId={attendanceId}
            onSuccess={handleCheckOutSuccess}
          />
        )}
      </div>
    </MobileLayout>
  );
}

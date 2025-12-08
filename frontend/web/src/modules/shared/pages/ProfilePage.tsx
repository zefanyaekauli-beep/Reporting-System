// frontend/web/src/modules/shared/pages/ProfilePage.tsx

import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../components/MobileLayout";
import { Card } from "../components/Card";
import { theme } from "../components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuthStore } from "../../../stores/authStore";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, clear } = useAuthStore();

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      clear();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  return (
    <MobileLayout title="Profil" showBottomNav={true}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* User Info Card */}
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 12,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: theme.colors.textMain,
                    marginBottom: 4,
                  }}
                >
                  {user?.username || "User"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.colors.textMuted,
                    textTransform: "capitalize",
                  }}
                >
                  {user?.division || "N/A"} • {user?.role || "User"}
                </div>
              </div>
            </div>

            {/* User Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  ID Pengguna
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  #{user?.id || "N/A"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  Divisi
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {user?.division || "N/A"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  Peran
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: theme.radius.card,
            border: `1px solid ${theme.colors.borderStrong}`,
            backgroundColor: theme.colors.surface,
            color: theme.colors.danger,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.danger;
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.color = theme.colors.danger;
          }}
        >
          <span>🚪</span>
          <span>{t("auth.logout")}</span>
        </button>
      </div>
    </MobileLayout>
  );
}


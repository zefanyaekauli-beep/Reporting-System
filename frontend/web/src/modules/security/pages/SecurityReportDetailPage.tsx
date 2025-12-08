// frontend/web/src/modules/security/pages/SecurityReportDetailPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MobileLayout } from "../../shared/components/MobileLayout";
import { theme } from "../../shared/components/theme";
import { useTranslation } from "../../../i18n/useTranslation";
import { Card } from "../../shared/components/Card";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { SkeletonCard } from "../../shared/components/Skeleton";
import { ImageModal } from "../../shared/components/ImageModal";
import { getSecurityReport, exportSecurityReportPDF } from "../../../api/securityApi";
import { formatDateTime, formatDate } from "../../../utils/formatDate";
import { useToast } from "../../shared/components/Toast";

export function SecurityReportDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getSecurityReport(Number(id));
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load report:", err);
      setError(err?.response?.data?.detail || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const blob = await exportSecurityReportPDF(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("PDF berhasil diunduh", "success");
    } catch (err: any) {
      console.error("Failed to export PDF:", err);
      showToast(err?.response?.data?.detail || "Gagal mengekspor PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title={t("security.reportDetail")}>
        <SkeletonCard />
        <SkeletonCard />
      </MobileLayout>
    );
  }

  if (error || !report) {
    return (
      <MobileLayout title={t("security.reportDetail")}>
        <Card hover={false}>
          <div style={{ textAlign: "center", padding: 40, color: theme.colors.danger }}>
            {error || "Laporan tidak ditemukan"}
          </div>
          <button
            onClick={() => navigate("/security/reports")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Kembali ke Daftar
          </button>
        </Card>
      </MobileLayout>
    );
  }

  const evidencePaths = report.evidence_paths
    ? report.evidence_paths.split(",").filter((p: string) => p.trim())
    : [];

  return (
    <MobileLayout title={t("security.reportDetail")}>
      {/* Header Card */}
      <Card hover={false}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              {report.report_type} • ID: #{report.id}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {report.title}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {report.severity && (
                <StatusBadge severity={report.severity as any} />
              )}
              <StatusBadge status={report.status} />
            </div>
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card hover={false}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 12,
            color: theme.colors.textMain,
          }}
        >
          Detail
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {report.location_text && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Lokasi
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                📍 {report.location_text}
              </div>
            </div>
          )}
          {report.description && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  marginBottom: 4,
                }}
              >
                Deskripsi
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: theme.colors.textMain,
                }}
              >
                {report.description}
              </div>
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                marginBottom: 4,
              }}
            >
              Dibuat
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {formatDate(report.created_at)} • {formatDateTime(report.created_at)}
            </div>
          </div>
        </div>
      </Card>

      {/* Evidence Photos */}
      {evidencePaths.length > 0 && (
        <Card hover={false}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: theme.colors.textMain,
            }}
          >
            Foto Bukti ({evidencePaths.length})
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {evidencePaths.map((path: string, idx: number) => (
              <div
                key={idx}
                onClick={() => setPreviewImage(`http://localhost:8000/${path}`)}
                style={{
                  aspectRatio: "1",
                  backgroundColor: theme.colors.border,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <img
                  src={`http://localhost:8000/${path}`}
                  alt={`Evidence ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerHTML = "📷";
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate("/security/reports")}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: "#FFFFFF",
              color: theme.colors.textMain,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Kembali
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: exporting ? theme.colors.textSoft : theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              opacity: exporting ? 0.6 : 1,
            }}
          >
            {exporting ? "Mengekspor..." : "📄 Ekspor PDF"}
          </button>
        </div>
        {report.status === "open" && (
          <button
            onClick={() => {
              // TODO: Implement edit/update
              navigate(`/security/reports/${id}/edit`);
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              backgroundColor: theme.colors.primary,
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
        {previewImage && (
          <ImageModal
            imageUrl={previewImage}
            alt="Evidence photo"
            onClose={() => setPreviewImage(null)}
          />
        )}
      </div>
    </MobileLayout>
  );
}


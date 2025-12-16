// frontend/web/src/modules/supervisor/pages/KTAManagementPage.tsx

import React, { useEffect, useState } from "react";
import { Officer, getOfficers } from "../../../api/supervisorApi";
import { downloadKTAImage, downloadKTAPDF, batchGenerateKTA } from "../../../api/ktaApi";
import { theme } from "../../shared/components/theme";

const KTAManagementPage: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedOfficers, setSelectedOfficers] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState<number | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {};
      if (divisionFilter) params.division = divisionFilter;
      const data = await getOfficers(params);
      setOfficers(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [divisionFilter]);

  const handleDownloadImage = async (officerId: number) => {
    setDownloading(officerId);
    try {
      await downloadKTAImage(officerId, true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to download KTA image for officer ${officerId}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPDF = async (officerId: number) => {
    setDownloading(officerId);
    try {
      await downloadKTAPDF(officerId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to download KTA PDF for officer ${officerId}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleBatchDownload = async (format: "PNG" | "PDF") => {
    if (selectedOfficers.size === 0) {
      setErrorMsg("Please select at least one officer");
      return;
    }
    setBatchDownloading(true);
    try {
      await batchGenerateKTA(Array.from(selectedOfficers), format);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to batch generate KTA");
    } finally {
      setBatchDownloading(false);
    }
  };

  const toggleSelection = (officerId: number) => {
    const newSet = new Set(selectedOfficers);
    if (newSet.has(officerId)) {
      newSet.delete(officerId);
    } else {
      newSet.add(officerId);
    }
    setSelectedOfficers(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedOfficers.size === officers.length) {
      setSelectedOfficers(new Set());
    } else {
      setSelectedOfficers(new Set(officers.map((o) => o.id)));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: "100%",
        paddingBottom: "2rem",
      }}
      className="overflow-y-auto"
    >
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          KTA (Kartu Tanda Anggota) Management
        </h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          Generate and download employee ID cards (KTA) in PNG or PDF format. Select multiple
          officers for batch generation.
        </p>
      </div>

      {/* Division Filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 500 }}>Filter by Division:</label>
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          style={{
            padding: "4px 8px",
            fontSize: 12,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 4,
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
          }}
        >
          <option value="">All Divisions</option>
          <option value="security">Security</option>
          <option value="cleaning">Cleaning</option>
          <option value="driver">Driver</option>
          <option value="parking">Parking</option>
        </select>
      </div>

      {/* Batch Actions */}
      {selectedOfficers.size > 0 && (
        <div
          style={{
            padding: 12,
            backgroundColor: theme.colors.primary + "10",
            borderRadius: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500 }}>
            {selectedOfficers.size} officer(s) selected
          </span>
          <button
            onClick={() => handleBatchDownload("PNG")}
            disabled={batchDownloading}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: batchDownloading ? "not-allowed" : "pointer",
              opacity: batchDownloading ? 0.6 : 1,
            }}
          >
            {batchDownloading ? "Downloading..." : "Download Selected as PNG"}
          </button>
          <button
            onClick={() => handleBatchDownload("PDF")}
            disabled={batchDownloading}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              backgroundColor: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: batchDownloading ? "not-allowed" : "pointer",
              opacity: batchDownloading ? 0.6 : 1,
            }}
          >
            {batchDownloading ? "Downloading..." : "Download Selected as PDF"}
          </button>
          <button
            onClick={() => setSelectedOfficers(new Set())}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              backgroundColor: "transparent",
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: 8,
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          Loading officers...
        </div>
      ) : officers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: theme.colors.textMuted }}>
          No officers found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Select All */}
          <div
            style={{
              padding: 8,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="checkbox"
              checked={selectedOfficers.size === officers.length && officers.length > 0}
              onChange={toggleSelectAll}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Select All</span>
          </div>

          {/* Officers List */}
          {officers.map((officer) => (
            <div
              key={officer.id}
              style={{
                padding: 12,
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <input
                type="checkbox"
                checked={selectedOfficers.has(officer.id)}
                onChange={() => toggleSelection(officer.id)}
                style={{ cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{officer.name}</div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                  {officer.badge_id} • {officer.division} • {officer.position}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleDownloadImage(officer.id)}
                  disabled={downloading === officer.id}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    backgroundColor: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: downloading === officer.id ? "not-allowed" : "pointer",
                    opacity: downloading === officer.id ? 0.6 : 1,
                  }}
                >
                  {downloading === officer.id ? "..." : "PNG"}
                </button>
                <button
                  onClick={() => handleDownloadPDF(officer.id)}
                  disabled={downloading === officer.id}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    backgroundColor: "#DC2626",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: downloading === officer.id ? "not-allowed" : "pointer",
                    opacity: downloading === officer.id ? 0.6 : 1,
                  }}
                >
                  {downloading === officer.id ? "..." : "PDF"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KTAManagementPage;


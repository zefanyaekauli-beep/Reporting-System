// frontend/web/src/modules/supervisor/pages/SupervisorAttendancePage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  listAttendance,
  updateAttendance,
  AttendanceRecord,
  AttendanceUpdate,
  listSites,
  Site,
} from "../../../api/supervisorApi";
import * as XLSX from "xlsx";

export function SupervisorAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<AttendanceUpdate>({});

  // Filters
  const [dateFrom, setDateFrom] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [roleType, setRoleType] = useState<string>(""); // SECURITY, CLEANING, DRIVER, PARKING (empty = all)
  const [statusFilter, setStatusFilter] = useState<string>(""); // on_duty, completed, late, no_show, early_checkout
  const [showFilters, setShowFilters] = useState(true); // Show filters by default
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSites();
    loadAttendance();
  }, []);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params: any = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (siteId) params.site_id = siteId;
      if (roleType) params.role_type = roleType;
      if (statusFilter) params.status = statusFilter;

      const data = await listAttendance(params);
      // Ensure data is always an array
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data attendance");
      setRecords([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: AttendanceRecord) => {
    setEditingId(r.id);
    setEditingData({
      checkout_time: r.checkout_time
        ? new Date(r.checkout_time).toISOString().slice(0, 16)
        : undefined,
      shift: r.shift || undefined,
      is_overtime: r.is_overtime,
      is_backup: r.is_backup,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEdit = async (id: number) => {
    try {
      await updateAttendance(id, editingData);
      setEditingId(null);
      setEditingData({});
      await loadAttendance();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal mengupdate data");
    }
  };

  const exportToExcel = () => {
    if (records.length === 0) {
      setErrorMsg("Tidak ada data untuk diekspor");
      return;
    }

    setExporting(true);
    try {
      // Prepare data for Excel
      const excelData = records.map((r) => ({
        "Nama": r.user_name || `User #${r.user_id}`,
        "Site": r.site_name,
        "Divisi": r.role_type,
        "Check-in": new Date(r.checkin_time).toLocaleString("id-ID"),
        "Check-out": r.checkout_time ? new Date(r.checkout_time).toLocaleString("id-ID") : "OPEN",
        "Shift": r.shift || "-",
        "Overtime": r.is_overtime ? "Ya" : "Tidak",
        "Backup": r.is_backup ? "Ya" : "Tidak",
        "GPS Valid": r.gps_valid === true ? "Ya" : r.gps_valid === false ? "Tidak" : "-",
        "Photo Evidence": r.photo_evidence ? "Ya" : "Tidak",
        "Status": r.status === "IN_PROGRESS" ? "On-duty" : "Completed",
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Nama
        { wch: 20 }, // Site
        { wch: 12 }, // Divisi
        { wch: 20 }, // Check-in
        { wch: 20 }, // Check-out
        { wch: 10 }, // Shift
        { wch: 10 }, // Overtime
        { wch: 10 }, // Backup
        { wch: 12 }, // GPS Valid
        { wch: 12 }, // Photo Evidence
        { wch: 12 }, // Status
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      // Generate filename
      const siteName = siteId ? sites.find((s) => s.id === siteId)?.name || "" : "All";
      const name = `Attendance_${siteName}_${dateFrom}_${dateTo}`.replace(/[^a-z0-9_\-]/gi, "_");
      const filename = `${name}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      setErrorMsg("");
    } catch (err: any) {
      console.error("Export Excel error:", err);
      setErrorMsg("Gagal mengekspor ke Excel");
    } finally {
      setExporting(false);
    }
  };


  useEffect(() => {
    loadAttendance();
  }, [dateFrom, dateTo, siteId, roleType, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
        {/* Filters */}
        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            marginBottom: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: showFilters ? 12 : 0,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
                Attendance Console
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                Unified attendance view for all divisions (Security, Cleaning, Driver)
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={exportToExcel}
                disabled={exporting || records.length === 0}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.success}`,
                  backgroundColor: exporting || records.length === 0 ? theme.colors.border : theme.colors.success,
                  color: "#fff",
                  cursor: exporting || records.length === 0 ? "not-allowed" : "pointer",
                  opacity: exporting || records.length === 0 ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title="Export to Excel"
              >
                📊 Excel
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: theme.radius.pill,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textMain,
                  cursor: "pointer",
                }}
              >
                {showFilters ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Site
                </label>
                <select
                  value={siteId || ""}
                  onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : undefined)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">Semua Site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Divisi
                </label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">All Divisions</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="DRIVER">Driver</option>
                  <option value="PARKING">Parking</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">All Status</option>
                  <option value="on_duty">On-duty</option>
                  <option value="completed">Completed</option>
                  <option value="late">Late</option>
                  <option value="no_show">No-show</option>
                  <option value="early_checkout">Early Checkout</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: theme.colors.danger + "20",
              border: `1px solid ${theme.colors.danger}`,
              color: theme.colors.danger,
              fontSize: 13,
              borderRadius: theme.radius.card,
              padding: "10px 12px",
              marginBottom: 12,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Desktop table */}
        {loading ? (
          <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
            Memuat data...
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
            Tidak ada data
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: theme.colors.surface + "80",
                      borderBottom: `1px solid ${theme.colors.borderStrong}`,
                    }}
                  >
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Nama
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Site
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Division
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Check-in
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Check-out
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                      GPS Valid
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                      Photo
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600, color: theme.colors.textMain }}>
                      Status
                    </th>
                    <th style={{ padding: "4px 8px", textAlign: "center", fontWeight: 600, color: theme.colors.textMain }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.borderStrong}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface + "60";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>
                        {r.user_name || `User #${r.user_id}`}
                      </td>
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>{r.site_name}</td>
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: theme.radius.pill,
                            backgroundColor:
                              r.role_type === "SECURITY"
                                ? theme.colors.primary + "20"
                                : r.role_type === "CLEANING"
                                ? theme.colors.success + "20"
                                : r.role_type === "DRIVER"
                                ? theme.colors.warning + "20"
                                : theme.colors.border,
                            color:
                              r.role_type === "SECURITY"
                                ? theme.colors.primary
                                : r.role_type === "CLEANING"
                                ? theme.colors.success
                                : r.role_type === "DRIVER"
                                ? theme.colors.warning
                                : theme.colors.textMain,
                          }}
                        >
                          {r.role_type}
                        </span>
                      </td>
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain, fontSize: 10 }}>
                        {new Date(r.checkin_time).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain, fontSize: 10 }}>
                        {editingId === r.id ? (
                          <input
                            type="datetime-local"
                            value={editingData.checkout_time || ""}
                            onChange={(e) =>
                              setEditingData({ ...editingData, checkout_time: e.target.value })
                            }
                            style={{
                              padding: "4px",
                              fontSize: 10,
                              borderRadius: 4,
                              border: `1px solid ${theme.colors.border}`,
                              width: "140px",
                            }}
                          />
                        ) : r.checkout_time ? (
                          new Date(r.checkout_time).toLocaleString("id-ID")
                        ) : (
                          <span style={{ color: theme.colors.warning }}>OPEN</span>
                        )}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {r.gps_valid === true ? (
                          <span style={{ color: theme.colors.success, fontSize: 12 }}>✓ Yes</span>
                        ) : r.gps_valid === false ? (
                          <span style={{ color: theme.colors.danger, fontSize: 12 }}>✗ No</span>
                        ) : (
                          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {r.photo_evidence === true ? (
                          <span style={{ color: theme.colors.success, fontSize: 12 }}>✓ Yes</span>
                        ) : (
                          <span style={{ color: theme.colors.textMuted, fontSize: 12 }}>✗ No</span>
                        )}
                      </td>
                      <td style={{ padding: "4px 8px", color: theme.colors.textMain }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: theme.radius.pill,
                            backgroundColor:
                              r.status === "IN_PROGRESS"
                                ? theme.colors.warning + "20"
                                : theme.colors.success + "20",
                            color:
                              r.status === "IN_PROGRESS"
                                ? theme.colors.warning
                                : theme.colors.success,
                          }}
                        >
                          {r.status === "IN_PROGRESS" ? "On-duty" : "Completed"}
                        </span>
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "center" }}>
                        {editingId === r.id ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={() => saveEdit(r.id)}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                borderRadius: 4,
                                backgroundColor: theme.colors.success,
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                borderRadius: 4,
                                backgroundColor: theme.colors.textMuted,
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={() => startEdit(r)}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                borderRadius: 4,
                                border: `1px solid ${theme.colors.border}`,
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.textMain,
                                cursor: "pointer",
                              }}
                              title="Edit attendance"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Open attendance detail modal with map preview, photos, etc.
                                alert(`Attendance detail for ${r.user_name || r.user_id}\nGPS: ${r.gps_valid ? "Valid" : "Invalid"}\nPhoto: ${r.photo_evidence ? "Yes" : "No"}`);
                              }}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                borderRadius: 4,
                                border: `1px solid ${theme.colors.primary}`,
                                backgroundColor: "transparent",
                                color: theme.colors.primary,
                                cursor: "pointer",
                              }}
                              title="View details (map, photos, timestamps)"
                            >
                              Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {records.map((r) => (
                <div
                  key={r.id}
                  style={{
                    borderRadius: theme.radius.card,
                    border: `1px solid ${theme.colors.borderStrong}`,
                    backgroundColor: theme.colors.surface + "80",
                    padding: 8,
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: theme.colors.textMain }}>
                      {r.user_name || `User #${r.user_id}`}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: theme.radius.pill,
                        backgroundColor:
                          r.role_type === "SECURITY"
                            ? theme.colors.primary + "20"
                            : r.role_type === "CLEANING"
                            ? theme.colors.success + "20"
                            : r.role_type === "DRIVER"
                            ? theme.colors.warning + "20"
                            : theme.colors.border,
                        color:
                          r.role_type === "SECURITY"
                            ? theme.colors.primary
                            : r.role_type === "CLEANING"
                            ? theme.colors.success
                            : r.role_type === "DRIVER"
                            ? theme.colors.warning
                            : theme.colors.textMain,
                      }}
                    >
                      {r.role_type}
                    </div>
                  </div>
                  <div style={{ color: theme.colors.textMuted, marginBottom: 2 }}>{r.site_name}</div>
                  <div style={{ marginTop: 4, marginBottom: 2 }}>
                    <span style={{ color: theme.colors.textSoft }}>Check-in: </span>
                    <span style={{ color: theme.colors.textMain }}>
                      {new Date(r.checkin_time).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ color: theme.colors.textSoft }}>Check-out: </span>
                    {editingId === r.id ? (
                      <input
                        type="datetime-local"
                        value={editingData.checkout_time || ""}
                        onChange={(e) =>
                          setEditingData({ ...editingData, checkout_time: e.target.value })
                        }
                        style={{
                          padding: "4px",
                          fontSize: 10,
                          borderRadius: 4,
                          border: `1px solid ${theme.colors.border}`,
                          width: "100%",
                          marginTop: 4,
                        }}
                      />
                    ) : r.checkout_time ? (
                      <span style={{ color: theme.colors.textMain }}>
                        {new Date(r.checkout_time).toLocaleString("id-ID")}
                      </span>
                    ) : (
                      <span style={{ color: theme.colors.warning }}>OPEN</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 10 }}>
                    <div>
                      <span style={{ color: theme.colors.textSoft }}>GPS: </span>
                      {r.gps_valid === true ? (
                        <span style={{ color: theme.colors.success }}>✓ Valid</span>
                      ) : r.gps_valid === false ? (
                        <span style={{ color: theme.colors.danger }}>✗ Invalid</span>
                      ) : (
                        <span style={{ color: theme.colors.textMuted }}>-</span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSoft }}>Photo: </span>
                      {r.photo_evidence === true ? (
                        <span style={{ color: theme.colors.success }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: theme.colors.textMuted }}>✗ No</span>
                      )}
                    </div>
                    <div>
                      <span style={{ color: theme.colors.textSoft }}>Status: </span>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: theme.radius.pill,
                          backgroundColor:
                            r.status === "IN_PROGRESS"
                              ? theme.colors.warning + "20"
                              : theme.colors.success + "20",
                          color:
                            r.status === "IN_PROGRESS"
                              ? theme.colors.warning
                              : theme.colors.success,
                        }}
                      >
                        {r.status === "IN_PROGRESS" ? "On-duty" : "Completed"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {editingId === r.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(r.id)}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            fontSize: 11,
                            borderRadius: 4,
                            backgroundColor: theme.colors.success,
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            fontSize: 11,
                            borderRadius: 4,
                            backgroundColor: theme.colors.textMuted,
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(r)}
                        style={{
                          width: "100%",
                          padding: "6px 12px",
                          fontSize: 11,
                          borderRadius: 4,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.surface,
                          color: theme.colors.textMain,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
    </div>
  );
}


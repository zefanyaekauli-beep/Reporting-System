// frontend/web/src/modules/supervisor/pages/SupervisorShiftCalendarPage.tsx

import { useEffect, useState } from "react";
import { theme } from "../../shared/components/theme";
import {
  getShiftsCalendar,
  createShift,
  updateShift,
  deleteShift,
  Shift,
  ShiftCreate,
  ShiftUpdate,
  listSites,
  Site,
  getOfficers,
  Officer,
} from "../../../api/supervisorApi";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

export function SupervisorShiftCalendarPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [division, setDivision] = useState<string>(""); // SECURITY, CLEANING, DRIVER

  // Create form state
  const [newShift, setNewShift] = useState<ShiftCreate>({
    site_id: 0,
    division: "",
    shift_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "08:00",
    end_time: "16:00",
    shift_type: "MORNING",
  });

  useEffect(() => {
    loadSites();
    loadOfficers();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [currentMonth, siteId, division]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
      if (data.length > 0 && !newShift.site_id) {
        setNewShift((prev) => ({ ...prev, site_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadOfficers = async () => {
    try {
      const data = await getOfficers();
      setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const loadShifts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      const params: any = {
        start: format(start, "yyyy-MM-dd"),
        end: format(end, "yyyy-MM-dd"),
      };
      if (siteId) params.site_id = siteId;
      if (division) params.division = division;

      const data = await getShiftsCalendar(params);
      setShifts(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memuat data shift");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift(newShift);
      setShowCreateModal(false);
      setNewShift({
        site_id: sites[0]?.id || 0,
        division: "",
        shift_date: format(new Date(), "yyyy-MM-dd"),
        start_time: "08:00",
        end_time: "16:00",
        shift_type: "MORNING",
      });
      loadShifts();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal membuat shift");
    }
  };

  const handleUpdateShift = async (shiftId: number, payload: ShiftUpdate) => {
    try {
      await updateShift(shiftId, payload);
      setShowEditModal(false);
      setEditingShift(null);
      loadShifts();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal mengupdate shift");
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!confirm("Hapus shift ini?")) return;
    try {
      await deleteShift(shiftId);
      loadShifts();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal menghapus shift");
    }
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return shifts.filter((s) => s.shift_date === dateStr);
  };

  const getDivisionColor = (div: string) => {
    switch (div.toUpperCase()) {
      case "SECURITY":
        return theme.colors.primary;
      case "CLEANING":
        return theme.colors.success;
      case "DRIVER":
        return theme.colors.warning;
      default:
        return theme.colors.textMuted;
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%", paddingBottom: "2rem" }} className="overflow-y-auto">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textMain, marginBottom: 4 }}>
          Shift Management
        </h1>
        <p style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Calendar view per site + division. Assign users to shifts or mark as open (vacant).
        </p>
      </div>

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
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
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
              Division
            </label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
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
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ← Prev
            </button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600, color: theme.colors.textMain }}>
              {format(currentMonth, "MMMM yyyy", { locale: id })}
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textMain,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Next →
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                width: "100%",
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: theme.colors.primary,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + Create Shift
            </button>
          </div>
        </div>
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

      {/* Calendar Grid */}
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 12, color: theme.colors.textMuted, padding: 20 }}>
          Loading...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.card,
            padding: 12,
            boxShadow: theme.shadowCard,
          }}
        >
          {/* Day headers */}
          {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((day) => (
            <div
              key={day}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: theme.colors.textMuted,
                textAlign: "center",
                padding: "8px 4px",
              }}
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayShifts = getShiftsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: 100,
                  padding: 8,
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: isCurrentMonth ? theme.colors.surface : theme.colors.background + "40",
                  cursor: "pointer",
                  opacity: isCurrentMonth ? 1 : 0.5,
                  borderColor: isTodayDate ? theme.colors.primary : theme.colors.border,
                  borderWidth: isTodayDate ? 2 : 1,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isTodayDate ? 700 : 600,
                    color: isTodayDate ? theme.colors.primary : theme.colors.textMain,
                    marginBottom: 4,
                  }}
                >
                  {format(day, "d")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {dayShifts.slice(0, 3).map((shift) => (
                    <div
                      key={shift.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingShift(shift);
                        setShowEditModal(true);
                      }}
                      style={{
                        fontSize: 9,
                        padding: "4px 6px",
                        borderRadius: 4,
                        backgroundColor: getDivisionColor(shift.division) + "20",
                        color: getDivisionColor(shift.division),
                        border: `1px solid ${getDivisionColor(shift.division)}`,
                        cursor: "pointer",
                      }}
                      title={`${shift.division} - ${shift.start_time} to ${shift.end_time} - ${shift.user_name || "OPEN"}`}
                    >
                      <div style={{ fontWeight: 600 }}>{shift.division.substring(0, 3)}</div>
                      <div style={{ fontSize: 8 }}>
                        {shift.start_time}-{shift.end_time}
                      </div>
                      <div style={{ fontSize: 8, opacity: 0.8 }}>
                        {shift.user_name || "OPEN"}
                      </div>
                    </div>
                  ))}
                  {dayShifts.length > 3 && (
                    <div style={{ fontSize: 9, color: theme.colors.textMuted, textAlign: "center" }}>
                      +{dayShifts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 20,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create New Shift</h3>
            <form onSubmit={handleCreateShift} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Site
                </label>
                <select
                  required
                  value={newShift.site_id}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, site_id: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select Site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Division
                </label>
                <select
                  required
                  value={newShift.division}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, division: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select Division</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="DRIVER">Driver</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={newShift.shift_date}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, shift_date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newShift.start_time}
                    onChange={(e) => setNewShift((prev) => ({ ...prev, start_time: e.target.value }))}
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
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newShift.end_time}
                    onChange={(e) => setNewShift((prev) => ({ ...prev, end_time: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Assign to Officer (optional - leave empty for OPEN shift)
                </label>
                <select
                  value={newShift.user_id || ""}
                  onChange={(e) => setNewShift((prev) => ({ ...prev, user_id: e.target.value ? Number(e.target.value) : null }))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">Open (Unassigned)</option>
                  {officers
                    .filter((o) => o.division.toLowerCase() === newShift.division.toLowerCase())
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.badge_id})
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    backgroundColor: theme.colors.primary,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && editingShift && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowEditModal(false);
            setEditingShift(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.card,
              padding: 20,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Edit Shift</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Date</div>
                <div style={{ fontSize: 13, color: theme.colors.textMain }}>
                  {format(new Date(editingShift.shift_date), "dd MMM yyyy", { locale: id })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Time</div>
                <div style={{ fontSize: 13, color: theme.colors.textMain }}>
                  {editingShift.start_time} - {editingShift.end_time}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Division</div>
                <div style={{ fontSize: 13, color: theme.colors.textMain }}>{editingShift.division}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Assign to Officer
                </label>
                <select
                  value={editingShift.user_id || ""}
                  onChange={(e) => {
                    const userId = e.target.value ? Number(e.target.value) : null;
                    handleUpdateShift(editingShift.id, { user_id: userId });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="">Open (Unassigned)</option>
                  {officers
                    .filter((o) => o.division.toLowerCase() === editingShift.division.toLowerCase())
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.badge_id})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: theme.colors.textMuted, display: "block", marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={editingShift.status}
                  onChange={(e) => {
                    handleUpdateShift(editingShift.id, { status: e.target.value });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                  }}
                >
                  <option value="ASSIGNED">Assigned</option>
                  <option value="OPEN">Open</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingShift(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.textMain,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (confirm("Hapus shift ini?")) {
                      handleDeleteShift(editingShift.id);
                    }
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${theme.colors.danger}`,
                    backgroundColor: "transparent",
                    color: theme.colors.danger,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


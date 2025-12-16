// frontend/web/src/modules/supervisor/pages/CalendarPage.tsx

import React, { useEffect, useState } from "react";
import { getCalendarEvents, CalendarEvent } from "../../../api/calendarApi";
import { listSites, Site } from "../../../api/supervisorApi";
import { theme } from "../../shared/components/theme";

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    site_id: "",
    event_types: "",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const load = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [eventsData, sitesData] = await Promise.all([
        getCalendarEvents({
          year,
          month,
          site_id: filters.site_id ? parseInt(filters.site_id) : undefined,
          event_types: filters.event_types || undefined,
        }),
        listSites(),
      ]);
      setEvents(eventsData);
      setSites(sitesData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year, month, filters.site_id, filters.event_types]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateStr);
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month - 1, day));
    }
    return days;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      ATTENDANCE: "#10B981",
      PATROL: "#2563EB",
      REPORT: "#F59E0B",
      INCIDENT: "#EF4444",
      TRAINING: "#8B5CF6",
      VISITOR: "#06B6D4",
    };
    return colors[type] || theme.colors.primary;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Activity Calendar</h2>
        <p style={{ fontSize: 11, color: theme.colors.textMuted }}>
          View all system events (attendance, patrols, reports, training, visitors) in a calendar view.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Site</label>
          <select
            value={filters.site_id}
            onChange={(e) => setFilters({ ...filters, site_id: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Event Types</label>
          <select
            value={filters.event_types}
            onChange={(e) => setFilters({ ...filters, event_types: e.target.value })}
            style={{
              padding: "4px 8px",
              fontSize: 12,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 4,
            }}
          >
            <option value="">All Events</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="PATROL">Patrol</option>
            <option value="REPORT,INCIDENT">Reports & Incidents</option>
            <option value="TRAINING">Training</option>
            <option value="VISITOR">Visitors</option>
          </select>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <button
          onClick={() => navigateMonth("prev")}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          ← Previous
        </button>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          {monthNames[month - 1]} {year}
        </h3>
        <button
          onClick={() => navigateMonth("next")}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            backgroundColor: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Next →
        </button>
      </div>

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
          Loading calendar...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            backgroundColor: theme.colors.backgroundSecondary,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              style={{
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                padding: 8,
                color: theme.colors.textMuted,
              }}
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {getDaysInMonth().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} style={{ minHeight: 100 }} />;
            }

            const dayEvents = getEventsForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                style={{
                  minHeight: 100,
                  padding: 4,
                  backgroundColor: isToday ? theme.colors.primary + "10" : "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {date.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        fontSize: 9,
                        padding: "2px 4px",
                        backgroundColor: getEventColor(event.type),
                        color: "white",
                        borderRadius: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 9, color: theme.colors.textMuted }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          padding: 12,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Legend:</div>
        {["ATTENDANCE", "PATROL", "REPORT", "INCIDENT", "TRAINING", "VISITOR"].map((type) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: getEventColor(type),
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 11 }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;


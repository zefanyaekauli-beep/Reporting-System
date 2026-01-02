// frontend/web/src/modules/supervisor/pages/Dashboard/components/DashboardFilters.tsx

import React, { useState, useEffect } from "react";
import { DashboardFilters as DashboardFiltersType } from "../hooks/useDashboardData";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { theme } from "../../../../shared/components/theme";

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onChange: (filters: DashboardFiltersType) => void;
}

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<DashboardFiltersType>(filters);

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const loadSites = async () => {
    try {
      const sitesData = await listSites();
      setSites(sitesData);
    } catch (err) {
      console.error("Error loading sites:", err);
    }
  };

  const handleFilterChange = (key: keyof DashboardFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleSiteToggle = (siteId: number) => {
    const currentSiteIds = localFilters.site_ids || [];
    const newSiteIds = currentSiteIds.includes(siteId)
      ? currentSiteIds.filter((id) => id !== siteId)
      : [...currentSiteIds, siteId];
    handleFilterChange("site_ids", newSiteIds);
  };

  const clearFilters = () => {
    const clearedFilters: DashboardFiltersType = {};
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 text-sm font-medium text-[#002B4B] bg-white border border-[#002B4B] rounded-lg hover:bg-gray-50 transition-colors"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        {showFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-[#002B4B] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Date From */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Date From
              </label>
              <input
                type="date"
                value={localFilters.date_from || ""}
                onChange={(e) => handleFilterChange("date_from", e.target.value || undefined)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Date To
              </label>
              <input
                type="date"
                value={localFilters.date_to || ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value || undefined)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              />
            </div>

            {/* Division */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Division
              </label>
              <select
                value={localFilters.division || ""}
                onChange={(e) => handleFilterChange("division", e.target.value || undefined)}
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

            {/* Shift */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Shift
              </label>
              <select
                value={localFilters.shift || ""}
                onChange={(e) => handleFilterChange("shift", e.target.value || undefined)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                }}
              >
                <option value="">All Shifts</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="NIGHT">Night</option>
                <option value="0">Shift 0</option>
                <option value="1">Shift 1</option>
                <option value="2">Shift 2</option>
                <option value="3">Shift 3</option>
              </select>
            </div>

            {/* Sites (Multi-select) */}
            <div className="md:col-span-2">
              <label
                style={{
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Sites ({localFilters.site_ids?.length || 0} selected)
              </label>
              <select
                multiple
                value={localFilters.site_ids?.map(String) || []}
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, (option) =>
                    parseInt(option.value)
                  );
                  handleFilterChange("site_ids", selectedIds);
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: 13,
                  minHeight: "38px",
                }}
                size={4}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


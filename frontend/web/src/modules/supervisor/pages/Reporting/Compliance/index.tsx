// frontend/web/src/modules/supervisor/pages/Reporting/Compliance/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface ComplianceChecklist {
  id: number;
  checklist_name: string;
  category?: string;
  is_active: boolean;
}

interface AuditSchedule {
  id: number;
  audit_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  auditor_name?: string;
  status: string;
}

export function CompliancePage() {
  const [checklists, setChecklists] = useState<ComplianceChecklist[]>([]);
  const [audits, setAudits] = useState<AuditSchedule[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [siteId, setSiteId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (siteId) params.site_id = siteId;

      const [checklistsRes, auditsRes] = await Promise.all([
        api.get("/compliance/checklists", { params }),
        api.get("/compliance/audits", { params }),
      ]);

      setChecklists(checklistsRes.data);
      setAudits(auditsRes.data);
    } catch (err: any) {
      console.error("Failed to load compliance data:", err);
      setError(err.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">Compliance And Auditor</h1>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Site</label>
            <select
              value={siteId || ""}
              onChange={(e) => setSiteId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Checklists */}
      <DashboardCard title="Compliance Checklists">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No checklists found</div>
        ) : (
          <div className="space-y-2">
            {checklists.map((checklist) => (
              <div key={checklist.id} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{checklist.checklist_name}</div>
                    {checklist.category && (
                      <div className="text-sm text-gray-600">{checklist.category}</div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${checklist.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {checklist.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {/* Audit Schedules */}
      <DashboardCard title="Audit Schedules">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : audits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audits scheduled</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Auditor</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{format(new Date(audit.scheduled_date), "MMM dd, yyyy")}</td>
                    <td className="py-2 px-3">{audit.audit_type}</td>
                    <td className="py-2 px-3">{audit.auditor_name || "-"}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {audit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}


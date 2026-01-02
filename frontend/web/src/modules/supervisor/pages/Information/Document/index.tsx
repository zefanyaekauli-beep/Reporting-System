// frontend/web/src/modules/supervisor/pages/Information/Document/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { format } from "date-fns";

interface Document {
  id: number;
  title: string;
  document_type: string;
  document_number?: string;
  version: string;
  status: string;
  category?: string;
  division?: string;
  created_at: string;
}

export function InformationDocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [division, setDivision] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadSites();
    loadDocuments();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [documentType, category, division]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (documentType) params.document_type = documentType;
      if (category) params.category = category;
      if (division) params.division = division;

      const response = await api.get("/documents", { params });
      setDocuments(response.data);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setError(err.response?.data?.detail || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">Document Control</h1>

      {/* Filters */}
      <DashboardCard title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={documentType || ""}
              onChange={(e) => setDocumentType(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              <option value="POLICY">Policy</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="FORM">Form</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Filter by category"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
            <select
              value={division || ""}
              onChange={(e) => setDivision(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Divisions</option>
              <option value="SECURITY">Security</option>
              <option value="CLEANING">Cleaning</option>
              <option value="DRIVER">Driver</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Documents">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No documents found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Version</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3">{doc.title}</td>
                    <td className="py-2 px-3">{doc.document_type}</td>
                    <td className="py-2 px-3">{doc.version}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {format(new Date(doc.created_at), "MMM dd, yyyy")}
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


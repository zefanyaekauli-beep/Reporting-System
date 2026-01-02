// frontend/web/src/modules/supervisor/pages/Reporting/Visitors/VisitorFormPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../../api/client";
import { listSites, Site } from "../../../../../api/supervisorApi";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface VisitorFormData {
  site_id: number;
  name: string;
  company?: string;
  id_card_number?: string;
  id_card_type?: string;
  phone?: string;
  email?: string;
  purpose?: string;
  category?: string;
  host_user_id?: number;
  host_name?: string;
  expected_duration_minutes?: number;
  notes?: string;
  photo?: File;
  id_card_photo?: File;
}

export function VisitorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<VisitorFormData>({
    site_id: 0,
    name: "",
    company: "",
    id_card_number: "",
    id_card_type: "",
    phone: "",
    email: "",
    purpose: "",
    category: "",
    host_name: "",
    expected_duration_minutes: undefined,
    notes: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idCardPhotoPreview, setIdCardPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
    if (isEdit && id) {
      loadVisitor();
    }
  }, [id, isEdit]);

  const loadSites = async () => {
    try {
      const data = await listSites();
      setSites(data);
      if (data.length > 0 && !isEdit) {
        setFormData((prev) => ({ ...prev, site_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load sites:", err);
    }
  };

  const loadVisitor = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await api.get(`/visitors/${id}`);
      const visitor = response.data;
      setFormData({
        site_id: visitor.site_id,
        name: visitor.name || "",
        company: visitor.company || "",
        id_card_number: visitor.id_card_number || "",
        id_card_type: visitor.id_card_type || "",
        phone: visitor.phone || "",
        email: visitor.email || "",
        purpose: visitor.purpose || "",
        category: visitor.category || "",
        host_user_id: visitor.host_user_id,
        host_name: visitor.host_name || "",
        expected_duration_minutes: visitor.expected_duration_minutes,
        notes: visitor.notes || "",
      });
      if (visitor.photo_path) {
        setPhotoPreview(visitor.photo_path);
      }
      if (visitor.id_card_photo_path) {
        setIdCardPhotoPreview(visitor.id_card_photo_path);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load visitor");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("site_id", String(formData.site_id));
      formDataToSend.append("name", formData.name);
      if (formData.company) formDataToSend.append("company", formData.company);
      if (formData.id_card_number)
        formDataToSend.append("id_card_number", formData.id_card_number);
      if (formData.id_card_type)
        formDataToSend.append("id_card_type", formData.id_card_type);
      if (formData.phone) formDataToSend.append("phone", formData.phone);
      if (formData.email) formDataToSend.append("email", formData.email);
      if (formData.purpose) formDataToSend.append("purpose", formData.purpose);
      if (formData.category) formDataToSend.append("category", formData.category);
      if (formData.host_user_id)
        formDataToSend.append("host_user_id", String(formData.host_user_id));
      if (formData.host_name) formDataToSend.append("host_name", formData.host_name);
      if (formData.expected_duration_minutes)
        formDataToSend.append(
          "expected_duration_minutes",
          String(formData.expected_duration_minutes)
        );
      if (formData.notes) formDataToSend.append("notes", formData.notes);
      if (formData.photo) formDataToSend.append("photo", formData.photo);
      if (formData.id_card_photo)
        formDataToSend.append("id_card_photo", formData.id_card_photo);

      if (isEdit && id) {
        await api.patch(`/visitors/${id}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/visitors", formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      navigate("/supervisor/reporting/visitors");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save visitor");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, id_card_photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#002B4B]">
          {isEdit ? "Edit Visitor" : "Register New Visitor"}
        </h1>
        <button
          onClick={() => navigate("/supervisor/reporting/visitors")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard title="Visitor Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.site_id}
                onChange={(e) =>
                  setFormData({ ...formData, site_id: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              >
                <option value={0}>Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company/Organization
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Card Type
              </label>
              <select
                value={formData.id_card_type}
                onChange={(e) =>
                  setFormData({ ...formData, id_card_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Type</option>
                <option value="KTP">KTP</option>
                <option value="SIM">SIM</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Card Number
              </label>
              <input
                type="text"
                value={formData.id_card_number}
                onChange={(e) =>
                  setFormData({ ...formData, id_card_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              >
                <option value="">Select Category</option>
                <option value="GUEST">Guest</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="VENDOR">Vendor</option>
                <option value="CLIENT">Client</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Visit Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Visit
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host Name
              </label>
              <input
                type="text"
                value={formData.host_name}
                onChange={(e) =>
                  setFormData({ ...formData, host_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.expected_duration_minutes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expected_duration_minutes: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              disabled={loading}
            />
          </div>
        </DashboardCard>

        <DashboardCard title="Photos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Visitor photo preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Card Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleIdCardPhotoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              {idCardPhotoPreview && (
                <div className="mt-2">
                  <img
                    src={idCardPhotoPreview}
                    alt="ID card photo preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/reporting/visitors")}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : isEdit ? "Update Visitor" : "Register Visitor"}
          </button>
        </div>
      </form>
    </div>
  );
}


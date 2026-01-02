// frontend/web/src/modules/supervisor/pages/Admin/Translation/index.tsx

import React, { useEffect, useState } from "react";
import api from "../../../../../api/client";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";

interface Translation {
  key: string;
  translations: Record<string, string>;
}

export function AdminTranslationPage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/admin/translation");
      setTranslations(response.data);
    } catch (err: any) {
      console.error("Failed to load translations:", err);
      setError(err.response?.data?.detail || "Failed to load translations");
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = async (key: string, translations: Record<string, string>) => {
    try {
      await api.put(`/api/v1/admin/translation/${key}`, { translations });
      loadTranslations();
    } catch (err: any) {
      console.error("Failed to update translation:", err);
      alert(err.response?.data?.detail || "Failed to update translation");
    }
  };

  const handleTranslationChange = (key: string, language: string, value: string) => {
    const translation = translations.find((t) => t.key === key);
    if (!translation) return;

    const newTranslations = {
      ...translation.translations,
      [language]: value,
    };

    updateTranslation(key, newTranslations);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[#002B4B]">Translation Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <DashboardCard title="Translations">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : translations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No translations found</div>
        ) : (
          <div className="space-y-4">
            {translations.map((translation) => (
              <div key={translation.key} className="p-4 bg-gray-50 rounded">
                <div className="font-medium mb-2">{translation.key}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">English</label>
                    <input
                      type="text"
                      value={translation.translations.en || ""}
                      onChange={(e) => handleTranslationChange(translation.key, "en", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Indonesian</label>
                    <input
                      type="text"
                      value={translation.translations.id || ""}
                      onChange={(e) => handleTranslationChange(translation.key, "id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}


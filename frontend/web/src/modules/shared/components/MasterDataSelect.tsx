// frontend/web/src/modules/shared/components/MasterDataSelect.tsx

import { useEffect, useState } from "react";
import api from "../../../api/client";
import { theme } from "./theme";

interface MasterDataSelectProps {
  category: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  division?: string;
  required?: boolean;
  error?: string;
  style?: React.CSSProperties;
}

export function MasterDataSelect({
  category,
  value,
  onChange,
  placeholder,
  division,
  required = false,
  error,
  style,
}: MasterDataSelectProps) {
  const [options, setOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoading(true);
        const params: any = { category };
        if (division) {
          params.division = division;
        }
        const response = await api.get("/master-data/" + category, { params });
        const data = response.data || [];
        setOptions(
          data.map((item: any) => ({
            code: item.code,
            name: item.name,
          }))
        );
      } catch (err) {
        console.error("Failed to load master data:", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, [category, division]);

  return (
    <div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        required={required}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 8,
          border: `1.5px solid ${error ? theme.colors.danger : theme.colors.border}`,
          fontSize: 14,
          transition: "all 0.2s",
          outline: "none",
          backgroundColor: loading ? theme.colors.bgSecondary : "#FFFFFF",
          ...style,
        }}
      >
        <option value="">{loading ? "Loading..." : placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name}
          </option>
        ))}
      </select>
      {error && (
        <div
          style={{
            fontSize: 12,
            color: theme.colors.danger,
            marginTop: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}


// frontend/web/src/modules/shared/components/SiteSelector.tsx

import { useState, useEffect, useRef } from "react";
import { theme } from "./theme";

export interface SiteOption {
  id: number;
  name: string;
}

interface SiteSelectorProps {
  sites: SiteOption[];
  value: number | null;
  onChange: (id: number) => void;
}

export function SiteSelector({ sites, value, onChange }: SiteSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const current = sites.find((s) => s.id === value) || sites[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (id: number) => {
    onChange(id);
    setOpen(false);
  };

  if (sites.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 12, position: "relative" }} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: theme.radius.pill,
          border: `1px solid ${theme.colors.border}`,
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <span style={{ color: theme.colors.textMuted, marginRight: 8 }}>
          Site:
        </span>
        <span style={{ fontWeight: 600 }}>
          {current ? current.name : "Select site"}
        </span>
        <span style={{ fontSize: 12, marginLeft: 8 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "110%",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            boxShadow: theme.shadowCard,
            zIndex: 20,
            maxHeight: 220,
            overflowY: "auto",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {sites.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                backgroundColor:
                  value === s.id ? theme.colors.background : "#FFFFFF",
                textAlign: "left",
                fontSize: 13,
                cursor: "pointer",
                color: theme.colors.textMain,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


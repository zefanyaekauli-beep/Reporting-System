// frontend/web/src/modules/shared/contexts/SiteContext.tsx

import { createContext, useContext, useState, ReactNode } from "react";

interface Site {
  id: number;
  name: string;
}

interface SiteContextType {
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;
  sites: Site[];
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

// Mock sites - replace with API call later
const MOCK_SITES: Site[] = [
  { id: 1, name: "Situs A" },
  { id: 2, name: "Situs B" },
  { id: 3, name: "Situs C" },
];

export function SiteProvider({ children }: { children: ReactNode }) {
  const [selectedSite, setSelectedSite] = useState<Site | null>(
    MOCK_SITES[0] || null
  );

  return (
    <SiteContext.Provider
      value={{
        selectedSite,
        setSelectedSite,
        sites: MOCK_SITES,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used within SiteProvider");
  }
  return context;
}


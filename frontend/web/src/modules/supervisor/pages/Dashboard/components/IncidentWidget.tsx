// frontend/web/src/modules/supervisor/pages/Dashboard/components/IncidentWidget.tsx

import React from "react";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { KpiCard } from "../../../../shared/components/ui/KpiCard";
import { IncidentSummaryWidget } from "../hooks/useDashboardData";

interface IncidentWidgetProps {
  data: IncidentSummaryWidget;
  loading?: boolean;
}

export function IncidentWidget({ data, loading }: IncidentWidgetProps) {
  if (loading) {
    return (
      <DashboardCard title="Incident Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Incident Summary">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Open Incidents"
          value={data.open_incidents}
          variant="warning"
        />
        <KpiCard
          title="In Review"
          value={data.in_review}
          variant="default"
        />
        <KpiCard
          title="Closed Today"
          value={data.closed_today}
          variant="success"
        />
        <KpiCard
          title="Critical Alerts"
          value={data.critical_alerts}
          variant="danger"
        />
      </div>
    </DashboardCard>
  );
}


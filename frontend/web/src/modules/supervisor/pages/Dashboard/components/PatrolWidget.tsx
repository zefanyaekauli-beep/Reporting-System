// frontend/web/src/modules/supervisor/pages/Dashboard/components/PatrolWidget.tsx

import React from "react";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { KpiCard } from "../../../../shared/components/ui/KpiCard";
import { PatrolStatusWidget } from "../hooks/useDashboardData";

interface PatrolWidgetProps {
  data: PatrolStatusWidget;
  loading?: boolean;
}

export function PatrolWidget({ data, loading }: PatrolWidgetProps) {
  if (loading) {
    return (
      <DashboardCard title="Patrol Status">
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
    <DashboardCard title="Patrol Status">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Routes Completed"
          value={data.routes_completed}
          variant="success"
        />
        <KpiCard
          title="In Progress"
          value={data.routes_in_progress}
          variant="default"
        />
        <KpiCard
          title="Pending"
          value={data.routes_pending}
          variant="warning"
        />
        <KpiCard
          title="Missed Checkpoints"
          value={data.missed_checkpoints}
          variant="danger"
        />
      </div>
    </DashboardCard>
  );
}


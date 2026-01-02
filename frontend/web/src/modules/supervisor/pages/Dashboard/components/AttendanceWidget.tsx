// frontend/web/src/modules/supervisor/pages/Dashboard/components/AttendanceWidget.tsx

import React from "react";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { KpiCard } from "../../../../shared/components/ui/KpiCard";
import { AttendanceSummaryWidget } from "../hooks/useDashboardData";

interface AttendanceWidgetProps {
  data: AttendanceSummaryWidget;
  loading?: boolean;
}

export function AttendanceWidget({ data, loading }: AttendanceWidgetProps) {
  if (loading) {
    return (
      <DashboardCard title="Attendance Summary">
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
    <DashboardCard title="Attendance Summary">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="On Duty"
          value={data.total_on_duty}
          variant="default"
        />
        <KpiCard
          title="Late"
          value={data.total_late}
          variant="warning"
        />
        <KpiCard
          title="Absent"
          value={data.total_absent}
          variant="danger"
        />
        <KpiCard
          title="Early Checkout"
          value={data.total_early_checkout}
          variant="warning"
        />
      </div>
    </DashboardCard>
  );
}


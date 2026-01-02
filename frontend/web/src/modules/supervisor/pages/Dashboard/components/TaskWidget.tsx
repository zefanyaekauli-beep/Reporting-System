// frontend/web/src/modules/supervisor/pages/Dashboard/components/TaskWidget.tsx

import React from "react";
import { DashboardCard } from "../../../../shared/components/ui/DashboardCard";
import { KpiCard } from "../../../../shared/components/ui/KpiCard";
import { TaskCompletionWidget } from "../hooks/useDashboardData";

interface TaskWidgetProps {
  data: TaskCompletionWidget;
  loading?: boolean;
}

export function TaskWidget({ data, loading }: TaskWidgetProps) {
  if (loading) {
    return (
      <DashboardCard title="Task Completion">
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
    <DashboardCard title="Task Completion">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Progress"
          value={`${data.checklist_progress.toFixed(1)}%`}
          subtitle={`${data.completed_today} completed today`}
          variant={data.checklist_progress >= 80 ? "success" : data.checklist_progress >= 50 ? "warning" : "danger"}
        />
        <KpiCard
          title="Overdue Tasks"
          value={data.overdue_tasks}
          variant={data.overdue_tasks > 0 ? "danger" : "success"}
        />
        <KpiCard
          title="Completed Today"
          value={data.completed_today}
          variant="success"
        />
        <KpiCard
          title="Total Tasks"
          value={data.total_tasks}
          variant="default"
        />
      </div>
    </DashboardCard>
  );
}


// frontend/web/src/modules/supervisor/components/AttendanceBarChart.tsx

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { theme } from "../../shared/components/theme";

interface BarChartData {
  name: string;
  attendance: number;
  onShift: number;
  overtime: number;
}

interface AttendanceBarChartProps {
  data: BarChartData[];
}

const AttendanceBarChart: React.FC<AttendanceBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <div className="text-sm mb-1">No data available</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Start tracking attendance to see charts</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
        <XAxis dataKey="name" stroke={theme.colors.textMain} />
        <YAxis stroke={theme.colors.textMain} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.card,
            color: theme.colors.textMain,
          }}
        />
        <Legend />
        <Bar dataKey="attendance" fill={theme.colors.primary} name="Total Attendance" />
        <Bar dataKey="onShift" fill={theme.colors.success} name="On Shift" />
        <Bar dataKey="overtime" fill={theme.colors.warning} name="Overtime" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AttendanceBarChart;

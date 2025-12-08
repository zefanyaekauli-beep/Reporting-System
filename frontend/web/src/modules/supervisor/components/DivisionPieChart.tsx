// frontend/web/src/modules/supervisor/components/DivisionPieChart.tsx

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { theme } from "../../shared/components/theme";

interface PieChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for recharts compatibility
}

interface DivisionPieChartProps {
  data: PieChartData[];
}

const DivisionPieChart: React.FC<DivisionPieChartProps> = ({ data }) => {
  const filteredData = data.filter((d) => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-slate-500 dark:text-slate-400">
        <div className="text-center">
          <div className="text-sm mb-1">No data available</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Start tracking attendance to see charts</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DivisionPieChart;

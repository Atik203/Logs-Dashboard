import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { type AggregatedLogDatum, type AggregateGroupBy } from "@api/api";

interface TrendChartProps {
  data: AggregatedLogDatum[];
  groupBy: AggregateGroupBy;
}

export function TrendChart({ data, groupBy }: TrendChartProps) {
  const xKey = groupBy === "date" ? "date" : groupBy;
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 32, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickMargin={8} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(value: string | number) =>
              xKey === "date" ? new Date(String(value)).toDateString() : String(value)
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="count" name="Log Count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A2UI Chart Component
 *
 * Data visualization component supporting line, bar, pie, and area charts.
 */

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartComponent } from "../types";

interface A2UIChartProps {
  data: ChartComponent;
  chartData: any[];
}

// Colors for charts
const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
];

export function A2UIChart({ data, chartData }: A2UIChartProps) {
  const { config, title } = data;

  console.log('[A2UIChart] Rendering chart:', {
    title: title?.literalString,
    chartType: config.type,
    dataLength: chartData.length,
    xKey: config.xKey,
    yKey: config.yKey,
    config,
    fullData: chartData,
    sampleData: chartData[0]
  });

  // Validate that data has required keys
  if (chartData.length > 0) {
    const firstItem = chartData[0];
    const hasXKey = config.xKey in firstItem;
    const hasYKey = config.yKey in firstItem;
    console.log('[A2UIChart] Data validation:', {
      hasXKey,
      hasYKey,
      availableKeys: Object.keys(firstItem),
      lookingFor: { xKey: config.xKey, yKey: config.yKey }
    });
  }

  if (chartData.length === 0) {
    console.log('[A2UIChart] No data - showing empty state');
    return (
      <div className="a2ui-chart-empty">
        {title && <h3>{title.literalString}</h3>}
        <p>No data available for chart</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (config.type) {
      case "line":
        return (
          <LineChart width={500} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={config.yKey}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ fill: COLORS[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart width={500} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar dataKey={config.yKey} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart width={500} height={300}>
            <Pie
              data={chartData}
              dataKey={config.yKey}
              nameKey={config.xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => entry[config.xKey]}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case "area":
        return (
          <AreaChart width={500} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={config.yKey}
              stroke={COLORS[2]}
              fill={COLORS[2]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      default:
        return <div>Unsupported chart type: {config.type}</div>;
    }
  };

  return (
    <div className="a2ui-chart">
      {title && <h3 className="a2ui-chart-title">{title.literalString}</h3>}
      <div style={{ width: '100%', height: 300, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

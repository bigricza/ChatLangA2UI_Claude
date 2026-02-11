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

// Colors for charts - matching theme gradient
const COLORS = [
  "#667eea", // primary purple
  "#764ba2", // deep purple
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ec4899", // pink
  "#ef4444", // red
  "#8b5cf6", // violet
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="a2ui-chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-value">
              <span style={{ fontWeight: 600 }}>{entry.name}:</span>{" "}
              <span style={{ color: entry.color }}>
                {typeof entry.value === "number"
                  ? entry.value.toLocaleString()
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Click handler for chart elements
  const handleClick = (data: any) => {
    console.log("[A2UIChart] Chart element clicked:", data);
    // In a full implementation, this could trigger actions or navigate
  };

  const renderChart = () => {
    switch (config.type) {
      case "line":
        return (
          <LineChart width={500} height={300} data={chartData} onClick={handleClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={config.yKey}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ fill: COLORS[0], r: 4, cursor: "pointer" }}
              activeDot={{ r: 8, cursor: "pointer" }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart width={500} height={300} data={chartData} onClick={handleClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={config.yKey}
              fill={COLORS[1]}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
            />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart width={500} height={300} onClick={handleClick}>
            <Pie
              data={chartData}
              dataKey={config.yKey}
              nameKey={config.xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => entry[config.xKey]}
              labelLine={false}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      case "area":
        return (
          <AreaChart width={500} height={300} data={chartData} onClick={handleClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={config.xKey}
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={config.yKey}
              stroke={COLORS[2]}
              fill={COLORS[2]}
              fillOpacity={0.3}
              cursor="pointer"
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

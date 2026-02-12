/**
 * ProgressChart Component
 *
 * 进度图表组件（环�?条形�?
 * Story 11-7: Advanced Features
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from '@dailyuse/ui-react-shadcn';

export interface ProgressDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ProgressChartProps {
  title?: string;
  description?: string;
  data: ProgressDataPoint[];
  type?: 'ring' | 'bar' | 'line';
  showLegend?: boolean;
  showTrend?: boolean;
  previousValue?: number;
  currentValue?: number;
  maxValue?: number;
  className?: string;
}

// Default colors
const defaultColors = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(45, 90%, 50%)',
  'hsl(0, 70%, 55%)',
  'hsl(280, 65%, 55%)',
];

// Ring Chart Component
function RingChart({
  data,
  size = 120,
  strokeWidth = 12,
}: {
  data: ProgressDataPoint[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let currentOffset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Data segments */}
      {data.map((d, i) => {
        const percent = total > 0 ? d.value / total : 0;
        const strokeLength = percent * circumference;
        const offset = currentOffset;
        currentOffset += strokeLength;

        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color || defaultColors[i % defaultColors.length]}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// Bar Chart Component
function BarChart({
  data,
  maxValue,
  height = 200,
}: {
  data: ProgressDataPoint[];
  maxValue?: number;
  height?: number;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, 100 / data.length);

  return (
    <div className="flex items-end justify-around gap-2" style={{ height }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 30);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="rounded-t-md transition-all duration-300"
              style={{
                width: `${barWidth}px`,
                height: `${barHeight}px`,
                backgroundColor: d.color || defaultColors[i % defaultColors.length],
              }}
            />
            <span className="text-xs text-muted-foreground truncate max-w-[50px]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Line Chart Component (Simple)
function LineChart({
  data,
  maxValue,
  height = 150,
}: {
  data: ProgressDataPoint[];
  maxValue?: number;
  height?: number;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / max) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1]?.x || padding} ${
    height - padding
  } L ${padding} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((percent) => {
        const y = padding + chartHeight - (percent / 100) * chartHeight;
        return (
          <line
            key={percent}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="hsl(var(--muted))"
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill="hsl(var(--primary) / 0.1)" />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

// Trend Indicator
function TrendIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const diff = current - previous;
  const percent = previous > 0 ? Math.round((diff / previous) * 100) : 0;

  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{percent}%</span>
      </div>
    );
  } else if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{percent}%</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  }
}

// Main Component
export function ProgressChart({
  title,
  description,
  data,
  type = 'bar',
  showLegend = true,
  showTrend = false,
  previousValue,
  currentValue,
  maxValue,
  className,
}: ProgressChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {showTrend && previousValue !== undefined && currentValue !== undefined && (
              <TrendIndicator current={currentValue} previous={previousValue} />
            )}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Chart */}
          {type === 'ring' && (
            <div className="relative">
              <RingChart data={data} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-xs text-muted-foreground">总计</div>
                </div>
              </div>
            </div>
          )}
          {type === 'bar' && <BarChart data={data} maxValue={maxValue} />}
          {type === 'line' && <LineChart data={data} maxValue={maxValue} />}

          {/* Legend */}
          {showLegend && (
            <div className="flex flex-wrap justify-center gap-4">
              {data.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: d.color || defaultColors[i % defaultColors.length],
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {d.label}: {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgressChart;

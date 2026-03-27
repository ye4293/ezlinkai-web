'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface MetricsChartProps {
  type: 'area' | 'bar';
  data: Record<string, unknown>[];
  dataKeys: { key: string; label: string; color: string; stacked?: boolean }[];
  xAxisKey: string;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  height?: number;
}

export default function MetricsChart({
  type,
  data,
  dataKeys,
  xAxisKey,
  xAxisFormatter,
  yAxisFormatter,
  height = 250
}: MetricsChartProps) {
  const chartConfig: ChartConfig = {};
  dataKeys.forEach((dk) => {
    chartConfig[dk.key] = { label: dk.label, color: dk.color };
  });

  const commonProps = {
    data,
    margin: { left: 0, right: 12, top: 8, bottom: 0 }
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: `${height}px` }}
    >
      {type === 'area' ? (
        <AreaChart {...commonProps}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={xAxisFormatter}
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tickFormatter={yAxisFormatter}
            fontSize={11}
            width={48}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              dataKey={dk.key}
              type="monotone"
              fill={`var(--color-${dk.key})`}
              fillOpacity={0.15}
              stroke={`var(--color-${dk.key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart {...commonProps}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={xAxisFormatter}
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tickFormatter={yAxisFormatter}
            fontSize={11}
            width={48}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dashed" />}
          />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              fill={`var(--color-${dk.key})`}
              radius={[4, 4, 0, 0]}
              stackId={dk.stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
}

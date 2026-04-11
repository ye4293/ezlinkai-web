'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsChart from '@/sections/model-plaza/components/metrics-chart';
import type { LogStatTimeSeriesPoint } from '@/lib/types/log-stat';

interface DurationChartProps {
  data: (LogStatTimeSeriesPoint & { time: string })[];
}

export default function DurationChart({ data }: DurationChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Request Duration Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          type="area"
          data={data as unknown as Record<string, unknown>[]}
          dataKeys={[
            {
              key: 'avg_duration',
              label: 'Avg Duration',
              color: 'hsl(var(--chart-1))'
            }
          ]}
          xAxisKey="time"
          yAxisFormatter={(v) =>
            v < 1 ? `${(v * 1000).toFixed(0)}ms` : `${v.toFixed(1)}s`
          }
          height={300}
        />
      </CardContent>
    </Card>
  );
}

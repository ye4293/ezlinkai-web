'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsChart from '@/sections/model-plaza/components/metrics-chart';
import type { LogStatTimeSeriesPoint } from '@/lib/types/log-stat';

interface SpeedChartProps {
  data: (LogStatTimeSeriesPoint & { time: string })[];
}

export default function SpeedChart({ data }: SpeedChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Token Generation Speed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          type="area"
          data={data as unknown as Record<string, unknown>[]}
          dataKeys={[
            {
              key: 'avg_speed',
              label: 'Avg Speed',
              color: 'hsl(var(--chart-1))'
            }
          ]}
          xAxisKey="time"
          yAxisFormatter={(v) => `${v.toFixed(0)} t/s`}
          height={250}
        />
      </CardContent>
    </Card>
  );
}

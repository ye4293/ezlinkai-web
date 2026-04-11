'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsChart from '@/sections/model-plaza/components/metrics-chart';
import type { LogStatTimeSeriesPoint } from '@/lib/types/log-stat';

interface RequestChartProps {
  data: (LogStatTimeSeriesPoint & { time: string })[];
}

export default function RequestChart({ data }: RequestChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Request Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          type="bar"
          data={data as unknown as Record<string, unknown>[]}
          dataKeys={[
            {
              key: 'total_requests',
              label: 'Requests',
              color: 'hsl(var(--chart-1))'
            }
          ]}
          xAxisKey="time"
          yAxisFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
          }
          height={250}
        />
      </CardContent>
    </Card>
  );
}

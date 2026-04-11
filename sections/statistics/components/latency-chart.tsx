'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricsChart from '@/sections/model-plaza/components/metrics-chart';
import type { LogStatTimeSeriesPoint } from '@/lib/types/log-stat';

interface LatencyChartProps {
  data: (LogStatTimeSeriesPoint & { time: string })[];
}

export default function LatencyChart({ data }: LatencyChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          First Word Latency
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MetricsChart
          type="area"
          data={data as unknown as Record<string, unknown>[]}
          dataKeys={[
            {
              key: 'avg_first_word_latency',
              label: 'Avg First Word',
              color: 'hsl(var(--chart-2))'
            }
          ]}
          xAxisKey="time"
          yAxisFormatter={(v) =>
            v < 1 ? `${(v * 1000).toFixed(0)}ms` : `${v.toFixed(1)}s`
          }
          height={250}
        />
      </CardContent>
    </Card>
  );
}

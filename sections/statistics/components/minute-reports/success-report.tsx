'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useMinuteReport } from '../../hooks/use-minute-report';
import type {
  StatsQuery,
  SuccessReport,
  SuccessPoint
} from '@/lib/types/request-statistics';
import {
  formatCount,
  formatRate,
  formatDuration,
  formatStatsTime,
  pointLabel
} from '@/lib/request-statistics';
import {
  Freshness,
  MetricGrid,
  ReportControls,
  ReportRange,
  ReportStatus,
  selectClass
} from './shared';
import { PointDetails } from './point-details';

export interface SelectedPoint {
  report: SuccessReport;
  point: SuccessPoint;
}
export const SuccessReportCard = memo(function SuccessReportCard({
  query,
  admin
}: {
  query: StatsQuery;
  admin: boolean;
}) {
  const report = useMinuteReport<SuccessReport>('/api/statistics/requests', {
    ...query,
    query_type: 'summary'
  });
  const [selected, setSelected] = useState<SelectedPoint | null>(null);
  const [pointIndex, setPointIndex] = useState(0);
  const data = report.data;
  const selectPoint = (index: number) => {
    if (data?.timeseries[index]) {
      setPointIndex(index);
      setSelected({ report: data, point: data.timeseries[index] });
    }
  };
  return (
    <Card className="min-w-0" data-testid="minute-success">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">成功率与耗时</CardTitle>
        <ReportControls {...report} />
      </CardHeader>
      <CardContent className="space-y-4">
        <ReportStatus {...report} hasData={!!data} />
        {data && (
          <>
            <Freshness value={data.freshness} />
            <ReportRange data={data} />
            <MetricGrid
              items={[
                ['日志请求数', formatCount(data.summary.total_requests)],
                ['成功率', formatRate(data.summary.success_rate)],
                ['平均耗时', formatDuration(data.summary.avg_duration_ms)],
                ['失败数', formatCount(data.summary.failure_count)],
                ['RPM · 次/分钟', formatCount(data.summary.rpm)],
                ['TPM · Token/分钟', formatCount(data.summary.tpm)]
              ]}
            />
            <ChartContainer
              config={{
                complete: { label: '成功率', color: 'hsl(var(--chart-1))' },
                partial: { label: '部分观察', color: '#d97706' }
              }}
              className="aspect-auto h-[300px] w-full"
              aria-label="成功率趋势，范围为百分之零至百分之一百"
            >
              <AreaChart
                data={data.timeseries}
                margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
                onClick={(state) => {
                  if (state?.activeTooltipIndex !== undefined)
                    selectPoint(Number(state.activeTooltipIndex));
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="effective_start"
                  type="number"
                  domain={[data.start_timestamp, data.end_timestamp]}
                  allowDataOverflow
                  tickFormatter={formatStatsTime}
                  minTickGap={45}
                  tickMargin={8}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickMargin={4}
                  fontSize={11}
                  width={48}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as SuccessPoint | undefined;
                    return active && p ? (
                      <div className="max-w-xs rounded-lg border bg-background p-3 text-xs shadow-md">
                        <div>{pointLabel(p)}</div>
                        <div className="mt-1">
                          成功 {formatCount(p.success_count)} / 失败{' '}
                          {formatCount(p.failure_count)} · 平均{' '}
                          {formatDuration(p.avg_duration_ms)}
                        </div>
                        <div>
                          RPM {formatCount(p.rpm)} · TPM {formatCount(p.tpm)}
                        </div>
                        <div>点击查看时间段详情</div>
                      </div>
                    ) : null;
                  }}
                />
                <Area
                  name="成功率"
                  dataKey={(p: SuccessPoint) =>
                    !p.incomplete && p.success_rate !== null
                      ? p.success_rate * 100
                      : null
                  }
                  type="monotone"
                  connectNulls={false}
                  stroke="var(--color-complete)"
                  fill="var(--color-complete)"
                  fillOpacity={0.15}
                  baseValue={0}
                  strokeWidth={2}
                  dot={
                    data.timeseries.filter(
                      (p) => !p.incomplete && p.success_rate !== null
                    ).length === 1
                      ? { r: 2, strokeWidth: 1 }
                      : false
                  }
                  activeDot={{ r: 2, strokeWidth: 1 }}
                  isAnimationActive={false}
                />
                <Area
                  name="部分观察"
                  dataKey={(p: SuccessPoint) =>
                    p.incomplete && p.success_rate !== null
                      ? p.success_rate * 100
                      : null
                  }
                  type="monotone"
                  connectNulls={false}
                  stroke="var(--color-partial)"
                  fill="var(--color-partial)"
                  fillOpacity={0.15}
                  baseValue={0}
                  strokeDasharray="4 4"
                  dot={
                    data.timeseries.filter(
                      (p) => p.incomplete && p.success_rate !== null
                    ).length === 1
                      ? { r: 2, strokeWidth: 1 }
                      : false
                  }
                  activeDot={{ r: 2, strokeWidth: 1 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground">
              空闲时间段的成功率没有分母，不绘制为
              0%。橙色虚线仅表示已观察到的部分。
            </p>
            <div className="space-y-2">
              <Label htmlFor="minute-point">时间段详情（也可点击图表）</Label>
              <div className="flex min-w-0 gap-2">
                <select
                  id="minute-point"
                  className={selectClass}
                  value={Math.min(pointIndex, data.timeseries.length - 1)}
                  onChange={(e) => setPointIndex(Number(e.target.value))}
                >
                  {data.timeseries.map((p, i) => (
                    <option key={p.bucket_start} value={i}>
                      {pointLabel(p)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() =>
                    selectPoint(
                      Math.min(pointIndex, data.timeseries.length - 1)
                    )
                  }
                  disabled={!data.timeseries.length}
                >
                  查看详情
                </Button>
              </div>
            </div>
          </>
        )}
        {selected && (
          <PointDetails
            selected={selected}
            latest={data}
            admin={admin}
            onClose={() => setSelected(null)}
            onSelect={setSelected}
          />
        )}
      </CardContent>
    </Card>
  );
});

'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  ModelPoint,
  ModelReport,
  StatsQuery
} from '@/lib/types/request-statistics';
import {
  formatCount,
  formatStatsTime,
  modelColor
} from '@/lib/request-statistics';
import {
  Freshness,
  ReportControls,
  ReportRange,
  ReportStatus,
  selectClass
} from './shared';

export const ModelReportCard = memo(function ModelReportCard({
  query
}: {
  query: StatsQuery;
}) {
  const [top, setTop] = useState(5);
  const [hidden, setHidden] = useState<string[]>([]);
  const report = useMinuteReport<ModelReport>(
    '/api/statistics/models/requests',
    { ...query, top_n: top }
  );
  const data = report.data;
  return (
    <Card className="min-w-0" data-testid="minute-models">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">模型请求量</CardTitle>
        <ReportControls {...report} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="minute-top" className="shrink-0">
            展示模型数
          </Label>
          <select
            id="minute-top"
            className={selectClass}
            style={{ width: '6rem' }}
            value={top}
            onChange={(e) => setTop(Number(e.target.value))}
            disabled={query.model_name !== undefined}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            其余合并为“其他”
          </span>
        </div>
        <ReportStatus {...report} hasData={!!data} />
        {data && (
          <>
            <Freshness value={data.freshness} />
            <ReportRange data={data} />
            <div className="text-sm text-muted-foreground">
              日志请求数：{formatCount(data.summary.total_requests)}
            </div>
            {data.series.length > 0 && (
              <Table aria-label="各模型请求量与平均速率">
                <TableHeader>
                  <TableRow>
                    <TableHead>模型</TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      请求数
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      RPM · 次/分钟
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      TPM · Token/分钟
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.series.map((s) => (
                    <TableRow key={s.id} data-model-summary={s.id}>
                      <TableCell className="max-w-48 break-all">
                        {s.label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(s.summary?.total_requests ?? null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(s.summary?.rpm ?? null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(s.summary?.tpm ?? null)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <ChartContainer
              config={{}}
              className="aspect-auto h-[250px] w-full"
              aria-label="各模型请求量趋势"
            >
              <AreaChart
                data={data.timeseries}
                margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
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
                  allowDecimals={false}
                  tickFormatter={formatCount}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as ModelPoint | undefined;
                    return active && p ? (
                      <div
                        className="max-w-xs rounded-lg border bg-background p-3 text-xs shadow-md"
                        data-testid="model-rates-tooltip"
                        data-bucket-start={p.bucket_start}
                      >
                        <div>
                          {formatStatsTime(p.effective_start)} –{' '}
                          {formatStatsTime(p.effective_end)}（不含）
                        </div>
                        {p.incomplete && (
                          <div className="text-amber-600">仅基于已观察部分</div>
                        )}
                        {data.series
                          .filter((s) => !hidden.includes(s.id))
                          .map((s) => (
                            <div
                              key={s.id}
                              className="mt-2 break-all"
                              data-model-tooltip={s.id}
                            >
                              <div>
                                {s.label}：{formatCount(p.values[s.id] ?? null)}{' '}
                                次
                              </div>
                              <div className="text-muted-foreground">
                                RPM {formatCount(p.rates?.[s.id]?.rpm ?? null)}{' '}
                                · TPM{' '}
                                {formatCount(p.rates?.[s.id]?.tpm ?? null)}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : null;
                  }}
                />
                {data.series.map((s) => (
                  <Area
                    key={s.id}
                    name={s.label}
                    dataKey={(p: ModelPoint) => p.values[s.id] ?? null}
                    hide={hidden.includes(s.id)}
                    type="monotone"
                    connectNulls={false}
                    stroke={
                      s.kind === 'other'
                        ? '#94a3b8'
                        : modelColor(s.model_name || s.label)
                    }
                    fill={
                      s.kind === 'other'
                        ? '#94a3b8'
                        : modelColor(s.model_name || s.label)
                    }
                    fillOpacity={0.15}
                    baseValue={0}
                    strokeWidth={2}
                    dot={
                      data.timeseries.filter((p) => p.values[s.id] != null)
                        .length === 1
                        ? { r: 2, strokeWidth: 1 }
                        : false
                    }
                    activeDot={{ r: 2, strokeWidth: 1 }}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
            {data.series.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {data.freshness.incomplete
                  ? '暂无已完成的模型统计。'
                  : '所选范围没有已记录请求。'}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {data.series.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={!hidden.includes(s.id)}
                  className={`max-w-full rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring ${
                    hidden.includes(s.id) ? 'opacity-40' : ''
                  }`}
                  onClick={() =>
                    setHidden((old) =>
                      old.includes(s.id)
                        ? old.filter((id) => id !== s.id)
                        : [...old, s.id]
                    )
                  }
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{
                      background:
                        s.kind === 'other'
                          ? '#94a3b8'
                          : modelColor(s.model_name || s.label)
                    }}
                  />
                  <span className="break-all">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              排名基于整个查询范围；隐藏曲线不改变总数。已完成空分钟为
              0，未完成分钟保持断点。RPM / TPM 按各模型自己的请求数和已记录
              Token
              数计算，上方为查询范围平均速率，悬浮提示为当前时间段平均速率；
              “其他”为其余模型合计，覆盖不完整时显示“—”。
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
});

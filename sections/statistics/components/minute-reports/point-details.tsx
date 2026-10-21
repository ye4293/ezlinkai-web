'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useMinuteReport } from '../../hooks/use-minute-report';
import {
  failureQuery,
  failureRanges,
  formatCount,
  formatDuration,
  formatRate,
  formatStatsTime
} from '@/lib/request-statistics';
import type {
  FailureReport,
  SuccessReport
} from '@/lib/types/request-statistics';
import type { SelectedPoint } from './success-report';
import { MetricGrid, ReportStatus, selectClass } from './shared';

export function PointDetails({
  selected,
  latest,
  admin,
  onClose,
  onSelect
}: {
  selected: SelectedPoint;
  latest: SuccessReport | null;
  admin: boolean;
  onClose: () => void;
  onSelect: (point: SelectedPoint) => void;
}) {
  const { report, point } = selected;
  const [showFailures, setShowFailures] = useState(false);
  const [page, setPage] = useState(1);
  const [rangeIndex, setRangeIndex] = useState(0);
  const ranges = failureRanges(report, point);
  const range = ranges[rangeIndex];
  const failures = useMinuteReport<FailureReport>(
    '/api/statistics/requests',
    showFailures && range
      ? failureQuery(report, point, admin, page, range)
      : null
  );
  const missing =
    point.total_requests === null || point.duration_count === null
      ? null
      : point.total_requests - point.duration_count;
  const newer = latest !== null && latest !== report;
  const newPoint = latest?.timeseries.find(
    (p) =>
      p.effective_start === point.effective_start &&
      p.effective_end === point.effective_end
  );
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-2xl"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          document.getElementById('minute-point')?.focus();
        }}
      >
        <SheetHeader className="pr-6">
          <SheetTitle>时间段统计详情</SheetTitle>
          <SheetDescription>
            {formatStatsTime(point.effective_start)} –{' '}
            {formatStatsTime(point.effective_end)}（不含结束时刻）
            <br />
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {point.incomplete
                ? '仅基于已观察部分'
                : point.total_requests === 0
                ? '已完成 · 无请求'
                : '已完成扫描'}
            </Badge>
            {point.is_partial && (
              <Badge variant="outline">仅统计所选时间范围</Badge>
            )}
          </div>
          {newer && (
            <div className="rounded-md border p-3 text-sm">
              图表已有新结果，当前详情保留点击时的快照。
              {newPoint && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    setShowFailures(false);
                    setPage(1);
                    setRangeIndex(0);
                    onSelect({ report: latest!, point: newPoint });
                  }}
                >
                  更新详情快照
                </Button>
              )}
            </div>
          )}
          <MetricGrid
            items={[
              ['成功率', formatRate(point.success_rate)],
              ['总请求数', formatCount(point.total_requests)],
              ['成功数', formatCount(point.success_count)],
              ['失败数', formatCount(point.failure_count)],
              ['RPM · 次/分钟', formatCount(point.rpm)],
              ['TPM · Token/分钟', formatCount(point.tpm)],
              ['平均耗时', formatDuration(point.avg_duration_ms)],
              ['最小耗时', formatDuration(point.min_duration_ms)],
              ['最大耗时', formatDuration(point.max_duration_ms)],
              ['有效耗时样本', formatCount(point.duration_count)],
              ['未纳入耗时统计', formatCount(missing)]
            ]}
          />
          <div className="space-y-1 break-words rounded-md border p-3 text-sm">
            <p>
              Token 名称包含：
              {report.filters.token_name === undefined ? (
                '全部'
              ) : (
                <span className="whitespace-pre-wrap">
                  {report.filters.token_name}
                </span>
              )}
            </p>
            <p>模型：{report.filters.model_name ?? '全部'}</p>
            {admin ? (
              <>
                <p className="whitespace-pre-wrap">
                  用户名包含：{report.filters.username ?? '全部'}
                </p>
                <p>渠道 ID：{report.filters.channel_id ?? '全部'}</p>
              </>
            ) : (
              <p>用户：当前用户</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            未记录耗时不表示失败；TPM 仅包含已记录的输入与输出
            Token。暂无完整速率时显示“—”。
          </p>
          {ranges.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="minute-failure-range">
                失败明细时间段（每段最多一小时）
              </Label>
              <select
                id="minute-failure-range"
                className={selectClass}
                value={rangeIndex}
                onChange={(e) => {
                  setRangeIndex(Number(e.target.value));
                  setPage(1);
                  setShowFailures(false);
                }}
              >
                {ranges.map((item, i) => (
                  <option key={item.effective_start} value={i}>
                    {formatStatsTime(item.effective_start)} –{' '}
                    {formatStatsTime(item.effective_end)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            disabled={
              !range ||
              point.failure_count === null ||
              point.failure_count === 0
            }
            onClick={() => {
              setPage(1);
              setShowFailures(true);
            }}
          >
            查看失败请求
          </Button>
          {point.failure_count === 0 && (
            <p className="text-xs text-muted-foreground">
              该时间段暂无已统计失败。
            </p>
          )}
          {showFailures && (
            <section
              aria-label="失败请求明细"
              className="space-y-3 border-t pt-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">失败请求明细</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFailures(false)}
                >
                  收起明细
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                日志为当前查询结果，迟到日志、补算和缓存可能使条数与图表快照不同。
              </p>
              <ReportStatus {...failures} hasData={!!failures.data} />
              {failures.loading && (
                <Button variant="ghost" size="sm" onClick={failures.cancel}>
                  取消明细查询
                </Button>
              )}
              {failures.data && (
                <>
                  <p className="text-xs text-muted-foreground">
                    共 {formatCount(failures.data.total)} 条 · 第{' '}
                    {failures.data.page} 页
                  </p>
                  {failures.data.list.length === 0 ? (
                    <p className="py-4 text-sm">当前查询没有失败日志。</p>
                  ) : (
                    <ol className="space-y-3">
                      {failures.data.list.map((log) => (
                        <li
                          key={log.id}
                          className="space-y-2 rounded-lg border p-3 text-sm"
                        >
                          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              #{log.id} · {formatStatsTime(log.created_at)}
                            </span>
                            <span>{formatDuration(log.duration_ms)}</span>
                          </div>
                          <p className="break-all">
                            {log.model_name} · Token：
                            <span className="whitespace-pre-wrap">
                              {log.token_name || '未命名'}
                            </span>
                          </p>
                          <p className="break-all text-xs text-muted-foreground">
                            请求标识：{log.request_id || '未记录'}
                          </p>
                          {admin && (
                            <p className="text-xs text-muted-foreground">
                              用户名：{log.username || '未记录'} · 用户 ID：
                              {log.user_id ?? '—'} · 渠道{' '}
                              {log.channel_id ?? '—'}
                            </p>
                          )}
                          <p className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-2">
                            {log.content || '未记录错误内容'}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1 || failures.loading}
                      onClick={() => setPage((n) => n - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        page * 20 >= failures.data.total ||
                        page * 20 > 10000 ||
                        failures.loading
                      }
                      onClick={() => setPage((n) => n + 1)}
                    >
                      下一页
                    </Button>
                    {page * 20 > 10000 && (
                      <span className="text-xs text-muted-foreground">
                        已达分页上限，请缩小时间或筛选范围。
                      </span>
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import type {
  FailureQuery,
  StatsInterval,
  StatsQuery,
  SuccessPoint,
  SuccessReport
} from './types/request-statistics';

export interface StatsDraft {
  from: string;
  to: string;
  interval: StatsInterval;
  token: string;
  model: string;
  user: string;
  channel: string;
}
export function localMinute(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function defaultStatsDraft(now = new Date()): StatsDraft {
  const end = new Date(Math.floor(now.getTime() / 60000) * 60000);
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  if (start.getTime() === end.getTime()) start.setMinutes(-1);
  return {
    from: localMinute(start),
    to: localMinute(end),
    interval: 'auto',
    token: '',
    model: '',
    user: '',
    channel: ''
  };
}
export function normalizeStatsDraft(
  draft: StatsDraft,
  admin: boolean,
  now = Date.now()
): StatsQuery {
  const start = new Date(draft.from).getTime() / 1000;
  const end = new Date(draft.to).getTime() / 1000;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start % 60 ||
    end % 60 ||
    start >= end
  )
    throw new Error('请选择有效的分钟起止时间，开始必须早于结束。');
  if (end > Math.floor(now / 60000) * 60)
    throw new Error('结束时间不能晚于当前分钟，只统计已结束分钟。');
  const q: StatsQuery = {
    start_timestamp: start,
    end_timestamp: end,
    interval: draft.interval
  };
  if (draft.token.trim() !== '') {
    q.token_name = draft.token;
    if (Array.from(q.token_name).length > 255)
      throw new Error('Token 名称不能超过 255 个字符。');
  }
  if (draft.model !== '') {
    if (
      draft.model.trim() !== draft.model ||
      Array.from(draft.model).length > 200
    )
      throw new Error('模型名称不能包含首尾空白，且不能超过 200 个字符。');
    q.model_name = draft.model;
  }
  if (admin) {
    if (draft.user.trim() !== '') {
      if (Array.from(draft.user).length > 191)
        throw new Error('用户名不能超过 191 个字符。');
      q.username = draft.user;
    }
    if (draft.channel !== '') {
      const n = Number(draft.channel);
      if (!/^\d+$/.test(draft.channel) || !Number.isSafeInteger(n) || n < 0)
        throw new Error('渠道 ID 必须为非负整数。');
      q.channel_id = n;
    }
  }
  const intervals = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600 };
  if (draft.interval !== 'auto' && !intervals[draft.interval])
    throw new Error('无效的时间粒度。');
  // 由后端统一按完整起止范围选择有界粒度，过细的粒度自动提升。

  return q;
}
// 大时间桶的明细按一小时分段查询，沿用现有明细接口预算。
export function failureRanges(report: SuccessReport, point: SuccessPoint) {
  const ranges: Pick<SuccessPoint, 'effective_start' | 'effective_end'>[] = [];
  const start = Math.max(point.effective_start, report.freshness.retained_from);
  const end = Math.min(
    point.effective_end,
    report.freshness.aggregated_before ?? point.effective_end
  );
  for (let from = start; from < end; from += 3600)
    ranges.push({
      effective_start: from,
      effective_end: Math.min(from + 3600, end)
    });
  return ranges;
}
export function failureQuery(
  report: SuccessReport,
  point: SuccessPoint,
  admin: boolean,
  page: number,
  range: Pick<SuccessPoint, 'effective_start' | 'effective_end'> = point
): FailureQuery {
  const { token_name, model_name, username, channel_id } = report.filters;
  return {
    query_type: 'failures',
    metric_version: report.metric_version,
    start_timestamp: range.effective_start,
    end_timestamp: range.effective_end,
    ...(token_name !== undefined ? { token_name } : {}),
    ...(model_name !== undefined ? { model_name } : {}),
    ...(admin && username !== undefined ? { username } : {}),
    ...(admin && channel_id !== undefined ? { channel_id } : {}),
    page,
    pagesize: 20
  };
}
export const formatCount = (n: number | null) =>
  n === null ? '—' : n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
export const formatRate = (n: number | null) =>
  n === null ? '—' : `${(n * 100).toFixed(2)}%`;
export const formatDuration = (n: number | null) =>
  n === null
    ? '无有效耗时'
    : n >= 1000
    ? `${(n / 1000).toLocaleString('zh-CN', { maximumFractionDigits: 3 })} s`
    : `${n.toLocaleString('zh-CN', { maximumFractionDigits: 3 })} ms`;
export const formatStatsTime = (seconds: number) =>
  new Date(seconds * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
export const pointLabel = (p: SuccessPoint) =>
  `${formatStatsTime(p.effective_start)} – ${formatStatsTime(
    p.effective_end
  )} · ${
    p.incomplete
      ? '尚未完整统计'
      : p.total_requests === 0
      ? '无请求'
      : formatRate(p.success_rate)
  }`;
export function modelColor(name: string): string {
  let hash = 0;
  for (const char of Array.from(name))
    hash = (Math.imul(hash, 31) + char.codePointAt(0)!) | 0;
  return `hsl(${(hash >>> 0) % 360} 65% 48%)`;
}

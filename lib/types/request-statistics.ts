export type StatsInterval = 'auto' | '1m' | '5m' | '15m' | '1h';
export interface StatsFilters {
  username?: string;
  token_name?: string;
  model_name?: string;
  channel_id?: number;
}
export interface StatsQuery extends StatsFilters {
  start_timestamp: number;
  end_timestamp: number;
  interval: StatsInterval;
}
export interface StatsMetrics {
  incomplete: boolean;
  total_requests: number | null;
  rpm: number | null;
  tpm: number | null;
}
export interface SuccessMetrics extends StatsMetrics {
  success_count: number | null;
  failure_count: number | null;
  success_rate: number | null;
  duration_count: number | null;
  avg_duration_ms: number | null;
  min_duration_ms: number | null;
  max_duration_ms: number | null;
}
export interface StatsBounds {
  bucket_start: number;
  bucket_end: number;
  effective_start: number;
  effective_end: number;
  is_partial: boolean;
}
export interface SuccessPoint extends StatsBounds, SuccessMetrics {}
export interface ModelPoint extends StatsBounds, StatsMetrics {
  values: Record<string, number | null>;
  rates: Record<string, Pick<StatsMetrics, 'rpm' | 'tpm'>>;
}
export interface StatsFreshness {
  coverage_start: number;
  retained_from: number;
  coverage: 'unknown' | 'observed';
  incomplete: boolean;
  source_healthy: boolean;
  coverage_issues?: string[];
  latest_stored_minute?: number;
  aggregated_before?: number;
  source_mutability: string;
}
interface StatsReport {
  metric_version: number;
  metric_scope: string;
  start_timestamp: number;
  end_timestamp: number;
  interval: string;
  interval_seconds: number;
  filters: StatsFilters;
  freshness: StatsFreshness;
}
export interface SuccessReport extends StatsReport {
  summary: SuccessMetrics;
  timeseries: SuccessPoint[];
}
export interface ModelReport extends StatsReport {
  summary: StatsMetrics;
  timeseries: ModelPoint[];
  top_n: number;
  series: {
    id: string;
    kind: 'model' | 'other';
    model_name?: string;
    label: string;
    summary: StatsMetrics;
  }[];
}
export interface FailureQuery extends StatsFilters {
  query_type: 'failures';
  metric_version: number;
  start_timestamp: number;
  end_timestamp: number;
  page: number;
  pagesize: number;
}
export interface FailureReport {
  metric_version: number;
  page: number;
  pagesize: number;
  total: number;
  list: {
    id: number;
    request_id: string;
    created_at: number;
    duration_ms: number | null;
    model_name: string;
    token_name: string;
    content: string;
    user_id?: number;
    username?: string;
    channel_id?: number;
  }[];
}

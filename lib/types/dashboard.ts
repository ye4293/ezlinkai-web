import { Result } from '@/lib/types/common';
import type { StatsBounds, StatsFreshness } from './request-statistics';

export interface Dashboard {
  current_quota: number;
  used_quota: number;
  tpm: number;
  rpm: number;
  quota_pm: number;
  request_pd: number;
  used_pd: number;
  model_stats?: ModelStat[];
}

export interface ModelStat {
  model_name: string;
  quota_sum: number;
}

export interface DashboardResult extends Result {
  data: Dashboard;
}

export interface GraphData {
  hour: string;
  amount: number;
}

export interface GraphResult extends Result {
  data: GraphData[];
}

export interface ModelUsageMetrics {
  total_requests: number | null;
  used_quota_usd: string | null;
  incomplete: boolean;
  amount_incomplete: boolean;
}

export interface ModelUsageHour extends StatsBounds, ModelUsageMetrics {
  values: Record<string, ModelUsageMetrics>;
}

export interface ModelUsageReport {
  start_timestamp: number;
  end_timestamp: number;
  aggregated_until: number;
  freshness: StatsFreshness;
  summary: ModelUsageMetrics;
  series: {
    id: string;
    model_name: string;
    summary: ModelUsageMetrics;
  }[];
  timeseries: ModelUsageHour[];
}

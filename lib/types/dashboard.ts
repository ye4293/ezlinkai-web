import { Result } from '@/lib/types/common';

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

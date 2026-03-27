// 模型监控相关类型

export interface ModelMetricsMini {
  success_rate: number;
  avg_latency: number;
  avg_speed: number;
  total_requests_24h: number;
  status: 'healthy' | 'degraded' | 'down' | 'no_data';
}

export interface ModelMetricsCurrentStats {
  rpm: number;
  tpm: number;
  success_rate: number;
  avg_latency: number;
  avg_speed: number;
  avg_first_word: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
}

export interface ModelMetricsPeriod24h {
  total_requests: number;
  success_rate: number;
  avg_latency: number;
  avg_speed: number;
  total_tokens: number;
}

export interface ChannelMetrics {
  channel_id: number;
  channel_name: string;
  success_rate: number;
  avg_latency: number;
  avg_speed: number;
  total_requests_24h: number;
}

export interface ModelMetricsDetail {
  model_name: string;
  provider: string;
  current: ModelMetricsCurrentStats | null;
  period_24h: ModelMetricsPeriod24h | null;
  pricing: import('./model-plaza').ModelPlazaItem | null;
  channels: ChannelMetrics[] | null; // 仅管理员
}

export interface MetricsTimeSeriesPoint {
  timestamp: number;
  total_requests: number;
  success_rate: number;
  avg_latency: number;
  avg_speed: number;
  avg_first_word: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface MetricsTimeSeriesResponse {
  model_name: string;
  period: string;
  points: MetricsTimeSeriesPoint[];
}

export type MetricsPeriod = '1h' | '24h' | '7d' | '30d';

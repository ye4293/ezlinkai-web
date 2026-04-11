// 请求耗时统计相关类型

export interface LogStatSummary {
  /** 总请求数 */
  total_requests: number;
  /** 平均耗时（秒） */
  avg_duration: number;
  /** P50 耗时（秒） */
  p50_duration: number;
  /** P95 耗时（秒） */
  p95_duration: number;
  /** P99 耗时（秒） */
  p99_duration: number;
  /** 平均首字延迟（秒） */
  avg_first_word_latency: number;
  /** P95 首字延迟（秒） */
  p95_first_word_latency: number;
  /** 平均生成速度（tokens/秒） */
  avg_speed: number;
  /** 成功请求数 */
  success_count: number;
  /** 错误请求数 */
  error_count: number;
}

export interface LogStatTimeSeriesPoint {
  /** 时间桶起始时间戳（unix秒） */
  timestamp: number;
  /** 该时间桶内的请求数 */
  total_requests: number;
  /** 平均耗时（秒） */
  avg_duration: number;
  /** 平均首字延迟（秒） */
  avg_first_word_latency: number;
  /** 平均生成速度（tokens/秒） */
  avg_speed: number;
  /** 成功率 (0-1) */
  success_rate: number;
}

export interface LogStatData {
  summary: LogStatSummary;
  timeseries: LogStatTimeSeriesPoint[];
}

export interface LogStatResponse {
  success: boolean;
  data: LogStatData;
  message?: string;
}

export type TimeBucket = '5m' | '15m' | '1h';

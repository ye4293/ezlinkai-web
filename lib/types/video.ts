export interface VideoStat {
  created_at: number;
  task_id: string;
  type: string;
  provider: string;
  mode: string;
  duration: string;
  username: string;
  channel_id: number;
  user_id: number;
  model: string;
  status: string;
  fail_reason: string;
  store_url: string;
  quota: number;
  n: number;
}

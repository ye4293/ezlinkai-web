export interface ImageStat {
  task_id: string;
  username: string;
  channel_id: number;
  user_id: number;
  model: string;
  status: string;
  fail_reason: string;
  image_id: string;
  store_url: string;
  provider: string;
  created_at: number;
  mode: string;
  n: number;
  quota: number;
}

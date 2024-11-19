export interface MidjourneyStat {
  submit_time: number;
  action: string;
  mj_id: string;
  type: string;
  status: string;
  progress: string;
  start_time: number;
  finish_time: number;
  image_url: string;
  prompt: string;
  fail_reason: string;
  quota: number;
}

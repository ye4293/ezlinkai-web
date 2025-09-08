export interface LogStat {
  id: number;
  /** 类型 */
  type: number;
  /** 用户名 */
  username?: string;
  /** 令牌名称 */
  token_name: string;
  /** 模型名称 */
  model_name: string;
  /** 起始时间 */
  start_timestamp: number;
  /** 结束时间 */
  end_timestamp: number;
  /** 渠道ID */
  channel?: number;
  /** 创建时间 */
  created_at: number;
  /** 内容 */
  content: string;
  /** 提示词令牌数 */
  prompt_tokens: number;
  /** 完成令牌数 */
  completion_tokens: number;
  /** 配额 */
  quota: number;
  /** 持续时间 */
  duration: number;
  /** 是否为流式请求 */
  is_stream: boolean | number; // 支持数据库中的 0/1 格式
  /** 首字延迟 */
  first_word_latency: number;
  /** 速度 */
  speed?: number;
  /** HTTP 引用 */
  http_referer?: string;
  /** 标题 */
  title?: string;
  /** 其他信息 */
  other?: string;
}

export type LogDataResult = {
  quota: number;
};

export interface LogStatResult {
  data?: LogDataResult;
  success: boolean;
  message: string;
}

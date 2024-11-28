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
}

export type LogDataResult = {
  quota: number;
};

export interface LogStatResult {
  data?: LogDataResult;
  success: boolean;
  message: string;
}

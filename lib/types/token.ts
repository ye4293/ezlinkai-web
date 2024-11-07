/** 令牌表单 */
export interface TokenForm {
  id?: number;
  /** 名称 */
  name: string;
  /** 过期时间 */
  expired_time: number;
  /** 额度 */
  remain_quota: number;
  /** 是否是无限额度 */
  unlimited_quota: boolean;
  /** 预警额度 */
  token_remind_threshold: number;
}

/** 令牌返回结果 */
export interface Token {
  id?: number;
  /** 状态 */
  status?: number;
  status_only?: boolean;
  /** 名称 */
  name?: string;
  /** 过期时间 */
  expired_time?: number;
  /** 额度 */
  remain_quota?: number;
  /** 是否是无限额度 */
  unlimited_quota?: boolean;
  /** 预警额度 */
  token_remind_threshold?: number;
  key: string;
}

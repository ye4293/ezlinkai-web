/** 兑换码表单 */
export interface RedemptionForm {
  id?: number;
  /** 名称 */
  name: string;
  /** 额度 */
  quota: number;
  /** 生成数量 */
  count: number;
}

/** 兑换码返回结果 */
export interface Redemption {
  id?: number;
  /** 用户 */
  user_id?: number;
  /** 状态 */
  status?: number;
  status_only?: boolean;
  /** 名称 */
  name?: string;
  /** 创建时间 */
  created_time?: number;
  /** 兑换时间 */
  redeemed_time?: number;
  /** 额度 */
  quota?: number;
  /** 生成数量 */
  count?: number;
}

/** 充值金额 */
export interface ChargeAmount {
  charge_id: number;
}

export interface CommonOperationalSettings {
  /** 充值链接 */
  TopUpLink: string;
  /** 聊天页面链接 */
  ChatLink: string;
  /** 单位美元额度 */
  QuotaPerUnit: number;
  /** 失败重试次数 */
  RetryTimes: number;
  // /** 以货币形式显示额度 */
  // DisplayInCurrencyEnabled: boolean;
  // /** Billing 相关 API 显示令牌额度而非用户额度 */
  // DisplayTokenStatEnabled: boolean;
  // /** 使用近似的方式估算 token 数以减少计算量 */
  // ApproximateTokenEnabled: boolean;
  // /** 启用额度消费日志记录 */
  // LogConsumeEnabled: boolean;
  /** 目标时间 */
  history_timestamp: Date;
  /** 最长响应时间 */
  ChannelDisableThreshold: number;
  /** 额度提醒阈值 */
  QuotaRemindThreshold: number;
  // /** 失败时自动禁用通道 */
  // AutomaticDisableChannelEnabled: boolean;
  // /** 成功时自动启用通道 */
  // AutomaticEnableChannelEnabled: boolean;
  /** 新用户初始额度 */
  QuotaForNewUser: number;
  /** 请求预扣费额度 */
  PreConsumedQuota: number;
  /** 邀请新用户奖励额度 */
  QuotaForInviter: number;
  /** 新用户使用邀请码奖励额度 */
  QuotaForInvitee: number;
  /** 模型倍率 */
  ModelRatio: string;
  /** 补全倍率 */
  CompletionRatio: string;
  /** 分组倍率 */
  GroupRatio: string;
}

export interface OperationalSettingsRequest extends CommonOperationalSettings {
  /** 以货币形式显示额度 */
  DisplayInCurrencyEnabled: string;
  /** Billing 相关 API 显示令牌额度而非用户额度 */
  DisplayTokenStatEnabled: string;
  /** 使用近似的方式估算 token 数以减少计算量 */
  ApproximateTokenEnabled: string;
  /** 启用额度消费日志记录 */
  LogConsumeEnabled: string;
  /** 失败时自动禁用通道 */
  AutomaticDisableChannelEnabled: string;
  /** 成功时自动启用通道 */
  AutomaticEnableChannelEnabled: string;
}

export interface OperationalSettings extends CommonOperationalSettings {
  /** 以货币形式显示额度 */
  DisplayInCurrencyEnabled: boolean;
  /** Billing 相关 API 显示令牌额度而非用户额度 */
  DisplayTokenStatEnabled: boolean;
  /** 使用近似的方式估算 token 数以减少计算量 */
  ApproximateTokenEnabled: boolean;
  /** 启用额度消费日志记录 */
  LogConsumeEnabled: boolean;
  /** 失败时自动禁用通道 */
  AutomaticDisableChannelEnabled: boolean;
  /** 成功时自动启用通道 */
  AutomaticEnableChannelEnabled: boolean;
}

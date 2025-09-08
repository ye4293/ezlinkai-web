/** 渠道表单 */
export interface ChannelForm {
  id?: number;
  /** 名称 */
  name: string;
  /** 类型 */
  type: number;
  /** 密钥 */
  key: string;
  /** 代理 */
  base_url: string;
  /** 其他 */
  other: string;

  /** 模型重定向 */
  model_mapping: string;
  /** 模型 */
  models: Array<string>;
  /** 分组 */
  groups: Array<string>;
  /** 渠道倍率 */
  channel_ratio?: number;
}

/** 渠道返回结果 */
export interface Channel {
  id?: number;
  /** 状态 */
  status?: number;
  /** 名称 */
  name?: string;
  /** 类型 */
  type?: number;
  /** 密钥 */
  key?: string;
  /** 代理 */
  base_url?: string;
  /** 其他 */
  other?: string;
  /** 模型重定向 */
  model_mapping?: string;
  /** 模型 */
  models?: string;
  /** 分组 */
  group?: string;
  /** 优先级 */
  priority?: number;
  /** 权重 */
  weight?: number;
  /** 渠道倍率 */
  channel_ratio?: number;
  response_time?: number;
  test_time?: number;
  /** 已使用配额 */
  used_quota?: number;
  /** 自动禁用 */
  auto_disabled?: boolean;
  /** 多密钥信息 */
  multi_key_info?: {
    is_multi_key: boolean;
    key_selection_mode?: number;
    batch_import_mode?: number;
    key_count?: number;
    key_status_list?: { [key: number]: number };
    key_metadata?: { [key: number]: any };
    enabled_key_count?: number;
    polling_index?: number;
    last_batch_import_time?: number;
  };
  /** 自动禁用原因 */
  auto_disabled_reason?: string;
  /** 自动禁用时间 */
  auto_disabled_time?: number;
  /** 导致禁用的模型 */
  auto_disabled_model?: string;
  /** 余额 */
  balance?: number;
}

export type ModelResult = {
  // success: boolean;
  data?: Array<any>;
};

/** 测试渠道返回结果 */
export type TestResult = {
  success: boolean;
  message: string;
  time: number;
};

/** 更新单个channel参数 */
export type ChannelBalanceParams = {
  id: number;
};

/** 更新单个channel余额返回结果 */
export type ChannelBalanceResult = {
  balance?: Channel;
  message: string;
  success: boolean;
};

/** 更新单个channel返回结果 */
export type ChannelResult = {
  data?: number;
  message: string;
  success: boolean;
};

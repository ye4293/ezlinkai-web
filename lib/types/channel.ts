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
  response_time?: number;
  test_time?: number;
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

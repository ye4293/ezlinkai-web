export type UserLoginResult = {
  data?: {
    /** 用户名 */
    username: string;
    /** 当前登陆用户的角色 */
    role: number;
  };
  success: boolean;
  message: string;
};

export interface UserInfo {
  /** 用户名 */
  username?: string;
  /** 当前登陆用户的角色 */
  roles?: Array<string>;
  /** 是否是管理员 */
  isAdmin?: boolean;
}

export interface UserSelf {
  access_token: string;
  aff_code: string;
  display_name: string;
  email: string;
  github_id: string;
  google_id: string;
  group: string;
  id: number;
  inviter_id: number;
  password: string;
  quota: number;
  request_count: number;
  role: number;
  status: number;
  used_quota: number;
  user_remind_threshold: number;
  username: string;
  verification_code: string;
  wechat_id: string;
}

export type UserSelfResult = {
  data?: UserSelf;
  success: boolean;
  message: string;
};

export interface SystemStatus {
  chat_link: string;
  display_in_currency: boolean;
  email_verification: boolean;
  footer_html: string;
  github_client_id: string;
  github_oauth: boolean;
  logo: string;
  quota_per_unit: number;
  server_address: string;
  start_time: number;
  system_name: string;
  top_up_link: string;
  turnstile_check: boolean;
  turnstile_site_key: string;
  version: string;
  wechat_login: boolean;
  wechat_qrcode: string;
}

export type SystemResult = {
  data?: SystemStatus;
  success: boolean;
  message: string;
};

export type CreateUser = {
  id?: number;
  username: string;
  display_name: string;
  password: string;
  group?: string;
  groupOptions?: Array<string>;
  quota?: number;
  user_remind_threshold?: number;
  github_id?: string;
  wechat_id?: string;
  email?: string;
};

export type ManageUser = {
  action: string;
  username: string;
};

export type DashboardParams = {
  time: number;
};

export interface DashboardDataResult {
  TotalQuota: number | string;
  TotalTokens: number | string;
  LogCount: number | string;
}

export type DashboardResult = {
  data?: DashboardDataResult;
  success: boolean;
  message: string;
};

export type DashboardDataGraphResult = Array<any>;

export type DashboardGraphResult = {
  data?: DashboardDataGraphResult;
  success: boolean;
  message: string;
};

export type ValueOptions = 'quota' | 'token' | 'count';

export type GraphParams = {
  target: ValueOptions;
  time: number;
};

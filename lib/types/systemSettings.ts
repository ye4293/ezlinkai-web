export interface CommonSystemSettings {
  /** 服务器地址 */
  ServerAddress: string;
  /** 允许的邮箱域名 */
  // EmailDomainWhitelist: Array<string>;
  /** 新的允许的邮箱域名 */
  NewEmailDomainWhitelist: string;
  /** 回调地址 */
  CryptCallbackUrl: string;
  /** 接收地址 */
  AddressOut: string;
  /** SMTP 服务器地址 */
  SMTPServer: string;
  /** SMTP 端口 */
  SMTPPort: string;
  /** SMTP 账户 */
  SMTPAccount: string;
  /** SMTP 发送者邮箱 */
  SMTPFrom: string;
  /** SMTP 访问凭证 */
  SMTPToken: string;
  /** GitHub Client ID */
  GitHubClientId: string;
  /** GitHub Client Secret */
  GitHubClientSecret: string;
  /** WeChat Server 服务器地址 */
  WeChatServerAddress: string;
  /** WeChat Server 访问凭证 */
  WeChatServerToken: string;
  /** 微信公众号二维码图片链接 */
  WeChatAccountQRCodeImageURL: string;
  /** Turnstile Site Key */
  TurnstileSiteKey: string;
  /** Turnstile Secret Key */
  TurnstileSecretKey: string;
}

export interface SystemSettingsRequest extends CommonSystemSettings {
  /** 允许的邮箱域名 */
  EmailDomainWhitelist: string;
  /** 允许通过密码进行登录 */
  PasswordLoginEnabled: string;
  /** 允许通过密码进行注册 */
  PasswordRegisterEnabled: string;
  /** 通过密码注册时需要进行邮箱验证 */
  EmailVerificationEnabled: string;
  /** 允许通过 GitHub 账户登录 & 注册 */
  GitHubOAuthEnabled: string;
  /** 允许通过微信登录 & 注册 */
  WeChatAuthEnabled: string;
  /** 允许新用户注册（此项为否时，新用户将无法以任何方式进行注册） */
  RegisterEnabled: string;
  /** 启用 Turnstile 用户校验 */
  TurnstileCheckEnabled: string;
  /** 启用 CryptPaymentEnabled */
  CryptPaymentEnabled: string;
  /** 启用邮箱域名白名单 */
  EmailDomainRestrictionEnabled: string;
}

export interface SystemSettings extends CommonSystemSettings {
  /** 允许的邮箱域名 */
  EmailDomainWhitelist: Array<string>;
  /** 允许通过密码进行登录 */
  PasswordLoginEnabled: boolean;
  /** 允许通过密码进行注册 */
  PasswordRegisterEnabled: boolean;
  /** 通过密码注册时需要进行邮箱验证 */
  EmailVerificationEnabled: boolean;
  /** 允许通过 GitHub 账户登录 & 注册 */
  GitHubOAuthEnabled: boolean;
  /** 允许通过微信登录 & 注册 */
  WeChatAuthEnabled: boolean;
  /** 允许新用户注册（此项为否时，新用户将无法以任何方式进行注册） */
  RegisterEnabled: boolean;
  /** 启用 Turnstile 用户校验 */
  TurnstileCheckEnabled: boolean;
  /** 启用 CryptPaymentEnabled */
  CryptPaymentEnabled: boolean;
  /** 启用邮箱域名白名单 */
  EmailDomainRestrictionEnabled: boolean;
}

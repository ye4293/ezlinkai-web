'use client';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Save,
  Mail,
  MessageSquare,
  SendHorizontal,
  HardDrive
} from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '系统设置', link: '/dashboard/setting' }
];

interface Option {
  key: string;
  value: any;
}

export default function SettingPage() {
  // ==================== 通用设置状态 ====================
  const [systemName, setSystemName] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [autoDisableEnabled, setAutoDisableEnabled] = useState(false);
  const [autoDisableKeywords, setAutoDisableKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== 提醒设置状态 ====================
  // SMTP 邮箱配置
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpAccount, setSmtpAccount] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpToken, setSmtpToken] = useState('');
  const [smtpSSLEnabled, setSmtpSSLEnabled] = useState(false);

  // 飞书 Webhook 配置（支持多个，每行一个）
  const [feishuWebhookUrls, setFeishuWebhookUrls] = useState('');

  // ==================== S3/R2 存储配置状态 ====================
  const [cfR2storeEnabled, setCfR2storeEnabled] = useState(false);
  const [cfBucketFileName, setCfBucketFileName] = useState('');
  const [cfFileAccessKey, setCfFileAccessKey] = useState('');
  const [cfFileSecretKey, setCfFileSecretKey] = useState('');
  const [cfFileEndpoint, setCfFileEndpoint] = useState('');
  const [cfFilePublicUrl, setCfFilePublicUrl] = useState('');

  // 测试相关状态
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // 获取设置数据
  const fetchOptions = async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch('/api/option');
      if (!response.ok) {
        throw new Error('Failed to fetch options');
      }
      const result = await response.json();
      if (result.success && result.data) {
        const options = result.data;

        // 加载系统名称
        const systemNameOption = options.find(
          (o: Option) => o.key === 'SystemName'
        );
        if (systemNameOption) {
          setSystemName(systemNameOption.value || '');
        }

        const retryCountOption = options.find(
          (o: Option) => o.key === 'RetryTimes'
        );
        if (retryCountOption) {
          setRetryCount(parseInt(retryCountOption.value) || 0);
        }

        const autoDisableEnabledOption = options.find(
          (o: Option) => o.key === 'AutomaticDisableChannelEnabled'
        );
        if (autoDisableEnabledOption) {
          setAutoDisableEnabled(
            autoDisableEnabledOption.value === 'true' ||
              autoDisableEnabledOption.value === true
          );
        }

        const autoDisableKeywordsOption = options.find(
          (o: Option) => o.key === 'AutoDisableKeywords'
        );
        if (autoDisableKeywordsOption) {
          setAutoDisableKeywords(autoDisableKeywordsOption.value || '');
        }

        // ==================== 加载提醒设置 ====================
        // SMTP 配置
        const smtpServerOption = options.find(
          (o: Option) => o.key === 'SMTPServer'
        );
        if (smtpServerOption) {
          setSmtpServer(smtpServerOption.value || '');
        }

        const smtpPortOption = options.find(
          (o: Option) => o.key === 'SMTPPort'
        );
        if (smtpPortOption) {
          setSmtpPort(smtpPortOption.value || '');
        }

        const smtpAccountOption = options.find(
          (o: Option) => o.key === 'SMTPAccount'
        );
        if (smtpAccountOption) {
          setSmtpAccount(smtpAccountOption.value || '');
        }

        const smtpFromOption = options.find(
          (o: Option) => o.key === 'SMTPFrom'
        );
        if (smtpFromOption) {
          setSmtpFrom(smtpFromOption.value || '');
        }

        const smtpSSLOption = options.find(
          (o: Option) => o.key === 'SMTPSSLEnabled'
        );
        if (smtpSSLOption) {
          setSmtpSSLEnabled(
            smtpSSLOption.value === 'true' || smtpSSLOption.value === true
          );
        }

        // 飞书 Webhook 配置（支持多个）
        const feishuWebhookOption = options.find(
          (o: Option) => o.key === 'FeishuWebhookUrls'
        );
        if (feishuWebhookOption) {
          setFeishuWebhookUrls(feishuWebhookOption.value || '');
        }

        // ==================== 加载 S3/R2 存储配置 ====================
        const cfR2storeEnabledOption = options.find(
          (o: Option) => o.key === 'CfR2storeEnabled'
        );
        if (cfR2storeEnabledOption) {
          setCfR2storeEnabled(
            cfR2storeEnabledOption.value === 'true' ||
              cfR2storeEnabledOption.value === true
          );
        }

        const cfBucketFileNameOption = options.find(
          (o: Option) => o.key === 'CfBucketFileName'
        );
        if (cfBucketFileNameOption) {
          setCfBucketFileName(cfBucketFileNameOption.value || '');
        }

        const cfFileAccessKeyOption = options.find(
          (o: Option) => o.key === 'CfFileAccessKey'
        );
        if (cfFileAccessKeyOption) {
          setCfFileAccessKey(cfFileAccessKeyOption.value || '');
        }

        const cfFileEndpointOption = options.find(
          (o: Option) => o.key === 'CfFileEndpoint'
        );
        if (cfFileEndpointOption) {
          setCfFileEndpoint(cfFileEndpointOption.value || '');
        }

        const cfFilePublicUrlOption = options.find(
          (o: Option) => o.key === 'CfFilePublicUrl'
        );
        if (cfFilePublicUrlOption) {
          setCfFilePublicUrl(cfFilePublicUrlOption.value || '');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 保存系统名称
      const systemNameResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'SystemName',
          value: systemName
        })
      });

      if (!systemNameResponse.ok) {
        throw new Error('Failed to save system name');
      }

      // 保存重试次数
      const retryResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'RetryTimes',
          value: retryCount.toString()
        })
      });

      if (!retryResponse.ok) {
        throw new Error('Failed to save retry count');
      }

      // 保存自动禁用开关
      const autoDisableEnabledResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'AutomaticDisableChannelEnabled',
          value: autoDisableEnabled.toString()
        })
      });

      if (!autoDisableEnabledResponse.ok) {
        throw new Error('Failed to save auto disable enabled setting');
      }

      // 保存自动禁用关键词
      const keywordResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'AutoDisableKeywords',
          value: autoDisableKeywords
        })
      });

      if (!keywordResponse.ok) {
        throw new Error('Failed to save auto disable keywords');
      }

      toast.success('设置保存成功！');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryCountChange = (value: string) => {
    const count = parseInt(value);
    if (!isNaN(count) && count >= 0) {
      setRetryCount(count);
    }
  };

  // ==================== 保存 SMTP 设置 ====================
  const handleSaveSMTP = async () => {
    setIsLoading(true);
    try {
      const smtpOptions = [
        { key: 'SMTPServer', value: smtpServer },
        { key: 'SMTPPort', value: smtpPort },
        { key: 'SMTPAccount', value: smtpAccount },
        { key: 'SMTPFrom', value: smtpFrom },
        { key: 'SMTPSSLEnabled', value: smtpSSLEnabled.toString() }
      ];

      // 只有当 smtpToken 不为空时才更新（敏感信息）
      if (smtpToken) {
        smtpOptions.push({ key: 'SMTPToken', value: smtpToken });
      }

      for (const option of smtpOptions) {
        const response = await fetch('/api/option', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(option)
        });
        if (!response.ok) {
          throw new Error(`Failed to save ${option.key}`);
        }
      }

      toast.success('SMTP 设置保存成功！');
      setSmtpToken(''); // 清空密码输入框
    } catch (error) {
      console.error('Save SMTP error:', error);
      toast.error('保存 SMTP 设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 保存飞书设置 ====================
  const handleSaveFeishu = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/option', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'FeishuWebhookUrls',
          value: feishuWebhookUrls
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save Feishu webhook');
      }

      toast.success('飞书 Webhook 设置保存成功！');
    } catch (error) {
      console.error('Save Feishu error:', error);
      toast.error('保存飞书设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 保存 S3/R2 存储设置 ====================
  const handleSaveStorage = async () => {
    setIsLoading(true);
    try {
      const storageOptions = [
        { key: 'CfR2storeEnabled', value: cfR2storeEnabled.toString() },
        { key: 'CfBucketFileName', value: cfBucketFileName },
        { key: 'CfFileEndpoint', value: cfFileEndpoint },
        { key: 'CfFilePublicUrl', value: cfFilePublicUrl }
      ];

      // 只有当 AccessKey 不为空时才更新（敏感信息）
      if (cfFileAccessKey) {
        storageOptions.push({ key: 'CfFileAccessKey', value: cfFileAccessKey });
      }

      // 只有当 SecretKey 不为空时才更新（敏感信息）
      if (cfFileSecretKey) {
        storageOptions.push({ key: 'CfFileSecretKey', value: cfFileSecretKey });
      }

      for (const option of storageOptions) {
        const response = await fetch('/api/option', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(option)
        });
        if (!response.ok) {
          throw new Error(`Failed to save ${option.key}`);
        }
      }

      toast.success('S3/R2 存储设置保存成功！');
      setCfFileAccessKey(''); // 清空密钥输入框
      setCfFileSecretKey('');
    } catch (error) {
      console.error('Save Storage error:', error);
      toast.error('保存存储设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 测试 SMTP 邮件发送 ====================
  const handleTestSMTP = async () => {
    if (!testEmail) {
      toast.error('请输入测试邮箱地址');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/test/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('测试邮件发送成功，请检查收件箱！');
      } else {
        toast.error(result.message || '测试邮件发送失败');
      }
    } catch (error) {
      console.error('Test SMTP error:', error);
      toast.error('测试邮件发送失败，请检查 SMTP 配置');
    } finally {
      setIsTesting(false);
    }
  };

  // ==================== 测试飞书 Webhook ====================
  const handleTestFeishu = async () => {
    if (!feishuWebhookUrls.trim()) {
      toast.error('请先填写飞书 Webhook URL');
      return;
    }

    // 解析多个 Webhook URL（按行分割，过滤空行）
    const urls = feishuWebhookUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast.error('请填写至少一个有效的 Webhook URL');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/test/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrls: urls })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`飞书测试消息发送成功！共 ${urls.length} 个 Webhook`);
      } else {
        toast.error(result.message || '飞书测试消息发送失败');
      }
    } catch (error) {
      console.error('Test Feishu error:', error);
      toast.error('飞书测试失败，请检查 Webhook URL');
    } finally {
      setIsTesting(false);
    }
  };

  if (error)
    return <div className="p-4 text-red-500">加载设置失败: {error}</div>;
  if (isDataLoading) return <div className="p-4">加载中...</div>;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">系统设置</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
        <Separator />

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>通用设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="system-name">系统名称</Label>
                <Input
                  id="system-name"
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="例如：生产环境、客户A站点"
                />
                <p className="text-sm text-muted-foreground">
                  设置系统名称后，所有推送消息（邮件、飞书等）都会带上此名称前缀，方便区分不同站点
                </p>
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="retry-count">失败重试次数</Label>
                <Input
                  id="retry-count"
                  type="number"
                  min="0"
                  max="10"
                  value={retryCount}
                  onChange={(e) => handleRetryCountChange(e.target.value)}
                  placeholder="请输入重试次数"
                />
                <p className="text-sm text-muted-foreground">
                  当上游渠道返回 5xx
                  错误或超时时，系统将进行重试，请合理设置重试次数
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>自动禁用渠道</CardTitle>
              <CardDescription>
                当响应返回信息包含如下关键词时，将自动禁用该渠道。一行一个关键词，支持大小写不敏感匹配。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 自动禁用开关 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="auto-disable-enabled"
                    className="text-base font-medium"
                  >
                    启用自动禁用
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    开启后，当渠道返回包含特定关键词的错误时，系统将自动禁用该渠道
                  </p>
                </div>
                <Switch
                  id="auto-disable-enabled"
                  checked={autoDisableEnabled}
                  onCheckedChange={setAutoDisableEnabled}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="auto-disable-keywords">自动禁用关键词</Label>
                <Textarea
                  id="auto-disable-keywords"
                  value={autoDisableKeywords}
                  onChange={(e) => setAutoDisableKeywords(e.target.value)}
                  placeholder="一行一个关键词，例如：&#10;api key not valid&#10;permission denied&#10;insufficient_quota&#10;consumer&#10;has been suspended"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  包括API密钥错误、余额不足、权限问题、账户被暂停等各种需要自动禁用的错误关键词
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ==================== 提醒设置 ==================== */}
          <Separator className="my-6" />
          <h3 className="text-xl font-semibold tracking-tight">提醒设置</h3>

          {/* SMTP 邮箱配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                配置 SMTP
              </CardTitle>
              <CardDescription>
                用以支持系统的邮件发送，如验证码、通知等
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP 服务器地址</Label>
                  <Input
                    id="smtp-server"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    placeholder="例如：smtp.qq.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP 端口</Label>
                  <Input
                    id="smtp-port"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="例如：465 或 587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-account">SMTP 账户</Label>
                  <Input
                    id="smtp-account"
                    value={smtpAccount}
                    onChange={(e) => setSmtpAccount(e.target.value)}
                    placeholder="登录 SMTP 服务器的账户"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">SMTP 发送者邮箱</Label>
                  <Input
                    id="smtp-from"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="发送邮件时显示的邮箱地址"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-token">SMTP 访问凭证</Label>
                  <Input
                    id="smtp-token"
                    type="password"
                    value={smtpToken}
                    onChange={(e) => setSmtpToken(e.target.value)}
                    placeholder="敏感信息不会发送到前端显示"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="smtp-ssl"
                    checked={smtpSSLEnabled}
                    onCheckedChange={setSmtpSSLEnabled}
                  />
                  <Label htmlFor="smtp-ssl">启用 SMTP SSL</Label>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <Button onClick={handleSaveSMTP} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  保存 SMTP 设置
                </Button>

                {/* 测试 SMTP */}
                <div className="flex items-end gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">测试邮箱</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="输入接收测试邮件的邮箱"
                      className="w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestSMTP}
                    disabled={isTesting || !smtpServer}
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    {isTesting ? '发送中...' : '发送测试邮件'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 飞书 Webhook 配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                配置飞书提醒
              </CardTitle>
              <CardDescription>
                用以支持系统通过飞书 Webhook 发送通知提醒，支持配置多个 Webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feishu-webhook">飞书 Webhook URL</Label>
                <Textarea
                  id="feishu-webhook"
                  value={feishuWebhookUrls}
                  onChange={(e) => setFeishuWebhookUrls(e.target.value)}
                  placeholder="一行一个 Webhook URL，例如：&#10;https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx&#10;https://open.feishu.cn/open-apis/bot/v2/hook/yyyyyyyy"
                  className="h-32 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  在飞书群组中添加自定义机器人后获取的 Webhook
                  地址。支持填写多个，每行一个，系统将向所有配置的 Webhook
                  发送通知。
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSaveFeishu} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  保存飞书设置
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestFeishu}
                  disabled={isTesting || !feishuWebhookUrls.trim()}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {isTesting ? '发送中...' : '发送测试消息'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ==================== 存储设置 ==================== */}
          <Separator className="my-6" />
          <h3 className="text-xl font-semibold tracking-tight">存储设置</h3>

          {/* S3/R2 存储配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                配置 S3/R2 存储
              </CardTitle>
              <CardDescription>
                配置 S3 兼容的对象存储服务（如 Cloudflare R2、阿里云 OSS、AWS
                S3），用于存储生成的图片和视频文件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 启用开关 */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="cf-r2store-enabled"
                    className="text-base font-medium"
                  >
                    启用 S3/R2 存储
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    开启后，生成的图片和视频将上传到 S3 兼容存储并返回 URL
                  </p>
                </div>
                <Switch
                  id="cf-r2store-enabled"
                  checked={cfR2storeEnabled}
                  onCheckedChange={setCfR2storeEnabled}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cf-file-endpoint">S3 端点 (Endpoint)</Label>
                  <Input
                    id="cf-file-endpoint"
                    value={cfFileEndpoint}
                    onChange={(e) => setCfFileEndpoint(e.target.value)}
                    placeholder="例如：https://xxx.r2.cloudflarestorage.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    S3 兼容服务的端点 URL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf-bucket-filename">
                    存储桶名称 (Bucket)
                  </Label>
                  <Input
                    id="cf-bucket-filename"
                    value={cfBucketFileName}
                    onChange={(e) => setCfBucketFileName(e.target.value)}
                    placeholder="例如：my-bucket"
                  />
                  <p className="text-xs text-muted-foreground">
                    存储文件的桶名称
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cf-file-publicurl">公共访问 URL (可选)</Label>
                <Input
                  id="cf-file-publicurl"
                  value={cfFilePublicUrl}
                  onChange={(e) => setCfFilePublicUrl(e.target.value)}
                  placeholder="例如：https://file.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  用于生成可公开访问的文件链接。Cloudflare R2 需配置自定义域；若
                  S3 端点本身支持公开访问（如 Rains3），可留空。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cf-file-accesskey">Access Key ID</Label>
                  <Input
                    id="cf-file-accesskey"
                    type="password"
                    value={cfFileAccessKey}
                    onChange={(e) => setCfFileAccessKey(e.target.value)}
                    placeholder="敏感信息不会发送到前端显示"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cf-file-secretkey">Secret Access Key</Label>
                  <Input
                    id="cf-file-secretkey"
                    type="password"
                    value={cfFileSecretKey}
                    onChange={(e) => setCfFileSecretKey(e.target.value)}
                    placeholder="敏感信息不会发送到前端显示"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>支持的 S3 兼容服务：</strong>
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                  <li>Cloudflare R2</li>
                  <li>阿里云 OSS（使用 S3 兼容端点）</li>
                  <li>AWS S3</li>
                  <li>MinIO</li>
                  <li>其他 S3 兼容服务</li>
                </ul>
              </div>

              <Button onClick={handleSaveStorage} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                保存存储设置
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

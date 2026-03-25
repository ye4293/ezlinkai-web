'use client';

import { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';
import { CreditCard, KeyRound, Link2, Save, ShieldCheck } from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '设置', link: '/dashboard/setting' },
  { title: '支付设置', link: '/dashboard/setting/payment' }
];

interface Option {
  key: string;
  value: unknown;
}

const getOptionValue = (options: Option[], key: string) => {
  const option = options.find((item) => item.key === key);
  return option?.value;
};

const toBool = (val: unknown) => val === 'true' || val === true;

export default function PaymentSettingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Epay state ----
  const [epayPaymentEnabled, setEpayPaymentEnabled] = useState(false);
  const [epayPayAddress, setEpayPayAddress] = useState('');
  const [epayId, setEpayId] = useState('');
  const [epayKey, setEpayKey] = useState('');
  const [epayPrice, setEpayPrice] = useState('7.3');
  const [epayMinTopUp, setEpayMinTopUp] = useState('1');
  const [epayCallbackAddress, setEpayCallbackAddress] = useState('');

  // ---- Stripe state ----
  const [stripePaymentEnabled, setStripePaymentEnabled] = useState(false);
  const [stripeApiSecret, setStripeApiSecret] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [stripePriceId, setStripePriceId] = useState('');
  const [stripeUnitPrice, setStripeUnitPrice] = useState('7.3');
  const [stripeMinTopUp, setStripeMinTopUp] = useState('1');
  const [stripePromotionCodesEnabled, setStripePromotionCodesEnabled] =
    useState(false);

  const isEpayConfigured = useMemo(() => {
    return Boolean(epayPayAddress && epayId);
  }, [epayPayAddress, epayId]);

  const isStripeConfigured = useMemo(() => {
    return Boolean(stripePriceId);
  }, [stripePriceId]);

  const fetchOptions = async () => {
    try {
      setIsDataLoading(true);
      setError(null);
      const response = await fetch('/api/option');
      if (!response.ok) {
        throw new Error('Failed to fetch options');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const options = result.data as Option[];

        // Epay
        setEpayPaymentEnabled(
          toBool(getOptionValue(options, 'EpayPaymentEnabled'))
        );
        setEpayPayAddress(
          String(getOptionValue(options, 'EpayPayAddress') || '')
        );
        setEpayId(String(getOptionValue(options, 'EpayId') || ''));
        setEpayPrice(String(getOptionValue(options, 'EpayPrice') || '7.3'));
        setEpayMinTopUp(String(getOptionValue(options, 'EpayMinTopUp') || '1'));
        setEpayCallbackAddress(
          String(getOptionValue(options, 'EpayCallbackAddress') || '')
        );
        setEpayKey('');

        // Stripe
        setStripePaymentEnabled(
          toBool(getOptionValue(options, 'StripePaymentEnabled'))
        );
        setStripePriceId(
          String(getOptionValue(options, 'StripePriceId') || '')
        );
        setStripeUnitPrice(
          String(getOptionValue(options, 'StripeUnitPrice') || '7.3')
        );
        setStripeMinTopUp(
          String(getOptionValue(options, 'StripeMinTopUp') || '1')
        );
        setStripePromotionCodesEnabled(
          toBool(getOptionValue(options, 'StripePromotionCodesEnabled'))
        );
        setStripeApiSecret('');
        setStripeWebhookSecret('');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load payment settings'
      );
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const saveOption = async (key: string, value: string) => {
    const response = await fetch('/api/option', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value })
    });

    if (!response.ok) {
      throw new Error(`Failed to save ${key}`);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const optionsToSave = [
        // Epay
        { key: 'EpayPaymentEnabled', value: epayPaymentEnabled.toString() },
        { key: 'EpayPayAddress', value: epayPayAddress.trim() },
        { key: 'EpayId', value: epayId.trim() },
        { key: 'EpayPrice', value: epayPrice.trim() || '7.3' },
        { key: 'EpayMinTopUp', value: epayMinTopUp.trim() || '1' },
        { key: 'EpayCallbackAddress', value: epayCallbackAddress.trim() },
        // Stripe
        {
          key: 'StripePaymentEnabled',
          value: stripePaymentEnabled.toString()
        },
        { key: 'StripePriceId', value: stripePriceId.trim() },
        { key: 'StripeUnitPrice', value: stripeUnitPrice.trim() || '7.3' },
        { key: 'StripeMinTopUp', value: stripeMinTopUp.trim() || '1' },
        {
          key: 'StripePromotionCodesEnabled',
          value: stripePromotionCodesEnabled.toString()
        }
      ];

      for (const option of optionsToSave) {
        await saveOption(option.key, option.value);
      }

      if (epayKey.trim()) {
        await saveOption('EpayKey', epayKey.trim());
      }
      if (stripeApiSecret.trim()) {
        await saveOption('StripeApiSecret', stripeApiSecret.trim());
      }
      if (stripeWebhookSecret.trim()) {
        await saveOption('StripeWebhookSecret', stripeWebhookSecret.trim());
      }

      toast.success('支付设置保存成功');
      setEpayKey('');
      setStripeApiSecret('');
      setStripeWebhookSecret('');
      await fetchOptions();
    } catch (saveError) {
      console.error('Save payment setting error:', saveError);
      toast.error('保存支付设置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">加载支付设置失败: {error}</div>;
  }

  if (isDataLoading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">支付设置</h2>
            <p className="text-sm text-muted-foreground">
              配置易支付和 Stripe 的接入参数，适用于 PC 与手机端管理界面。
            </p>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? '保存中...' : '保存支付设置'}
          </Button>
        </div>

        <Separator />

        {/* ==================== 易支付 ==================== */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                易支付开关
              </CardTitle>
              <CardDescription>
                开启后，前端充值页将可以读取并使用易支付相关配置。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="epay-enabled"
                    className="text-base font-medium"
                  >
                    启用易支付
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    当前状态：{epayPaymentEnabled ? '已启用' : '未启用'}
                    {isEpayConfigured
                      ? '，已填写基础参数'
                      : '，尚未完成基础参数'}
                  </p>
                </div>
                <Switch
                  id="epay-enabled"
                  checked={epayPaymentEnabled}
                  onCheckedChange={setEpayPaymentEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                接入参数
              </CardTitle>
              <CardDescription>
                填写易支付网关、商户
                PID、密钥以及回调地址。密钥属于敏感信息，不会回显。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="epay-pay-address">支付网关地址</Label>
                  <Input
                    id="epay-pay-address"
                    value={epayPayAddress}
                    onChange={(e) => setEpayPayAddress(e.target.value)}
                    placeholder="例如：https://pay.example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    易支付网关根地址，不需要额外拼接接口路径。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epay-id">易支付商户 PID</Label>
                  <Input
                    id="epay-id"
                    value={epayId}
                    onChange={(e) => setEpayId(e.target.value)}
                    placeholder="例如：2058"
                  />
                  <p className="text-xs text-muted-foreground">
                    对应易支付平台分配的商户编号。
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="epay-callback-address">
                    回调地址（可选）
                  </Label>
                  <Input
                    id="epay-callback-address"
                    value={epayCallbackAddress}
                    onChange={(e) => setEpayCallbackAddress(e.target.value)}
                    placeholder="例如：https://api.example.com，留空则使用系统地址"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于异步通知回调域名。若站点存在反向代理或内外网分离，建议显式填写。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                密钥与充值规则
              </CardTitle>
              <CardDescription>
                商户密钥仅在重新填写时更新；价格和最低充值数量会影响充值页展示与下单校验。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="epay-key">易支付商户密钥</Label>
                  <Input
                    id="epay-key"
                    type="password"
                    value={epayKey}
                    onChange={(e) => setEpayKey(e.target.value)}
                    placeholder="如已配置可留空，不会回显"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    仅在你输入新值时更新，不输入则保持后端现有配置。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epay-price">充值单价（元 / 单位）</Label>
                  <Input
                    id="epay-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={epayPrice}
                    onChange={(e) => setEpayPrice(e.target.value)}
                    placeholder="例如：7.3"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于根据用户输入的充值数量，换算出实际支付金额。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epay-min-topup">最低充值数量</Label>
                  <Input
                    id="epay-min-topup"
                    type="number"
                    min="1"
                    step="1"
                    value={epayMinTopUp}
                    onChange={(e) => setEpayMinTopUp(e.target.value)}
                    placeholder="例如：1"
                  />
                  <p className="text-xs text-muted-foreground">
                    前端与后端都将依据该值限制最低充值数量。
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">配置说明</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>
                    建议先填写网关地址、商户 PID 和商户密钥，再启用易支付开关。
                  </li>
                  <li>
                    如果部署在反向代理之后，建议显式配置回调地址，避免通知回调失败。
                  </li>
                  <li>
                    该页面对手机端使用单列布局，对桌面端自动切换为双列/三列布局。
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* ==================== Stripe ==================== */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe 开关
              </CardTitle>
              <CardDescription>
                开启后，前端充值页将可以使用 Stripe Checkout 进行在线支付。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="stripe-enabled"
                    className="text-base font-medium"
                  >
                    启用 Stripe 支付
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    当前状态：{stripePaymentEnabled ? '已启用' : '未启用'}
                    {isStripeConfigured
                      ? '，已填写 Price ID'
                      : '，尚未配置 Price ID'}
                  </p>
                </div>
                <Switch
                  id="stripe-enabled"
                  checked={stripePaymentEnabled}
                  onCheckedChange={setStripePaymentEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Stripe 密钥
              </CardTitle>
              <CardDescription>
                填写 Stripe API Secret Key 和 Webhook Signing
                Secret。密钥属于敏感信息，不会回显。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stripe-api-secret">API Secret Key</Label>
                  <Input
                    id="stripe-api-secret"
                    type="password"
                    value={stripeApiSecret}
                    onChange={(e) => setStripeApiSecret(e.target.value)}
                    placeholder="sk_live_... 或 sk_test_..."
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    以 sk_live_ 或 sk_test_ 开头的密钥，仅在输入新值时更新。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook-secret">
                    Webhook Signing Secret
                  </Label>
                  <Input
                    id="stripe-webhook-secret"
                    type="password"
                    value={stripeWebhookSecret}
                    onChange={(e) => setStripeWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    以 whsec_ 开头，用于验证 Stripe Webhook 签名。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Stripe 充值规则
              </CardTitle>
              <CardDescription>
                配置 Stripe 的 Price ID、单价、最低充值数量以及是否允许优惠码。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="stripe-price-id">Stripe Price ID</Label>
                  <Input
                    id="stripe-price-id"
                    value={stripePriceId}
                    onChange={(e) => setStripePriceId(e.target.value)}
                    placeholder="price_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    在 Stripe Dashboard 中创建 Product → Price 后获得的价格 ID。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-unit-price">
                    充值单价（USD / 单位）
                  </Label>
                  <Input
                    id="stripe-unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={stripeUnitPrice}
                    onChange={(e) => setStripeUnitPrice(e.target.value)}
                    placeholder="例如：7.3"
                  />
                  <p className="text-xs text-muted-foreground">
                    每个充值单位对应的美元金额，用于前端展示和后端校验。
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-min-topup">最低充值数量</Label>
                  <Input
                    id="stripe-min-topup"
                    type="number"
                    min="1"
                    step="1"
                    value={stripeMinTopUp}
                    onChange={(e) => setStripeMinTopUp(e.target.value)}
                    placeholder="例如：1"
                  />
                  <p className="text-xs text-muted-foreground">
                    前端与后端都将依据该值限制 Stripe 最低充值数量。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label
                    htmlFor="stripe-promo"
                    className="text-base font-medium"
                  >
                    允许优惠码
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    开启后，用户在 Stripe Checkout 页面可以输入 Promotion Code。
                  </p>
                </div>
                <Switch
                  id="stripe-promo"
                  checked={stripePromotionCodesEnabled}
                  onCheckedChange={setStripePromotionCodesEnabled}
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">配置说明</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>
                    建议先填写 API Secret Key、Webhook Secret 和 Price
                    ID，再启用 Stripe 开关。
                  </li>
                  <li>
                    Webhook 回调地址需在 Stripe Dashboard 中配置为
                    <code className="mx-1 rounded bg-muted px-1 py-0.5">
                      {'https://<你的域名>/api/stripe/webhook'}
                    </code>
                  </li>
                  <li>
                    Stripe
                    和易支付可以同时启用，用户在充值页面会看到多个支付选项。
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

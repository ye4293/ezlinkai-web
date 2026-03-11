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
import { CreditCard, KeyRound, Link2, Save } from 'lucide-react';

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

export default function PaymentSettingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [epayPaymentEnabled, setEpayPaymentEnabled] = useState(false);
  const [epayPayAddress, setEpayPayAddress] = useState('');
  const [epayId, setEpayId] = useState('');
  const [epayKey, setEpayKey] = useState('');
  const [epayPrice, setEpayPrice] = useState('7.3');
  const [epayMinTopUp, setEpayMinTopUp] = useState('1');
  const [epayCallbackAddress, setEpayCallbackAddress] = useState('');

  const isConfigured = useMemo(() => {
    return Boolean(epayPayAddress && epayId);
  }, [epayPayAddress, epayId]);

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

        setEpayPaymentEnabled(
          getOptionValue(options, 'EpayPaymentEnabled') === 'true' ||
            getOptionValue(options, 'EpayPaymentEnabled') === true
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
        { key: 'EpayPaymentEnabled', value: epayPaymentEnabled.toString() },
        { key: 'EpayPayAddress', value: epayPayAddress.trim() },
        { key: 'EpayId', value: epayId.trim() },
        { key: 'EpayPrice', value: epayPrice.trim() || '7.3' },
        { key: 'EpayMinTopUp', value: epayMinTopUp.trim() || '1' },
        { key: 'EpayCallbackAddress', value: epayCallbackAddress.trim() }
      ];

      for (const option of optionsToSave) {
        await saveOption(option.key, option.value);
      }

      if (epayKey.trim()) {
        await saveOption('EpayKey', epayKey.trim());
      }

      toast.success('支付设置保存成功');
      setEpayKey('');
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
              配置易支付接入参数，适用于 PC 与手机端管理界面。
            </p>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? '保存中...' : '保存支付设置'}
          </Button>
        </div>

        <Separator />

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
                    {isConfigured ? '，已填写基础参数' : '，尚未完成基础参数'}
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
      </div>
    </PageContainer>
  );
}

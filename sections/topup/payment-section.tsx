'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const FIXED_AMOUNTS = [10, 20, 50, 100, 200, 500];

interface TopupInfo {
  enable_online_topup: boolean;
  enable_reason?: string;
  min_topup: number;
  price: number;
  quota_per_unit: number;
}

const extractApiErrorMessage = (result: any, fallback: string) => {
  if (typeof result?.message === 'string' && result.message) {
    return result.message;
  }
  if (typeof result?.details === 'string' && result.details) {
    return result.details;
  }
  if (typeof result?.error === 'string' && result.error) {
    return result.error;
  }
  if (typeof result?.error?.message === 'string' && result.error.message) {
    return result.error.message;
  }
  if (
    typeof result?.error?.error?.message === 'string' &&
    result.error.error.message
  ) {
    return result.error.error.message;
  }
  return fallback;
};

const submitEpayForm = (
  actionUrl: string,
  params: Record<string, string>,
  useSameWindow: boolean
) => {
  const form = document.createElement('form');
  form.action = actionUrl;
  form.method = 'POST';
  form.target = useSameWindow ? '_self' : '_blank';

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

export default function PaymentSection() {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('wxpay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topupInfo, setTopupInfo] = useState<TopupInfo | null>(null);
  const [topupInfoError, setTopupInfoError] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const isEpayMethod = paymentMethod === 'wxpay' || paymentMethod === 'alipay';

  useEffect(() => {
    const fetchTopupInfo = async () => {
      try {
        const res = await fetch('/api/user/topup/info', {
          credentials: 'include'
        });
        const result = await res.json().catch(() => null);
        if (res.ok && result?.success && result.data) {
          setTopupInfo(result.data);
          setTopupInfoError('');
          return;
        }
        setTopupInfo(null);
        setTopupInfoError(
          extractApiErrorMessage(result, '充值配置获取失败，请稍后重试')
        );
      } catch (error) {
        setTopupInfo(null);
        setTopupInfoError('充值配置获取失败，请稍后重试');
        console.error('Failed to fetch topup info', error);
      }
    };

    fetchTopupInfo();
  }, []);

  useEffect(() => {
    if (!isEpayMethod || !amount || amount <= 0) {
      setPayAmount('');
      return;
    }

    let cancelled = false;

    const fetchPayAmount = async () => {
      try {
        const res = await fetch('/api/user/amount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: Number(amount)
          })
        });
        const result = await res.json().catch(() => null);
        if (!cancelled) {
          if (res.ok && result?.success) {
            setPayAmount(String(result.data || ''));
          } else {
            setPayAmount('');
          }
        }
      } catch (error) {
        if (!cancelled) {
          setPayAmount('');
        }
      }
    };

    fetchPayAmount();

    return () => {
      cancelled = true;
    };
  }, [amount, isEpayMethod]);

  const handlePay = async () => {
    if (!amount || amount <= 0) {
      toast.error('请选择或输入正确的充值数量');
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === 'stripe') {
      // Map known amounts to charge IDs based on previous StripePage logic
      let chargeId = 0;
      if (amount === 1) chargeId = 1;
      else if (amount === 10) chargeId = 2;
      else if (amount === 50) chargeId = 3;

      if (chargeId === 0) {
        toast.info(`当前仅支持部分固定 Stripe 面额，暂不支持该金额`);
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch(`/api/charge/create_order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ charge_id: chargeId }),
          credentials: 'include'
        });
        const { data, success } = await res.json();
        if (success && data?.charge_url) {
          window.open(data.charge_url, '_blank');
        } else {
          toast.error('创建 Stripe 订单失败');
        }
      } catch (e) {
        toast.error('创建 Stripe 订单时出错');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (topupInfo && !topupInfo.enable_online_topup) {
        toast.error(topupInfo.enable_reason || '管理员尚未开启易支付');
        setIsSubmitting(false);
        return;
      }

      if (topupInfo?.min_topup && Number(amount) < topupInfo.min_topup) {
        toast.error(`充值数量不能小于 ${topupInfo.min_topup}`);
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch('/api/user/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: Number(amount),
            payment_method: paymentMethod,
            return_url: `${window.location.origin}/dashboard/topup`
          })
        });

        const result = await res.json().catch(() => null);
        if (!res.ok || !result?.success) {
          toast.error(extractApiErrorMessage(result, '创建易支付订单失败'));
          return;
        }

        if (!result.url || !result.data) {
          toast.error('易支付返回参数不完整');
          return;
        }

        const useSameWindow = window.matchMedia('(max-width: 768px)').matches;
        submitEpayForm(
          result.url,
          result.data as Record<string, string>,
          useSameWindow
        );
      } catch (error) {
        console.error('Create epay order failed', error);
        toast.error('发起易支付订单失败');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>账户充值</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>{isEpayMethod ? '充值数量' : '选择金额 ($)'}</Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {FIXED_AMOUNTS.map((val) => (
              <Button
                key={val}
                variant={amount === val ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setAmount(val)}
              >
                {isEpayMethod ? val : `$${val}`}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Label className="w-32 whitespace-nowrap">
              {isEpayMethod ? '自定义数量:' : '自定义金额:'}
            </Label>
            <Input
              type="number"
              min="1"
              placeholder={isEpayMethod ? '输入充值数量' : '输入金额'}
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : '')
              }
              className="flex-1"
            />
          </div>
          {isEpayMethod && (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span>最低充值：{topupInfo?.min_topup ?? '-'}</span>
                <span>
                  单价：
                  {typeof topupInfo?.price === 'number'
                    ? `¥${topupInfo.price}`
                    : '-'}
                </span>
              </div>
              {topupInfoError && (
                <div className="mt-2 text-xs text-destructive">
                  {topupInfoError}
                </div>
              )}
              {topupInfo?.enable_reason && !topupInfo.enable_online_topup && (
                <div className="mt-2 text-xs text-destructive">
                  {topupInfo.enable_reason}
                </div>
              )}
              <div className="mt-2 font-medium text-foreground">
                应付金额：{payAmount ? `¥${payAmount}` : '--'}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>支付方式</Label>
          <Tabs
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span className="hidden sm:inline">Stripe</span>
              </TabsTrigger>
              <TabsTrigger value="wxpay" className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">微信</span>
              </TabsTrigger>
              <TabsTrigger value="alipay" className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span className="hidden sm:inline">支付宝</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="stripe"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                使用 Stripe 进行信用卡支付。
              </p>
            </TabsContent>

            <TabsContent
              value="wxpay"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                通过易支付拉起微信支付。
              </p>
            </TabsContent>

            <TabsContent
              value="alipay"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                通过易支付拉起支付宝支付。
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePay}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? '提交中...'
            : isEpayMethod
            ? `立即支付${payAmount ? ` (¥${payAmount})` : ''}`
            : `Pay Now${amount ? ` ($${amount})` : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}

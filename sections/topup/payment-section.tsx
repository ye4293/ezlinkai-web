'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { CreditCard, Wallet, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const FIXED_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function PaymentSection({
  topUpLink,
  paymentUri
}: {
  topUpLink: string;
  paymentUri: string;
}) {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const handlePay = async () => {
    if (!amount || amount <= 0) {
      toast.error('Please select or enter a valid amount.');
      return;
    }

    if (paymentMethod === 'stripe') {
      // Map known amounts to charge IDs based on previous StripePage logic
      let chargeId = 0;
      if (amount === 1) chargeId = 1;
      else if (amount === 10) chargeId = 2;
      else if (amount === 50) chargeId = 3;

      if (chargeId === 0) {
        toast.info(
          `Custom amount $${amount} via Stripe is not fully supported by backend yet. Mocking request...`
        );
        return;
      }

      try {
        const res = await fetch(`/api/charge/create_order`, {
          method: 'POST',
          body: JSON.stringify({ charge_id: chargeId }),
          credentials: 'include'
        });
        const { data, success } = await res.json();
        if (success && data?.charge_url) {
          window.open(data.charge_url);
        } else {
          toast.error('Failed to create Stripe order.');
        }
      } catch (e) {
        toast.error('Error creating order.');
      }
    } else {
      toast.info(
        `Payment via ${paymentMethod} for $${amount} initiated (Mock).`
      );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Account Top-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Amount ($)</Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {FIXED_AMOUNTS.map((val) => (
              <Button
                key={val}
                variant={amount === val ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setAmount(val)}
              >
                ${val}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Label className="w-32 whitespace-nowrap">Custom Amount:</Label>
            <Input
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : '')
              }
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Payment Method</Label>
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
              <TabsTrigger value="wechat" className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">WeChat</span>
              </TabsTrigger>
              <TabsTrigger value="alipay" className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span className="hidden sm:inline">Alipay</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="stripe"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                Pay securely with your credit card via Stripe.
              </p>
            </TabsContent>

            <TabsContent
              value="wechat"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                Pay easily using WeChat Pay.
              </p>
            </TabsContent>

            <TabsContent
              value="alipay"
              className="mt-4 rounded-lg border bg-muted/20 p-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                Pay easily using Alipay.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <Button className="w-full" size="lg" onClick={handlePay}>
          Pay Now {amount ? `($${amount})` : ''}
        </Button>

        {/* Crypto Option (Legacy) - Hidden per request */}
        {/*
        <div className="pt-6 border-t mt-6">
          <Label className="mb-3 block">Pay with Crypto (USDT Polygon)</Label>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-lg">
            {topUpLink ? (
              <Image
                src={topUpLink}
                alt="Crypto QR Code"
                width={120}
                height={120}
                unoptimized
                className="rounded-md"
              />
            ) : (
              <div className="w-[120px] h-[120px] bg-muted flex items-center justify-center rounded-md">
                <span className="text-xs text-muted-foreground">No QR</span>
              </div>
            )}
            <div className="text-sm space-y-1 overflow-hidden w-full">
              <p className="font-medium">Network: Polygon</p>
              <p className="text-muted-foreground truncate" title="0x3C034A1Cf6A3eBe386b51327F5f8d9A06057821B">
                Address: 0x3C034A1Cf6A3eBe386b51327F5f8d9A06057821B
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                * Please only send USDT on Polygon network.
              </p>
            </div>
          </div>
        </div>
        */}
      </CardContent>
    </Card>
  );
}

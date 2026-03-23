'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

function getServerAddress(): string {
  if (typeof window === 'undefined') return '';
  try {
    const status = localStorage.getItem('status');
    if (status) {
      const parsed = JSON.parse(status);
      if (parsed.server_address) {
        return parsed.server_address.replace(/\/+$/, '');
      }
    }
  } catch {}
  return window.location.origin;
}

export default function InviteCard({ user }: { user?: any }) {
  const [serverAddress, setServerAddress] = useState(
    typeof window !== 'undefined' ? getServerAddress() : ''
  );

  useEffect(() => {
    setServerAddress(getServerAddress());
  }, []);

  const referralLink = `${serverAddress}/register?aff=${
    user?.aff_code || 'CODE'
  }`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <Card className="h-full">
      <CardHeader className="rounded-t-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <CardTitle className="flex items-center justify-between">
          <span>Invite Rewards</span>
          <span className="text-sm font-normal opacity-90">
            Invite friends for extra rewards
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-600">$0.00</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Available Earnings
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">$0.00</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Total Earnings
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">0</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Invited Users
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Referral Link</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-muted" />
            <Button
              onClick={handleCopy}
              variant="secondary"
              className="shrink-0"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">
            Reward Instructions:
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Invite friends to register, and you will receive corresponding
              rewards after they top up.
            </li>
            <li>
              Through the transfer function, reward amounts can be transferred
              to your account balance.
            </li>
            <li>The more friends you invite, the more rewards you get.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

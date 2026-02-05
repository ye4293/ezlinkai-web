'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Key, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export function SystemTokenCard() {
  const [systemToken, setSystemToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { update: updateSession } = useSession();

  const generateAccessToken = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/token');
      const json = await res.json();
      if (json.success && json.data) {
        setSystemToken(json.data);
        await navigator.clipboard.writeText(json.data);

        // 更新 NextAuth session 中的 accessToken，避免权限失效
        await updateSession({ accessToken: json.data });

        toast({
          title: '令牌已重置',
          description: '新令牌已复制到剪贴板，请妥善保管'
        });
      } else {
        toast({
          title: '生成失败',
          description: json.message || '请重试',
          variant: 'destructive'
        });
      }
    } catch (e) {
      toast({
        title: '请求失败',
        description: '请检查网络后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (!systemToken) return;
    await navigator.clipboard.writeText(systemToken);
    toast({
      title: '已复制',
      description: '系统令牌已复制到剪贴板'
    });
  };

  return (
    <Card className="rounded-xl border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">系统访问令牌</CardTitle>
            <CardDescription className="mt-1 text-sm leading-relaxed">
              用于 API
              调用的身份验证令牌，请妥善保管。生成或重新生成后请立即保存，页面刷新后将不再显示完整令牌。
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemToken ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Input
              readOnly
              value={systemToken}
              className="h-9 flex-1 bg-muted/50 font-mono text-xs sm:text-sm"
            />
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyToken}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={generateAccessToken}
                disabled={loading}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                重新生成
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={generateAccessToken}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Key className="h-4 w-4" />
            )}
            {systemToken ? '重新生成' : '生成令牌'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

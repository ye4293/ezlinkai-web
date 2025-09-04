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
import { Save } from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '系统设置', link: '/dashboard/setting' }
];

interface Option {
  key: string;
  value: any;
}

export default function SettingPage() {
  const [retryCount, setRetryCount] = useState(0);
  const [autoDisableKeywords, setAutoDisableKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const retryCountOption = options.find(
          (o: Option) => o.key === 'RetryTimes'
        );
        if (retryCountOption) {
          setRetryCount(parseInt(retryCountOption.value) || 0);
        }

        const autoDisableKeywordsOption = options.find(
          (o: Option) => o.key === 'AutoDisableKeywords'
        );
        if (autoDisableKeywordsOption) {
          setAutoDisableKeywords(autoDisableKeywordsOption.value || '');
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
        </div>
      </div>
    </PageContainer>
  );
}

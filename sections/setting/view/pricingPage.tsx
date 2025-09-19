'use client';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  { title: '系统设置', link: '/dashboard/setting' },
  { title: '价格设置', link: '/dashboard/setting/pricing' }
];

interface Option {
  key: string;
  value: any;
}

export default function PricingPage() {
  const [perCallPricing, setPerCallPricing] = useState('');
  const [inputVolumePrice, setInputVolumePrice] = useState('');
  const [outputVolumePrice, setOutputVolumePrice] = useState('');
  const [audioInputRatio, setAudioInputRatio] = useState('');
  const [audioOutputRatio, setAudioOutputRatio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 默认的定价配置示例
  const defaultPerCallPricing = `{
  "doubao-seedream-4-0-250828": 0.3
}`;

  const defaultInputVolumePrice = `{
  "gpt-image-1": 0.0025,
  "gemini-2.5-flash-image-preview": 0.15
}`;

  const defaultOutputVolumePrice = `{
  "gpt-image-1": 8,
  "gemini-2.5-flash-image-preview": 100
}`;

  const defaultAudioInputRatio = `{

}`;

  const defaultAudioOutputRatio = `{

}`;

  // 获取价格设置数据
  const fetchPricingOptions = async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch('/api/option');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing options');
      }
      const result = await response.json();
      if (result.success && result.data) {
        const options = result.data;

        const perCallOption = options.find(
          (o: Option) => o.key === 'PerCallPricing'
        );
        if (perCallOption) {
          setPerCallPricing(
            formatJSON(perCallOption.value) || defaultPerCallPricing
          );
        } else {
          setPerCallPricing(defaultPerCallPricing);
        }

        const inputVolumeOption = options.find(
          (o: Option) => o.key === 'ModelRatio'
        );
        if (inputVolumeOption) {
          setInputVolumePrice(
            formatJSON(inputVolumeOption.value) || defaultInputVolumePrice
          );
        } else {
          setInputVolumePrice(defaultInputVolumePrice);
        }

        const outputVolumeOption = options.find(
          (o: Option) => o.key === 'CompletionRatio'
        );
        if (outputVolumeOption) {
          setOutputVolumePrice(
            formatJSON(outputVolumeOption.value) || defaultOutputVolumePrice
          );
        } else {
          setOutputVolumePrice(defaultOutputVolumePrice);
        }

        const audioInputOption = options.find(
          (o: Option) => o.key === 'AudioInputRatio'
        );
        if (audioInputOption) {
          setAudioInputRatio(
            formatJSON(audioInputOption.value) || defaultAudioInputRatio
          );
        } else {
          setAudioInputRatio(defaultAudioInputRatio);
        }

        const audioOutputOption = options.find(
          (o: Option) => o.key === 'AudioOutputRatio'
        );
        if (audioOutputOption) {
          setAudioOutputRatio(
            formatJSON(audioOutputOption.value) || defaultAudioOutputRatio
          );
        } else {
          setAudioOutputRatio(defaultAudioOutputRatio);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load pricing settings'
      );
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingOptions();
  }, []);

  // 格式化JSON字符串为美观的多行格式
  const formatJSON = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString; // 如果解析失败，返回原字符串
    }
  };

  const validateJSON = (jsonString: string, fieldName: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      toast.error(`${fieldName} JSON格式错误，请检查语法`);
      return false;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 验证JSON格式
      if (
        !validateJSON(perCallPricing, '按次计费价格') ||
        !validateJSON(inputVolumePrice, '模型基础价格倍率') ||
        !validateJSON(outputVolumePrice, '输出token价格倍率') ||
        !validateJSON(audioInputRatio, '音频输入token倍率') ||
        !validateJSON(audioOutputRatio, '音频输出token倍率')
      ) {
        return;
      }

      // 保存按次计费价格
      const perCallResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'PerCallPricing',
          value: perCallPricing
        })
      });

      if (!perCallResponse.ok) {
        throw new Error('Failed to save per call pricing');
      }

      // 保存模型基础价格倍率
      const inputVolumeResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'ModelRatio',
          value: inputVolumePrice
        })
      });

      if (!inputVolumeResponse.ok) {
        throw new Error('Failed to save model ratio pricing');
      }

      // 保存输出token价格倍率
      const outputVolumeResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'CompletionRatio',
          value: outputVolumePrice
        })
      });

      if (!outputVolumeResponse.ok) {
        throw new Error('Failed to save completion ratio pricing');
      }

      // 保存音频输入token倍率
      const audioInputResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'AudioInputRatio',
          value: audioInputRatio
        })
      });

      if (!audioInputResponse.ok) {
        throw new Error('Failed to save audio input ratio');
      }

      // 保存音频输出token倍率
      const audioOutputResponse = await fetch('/api/option', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'AudioOutputRatio',
          value: audioOutputRatio
        })
      });

      if (!audioOutputResponse.ok) {
        throw new Error('Failed to save audio output ratio');
      }

      toast.success('价格设置保存成功！');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (error)
    return <div className="p-4 text-red-500">加载价格设置失败: {error}</div>;
  if (isDataLoading) return <div className="p-4">加载中...</div>;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">价格设置</h2>
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
              <CardTitle>按次计费价格</CardTitle>
              <CardDescription>
                一次调用消耗多少元，优先级大于模型倍率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="per-call-pricing">按次计费价格配置</Label>
                <Textarea
                  id="per-call-pricing"
                  value={perCallPricing}
                  onChange={(e) => setPerCallPricing(e.target.value)}
                  placeholder="请输入JSON格式的按次计费价格配置"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  JSON格式，key为模型名称，value为每次调用的价格（元）
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>模型基础价格倍率</CardTitle>
              <CardDescription>
                设置各模型的基础价格倍率，用于token计费的基础价格
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="input-volume-pricing">
                  模型基础价格倍率配置
                </Label>
                <Textarea
                  id="input-volume-pricing"
                  value={inputVolumePrice}
                  onChange={(e) => setInputVolumePrice(e.target.value)}
                  placeholder="请输入JSON格式的模型基础价格倍率配置"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  JSON格式，key为模型名称，value为基础价格倍率（如：0.0025表示2.5/1M
                  tokens）
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>输出token价格倍率</CardTitle>
              <CardDescription>
                设置输出token相对于输入token的价格倍率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="output-volume-pricing">
                  输出token价格倍率配置
                </Label>
                <Textarea
                  id="output-volume-pricing"
                  value={outputVolumePrice}
                  onChange={(e) => setOutputVolumePrice(e.target.value)}
                  placeholder="请输入JSON格式的输出token价格倍率配置"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  JSON格式，key为模型名称，value为输出token相对输入token的倍率（如：8表示输出token是输入token价格的8倍）
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>音频输入token倍率</CardTitle>
              <CardDescription>
                设置音频输入token相对于文本输入token的价格倍率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="audio-input-ratio">音频输入token倍率配置</Label>
                <Textarea
                  id="audio-input-ratio"
                  value={audioInputRatio}
                  onChange={(e) => setAudioInputRatio(e.target.value)}
                  placeholder="请输入JSON格式的音频输入token倍率配置"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  JSON格式，key为模型名称，value为音频输入token相对文本输入token的倍率（如：100表示音频输入token是文本输入token价格的100倍）
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>音频输出token倍率</CardTitle>
              <CardDescription>
                设置音频输出token相对于文本输出token的价格倍率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="audio-output-ratio">
                  音频输出token倍率配置
                </Label>
                <Textarea
                  id="audio-output-ratio"
                  value={audioOutputRatio}
                  onChange={(e) => setAudioOutputRatio(e.target.value)}
                  placeholder="请输入JSON格式的音频输出token倍率配置"
                  className="h-60 font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  JSON格式，key为模型名称，value为音频输出token相对文本输出token的倍率（如：200表示音频输出token是文本输出token价格的200倍）
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

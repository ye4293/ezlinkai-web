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
import { Save, RefreshCcw } from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '系统设置', link: '/dashboard/setting' },
  { title: '模型设置', link: '/dashboard/setting/model' }
];

interface Option {
  key: string;
  value: any;
}

export default function ModelSettingPage() {
  // Claude 设置状态
  const [claudeThinkingEnabled, setClaudeThinkingEnabled] = useState(true);
  const [claudeThinkingBudgetRatio, setClaudeThinkingBudgetRatio] =
    useState('0.8');
  const [claudeDefaultMaxTokens, setClaudeDefaultMaxTokens] = useState('');
  const [claudeReasoningEffortMap, setClaudeReasoningEffortMap] = useState('');
  const [claudeRequestHeaders, setClaudeRequestHeaders] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 获取设置
  const fetchOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/option');
      const result = await response.json();
      if (result.success && result.data) {
        const options = result.data;

        // Claude Thinking Enabled
        const claudeThinkingEnabledOption = options.find(
          (o: Option) => o.key === 'ClaudeThinkingEnabled'
        );
        if (claudeThinkingEnabledOption) {
          setClaudeThinkingEnabled(
            claudeThinkingEnabledOption.value === 'true'
          );
        }

        // Claude Thinking Budget Ratio
        const claudeThinkingBudgetRatioOption = options.find(
          (o: Option) => o.key === 'ClaudeThinkingBudgetRatio'
        );
        if (claudeThinkingBudgetRatioOption) {
          setClaudeThinkingBudgetRatio(
            claudeThinkingBudgetRatioOption.value || '0.8'
          );
        }

        // Claude Default Max Tokens
        const claudeDefaultMaxTokensOption = options.find(
          (o: Option) => o.key === 'ClaudeDefaultMaxTokens'
        );
        if (claudeDefaultMaxTokensOption) {
          try {
            const parsed = JSON.parse(claudeDefaultMaxTokensOption.value);
            setClaudeDefaultMaxTokens(JSON.stringify(parsed, null, 2));
          } catch {
            setClaudeDefaultMaxTokens(claudeDefaultMaxTokensOption.value || '');
          }
        }

        // Claude Reasoning Effort Map
        const claudeReasoningEffortMapOption = options.find(
          (o: Option) => o.key === 'ClaudeReasoningEffortMap'
        );
        if (claudeReasoningEffortMapOption) {
          try {
            const parsed = JSON.parse(claudeReasoningEffortMapOption.value);
            setClaudeReasoningEffortMap(JSON.stringify(parsed, null, 2));
          } catch {
            setClaudeReasoningEffortMap(
              claudeReasoningEffortMapOption.value || ''
            );
          }
        }

        // Claude Request Headers
        const claudeRequestHeadersOption = options.find(
          (o: Option) => o.key === 'ClaudeRequestHeaders'
        );
        if (claudeRequestHeadersOption) {
          try {
            const parsed = JSON.parse(claudeRequestHeadersOption.value);
            setClaudeRequestHeaders(JSON.stringify(parsed, null, 2));
          } catch {
            setClaudeRequestHeaders(claudeRequestHeadersOption.value || '');
          }
        }
      }
    } catch (error) {
      toast.error('获取设置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // 保存单个设置
  const saveOption = async (key: string, value: string) => {
    const response = await fetch('/api/option', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || '保存失败');
    }
  };

  // 验证 JSON 格式
  const validateJSON = (jsonStr: string, fieldName: string): boolean => {
    if (!jsonStr || jsonStr.trim() === '') {
      return true; // 空值允许
    }
    try {
      JSON.parse(jsonStr);
      return true;
    } catch {
      toast.error(`${fieldName} JSON 格式错误`);
      return false;
    }
  };

  // 保存所有设置
  const handleSave = async () => {
    // 验证 JSON 格式
    if (!validateJSON(claudeDefaultMaxTokens, '缺省 MaxTokens')) return;
    if (!validateJSON(claudeReasoningEffortMap, 'ReasoningEffort 百分比映射'))
      return;
    if (!validateJSON(claudeRequestHeaders, 'Claude 请求头覆盖')) return;

    // 验证百分比范围
    const ratio = parseFloat(claudeThinkingBudgetRatio);
    if (isNaN(ratio) || ratio < 0.1 || ratio > 1.0) {
      toast.error('思考适配 BudgetTokens 百分比必须在 0.1 到 1.0 之间');
      return;
    }

    setSaving(true);
    try {
      await saveOption(
        'ClaudeThinkingEnabled',
        claudeThinkingEnabled ? 'true' : 'false'
      );
      await saveOption('ClaudeThinkingBudgetRatio', claudeThinkingBudgetRatio);

      if (claudeDefaultMaxTokens.trim()) {
        await saveOption(
          'ClaudeDefaultMaxTokens',
          JSON.stringify(JSON.parse(claudeDefaultMaxTokens))
        );
      }

      if (claudeReasoningEffortMap.trim()) {
        await saveOption(
          'ClaudeReasoningEffortMap',
          JSON.stringify(JSON.parse(claudeReasoningEffortMap))
        );
      }

      if (claudeRequestHeaders.trim()) {
        await saveOption(
          'ClaudeRequestHeaders',
          JSON.stringify(JSON.parse(claudeRequestHeaders))
        );
      }

      toast.success('保存成功');
    } catch (error: any) {
      toast.error(error.message || '保存失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // 默认值
  const defaultMaxTokens = {
    default: 8192,
    'claude-3-haiku-20240307': 4096,
    'claude-3-opus-20240229': 4096,
    'claude-3-7-sonnet-20250219-thinking': 16000
  };

  const defaultReasoningEffortMap = {
    none: 0,
    minimal: 0.2,
    low: 0.4,
    medium: 0.6,
    high: 0.8,
    xhigh: 0.95
  };

  const exampleRequestHeaders = {
    'claude-3-7-sonnet-20250219-thinking': {
      'anthropic-beta':
        'output-128k-2025-02-19,token-efficient-tools-2025-02-19'
    }
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">模型设置</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchOptions} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
        <Separator />

        {/* Claude 设置 */}
        <Card>
          <CardHeader>
            <CardTitle>Claude 设置</CardTitle>
            <CardDescription>
              配置 Claude 模型的 thinking 功能和请求参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 请求头覆盖 */}
            <div className="space-y-2">
              <Label htmlFor="claudeRequestHeaders">Claude 请求头覆盖</Label>
              <Textarea
                id="claudeRequestHeaders"
                placeholder="{}"
                value={claudeRequestHeaders}
                onChange={(e) => setClaudeRequestHeaders(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                示例: {JSON.stringify(exampleRequestHeaders)}
              </p>
            </div>

            {/* 缺省 MaxTokens */}
            <div className="space-y-2">
              <Label htmlFor="claudeDefaultMaxTokens">缺省 MaxTokens</Label>
              <Textarea
                id="claudeDefaultMaxTokens"
                placeholder="{}"
                value={claudeDefaultMaxTokens}
                onChange={(e) => setClaudeDefaultMaxTokens(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                示例: {JSON.stringify(defaultMaxTokens)}
              </p>
            </div>

            {/* 启用 Claude 思考适配 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="claudeThinkingEnabled">
                  启用 Claude 思考适配（-thinking 后缀）
                </Label>
                <p className="text-sm text-muted-foreground">
                  开启后，模型名以 -thinking 结尾时会自动启用 Claude
                  的扩展思考功能
                </p>
              </div>
              <Switch
                id="claudeThinkingEnabled"
                checked={claudeThinkingEnabled}
                onCheckedChange={setClaudeThinkingEnabled}
              />
            </div>

            {/* 思考适配 BudgetTokens 百分比 */}
            <div className="space-y-2">
              <Label htmlFor="claudeThinkingBudgetRatio">
                思考适配 BudgetTokens 百分比
              </Label>
              <Input
                id="claudeThinkingBudgetRatio"
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={claudeThinkingBudgetRatio}
                onChange={(e) => setClaudeThinkingBudgetRatio(e.target.value)}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Claude 思考适配 BudgetTokens = MaxTokens * BudgetTokens
                百分比，范围 0.1 到 1.0
              </p>
            </div>

            {/* ReasoningEffort 百分比映射 */}
            <div className="space-y-2">
              <Label htmlFor="claudeReasoningEffortMap">
                ReasoningEffort 百分比映射
              </Label>
              <Textarea
                id="claudeReasoningEffortMap"
                placeholder="{}"
                value={claudeReasoningEffortMap}
                onChange={(e) => setClaudeReasoningEffortMap(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                OpenAI 的 reasoning_effort 参数到 thinking budget 百分比的映射。
                支持的值：none, minimal, low, medium, high, xhigh
              </p>
              <p className="text-sm text-muted-foreground">
                示例: {JSON.stringify(defaultReasoningEffortMap)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

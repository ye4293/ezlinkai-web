'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Option {
  key: string;
  value: string;
}

// DynamicPriority 配置项默认值（与后端 common/config/config.go 保持一致）
const DEFAULTS = {
  enabled: false,
  weightSuccess: 50,
  weightLatency: 30,
  weightPrice: 20,
  calcIntervalMinutes: 5,
  topThreshold: 10,
  windowMinutes: 10
};

export default function DynamicPrioritySetting() {
  const [enabled, setEnabled] = useState(DEFAULTS.enabled);
  // applyEnabled：是否真正切换选渠道分发。与 enabled 解耦——可只开计算旁路观察。
  const [applyEnabled, setApplyEnabled] = useState(DEFAULTS.enabled);
  const [weightSuccess, setWeightSuccess] = useState(DEFAULTS.weightSuccess);
  const [weightLatency, setWeightLatency] = useState(DEFAULTS.weightLatency);
  const [weightPrice, setWeightPrice] = useState(DEFAULTS.weightPrice);
  const [calcIntervalMinutes, setCalcIntervalMinutes] = useState(
    DEFAULTS.calcIntervalMinutes
  );
  const [topThreshold, setTopThreshold] = useState(DEFAULTS.topThreshold);
  const [windowMinutes, setWindowMinutes] = useState(DEFAULTS.windowMinutes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/option');
        if (!response.ok) return;
        const result = await response.json();
        const options: Option[] = result.data || [];
        const get = (key: string): string | undefined =>
          options.find((o) => o.key === key)?.value;
        const v = get('DynamicPriorityEnabled');
        if (v !== undefined) setEnabled(v === 'true');
        const av = get('DynamicPriorityApplyEnabled');
        if (av !== undefined) setApplyEnabled(av === 'true');
        const ws = get('DynamicPriorityWeightSuccess');
        if (ws !== undefined) setWeightSuccess(parseFloat(ws));
        const wl = get('DynamicPriorityWeightLatency');
        if (wl !== undefined) setWeightLatency(parseFloat(wl));
        const wp = get('DynamicPriorityWeightPrice');
        if (wp !== undefined) setWeightPrice(parseFloat(wp));
        const ci = get('DynamicPriorityCalcIntervalMinutes');
        if (ci !== undefined)
          setCalcIntervalMinutes(parseInt(ci) || DEFAULTS.calcIntervalMinutes);
        const tt = get('DynamicPriorityTopThreshold');
        if (tt !== undefined)
          setTopThreshold(parseInt(tt) || DEFAULTS.topThreshold);
        const wm = get('DynamicPriorityWindowMinutes');
        if (wm !== undefined)
          setWindowMinutes(parseInt(wm) || DEFAULTS.windowMinutes);
      } catch (e) {
        console.error('fetch dynamic priority options failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const saveOption = async (key: string, value: string) => {
    const response = await fetch('/api/option', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) throw new Error(`Failed to save ${key}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveOption('DynamicPriorityEnabled', enabled.toString());
      await saveOption('DynamicPriorityApplyEnabled', applyEnabled.toString());
      await saveOption(
        'DynamicPriorityWeightSuccess',
        weightSuccess.toString()
      );
      await saveOption(
        'DynamicPriorityWeightLatency',
        weightLatency.toString()
      );
      await saveOption('DynamicPriorityWeightPrice', weightPrice.toString());
      await saveOption(
        'DynamicPriorityCalcIntervalMinutes',
        calcIntervalMinutes.toString()
      );
      await saveOption('DynamicPriorityTopThreshold', topThreshold.toString());
      await saveOption(
        'DynamicPriorityWindowMinutes',
        windowMinutes.toString()
      );
      toast.success('动态优先级设置已保存');
    } catch (e) {
      console.error(e);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 权重总和提示：三权重建议和为 100，但不强制（后端会归一化）
  const weightSum = weightSuccess + weightLatency + weightPrice;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          动态优先级
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={loading}
          />
        </CardTitle>
        <CardDescription>
          基于实时成功率、延迟、价格为同模型下的多个渠道计算动态优先级分数。
          上方开关仅控制「计算并落库」（旁路观察，不影响现有渠道分发）；
          下方「切换分发」开关才真正改变选渠道逻辑。建议先开计算，在「Model」页观察分数合理后再开切换。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between rounded-lg border border-orange-500/50 bg-orange-500/5 p-4">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">切换分发（危险）</Label>
            <div className="text-[0.8rem] text-muted-foreground">
              开启后选渠道将按动态优先级排序，完全替代静态优先级。
              <strong className="text-orange-600 dark:text-orange-400">
                开启前请先在 Model 页确认分数符合预期
              </strong>
              。未开启时只计算落库，现有分发方式不变。
            </div>
          </div>
          <Switch
            checked={applyEnabled}
            onCheckedChange={setApplyEnabled}
            disabled={loading || !enabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-w-success">成功率权重</Label>
            <Input
              id="dp-w-success"
              type="number"
              min={0}
              max={100}
              value={weightSuccess}
              onChange={(e) =>
                setWeightSuccess(parseFloat(e.target.value) || 0)
              }
              className="w-32"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-w-latency">延迟权重</Label>
            <Input
              id="dp-w-latency"
              type="number"
              min={0}
              max={100}
              value={weightLatency}
              onChange={(e) =>
                setWeightLatency(parseFloat(e.target.value) || 0)
              }
              className="w-32"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-w-price">价格权重</Label>
            <Input
              id="dp-w-price"
              type="number"
              min={0}
              max={100}
              value={weightPrice}
              onChange={(e) => setWeightPrice(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-interval">评分周期（分钟）</Label>
            <Input
              id="dp-interval"
              type="number"
              min={1}
              max={60}
              value={calcIntervalMinutes}
              onChange={(e) =>
                setCalcIntervalMinutes(
                  parseInt(e.target.value) < 1 ? 1 : parseInt(e.target.value)
                )
              }
              className="w-32"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-threshold">同档阈值（%）</Label>
            <Input
              id="dp-threshold"
              type="number"
              min={1}
              max={100}
              value={topThreshold}
              onChange={(e) =>
                setTopThreshold(
                  parseInt(e.target.value) < 1 ? 1 : parseInt(e.target.value)
                )
              }
              className="w-32"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dp-window">滑动窗口（分钟）</Label>
            <Input
              id="dp-window"
              type="number"
              min={1}
              max={60}
              value={windowMinutes}
              onChange={(e) =>
                setWindowMinutes(
                  parseInt(e.target.value) < 1 ? 1 : parseInt(e.target.value)
                )
              }
              className="w-32"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          权重总和：{weightSum}
          {weightSum !== 100 && '（非 100 时后端自动归一化）'}
        </p>
        <p className="text-sm text-muted-foreground">
          同档阈值：选渠道时取分数前 X% 的渠道作为同档，档内按权重加权随机。
          窗口：评分只看最近 N
          分钟的请求数据。延迟维度自动区分流式（首字延迟）与非流式（端到端）。
        </p>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? '保存中...' : '保存动态优先级设置'}
        </Button>
      </CardContent>
    </Card>
  );
}

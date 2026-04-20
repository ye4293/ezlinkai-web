'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import request from '@/app/lib/clientFetch';

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface KeySource {
  Type: string; // "context_int" | "context_string" | "gjson"
  Key: string;
  Path: string;
}

interface AffinityRule {
  Name: string;
  ModelRegex: string[];
  PathRegex: string[];
  UserAgentInclude: string[];
  KeySources: KeySource[];
  ValueRegex: string;
  TTLSeconds: number;
  SkipRetryOnFailure: boolean;
  IncludeRuleName: boolean;
  IncludeModelName: boolean;
  IncludeUsingGroup: boolean;
}

interface AffinityConfig {
  Enabled: boolean;
  MaxSize: number;
  DefaultTTLSeconds: number;
  SwitchAffinityOnSuccess: boolean;
  Rules: AffinityRule[];
}

const DEFAULT_CONFIG: AffinityConfig = {
  Enabled: false,
  MaxSize: 100000,
  DefaultTTLSeconds: 3600,
  SwitchAffinityOnSuccess: false,
  Rules: []
};

// ─── 规则编辑弹窗 ─────────────────────────────────────────────────────────────

function RuleEditDialog({
  open,
  onOpenChange,
  rule,
  onSave
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rule: AffinityRule | null;
  onSave: (r: AffinityRule) => void;
}) {
  const [form, setForm] = useState<AffinityRule>(
    rule ?? {
      Name: '',
      ModelRegex: [],
      PathRegex: [],
      UserAgentInclude: [],
      KeySources: [{ Type: 'gjson', Key: '', Path: '' }],
      ValueRegex: '',
      TTLSeconds: 0,
      SkipRetryOnFailure: true,
      IncludeRuleName: true,
      IncludeModelName: false,
      IncludeUsingGroup: true
    }
  );

  useEffect(() => {
    if (rule) setForm(rule);
  }, [rule]);

  const handle = (field: keyof AffinityRule, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? '编辑规则' : '新增规则'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>规则名称</Label>
              <Input
                value={form.Name}
                onChange={(e) => handle('Name', e.target.value)}
                placeholder="如 claude-cli"
              />
            </div>
            <div className="space-y-1">
              <Label>TTL（秒，0 使用全局默认）</Label>
              <Input
                type="number"
                value={form.TTLSeconds}
                onChange={(e) => handle('TTLSeconds', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>模型正则（每行一条）</Label>
            <Textarea
              rows={2}
              value={form.ModelRegex.join('\n')}
              onChange={(e) =>
                handle('ModelRegex', e.target.value.split('\n').filter(Boolean))
              }
              placeholder="^claude-"
            />
          </div>
          <div className="space-y-1">
            <Label>路径正则（每行一条，为空不限制）</Label>
            <Textarea
              rows={2}
              value={form.PathRegex.join('\n')}
              onChange={(e) =>
                handle('PathRegex', e.target.value.split('\n').filter(Boolean))
              }
              placeholder="/v1/messages"
            />
          </div>
          <div className="space-y-1">
            <Label>
              Key 来源（仅支持一条 gjson，Path 如 metadata.user_id）
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">类型</Label>
                <Input
                  value={form.KeySources[0]?.Type ?? 'gjson'}
                  onChange={(e) => {
                    const sources = [...form.KeySources];
                    sources[0] = { ...sources[0], Type: e.target.value };
                    handle('KeySources', sources);
                  }}
                  placeholder="gjson"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  路径 / Key
                </Label>
                <Input
                  value={
                    form.KeySources[0]?.Path || form.KeySources[0]?.Key || ''
                  }
                  onChange={(e) => {
                    const sources = [...form.KeySources];
                    const t = sources[0]?.Type ?? 'gjson';
                    sources[0] = {
                      ...sources[0],
                      Path: t === 'gjson' ? e.target.value : '',
                      Key: t !== 'gjson' ? e.target.value : ''
                    };
                    handle('KeySources', sources);
                  }}
                  placeholder="metadata.user_id"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.SkipRetryOnFailure}
                onCheckedChange={(v) => handle('SkipRetryOnFailure', v)}
              />
              <Label>失败后不重试</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.IncludeRuleName}
                onCheckedChange={(v) => handle('IncludeRuleName', v)}
              />
              <Label>Key 含规则名</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.IncludeModelName}
                onCheckedChange={(v) => handle('IncludeModelName', v)}
              />
              <Label>Key 含模型名</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.IncludeUsingGroup}
                onCheckedChange={(v) => handle('IncludeUsingGroup', v)}
              />
              <Label>Key 含分组</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                onSave(form);
                onOpenChange(false);
              }}
            >
              保存规则
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function AffinityModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [config, setConfig] = useState<AffinityConfig>(DEFAULT_CONFIG);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AffinityRule | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await request.get('/api/affinity/config');
      if (res.data?.success) {
        const cfg = res.data.data as AffinityConfig;
        setConfig(cfg);
        setJsonText(JSON.stringify(cfg, null, 2));
      }
    } catch {
      toast.error('加载亲和配置失败');
    }
  }, []);

  const fetchCacheStats = useCallback(async () => {
    try {
      const res = await request.get('/api/affinity/cache');
      if (res.data?.success) {
        setCacheCount(res.data.data?.count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchConfig();
      fetchCacheStats();
    }
  }, [open, fetchConfig, fetchCacheStats]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let cfg = config;
      if (jsonMode) {
        cfg = JSON.parse(jsonText);
      }
      const res = await request.put('/api/affinity/config', cfg);
      if (res.data?.success) {
        toast.success('保存成功');
        setConfig(cfg);
      } else {
        toast.error(res.data?.message ?? '保存失败');
      }
    } catch (e: unknown) {
      toast.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const res = await request.delete('/api/affinity/cache');
      if (res.data?.success) {
        toast.success(res.data.message ?? '缓存已清空');
        setCacheCount(0);
      } else {
        toast.error(res.data?.message ?? '清空失败');
      }
    } catch {
      toast.error('清空缓存失败');
    } finally {
      setClearing(false);
    }
  };

  const handleSwitchToJson = () => {
    setJsonText(JSON.stringify(config, null, 2));
    setJsonMode(true);
  };

  const handleSwitchToVisual = () => {
    try {
      const cfg = JSON.parse(jsonText);
      setConfig(cfg);
      setJsonMode(false);
    } catch {
      toast.error('JSON 格式错误，无法切换');
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setEditingIndex(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: AffinityRule, index: number) => {
    setEditingRule(rule);
    setEditingIndex(index);
    setRuleDialogOpen(true);
  };

  const handleDeleteRule = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      Rules: prev.Rules.filter((_, i) => i !== index)
    }));
  };

  const handleSaveRule = (rule: AffinityRule) => {
    setConfig((prev) => {
      const rules = [...(prev.Rules ?? [])];
      if (editingIndex !== null) {
        rules[editingIndex] = rule;
      } else {
        rules.push(rule);
      }
      return { ...prev, Rules: rules };
    });
  };

  const formatKeySource = (sources: KeySource[]) => {
    if (!sources?.length) return '-';
    const s = sources[0];
    if (s.Type === 'gjson') return `gjson:${s.Path}`;
    return `${s.Type}:${s.Key}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>渠道亲和性</DialogTitle>
          </DialogHeader>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              渠道亲和性会基于从请求上下文或 JSON Body 提取的
              Key，优先复用上一次成功的渠道。
            </AlertDescription>
          </Alert>

          {!jsonMode ? (
            <div className="space-y-6">
              {/* 全局开关 + 参数 */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">启用</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.Enabled}
                      onCheckedChange={(v) =>
                        setConfig((prev) => ({ ...prev, Enabled: v }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    启用后将优先复用上一次成功的渠道（粘滞选路）。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">最大条目数</Label>
                  <Input
                    type="number"
                    value={config.MaxSize}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        MaxSize: Number(e.target.value)
                      }))
                    }
                    className="w-36"
                  />
                  <p className="text-xs text-muted-foreground">
                    内存存储最大条目数。0 表示使用后端默认容量：100000。
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    默认 TTL（秒）
                  </Label>
                  <Input
                    type="number"
                    value={config.DefaultTTLSeconds}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        DefaultTTLSeconds: Number(e.target.value)
                      }))
                    }
                    className="w-36"
                  />
                  <p className="text-xs text-muted-foreground">
                    规则 ttl_seconds 为 0 时使用。0 表示使用后端默认 TTL：3600
                    秒。
                  </p>
                </div>
              </div>

              {/* 成功后切换亲和 */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  成功后切换亲和
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.SwitchAffinityOnSuccess}
                    onCheckedChange={(v) =>
                      setConfig((prev) => ({
                        ...prev,
                        SwitchAffinityOnSuccess: v
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  如果亲和到的渠道失败，重试到其他渠道成功后，将亲和更新到成功的渠道。
                </p>
              </div>

              {/* 工具栏 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToJson}
                >
                  JSON 模式
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddRule}>
                  <Plus className="mr-1 h-3 w-3" /> 新增规则
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchCacheStats}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  刷新缓存统计
                  {cacheCount !== null && (
                    <span className="ml-1 text-muted-foreground">
                      ({cacheCount})
                    </span>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={clearing}
                >
                  {clearing ? '清空中...' : '清空全部缓存'}
                </Button>
              </div>

              {/* 规则表格 */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>模型正则</TableHead>
                      <TableHead>路径正则</TableHead>
                      <TableHead>Key 来源</TableHead>
                      <TableHead>TTL（秒）</TableHead>
                      <TableHead>失败后是否重试</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(config.Rules ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          暂无规则，点击"新增规则"添加
                        </TableCell>
                      </TableRow>
                    ) : (
                      (config.Rules ?? []).map((rule, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {rule.Name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.ModelRegex?.map((r, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="font-mono text-xs"
                                >
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.PathRegex?.length ? (
                                rule.PathRegex.map((r, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {r}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatKeySource(rule.KeySources)}
                          </TableCell>
                          <TableCell>
                            {rule.TTLSeconds > 0 ? rule.TTLSeconds : '-'}
                          </TableCell>
                          <TableCell>
                            {rule.SkipRetryOnFailure ? (
                              <Badge variant="destructive" className="text-xs">
                                不重试
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                重试
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditRule(rule, idx)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteRule(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* JSON 模式 */
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToVisual}
                >
                  可视化模式
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
              <Textarea
                className="min-h-[400px] font-mono text-sm"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RuleEditDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        rule={editingRule}
        onSave={handleSaveRule}
      />
    </>
  );
}

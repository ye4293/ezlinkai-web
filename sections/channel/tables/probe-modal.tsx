'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Channel } from '@/lib/types/channel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// 单次 HTTP 请求探测的模型数上限，必须与后端 manualProbeMaxPerRequest 一致。
const PROBE_BATCH_SIZE = 50;

type Scene = 'pending_add' | 'pending_remove';

interface ProbeResult {
  model: string;
  mapped_model?: string;
  scene: Scene;
  verdict: string;
  status_code: number;
  duration: number;
  message?: string;
  skip_reason?: string;
  approve: boolean;
}

interface ProbeTarget {
  model: string;
  scene: Scene;
}

interface ProbeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  onApplied?: () => void;
}

// shouldPreselect 决定探测结果的默认勾选状态。
//
// 刻意比后端的 probeVerdictApproves 更严格：后端对 skipped 返回 approve=true
// （「探针无能力→信任上游」是定时任务的策略），但管理员点手动探针恰恰是因为
// 不信任上游，所以 skipped / rate_limited / inconclusive 一律不默认勾选，
// 只勾选有明确证据的：新增方向的 alive、删除方向的 not_found / unavailable。
function shouldPreselect(verdict: string, scene: Scene): boolean {
  if (scene === 'pending_add') return verdict === 'alive';
  if (scene === 'pending_remove')
    return verdict === 'not_found' || verdict === 'unavailable';
  return false;
}

// verdict → 中性、可读的中文标签。
// unavailable 特意不写「临时不可用」：实测级联 one-api 时 503 常是「本 key 分组
// 无权访问」这类长期状态，误导管理员「等会再试」会再花一次探测的钱。
const VERDICT_LABEL: Record<string, string> = {
  alive: '可用',
  not_found: '不存在 (404)',
  unavailable: '上游不可服务 (503)',
  rate_limited: '限流 (429)',
  inconclusive: '无法判定',
  skipped: '跳过（非聊天模型）'
};

const VERDICT_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  alive: 'default',
  not_found: 'destructive',
  unavailable: 'destructive',
  rate_limited: 'secondary',
  inconclusive: 'outline',
  skipped: 'outline'
};

function parseTargets(channel: Channel): ProbeTarget[] {
  let settings: any = {};
  try {
    settings = JSON.parse(channel.other_settings || '{}') || {};
  } catch {
    settings = {};
  }
  const add: string[] =
    settings.upstream_model_update_last_detected_models || [];
  const remove: string[] =
    settings.upstream_model_update_last_removed_models || [];
  const targets: ProbeTarget[] = [];
  add.forEach((m) => m && targets.push({ model: m, scene: 'pending_add' }));
  remove.forEach(
    (m) => m && targets.push({ model: m, scene: 'pending_remove' })
  );
  return targets;
}

export const ProbeModal: React.FC<ProbeModalProps> = ({
  isOpen,
  onClose,
  channel,
  onApplied
}) => {
  const [targets, setTargets] = useState<ProbeTarget[]>(() =>
    parseTargets(channel)
  );
  const [detecting, setDetecting] = useState(false);
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unsupported, setUnsupported] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargets(parseTargets(channel));
    }
  }, [isOpen, channel]);

  // 关闭时中止在途探测并复位
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      abortRef.current = null;
      setResults({});
      setSelected({});
      setRunning(false);
      setDetecting(false);
      setProgress({ done: 0, total: 0 });
      setUnsupported('');
    }
  }, [isOpen]);

  const runDetect = async () => {
    setDetecting(true);
    try {
      const res = await fetch('/api/channel/upstream_updates/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(channel.id) }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || '拉取上游差异失败');
        return;
      }
      const addModels: string[] = data.data?.add_models || [];
      const removeModels: string[] = data.data?.remove_models || [];
      const newTargets: ProbeTarget[] = [];
      addModels.forEach(
        (m) => m && newTargets.push({ model: m, scene: 'pending_add' })
      );
      removeModels.forEach(
        (m) => m && newTargets.push({ model: m, scene: 'pending_remove' })
      );
      setTargets(newTargets);
      if (newTargets.length === 0) {
        toast.info('上游模型列表与本地一致，无差异');
      }
    } catch (e: any) {
      toast.error(e?.message || '拉取上游差异异常');
    } finally {
      setDetecting(false);
    }
  };

  const runProbe = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setUnsupported('');
    setResults({});
    setSelected({});
    setProgress({ done: 0, total: targets.length });

    const queue = [...targets];
    try {
      while (queue.length > 0 && !controller.signal.aborted) {
        const batch = queue.splice(0, PROBE_BATCH_SIZE);
        const res = await fetch('/api/channel/upstream_updates/probe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(channel.id),
            models: batch.map((t) => t.model)
          }),
          credentials: 'include',
          signal: controller.signal
        });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.message || '探测失败');
          break;
        }
        if (data.data?.supported === false) {
          setUnsupported(data.data.reason || '该渠道类型不支持探测');
          break;
        }
        const batchResults: ProbeResult[] = data.data?.results || [];
        setResults((prev) => {
          const next = { ...prev };
          batchResults.forEach((r) => (next[r.model] = r));
          return next;
        });
        setSelected((prev) => {
          const next = { ...prev };
          batchResults.forEach((r) => {
            next[r.model] = shouldPreselect(r.verdict, r.scene);
          });
          return next;
        });
        setProgress((p) => ({ ...p, done: p.done + batch.length }));
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(e?.message || '探测异常');
    } finally {
      setRunning(false);
    }
  };

  const resultList = useMemo(
    () => targets.map((t) => results[t.model]).filter(Boolean) as ProbeResult[],
    [targets, results]
  );

  const selectedCount = useMemo(
    () => resultList.filter((r) => selected[r.model]).length,
    [resultList, selected]
  );

  const applySelected = async () => {
    const addModels = resultList
      .filter((r) => r.scene === 'pending_add' && selected[r.model])
      .map((r) => r.model);
    const removeModels = resultList
      .filter((r) => r.scene === 'pending_remove' && selected[r.model])
      .map((r) => r.model);
    if (addModels.length === 0 && removeModels.length === 0) {
      toast.error('未勾选任何模型');
      return;
    }
    setApplying(true);
    try {
      const res = await fetch('/api/channel/upstream_updates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(channel.id),
          add_models: addModels,
          remove_models: removeModels,
          ignore_models: []
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || '应用失败');
        return;
      }
      const added: string[] = data.data?.added_models || [];
      const removed: string[] = data.data?.removed_models || [];
      // 与提交值做差集：pending 列表可能在探测期间被定时任务改动，
      // 交集会静默吞掉部分勾选，必须告警（否则管理员以为全部应用了）。
      const missed = [
        ...addModels.filter((m) => !added.includes(m)),
        ...removeModels.filter((m) => !removed.includes(m))
      ];
      if (missed.length > 0) {
        toast.warning(
          `${
            missed.length
          } 个模型已不在待处理列表（可能已被自动同步或上游列表已变），未应用：${missed
            .slice(0, 5)
            .join(', ')}${missed.length > 5 ? ' …' : ''}`
        );
      }
      toast.success(
        `已应用：新增 ${added.length} 个，删除 ${removed.length} 个`
      );
      onApplied?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || '应用失败');
    } finally {
      setApplying(false);
    }
  };

  const started = progress.total > 0;

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          runProbe();
        }}
        loading={false}
        title="确认探测"
        description={`将向上游发起最多 ${targets.length} 次真实请求以验证模型可用性，可能产生上游费用。确定继续？`}
      />
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>模型探针：{channel.name}</DialogTitle>
            <DialogDescription>
              对上游差异模型发起真实请求，验证是否可用，并可勾选应用增删。
            </DialogDescription>
          </DialogHeader>

          {targets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="text-sm text-muted-foreground">
                当前没有待处理的上游差异。
              </span>
              <Button size="sm" onClick={runDetect} disabled={detecting}>
                {detecting ? '正在拉取…' : '拉取上游差异'}
              </Button>
            </div>
          ) : unsupported ? (
            <div className="py-8 text-center text-sm text-destructive">
              {unsupported}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={running}
                >
                  {running ? '探测中…' : started ? '重新探测' : '开始探测'}
                </Button>
                {running && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abortRef.current?.abort()}
                  >
                    停止
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  待探测 {targets.length} 个（新增{' '}
                  {targets.filter((t) => t.scene === 'pending_add').length} /
                  待删{' '}
                  {targets.filter((t) => t.scene === 'pending_remove').length}）
                </span>
              </div>

              {started && (
                <div className="space-y-1">
                  <Progress
                    value={(progress.done / progress.total) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    进度 {progress.done}/{progress.total}
                  </div>
                </div>
              )}

              {resultList.length > 0 && (
                <div className="max-h-[45vh] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>模型</TableHead>
                        <TableHead className="w-20">方向</TableHead>
                        <TableHead className="w-32">结论</TableHead>
                        <TableHead className="w-16">耗时</TableHead>
                        <TableHead>详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultList.map((r) => (
                        <TableRow key={r.model}>
                          <TableCell>
                            <Checkbox
                              checked={!!selected[r.model]}
                              onCheckedChange={(v) =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [r.model]: !!v
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.model}
                            {r.mapped_model && r.mapped_model !== r.model && (
                              <span className="text-muted-foreground">
                                {' '}
                                →{r.mapped_model}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.scene === 'pending_add' ? '新增' : '待删'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={VERDICT_VARIANT[r.verdict] || 'outline'}
                            >
                              {VERDICT_LABEL[r.verdict] || r.verdict}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.duration > 0 ? `${r.duration.toFixed(1)}s` : '-'}
                          </TableCell>
                          <TableCell
                            className="max-w-[220px] truncate text-xs text-muted-foreground"
                            title={r.message || r.skip_reason || ''}
                          >
                            {r.message || r.skip_reason || ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            <Button
              onClick={applySelected}
              disabled={running || applying || selectedCount === 0}
            >
              {applying ? '应用中…' : `应用勾选（${selectedCount}）`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

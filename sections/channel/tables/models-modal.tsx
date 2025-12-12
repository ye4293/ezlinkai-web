'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Channel } from '@/lib/types/channel';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Search,
  Play,
  RotateCw,
  MoreVertical
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface ModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
}

type Model = {
  id: string;
  name: string;
  owned_by: string;
  created_at: number;
  responseTime?: number; // 响应时间（秒）
  testStatus?: 'testing' | 'success' | 'failed' | 'idle'; // 测试状态
};

// 移动端模型行组件 - 简洁的表格行样式
const MobileModelRow = ({
  model,
  isSelected,
  onSelect,
  onTest
}: {
  model: Model;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onTest: () => void;
}) => {
  const getStatusBadge = () => {
    if (model.testStatus === 'testing') {
      return (
        <Badge
          variant="outline"
          className="animate-pulse border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
        >
          测试中
        </Badge>
      );
    }
    if (model.testStatus === 'success') {
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          成功
        </Badge>
      );
    }
    if (model.testStatus === 'failed') {
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          失败
        </Badge>
      );
    }
    return <Badge variant="secondary">未开始</Badge>;
  };

  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-3 last:border-0 ${
        isSelected ? 'bg-muted/50' : ''
      }`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{model.name}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{model.owned_by}</span>
          {model.responseTime && (
            <span className="font-mono">{model.responseTime.toFixed(2)}s</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {getStatusBadge()}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onTest();
          }}
          disabled={model.testStatus === 'testing'}
          className="h-7 px-2 text-xs"
        >
          测试
        </Button>
      </div>
    </div>
  );
};

export const ModelsModal: React.FC<ModelsModalProps> = ({
  isOpen,
  onClose,
  channel
}) => {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (isOpen) {
      const fetchModels = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/channel/models_by_id?id=${channel.id}`);
          if (!res.ok) throw new Error(res.statusText);
          const data = await res.json();
          if (data.success) {
            setModels(
              data.data.map((model: any) => ({
                id: model.id,
                name: model.id,
                owned_by: model.owned_by,
                created_at: model.created_at,
                testStatus: 'idle' as const,
                responseTime: undefined
              }))
            );
          } else {
            toast.error(data.message || '获取模型列表失败');
          }
        } catch (error) {
          console.error(error);
          toast.error('获取模型列表失败');
        } finally {
          setLoading(false);
        }
      };
      fetchModels();
    }
  }, [isOpen, channel.id]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const testModel = async (modelName: string) => {
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelName
          ? { ...m, testStatus: 'testing', responseTime: undefined }
          : m
      )
    );

    const startTime = Date.now();
    try {
      const res = await fetch(`/api/channel/test/${channel.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      });

      const endTime = Date.now();
      const localTime = (endTime - startTime) / 1000;

      if (!res.ok) throw new Error(res.statusText);
      const result = await res.json();

      let serverTime = localTime;
      if (result.message && typeof result.message === 'string') {
        const match = result.message.match(/took ([\d.]+)s/);
        if (match) serverTime = parseFloat(match[1]);
      }

      if (result.success) {
        setModels((prev) =>
          prev.map((m) =>
            m.id === modelName
              ? { ...m, testStatus: 'success', responseTime: serverTime }
              : m
          )
        );
        toast.success(result.message || `模型 ${modelName} 测试成功`);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelName
            ? {
                ...m,
                testStatus: 'failed',
                responseTime: (Date.now() - startTime) / 1000
              }
            : m
        )
      );
      toast.error(error.message || `模型 ${modelName} 测试失败`);
    }
  };

  const onBatchTest = async () => {
    if (selectedModels.length === 0) return;
    toast.info(`开始批量测试 ${selectedModels.length} 个模型...`);
    for (const model of selectedModels) {
      await testModel(model.id);
    }
  };

  const filteredModels = useMemo(() => {
    return models.filter((model) =>
      model.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [models, search]);

  const totalPages = Math.ceil(filteredModels.length / pageSize);
  const paginatedModels = filteredModels.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const allPageSelected =
    paginatedModels.length > 0 &&
    paginatedModels.every((m) => selectedModels.some((s) => s.id === m.id));

  const handleSelectAllPage = (checked: boolean) => {
    if (checked) {
      const newSelected = [...selectedModels];
      paginatedModels.forEach((m) => {
        if (!newSelected.some((s) => s.id === m.id)) newSelected.push(m);
      });
      setSelectedModels(newSelected);
    } else {
      const pageIds = paginatedModels.map((m) => m.id);
      setSelectedModels(selectedModels.filter((m) => !pageIds.includes(m.id)));
    }
  };

  const handleSelectModel = (model: Model, checked: boolean) => {
    if (checked) {
      setSelectedModels([...selectedModels, model]);
    } else {
      setSelectedModels(selectedModels.filter((m) => m.id !== model.id));
    }
  };

  const handleCopySelected = () => {
    if (selectedModels.length === 0) return;
    const text = selectedModels.map((m) => m.id).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('已复制选中模型名称');
  };

  const handleSelectSuccessful = () => {
    const successModels = filteredModels.filter(
      (m) => m.testStatus === 'success'
    );
    const newSelected = [...selectedModels];
    successModels.forEach((m) => {
      if (!newSelected.some((s) => s.id === m.id)) newSelected.push(m);
    });
    setSelectedModels(newSelected);
    toast.success(`已选择 ${successModels.length} 个测试成功的模型`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        Mobile: Full screen (h-[100dvh] w-screen max-w-none rounded-none)
        Desktop: Centered dialog (sm:h-auto sm:max-h-[85vh] sm:max-w-4xl sm:rounded-lg)
      */}
      <DialogContent className="fixed left-[50%] top-[50%] z-50 flex max-h-[85vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col gap-0 rounded-lg border bg-background p-0 shadow-lg duration-200 sm:w-full">
        {/* Header */}
        <DialogHeader className="flex flex-shrink-0 flex-row items-center justify-between border-b px-4 py-3 pr-12 sm:pr-6">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">
              {channel.name} 渠道的模型测试
            </DialogTitle>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              共 {models.length} 个模型
            </Badge>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-shrink-0 flex-col gap-3 border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 bg-background pl-9 text-sm"
              />
            </div>

            {/* Mobile Actions Dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleCopySelected}
                    disabled={selectedModels.length === 0}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制选中 ({selectedModels.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSelectSuccessful}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    选中成功模型
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Actions */}
            <div className="hidden gap-2 sm:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySelected}
                disabled={selectedModels.length === 0}
              >
                <Copy className="mr-2 h-4 w-4" />
                复制选中
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectSuccessful}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                选择成功
              </Button>
            </div>
          </div>

          {/* Selection Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-page"
                checked={allPageSelected}
                onCheckedChange={handleSelectAllPage}
              />
              <label
                htmlFor="select-all-page"
                className="text-sm text-muted-foreground"
              >
                全选本页
              </label>
            </div>
            {selectedModels.length > 0 && (
              <span className="text-sm font-medium text-primary">
                已选 {selectedModels.length} 项
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <RotateCw className="h-8 w-8 animate-spin" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-sm">暂无模型</p>
            </div>
          ) : paginatedModels.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <p className="text-sm">未找到相关模型</p>
            </div>
          ) : (
            <>
              {/* Mobile List View */}
              <div className="block sm:hidden">
                {/* 移动端表头 */}
                <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <div className="w-4 shrink-0"></div>
                  <div className="flex-1">模型信息</div>
                  <div className="shrink-0 text-right">状态/操作</div>
                </div>
                {paginatedModels.map((model) => (
                  <MobileModelRow
                    key={model.id}
                    model={model}
                    isSelected={selectedModels.some((m) => m.id === model.id)}
                    onSelect={(checked) => handleSelectModel(model, checked)}
                    onTest={() => testModel(model.id)}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden flex-col sm:flex">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        {/* Checkbox managed in toolbar for simplicity, or we can add back here */}
                      </TableHead>
                      <TableHead>模型名称</TableHead>
                      <TableHead className="w-[100px] text-center">
                        状态
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        响应时间
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedModels.some(
                              (m) => m.id === model.id
                            )}
                            onCheckedChange={(checked) =>
                              handleSelectModel(model, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {model.owned_by}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {model.testStatus === 'testing' ? (
                            <Badge
                              variant="outline"
                              className="animate-pulse border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            >
                              测试中
                            </Badge>
                          ) : model.testStatus === 'success' ? (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                            >
                              成功
                            </Badge>
                          ) : model.testStatus === 'failed' ? (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                            >
                              失败
                            </Badge>
                          ) : (
                            <Badge variant="secondary">未测试</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {model.responseTime
                            ? `${model.responseTime.toFixed(2)}s`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testModel(model.id)}
                            disabled={model.testStatus === 'testing'}
                          >
                            测试
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pb-safe flex flex-shrink-0 items-center justify-between border-t bg-background p-3">
          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[3.5rem] text-center text-sm font-medium">
              {page} / {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {selectedModels.length > 0 && (
              <Button onClick={onBatchTest} className="h-9 px-4">
                <Play className="mr-2 h-4 w-4" />
                测试 ({selectedModels.length})
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} className="h-9">
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

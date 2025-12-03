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
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

// 移动端模型卡片组件
const MobileModelCard = ({
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
  return (
    <Card className="mb-3 overflow-hidden border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <div>
              <div className="break-all font-medium">{model.name}</div>
              <div className="text-xs text-muted-foreground">
                {model.owned_by}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {model.testStatus === 'testing' ? (
              <Badge
                variant="outline"
                className="animate-pulse border-blue-200 bg-blue-50 text-blue-700"
              >
                测试中
              </Badge>
            ) : model.testStatus === 'success' ? (
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-green-700"
              >
                成功
              </Badge>
            ) : model.testStatus === 'failed' ? (
              <Badge
                variant="outline"
                className="border-red-200 bg-red-50 text-red-700"
              >
                失败
              </Badge>
            ) : (
              <Badge variant="secondary">未测试</Badge>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {model.responseTime ? `${model.responseTime.toFixed(2)}s` : '-'}
            </span>
          </div>
        </div>
        <div className="mt-3 flex justify-end border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTest}
            disabled={model.testStatus === 'testing'}
            className="h-8 text-xs"
          >
            <Play className="mr-1 h-3 w-3" /> 测试
          </Button>
        </div>
      </CardContent>
    </Card>
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
      {/* 调整 DialogContent 样式以适应移动端 */}
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:h-[85vh]">
        <DialogHeader className="flex-shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold sm:text-lg">
              模型测试 - {channel.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="font-mono text-xs sm:text-sm"
              >
                共 {models.length} 个
              </Badge>
              {/* 移动端显示的关闭按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full sm:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模型..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopySelected}
                disabled={selectedModels.length === 0}
                title="复制选中模型名称"
                className="flex-1 sm:flex-none"
              >
                <Copy className="mr-2 h-4 w-4" />
                <span className="sm:hidden">复制</span>
                <span className="hidden sm:inline">复制选中</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSelectSuccessful}
                title="选择所有测试成功的模型"
                className="flex-1 sm:flex-none"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span className="sm:hidden">全选成功</span>
                <span className="hidden sm:inline">选择成功</span>
              </Button>
            </div>
          </div>

          {/* 全选 checkbox for mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Checkbox
              checked={allPageSelected}
              onCheckedChange={handleSelectAllPage}
              id="select-all-mobile"
            />
            <label
              htmlFor="select-all-mobile"
              className="text-sm text-muted-foreground"
            >
              全选当前页
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <RotateCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  正在加载模型列表...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={handleSelectAllPage}
                        />
                      </TableHead>
                      <TableHead>模型名称</TableHead>
                      <TableHead className="w-[120px] text-center">
                        状态
                      </TableHead>
                      <TableHead className="w-[120px] text-center">
                        响应时间
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedModels.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          未找到相关模型
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedModels.map((model) => (
                        <TableRow key={model.id} className="hover:bg-muted/30">
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
                                className="animate-pulse border-blue-200 bg-blue-50 text-blue-700"
                              >
                                测试中
                              </Badge>
                            ) : model.testStatus === 'success' ? (
                              <Badge
                                variant="outline"
                                className="border-green-200 bg-green-50 text-green-700"
                              >
                                成功
                              </Badge>
                            ) : model.testStatus === 'failed' ? (
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View: Cards */}
              <div className="block p-4 sm:hidden">
                {paginatedModels.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    未找到相关模型
                  </div>
                ) : (
                  paginatedModels.map((model) => (
                    <MobileModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModels.some((m) => m.id === model.id)}
                      onSelect={(checked) => handleSelectModel(model, checked)}
                      onTest={() => testModel(model.id)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 flex-col gap-3 border-t bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex w-full items-center justify-between text-sm text-muted-foreground sm:w-auto sm:gap-4">
            <span>已选 {selectedModels.length}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[3rem] text-center">
                {page} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              关闭
            </Button>
            <Button
              onClick={onBatchTest}
              disabled={selectedModels.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Play className="mr-2 h-4 w-4" />
              <span className="sm:hidden">测试选中</span>
              <span className="hidden sm:inline">批量测试</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

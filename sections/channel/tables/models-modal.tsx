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
import { useEffect, useState } from 'react';
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
import { useRouter } from 'next/navigation';

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

export const ModelsModal: React.FC<ModelsModalProps> = ({
  isOpen,
  onClose,
  channel
}) => {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const fetchModels = async () => {
        setLoading(true);
        try {
          console.log(`获取频道 ${channel.id} 的模型列表`);
          const res = await fetch(`/api/channel/models_by_id?id=${channel.id}`);

          console.log(`获取模型API响应状态: ${res.status} ${res.statusText}`);

          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `获取模型列表失败: ${res.status} ${res.statusText}`,
              errorText
            );
            toast.error(`获取模型列表失败: ${res.status} ${res.statusText}`);
            return;
          }

          const data = await res.json();
          console.log('模型列表API响应数据:', data);

          if (data.success) {
            setModels(
              data.data.map((model: any) => ({
                id: model.id,
                name: model.id, // The API seems to return id as the name
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
          console.error('获取模型列表时发生错误:', error);
          toast.error(
            `获取模型列表时发生错误: ${
              error instanceof Error ? error.message : '未知错误'
            }`
          );
        } finally {
          setLoading(false);
        }
      };
      fetchModels();
    }
  }, [isOpen, channel.id]);

  const testModel = async (modelName: string) => {
    // 更新模型状态为测试中
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === modelName
          ? {
              ...model,
              testStatus: 'testing' as const,
              responseTime: undefined
            }
          : model
      )
    );

    toast.info(`正在测试模型: ${modelName}...`);
    const startTime = Date.now();

    try {
      console.log(`开始测试频道 ${channel.id} 的模型 ${modelName}`);
      const res = await fetch(`/api/channel/test/${channel.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: modelName }),
        credentials: 'include'
      });

      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000; // 转换为秒

      console.log(`API响应状态: ${res.status} ${res.statusText}`);
      console.log(`本地测量响应时间: ${responseTime.toFixed(2)}s`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `API请求失败: ${res.status} ${res.statusText}`,
          errorText
        );
        toast.error(`API请求失败: ${res.status} ${res.statusText}`);

        // 更新模型状态为失败
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === modelName
              ? {
                  ...model,
                  testStatus: 'failed' as const,
                  responseTime: responseTime
                }
              : model
          )
        );
        return;
      }

      const result = await res.json();
      console.log('API响应数据:', result);

      // 从返回消息中提取服务器端测量的时间（如果有）
      let serverResponseTime = responseTime;
      if (result.message && typeof result.message === 'string') {
        const timeMatch = result.message.match(/took ([\d.]+)s/);
        if (timeMatch) {
          serverResponseTime = parseFloat(timeMatch[1]);
          console.log(`服务器端测量响应时间: ${serverResponseTime}s`);
        }
      }

      if (result.success) {
        toast.success(
          result.message ||
            `模型 ${modelName} 测试成功，耗时 ${serverResponseTime.toFixed(2)}s`
        );

        // 更新模型状态为成功
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === modelName
              ? {
                  ...model,
                  testStatus: 'success' as const,
                  responseTime: serverResponseTime
                }
              : model
          )
        );
      } else {
        toast.error(result.message || `模型 ${modelName} 测试失败`);

        // 更新模型状态为失败
        setModels((prevModels) =>
          prevModels.map((model) =>
            model.id === modelName
              ? {
                  ...model,
                  testStatus: 'failed' as const,
                  responseTime: serverResponseTime
                }
              : model
          )
        );
      }
    } catch (e) {
      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000;

      console.error(`测试模型 ${modelName} 时发生错误:`, e);
      toast.error(
        `测试模型 ${modelName} 时发生错误: ${
          e instanceof Error ? e.message : '未知错误'
        }`
      );

      // 更新模型状态为失败
      setModels((prevModels) =>
        prevModels.map((model) =>
          model.id === modelName
            ? {
                ...model,
                testStatus: 'failed' as const,
                responseTime: responseTime
              }
            : model
        )
      );
    }
  };

  const onBatchTest = async () => {
    if (selectedModels.length === 0) {
      toast.warning('请至少选择一个模型进行测试。');
      return;
    }

    toast.info(`开始批量测试 ${selectedModels.length} 个模型...`);

    for (const model of selectedModels) {
      await testModel(model.id);
    }
  };

  const [allSelected, setAllSelected] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    if (checked) {
      setSelectedModels([...filteredModels]);
    } else {
      setSelectedModels([]);
    }
  };

  const handleSelectModel = (model: Model, checked: boolean) => {
    if (checked) {
      setSelectedModels((prev) => [...prev, model]);
    } else {
      setSelectedModels((prev) => prev.filter((m) => m.id !== model.id));
      setAllSelected(false);
    }
  };

  const isModelSelected = (model: Model) => {
    return selectedModels.some((m) => m.id === model.id);
  };

  const filteredModels = models.filter((model) =>
    model.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[800px] max-h-[95vh] w-[1200px] max-w-[95vw] flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-xl font-bold">
            Models for Channel: {channel.name}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-6 py-4">
          <div className="px-6">
            <Input
              placeholder="搜索模型..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mx-auto block h-10 max-w-lg text-base"
              disabled={loading}
            />
          </div>
          <div className="min-h-0 flex-1 rounded-lg bg-gray-50/50 p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      加载模型中...
                    </p>
                    <p className="text-sm text-gray-500">
                      正在获取频道 {channel.name} 的模型列表
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full overflow-auto">
                <Table
                  style={{ width: '1100px', tableLayout: 'fixed' }}
                  className="mx-auto"
                >
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead
                        style={{ width: '80px' }}
                        className="text-center"
                      >
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead
                        style={{ width: '600px' }}
                        className="text-left"
                      >
                        模型名称
                      </TableHead>
                      <TableHead
                        style={{ width: '140px' }}
                        className="text-center"
                      >
                        状态
                      </TableHead>
                      <TableHead
                        style={{ width: '140px' }}
                        className="text-center"
                      >
                        响应时间
                      </TableHead>
                      <TableHead
                        style={{ width: '140px' }}
                        className="text-center"
                      >
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow key={model.id} className="hover:bg-gray-50">
                        <TableCell
                          style={{ width: '80px' }}
                          className="text-center"
                        >
                          <Checkbox
                            checked={isModelSelected(model)}
                            onCheckedChange={(checked) =>
                              handleSelectModel(model, checked as boolean)
                            }
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell
                          style={{ width: '600px' }}
                          className="text-left"
                        >
                          <div
                            className="truncate pr-4 font-mono text-base text-gray-900"
                            title={model.name}
                          >
                            {model.name}
                          </div>
                        </TableCell>
                        <TableCell
                          style={{ width: '140px' }}
                          className="text-center"
                        >
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
                            {model.owned_by}
                          </span>
                        </TableCell>
                        <TableCell
                          style={{ width: '140px' }}
                          className="text-center"
                        >
                          {model.testStatus === 'testing' ? (
                            <span className="inline-flex animate-pulse items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-600">
                              测试中
                            </span>
                          ) : model.responseTime !== undefined ? (
                            <span
                              className={`inline-flex items-center rounded-full px-4 py-2 font-mono text-sm font-medium ${
                                model.testStatus === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : model.testStatus === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {model.responseTime.toFixed(1)}s
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                              未测试
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          style={{ width: '140px' }}
                          className="text-center"
                        >
                          <Button
                            variant={
                              model.testStatus === 'testing'
                                ? 'secondary'
                                : 'outline'
                            }
                            size="default"
                            onClick={() => testModel(model.id)}
                            disabled={model.testStatus === 'testing'}
                            className="h-9 px-4 text-sm"
                          >
                            {model.testStatus === 'testing' ? '测试中' : '测试'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 底部统计信息 */}
                <div className="sticky bottom-0 border-t bg-background pt-3">
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-600">
                      共 {filteredModels.length} 个模型
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 gap-4 border-t pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 px-6 text-base"
          >
            取消
          </Button>
          <Button
            onClick={onBatchTest}
            disabled={selectedModels.length === 0}
            className="h-10 px-6 text-base"
          >
            批量测试选中模型 ({selectedModels.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

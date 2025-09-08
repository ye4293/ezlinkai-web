'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Channel } from '@/lib/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/table/data-table';
import { Input } from '@/components/ui/input';
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
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

  const modelColumns: ColumnDef<Model>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: 'name',
      header: 'Model Name'
    },
    {
      accessorKey: 'owned_by',
      header: 'Status',
      cell: ({ row }) => {
        return <span>{row.original.owned_by}</span>;
      }
    },
    {
      accessorKey: 'responseTime',
      header: '响应时间',
      cell: ({ row }) => {
        const model = row.original;
        const { testStatus, responseTime } = model;

        if (testStatus === 'testing') {
          return <span className="text-blue-600">测试中...</span>;
        }

        if (responseTime !== undefined) {
          const colorClass =
            testStatus === 'success'
              ? 'text-green-600'
              : testStatus === 'failed'
              ? 'text-red-600'
              : 'text-gray-600';
          return <span className={colorClass}>{responseTime.toFixed(2)}s</span>;
        }

        return <span className="text-gray-400">未测试</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const model = row.original;
        const istesting = model.testStatus === 'testing';

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => testModel(model.id)}
            disabled={istesting}
          >
            {istesting ? '测试中...' : '测试'}
          </Button>
        );
      }
    }
  ];

  const filteredModels = models.filter((model) =>
    model.id.toLowerCase().includes(search.toLowerCase())
  );

  const table = useReactTable({
    data: filteredModels,
    columns: modelColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    enableRowSelection: true
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Models for Channel:{' '}
            <span className="font-bold">{channel.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Search model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DataTable
            table={table}
            columns={modelColumns}
            data={filteredModels}
            totalItems={filteredModels.length}
            pageSize={5}
            onSelectionChange={setSelectedModels}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onBatchTest}>
            批量测试选中的模型 ({selectedModels.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

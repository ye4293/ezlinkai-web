'use client';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Channel } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderNumber } from '@/utils/render';
import { useState, useEffect, useContext } from 'react';
import React from 'react';
import { toast } from 'sonner';
import { CHANNEL_OPTIONS } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { invalidateCache } from '@/lib/cache-utils';

interface ColumnsProps {
  onManageKeys: (channel: Channel) => void;
}

type ChannelType = {
  key: number;
  text: string;
  value: number;
  color: string;
};

function useChannelTypes() {
  const [types, setTypes] = useState<ChannelType[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/channel/types', {
          credentials: 'include'
        });
        const { data } = await res.json();
        setTypes(data);
      } catch (error) {
        // 如果API失败，使用本地常量作为fallback
        setTypes(CHANNEL_OPTIONS);
      }
    };
    fetchTypes();
  }, []);

  return types;
}

const getStatusInfo = (status: number) => {
  switch (status) {
    case 1:
      return { text: '已启用', variant: 'default' as const };
    case 2:
      return { text: '手动禁用', variant: 'secondary' as const };
    case 3:
      return { text: '自动禁用', variant: 'destructive' as const };
    default:
      return { text: '未知', variant: 'outline' as const };
  }
};

// Status Cell Component
const StatusCell = ({ row }: { row: any }) => {
  const [status, setStatus] = useState(row.getValue('status') as number);
  const router = useRouter();

  const handleStatusChange = async (newStatus: boolean) => {
    const oldStatus = status;
    const newStatusValue = newStatus ? 1 : 2; // 启用: 1, 手动禁用: 2
    setStatus(newStatusValue);

    try {
      const params = {
        id: row.original.id,
        status: newStatusValue
      };
      const res = await fetch(`/api/channel`, {
        method: 'PUT',
        body: JSON.stringify(params),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update status');

      const oldStatusInfo = getStatusInfo(oldStatus);
      const newStatusInfo = getStatusInfo(newStatusValue);
      toast.success(
        `Channel '${row.original.name}' status changed from ${oldStatusInfo.text} to ${newStatusInfo.text}`
      );

      // 清除缓存以确保获取最新数据
      invalidateCache('channels');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
      setStatus(oldStatus); // 更新失败时，恢复原状
    }
  };

  const isChecked = status === 1;
  const currentStatusInfo = getStatusInfo(status);
  const channel = row.original as Channel;
  const reason = channel.auto_disabled_reason;
  const time = channel.auto_disabled_time;

  let switchClassName = '';
  if (status === 1) {
    switchClassName = 'data-[state=checked]:bg-green-500';
  } else if (status === 3) {
    switchClassName = 'data-[state=unchecked]:bg-orange-500';
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Hack to prevent Tailwind CSS from purging dynamic classes */}
      <div className="hidden data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-orange-500"></div>
      <Switch checked={isChecked} onCheckedChange={handleStatusChange} />
      <Badge variant={currentStatusInfo.variant}>
        {currentStatusInfo.text}
      </Badge>
      {status === 3 && reason && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">⚠️</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md shadow-lg">
              <div className="space-y-2 p-2 font-mono text-xs">
                <div className="font-sans text-sm font-bold text-foreground">
                  自动禁用详情
                </div>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-16 flex-shrink-0 text-muted-foreground">
                      原因
                    </span>
                    <span className="font-semibold text-destructive">
                      {formatDisableReason(reason).display}
                    </span>
                  </div>
                  {channel.auto_disabled_model && (
                    <div className="flex">
                      <span className="w-16 flex-shrink-0 text-muted-foreground">
                        模型
                      </span>
                      <span className="font-semibold">
                        {channel.auto_disabled_model}
                      </span>
                    </div>
                  )}
                  {time && (
                    <div className="flex">
                      <span className="w-16 flex-shrink-0 text-muted-foreground">
                        时间
                      </span>
                      <span className="font-semibold">
                        {dayjs.unix(time).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-1 mt-2 font-sans font-medium text-foreground">
                    原始错误
                  </div>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
                    <code>{formatDisableReason(reason).tooltip}</code>
                  </pre>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

// 辅助函数：解析并格式化禁用原因
const formatDisableReason = (reason: string) => {
  try {
    const parsed = JSON.parse(reason);
    let message = 'No message found in JSON';

    if (parsed.error && parsed.error.message) {
      message = parsed.error.message;
    } else if (parsed.message) {
      message = parsed.message;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // 尝试查找任何嵌套的message
      const findMessage = (obj: any): string | null => {
        for (const key in obj) {
          if (key === 'message' && typeof obj[key] === 'string') {
            return obj[key];
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedMessage = findMessage(obj[key]);
            if (nestedMessage) return nestedMessage;
          }
        }
        return null;
      };
      message = findMessage(parsed) || message;
    }

    const coreMessageMatch = message.match(/\[.*?\]\s*(.*)/);
    const cleanMessage = coreMessageMatch ? coreMessageMatch[1] : message;

    return {
      display: cleanMessage,
      tooltip: JSON.stringify(parsed, null, 2)
    };
  } catch (e) {
    // 不是JSON格式
    return { display: reason, tooltip: reason };
  }
};

const renderResponseTime = (test_time: number, response_time: number) => {
  let time: string | number = response_time / 1000;
  time = time.toFixed(2) + ' ' + 's';
  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span>{response_time === 0 ? 'Not tested' : time}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {test_time
            ? dayjs(test_time * 1000).format('YYYY-MM-DD HH:mm:ss')
            : 'Not tested'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const renderBalance = (type: number, balance: number) => {
  switch (type) {
    case 1: // OpenAI
      return <span>${balance.toFixed(2)}</span>;
    case 4: // CloseAI
      return <span>¥{balance.toFixed(2)}</span>;
    case 8: // 自定义
      return <span>${balance.toFixed(2)}</span>;
    case 5: // OpenAI-SB
      return <span>¥{(balance / 10000).toFixed(2)}</span>;
    case 10: // AI Proxy
      return <span>{renderNumber(balance)}</span>;
    case 12: // API2GPT
      return <span>¥{balance.toFixed(2)}</span>;
    case 13: // AIGC2D
      return <span>{renderNumber(balance)}</span>;
    default:
      return <span>Not supported</span>;
  }
};

// 颜色映射函数
const getColorStyle = (colorName: string) => {
  const colorMap: { [key: string]: string } = {
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f97316',
    black: '#1f2937',
    olive: '#84cc16',
    brown: '#a3a3a3',
    violet: '#8b5cf6',
    purple: '#a855f7',
    teal: '#14b8a6',
    red: '#ef4444',
    pink: '#ec4899',
    yellow: '#eab308'
  };
  return colorMap[colorName] || '#6b7280';
};

// 创建 Context
const ChannelTypesContext = React.createContext<ChannelType[]>([]);

// 创建 Provider 组件
export function ChannelTypesProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const types = useChannelTypes();
  return (
    <ChannelTypesContext.Provider value={types}>
      {children}
    </ChannelTypesContext.Provider>
  );
}

// 创建自定义 hook 来使用 context
const useChannelTypesContext = () => {
  return useContext(ChannelTypesContext);
};

// Priority Cell Component
const PriorityCell = ({ row }: { row: any }) => {
  const [value, setValue] = useState(row.getValue('priority') as number);
  const router = useRouter();

  const handleBlur = async () => {
    try {
      const params = {
        id: row.original.id,
        priority: parseInt(String(value))
      };
      const res = await fetch(`/api/channel`, {
        method: 'PUT',
        body: JSON.stringify(params),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update priority');

      // 清除缓存以确保获取最新数据
      invalidateCache('channels');
      router.refresh();
    } catch (error) {
      setValue(row.getValue('priority'));
    }
  };

  return (
    <div className="text-center">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        className="w-16 rounded border text-center"
      />
    </div>
  );
};

// Weight Cell Component
const WeightCell = ({ row }: { row: any }) => {
  const [value, setValue] = useState(row.getValue('weight') as number);
  const router = useRouter();

  const handleBlur = async () => {
    try {
      const params = {
        id: row.original.id,
        weight: parseInt(String(value))
      };
      const res = await fetch(`/api/channel`, {
        method: 'PUT',
        body: JSON.stringify(params),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update weight');

      // 清除缓存以确保获取最新数据
      invalidateCache('channels');
      router.refresh();
    } catch (error) {
      setValue(row.getValue('weight'));
    }
  };

  return (
    <div className="text-center">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        className="w-16 rounded border text-center"
      />
    </div>
  );
};

// Channel Ratio Cell Component
const ChannelRatioCell = ({ row }: { row: any }) => {
  const [value, setValue] = useState(row.getValue('channel_ratio') as number);
  const router = useRouter();

  const handleBlur = async () => {
    try {
      const params = {
        id: row.original.id,
        channel_ratio: parseFloat(String(value))
      };
      const res = await fetch(`/api/channel`, {
        method: 'PUT',
        body: JSON.stringify(params),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to update channel ratio');

      // 清除缓存以确保获取最新数据
      invalidateCache('channels');
      router.refresh();
    } catch (error) {
      setValue(row.getValue('channel_ratio'));
    }
  };

  return (
    <div className="text-center">
      <input
        type="number"
        step="0.1"
        min="0.1"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        className="w-20 rounded border text-center"
      />
    </div>
  );
};

// Type Cell Component with Color
const TypeCell = ({ row }: { row: any }) => {
  const types = useChannelTypesContext();
  const typeValue = row.getValue('type') as number;
  const typeInfo = types.find((item) => item.key === typeValue);
  const typeText = typeInfo?.text || '';
  const typeColor = typeInfo?.color || 'gray';

  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded border px-2 py-1 text-sm font-medium text-white"
        style={{
          backgroundColor: getColorStyle(typeColor),
          borderColor: getColorStyle(typeColor)
        }}
        title={typeText}
      >
        {typeText}
      </div>
    </div>
  );
};

// Actions Cell Component
const ActionsCell = ({
  row,
  onManageKeys
}: {
  row: any;
  onManageKeys: (channel: Channel) => void;
}) => {
  return (
    <div className="text-center">
      <CellAction data={row.original} onManageKeys={onManageKeys} />
    </div>
  );
};

// Used Quota Cell Component - 完全重构版本
const UsedQuotaCell = ({ row }: { row: any }) => {
  const rawUsedQuota = row.getValue('used_quota') as number;
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [justCleared, setJustCleared] = useState(false);

  // 计算实际配额值
  const actualQuota = rawUsedQuota ? rawUsedQuota / 500000 : 0;

  // 格式化配额显示
  const formatDisplayValue = (value: number) => {
    if (value === 0) return '0';
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  // 清空配额函数
  const handleClearQuota = async () => {
    const displayValue = formatDisplayValue(actualQuota);
    if (
      !confirm(
        `确认清空渠道 "${row.original.name}" 的配额？\n当前值: ${displayValue}`
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch(
        `/api/channel/clear_quota/${row.original.id}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '清空失败');
      }

      setJustCleared(true);
      toast.success(`配额已清空: ${row.original.name}`);
      setTimeout(() => {
        // 清除缓存以确保获取最新数据
        invalidateCache('channels');
        router.refresh();
        setJustCleared(false);
      }, 1500);
    } catch (error) {
      toast.error(
        `清空失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    } finally {
      setIsClearing(false);
    }
  };

  // 渲染配额值
  const displayValue = justCleared ? '0' : formatDisplayValue(actualQuota);
  const hasValue = actualQuota > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center'
      }}
    >
      {/* 配额显示 */}
      <div
        style={{
          padding: '6px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: justCleared
            ? '#dcfce7'
            : hasValue
            ? '#ffffff'
            : '#f9fafb',
          color: justCleared ? '#059669' : hasValue ? '#374151' : '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '60px',
          textAlign: 'center' as const,
          position: 'relative' as const
        }}
      >
        {displayValue}
        {justCleared && (
          <span style={{ marginLeft: '4px', color: '#10b981' }}>✓</span>
        )}
      </div>

      {/* 清空按钮 */}
      {!justCleared && (
        <button
          onClick={handleClearQuota}
          disabled={isClearing || !hasValue}
          style={{
            width: '28px',
            height: '28px',
            border: '1px solid',
            borderRadius: '6px',
            backgroundColor: !hasValue ? '#f9fafb' : '#fef2f2',
            borderColor: !hasValue ? '#e5e7eb' : '#fecaca',
            color: !hasValue ? '#9ca3af' : '#dc2626',
            cursor: !hasValue ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          title={
            !hasValue ? '无配额可清空' : isClearing ? '清空中...' : '清空配额'
          }
        >
          {isClearing ? '⟳' : '🗑'}
        </button>
      )}
    </div>
  );
};

// Balance Cell Component
const BalanceCell = ({ row }: { row: any }) => {
  const router = useRouter();

  const updateBalance = async () => {
    const params = {
      id: row.original.id
    };
    const res = await fetch(`/api/channel/update_balance/${params.id}`, {
      method: 'GET',
      credentials: 'include'
    });
    const { success, message } = await res.json();
    if (!success) {
      toast.error(message);
    } else {
      // 只有在成功时才清除缓存
      invalidateCache('channels');
    }

    router.refresh();
  };

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="cursor-pointer text-center" onClick={updateBalance}>
            {renderBalance(row.getValue('type'), row.getValue('balance'))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">Update balance</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const columns = ({
  onManageKeys
}: ColumnsProps): ColumnDef<Channel>[] => {
  // 移除这里的useRouter，将其移到需要的组件中

  return [
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
      accessorKey: 'id',
      header: () => <div className="text-center">ID</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('id')}</div>
    },
    {
      accessorKey: 'name',
      header: () => <div className="text-center">Name</div>,
      cell: ({ row }) => {
        const channel = row.original;
        const isMultiKey = channel.multi_key_info?.is_multi_key;
        const keyCount = channel.multi_key_info?.key_count || 0;

        // 计算启用的密钥数量 - 多重策略保证可靠性
        let enabledCount = 0;
        let calculationMethod = '';

        // 方案1：优先使用后端直接计算的值（最可靠）
        if (
          channel.multi_key_info?.enabled_key_count !== undefined &&
          channel.multi_key_info.enabled_key_count !== null
        ) {
          enabledCount = channel.multi_key_info.enabled_key_count;
          calculationMethod = '后端计算';
        }
        // 方案2：前端动态计算（基于密钥状态列表）
        else if (
          channel.multi_key_info?.key_status_list &&
          Object.keys(channel.multi_key_info.key_status_list).length > 0
        ) {
          enabledCount = Object.values(
            channel.multi_key_info.key_status_list
          ).filter((status) => status === 1).length;
          calculationMethod = '前端计算';
        }
        // 方案3：智能推断 - 如果没有状态列表但有密钥数量，默认认为全部启用
        // 这是因为 GetKeyStatus 的默认行为就是返回启用状态
        else if (keyCount > 0) {
          // 根据 GetKeyStatus 的逻辑，如果 KeyStatusList 为空，所有密钥默认为启用状态
          enabledCount = keyCount;
          calculationMethod = '智能推断(默认启用)';
        } else {
          calculationMethod = '无法计算';
          console.error(`Channel ${channel.name}: 无法计算启用密钥数量`, {
            keyCount,
            multi_key_info: channel.multi_key_info
          });
        }

        // 数据完整性检查（仅在异常情况下输出日志）
        if (calculationMethod === '无法计算') {
          console.error(`❌ Channel "${channel.name}": 无法获取密钥状态信息`);
        }

        return (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span>{row.getValue('name')}</span>
              {isMultiKey && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
                          enabledCount === keyCount
                            ? 'border-green-200 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-200'
                            : enabledCount === 0
                            ? 'border-red-200 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-200'
                            : 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        🔗 聚合{' '}
                        {keyCount > 0 ? `${enabledCount}/${keyCount}` : ''}
                        {calculationMethod === '智能推断(默认启用)' && (
                          <span className="ml-1" title="基于默认逻辑推断">
                            ℹ️
                          </span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">多密钥聚合渠道</p>
                        <p>
                          可用密钥:{' '}
                          <span className="text-green-400">{enabledCount}</span>{' '}
                          / 总密钥:{' '}
                          <span className="text-blue-400">{keyCount}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          选择模式:{' '}
                          {channel.multi_key_info?.key_selection_mode === 0
                            ? '轮询'
                            : '随机'}
                        </p>
                        <p className="text-xs text-gray-400">
                          编辑模式:{' '}
                          {channel.multi_key_info?.batch_import_mode === 0
                            ? '覆盖'
                            : '追加'}
                        </p>
                        {calculationMethod === '智能推断(默认启用)' && (
                          <p className="text-xs text-blue-400">
                            ℹ️ 基于默认逻辑推断（密钥默认启用）
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'group',
      header: () => <div className="text-center">Group</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('group')}</div>
      )
    },
    {
      accessorKey: 'type',
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => <TypeCell row={row} />
    },
    {
      accessorKey: 'priority',
      header: () => <div className="text-center">Priority</div>,
      cell: ({ row }) => <PriorityCell row={row} />
    },
    {
      accessorKey: 'weight',
      header: () => <div className="text-center">Weight</div>,
      cell: ({ row }) => <WeightCell row={row} />
    },
    {
      accessorKey: 'channel_ratio',
      header: () => <div className="text-center">Channel Ratio</div>,
      cell: ({ row }) => <ChannelRatioCell row={row} />
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => <StatusCell row={row} />
    },
    {
      accessorKey: 'response_time',
      header: () => <div className="text-center">Response Time</div>,
      cell: ({ row }) =>
        renderResponseTime(
          row.getValue('test_time'),
          row.getValue('response_time')
        )
    },
    {
      accessorKey: 'used_quota',
      header: () => <div className="text-center">Used Quota</div>,
      cell: ({ row }) => <UsedQuotaCell row={row} />
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-center">Balance</div>,
      cell: ({ row }) => <BalanceCell row={row} />
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => <ActionsCell row={row} onManageKeys={onManageKeys} />
    }
  ];
};

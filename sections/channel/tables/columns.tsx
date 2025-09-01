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
      return { text: 'Enabled', colorClass: 'text-green-600' };
    case 2:
      return { text: 'Disabled', colorClass: 'text-gray-500' };
    case 3:
      return { text: 'Auto Disabled', colorClass: 'text-orange-500' };
    default:
      return { text: 'Unknown', colorClass: 'text-gray-500' };
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
      router.refresh();
    } catch (error) {
      toast.error('Failed to update status');
      setStatus(oldStatus); // 更新失败时，恢复原状
    }
  };

  const isChecked = status === 1;
  const currentStatusInfo = getStatusInfo(status);

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
      <Switch
        checked={isChecked}
        onCheckedChange={handleStatusChange}
        className={switchClassName}
      />
      <span className={currentStatusInfo.colorClass}>
        {currentStatusInfo.text}
      </span>
    </div>
  );
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
      accessorKey: 'used_quota',
      header: () => <div className="text-center">Used Quota</div>,
      cell: ({ row }) => {
        const usedQuota = row.getValue('used_quota') as number;
        const displayValue = (usedQuota / 500000).toFixed(2);
        return <div className="text-center">${displayValue}</div>;
      }
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => <StatusCell row={row} />
    },
    {
      accessorKey: 'response_time',
      header: () => <div className="text-center">Response time</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {renderResponseTime(
            row.original.test_time as number,
            row.getValue('response_time') as number
          )}
        </div>
      )
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-center">Balance</div>,
      cell: ({ row }) => <BalanceCell row={row} />
    },
    {
      accessorKey: 'priority',
      header: () => <div className="text-center">Priority</div>,
      cell: ({ row }) => {
        return <PriorityCell row={row} />;
      }
    },
    {
      accessorKey: 'weight',
      header: () => <div className="text-center">Weight</div>,
      cell: ({ row }) => {
        return <WeightCell row={row} />;
      }
    },
    {
      accessorKey: 'channel_ratio',
      header: () => <div className="text-center">Channel Ratio</div>,
      cell: ({ row }) => {
        return <ChannelRatioCell row={row} />;
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => <ActionsCell row={row} onManageKeys={onManageKeys} />
    }
  ];
};

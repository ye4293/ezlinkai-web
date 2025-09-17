'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { memo, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Channel } from '@/lib/types/channel';
import { CellAction } from './cell-action';
import { renderNumber } from '@/utils/render';
import { toast } from 'sonner';
import React from 'react';
import { Input } from '@/components/ui/input';

// 直接使用后端返回的数据结构
export type ChannelType = {
  key: number;
  text: string;
  value: number;
  color: string;
};

// 常量定义
const QUOTA_DIVISOR = 500000; // Used Quota 显示除数

// 实用工具函数
const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

const safeApiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// --- 辅助函数 ---

const formatDisableReason = (reason: string) => {
  try {
    const parsed = JSON.parse(reason);
    let message = 'No message found in JSON';

    if (parsed.error && parsed.error.message) {
      message = parsed.error.message;
    } else if (parsed.message) {
      message = parsed.message;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // 安全的递归搜索，限制深度防止无限循环
      const findMessage = (obj: any, depth: number = 0): string | null => {
        if (depth > 5) return null; // 限制递归深度

        for (const key in obj) {
          if (!obj.hasOwnProperty(key)) continue;

          if (key === 'message' && typeof obj[key] === 'string') {
            return obj[key];
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nestedMessage = findMessage(obj[key], depth + 1);
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
    return { display: reason, tooltip: reason };
  }
};

const renderBalance = (type: number, balance: number) => {
  // 数据验证
  if (!isValidNumber(balance)) {
    return <span className="text-gray-500">无效数据</span>;
  }

  // 处理负数余额
  const isNegative = balance < 0;
  const absBalance = Math.abs(balance);
  const negativeClass = isNegative ? 'text-red-600' : '';

  switch (type) {
    case 1: // OpenAI
      return (
        <span className={negativeClass}>
          ${absBalance.toFixed(2)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 4: // CloseAI
      return (
        <span className={negativeClass}>
          ¥{absBalance.toFixed(2)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 8: // 自定义
      return (
        <span className={negativeClass}>
          ${absBalance.toFixed(2)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 5: // OpenAI-SB
      return (
        <span className={negativeClass}>
          ¥{(absBalance / 10000).toFixed(2)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 10: // AI Proxy
      return (
        <span className={negativeClass}>
          {renderNumber(absBalance)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 12: // API2GPT
      return (
        <span className={negativeClass}>
          ¥{absBalance.toFixed(2)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    case 13: // AIGC2D
      return (
        <span className={negativeClass}>
          {renderNumber(absBalance)}
          {isNegative ? ' (负数)' : ''}
        </span>
      );
    default:
      return <span className="text-yellow-600">不支持的类型 ({type})</span>;
  }
};

// --- 单元格组件 ---

// 常量化颜色映射，避免每次渲染重新创建
const COLOR_CLASS_MAP: { [key: string]: string } = {
  green: 'bg-green-500 text-white',
  blue: 'bg-blue-500 text-white',
  orange: 'bg-orange-500 text-white',
  black: 'bg-gray-800 text-white',
  olive: 'bg-lime-600 text-white',
  brown: 'bg-amber-700 text-white',
  violet: 'bg-violet-500 text-white',
  purple: 'bg-purple-500 text-white',
  teal: 'bg-teal-500 text-white',
  red: 'bg-red-500 text-white',
  pink: 'bg-pink-500 text-white',
  yellow: 'bg-yellow-500 text-black',
  gray: 'bg-gray-400 text-white'
};

const TypeCell = memo(
  ({
    row,
    channelTypes
  }: {
    row: Row<Channel>;
    channelTypes: ChannelType[];
  }) => {
    const typeValue = row.getValue('type') as number;

    const channelTypeInfo = useMemo(() => {
      // 数据验证
      if (typeof typeValue !== 'number' || isNaN(typeValue)) {
        return { text: '无效类型', color: 'gray' };
      }

      // 直接查找对应的类型
      const channelType = channelTypes.find((t) => t.value === typeValue);

      if (channelType) {
        return {
          text: channelType.text,
          color: channelType.color
        };
      }

      // 没找到就显示未知类型
      return { text: `未知类型 (${typeValue})`, color: 'gray' };
    }, [channelTypes, typeValue]);

    const colorClasses =
      COLOR_CLASS_MAP[channelTypeInfo.color] || COLOR_CLASS_MAP.gray;

    return (
      <div className="text-center">
        <Badge
          className={`whitespace-nowrap ${colorClasses}`}
          aria-label={`渠道类型: ${channelTypeInfo.text}`}
        >
          {channelTypeInfo.text}
        </Badge>
      </div>
    );
  }
);
TypeCell.displayName = 'TypeCell';

const StatusCell = memo(
  ({ row, onDataChange }: { row: Row<Channel>; onDataChange?: () => void }) => {
    const channel = row.original;
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleStatusChange = async (newStatus: number) => {
      if (isUpdating) return; // 防止重复点击

      const oldStatus = channel.status ?? 3; // 默认为手动禁用状态
      const getStatusText = (status: number) => {
        const statusMap = {
          1: '已启用',
          2: '自动禁用',
          3: '手动禁用'
        };
        return statusMap[status as keyof typeof statusMap] || '未知状态';
      };

      setIsUpdating(true);
      try {
        const result = await safeApiCall(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify({ id: channel.id, status: newStatus })
        });

        if (result.success) {
          toast.success(
            `渠道状态已从「${getStatusText(oldStatus)}」变更为「${getStatusText(
              newStatus
            )}」`
          );
          onDataChange?.(); // refetch 函数已经会处理缓存失效
        } else {
          throw new Error(result.message || '状态更新失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '状态更新失败';
        toast.error(`状态更新失败: ${errorMessage}`);
      } finally {
        setIsUpdating(false);
      }
    };

    const statusMap = {
      1: {
        text: '已启用',
        color: 'bg-green-100 text-green-800',
        switchColor: 'bg-green-500'
      },
      2: {
        text: '自动禁用',
        color: 'bg-orange-100 text-orange-800',
        switchColor: 'bg-orange-500'
      },
      3: {
        text: '手动禁用',
        color: 'bg-gray-100 text-gray-800',
        switchColor: 'bg-gray-400'
      }
    };
    const currentStatus =
      statusMap[channel.status as keyof typeof statusMap] || statusMap[3];
    const isEnabled = channel.status === 1;

    return (
      <div className="flex items-center justify-center gap-2">
        <Switch
          checked={isEnabled}
          disabled={isUpdating}
          onCheckedChange={() => handleStatusChange(isEnabled ? 3 : 1)}
          className={`relative h-4 w-8 cursor-pointer rounded-full p-1 transition-colors ${
            isEnabled ? currentStatus.switchColor : 'bg-gray-300'
          } ${isUpdating ? 'cursor-not-allowed opacity-50' : ''}`}
        />
        <Badge
          variant="outline"
          className={`border-transparent ${currentStatus.color} ${
            isUpdating ? 'opacity-50' : ''
          }`}
        >
          {isUpdating ? '更新中...' : currentStatus.text}
        </Badge>

        {/* 自动禁用信息 */}
        {channel.status === 3 && channel.auto_disabled_reason && (
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
                        {
                          formatDisableReason(channel.auto_disabled_reason)
                            .display
                        }
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
                    {channel.auto_disabled_time && (
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-muted-foreground">
                          时间
                        </span>
                        <span className="font-semibold">
                          {dayjs
                            .unix(channel.auto_disabled_time)
                            .format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="mb-1 mt-2 font-sans font-medium text-foreground">
                      原始错误
                    </div>
                    <pre className="whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
                      <code>
                        {
                          formatDisableReason(channel.auto_disabled_reason)
                            .tooltip
                        }
                      </code>
                    </pre>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
);
StatusCell.displayName = 'StatusCell';

const ResponseTimeCell = memo(({ row }: { row: Row<Channel> }) => {
  const testTime = row.original.test_time;
  const responseTime = row.getValue('response_time') as number;

  // 数据验证
  if (!isValidNumber(responseTime)) {
    return (
      <div className="text-center">
        <span className="text-gray-500">无效数据</span>
      </div>
    );
  }

  // 格式化响应时间，添加性能指示器
  const getTimeDisplay = () => {
    if (responseTime === 0) {
      return { text: '未测试', color: 'text-gray-500' };
    }

    const timeInSeconds = responseTime / 1000;
    const formattedTime = timeInSeconds.toFixed(2) + ' s';

    // 根据响应时间添加颜色指示
    if (timeInSeconds < 1) {
      return { text: formattedTime, color: 'text-green-600' }; // 优秀
    } else if (timeInSeconds < 3) {
      return { text: formattedTime, color: 'text-yellow-600' }; // 良好
    } else if (timeInSeconds < 10) {
      return { text: formattedTime, color: 'text-orange-600' }; // 一般
    } else {
      return { text: formattedTime, color: 'text-red-600' }; // 慢
    }
  };

  const timeDisplay = getTimeDisplay();
  const testTimeFormatted = testTime
    ? dayjs.unix(testTime).format('YYYY-MM-DD HH:mm:ss')
    : '未测试';

  return (
    <div className="text-center">
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span
              className={`font-mono ${timeDisplay.color}`}
              aria-label={`响应时间: ${timeDisplay.text}, 最后测试: ${testTimeFormatted}`}
            >
              {timeDisplay.text}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-sm">
              <div>最后测试: {testTimeFormatted}</div>
              {responseTime > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {responseTime < 1000
                    ? '优秀'
                    : responseTime < 3000
                    ? '良好'
                    : responseTime < 10000
                    ? '一般'
                    : '需要优化'}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});
ResponseTimeCell.displayName = 'ResponseTimeCell';

const UsedQuotaCell = memo(
  ({ row, onDataChange }: { row: Row<Channel>; onDataChange?: () => void }) => {
    const usedQuota = row.getValue('used_quota') as number;
    const channel = row.original;
    const [isClearing, setIsClearing] = React.useState(false);

    // 数据验证
    if (!isValidNumber(usedQuota)) {
      return (
        <div className="text-center">
          <span className="font-mono text-sm text-gray-500">无效数据</span>
        </div>
      );
    }

    const formattedQuota = (usedQuota / QUOTA_DIVISOR).toFixed(2);
    const rawQuota = formatNumber(usedQuota); // 显示原始数值（带千分位）

    // 清空配额函数
    const clearQuota = async () => {
      if (isClearing) return; // 防止重复点击

      // 自定义确认对话框内容
      const confirmMessage = [
        `渠道: ${channel.name}`,
        `当前配额: ${formattedQuota} (原始值: ${rawQuota})`,
        '',
        '确定要清空此渠道的使用配额吗？',
        '此操作不可撤销！'
      ].join('\n');

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setIsClearing(true);
      try {
        const result = await safeApiCall(
          `/api/channel/clear_quota/${channel.id}`,
          {
            method: 'GET'
          }
        );

        if (result.success) {
          toast.success(`已清空渠道「${channel.name}」的使用配额`);
          onDataChange?.();
        } else {
          throw new Error(result.message || '清空配额失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '清空配额失败';
        toast.error(`清空配额失败: ${errorMessage}`);
      } finally {
        setIsClearing(false);
      }
    };

    return (
      <div className="flex items-center justify-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-help font-mono text-sm"
                aria-label={`使用配额: ${formattedQuota}, 原始值: ${rawQuota}`}
              >
                {formattedQuota}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div>显示值: {formattedQuota}</div>
                <div>原始值: {rawQuota}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  显示值 = 原始值 ÷ {QUOTA_DIVISOR.toLocaleString()}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {usedQuota > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 hover:bg-red-50 hover:text-red-600 ${
                    isClearing ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  onClick={clearQuota}
                  disabled={isClearing}
                  aria-label={`清空渠道 ${channel.name} 的使用配额`}
                >
                  <RotateCcw
                    className={`h-3 w-3 ${isClearing ? 'animate-spin' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isClearing ? '正在清空...' : '清空使用配额 (不可撤销)'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
);
UsedQuotaCell.displayName = 'UsedQuotaCell';

const BalanceCell = memo(
  ({ row, onDataChange }: { row: Row<Channel>; onDataChange?: () => void }) => {
    const [isUpdating, setIsUpdating] = React.useState(false);
    const channel = row.original;

    const updateBalance = async () => {
      if (isUpdating) return; // 防止重复点击

      setIsUpdating(true);
      try {
        const { success, message } = await safeApiCall(
          `/api/channel/update_balance/${channel.id}`,
          {
            method: 'GET'
          }
        );

        if (!success) {
          toast.error(message || '余额更新失败');
        } else {
          toast.success('余额更新成功');
          onDataChange?.(); // 使用 refetch 函数刷新数据
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '余额更新失败';
        toast.error(`余额更新失败: ${errorMessage}`);
      } finally {
        setIsUpdating(false);
      }
    };

    return (
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className={`cursor-pointer text-center ${
                isUpdating ? 'cursor-not-allowed opacity-50' : ''
              }`}
              onClick={updateBalance}
              aria-label={`更新渠道 ${channel.name} 的余额`}
            >
              {isUpdating
                ? '更新中...'
                : renderBalance(row.getValue('type'), row.getValue('balance'))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isUpdating ? '正在更新余额...' : '点击更新余额'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);
BalanceCell.displayName = 'BalanceCell';

// 可编辑数字单元格组件
const EditableNumberCell = memo(
  ({
    row,
    field,
    onDataChange,
    placeholder = '点击编辑',
    min = 0,
    max = 999999,
    step = 1,
    decimalPlaces = 0
  }: {
    row: Row<Channel>;
    field: keyof Channel;
    onDataChange?: () => void;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    decimalPlaces?: number;
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [value, setValue] = React.useState('');
    const channel = row.original;
    const currentValue = row.getValue(field) as number;

    // 格式化显示值
    const formatValue = (num: number) => {
      if (decimalPlaces > 0) {
        return num.toFixed(decimalPlaces);
      }
      return Math.round(num).toString();
    };

    // 进入编辑模式
    const startEditing = () => {
      setValue(formatValue(currentValue || 0));
      setIsEditing(true);
    };

    // 取消编辑
    const cancelEditing = () => {
      setIsEditing(false);
      setValue('');
    };

    // 保存更改
    const saveChange = async () => {
      if (isUpdating) return;

      const numValue = parseFloat(value);

      // 验证输入
      if (isNaN(numValue) || numValue < min || numValue > max) {
        toast.error(`请输入 ${min} 到 ${max} 之间的有效数字`);
        return;
      }

      // 如果值没有变化，直接退出编辑
      if (numValue === currentValue) {
        setIsEditing(false);
        return;
      }

      setIsUpdating(true);
      try {
        const updateData = {
          id: channel.id,
          [field]:
            decimalPlaces > 0
              ? Number(numValue.toFixed(decimalPlaces))
              : Math.round(numValue)
        };

        const result = await safeApiCall('/api/channel/', {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        if (result.success) {
          const fieldNames = {
            priority: '优先级',
            weight: '权重',
            channel_ratio: '渠道倍率'
          };
          const fieldName =
            fieldNames[field as keyof typeof fieldNames] || field;

          toast.success(`${fieldName}已更新为 ${formatValue(numValue)}`);
          setIsEditing(false);
          onDataChange?.();
        } else {
          throw new Error(result.message || '更新失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '更新失败';
        toast.error(`更新失败: ${errorMessage}`);
      } finally {
        setIsUpdating(false);
      }
    };

    // 处理按键事件
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        saveChange();
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    };

    if (isEditing) {
      return (
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveChange}
            className="h-8 w-20 text-center text-sm"
            min={min}
            max={max}
            step={step}
            disabled={isUpdating}
            autoFocus
          />
          {isUpdating && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          )}
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer rounded px-2 py-1 text-center transition-colors hover:bg-gray-50"
        onClick={startEditing}
        title={`点击编辑 ${placeholder}`}
      >
        <span className="font-mono text-sm">
          {currentValue !== null && currentValue !== undefined
            ? formatValue(currentValue)
            : '-'}
        </span>
      </div>
    );
  }
);
EditableNumberCell.displayName = 'EditableNumberCell';

const ActionsCell = memo(
  ({
    row,
    onManageKeys
  }: {
    row: Row<Channel>;
    onManageKeys: (channel: Channel) => void;
  }) => {
    return <CellAction data={row.original} onManageKeys={onManageKeys} />;
  }
);
ActionsCell.displayName = 'ActionsCell';

// --- 列定义 ---

export const createColumns = ({
  onManageKeys,
  onDataChange,
  channelTypes
}: {
  onManageKeys: (channel: Channel) => void;
  onDataChange?: () => void;
  channelTypes: ChannelType[];
}): ColumnDef<Channel>[] => [
  {
    id: 'select',
    size: 40,
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
    size: 60,
    header: () => <div className="text-center">ID</div>,
    cell: ({ row }) => <div className="text-center">{row.getValue('id')}</div>
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
    cell: ({ row }) => {
      const channel = row.original;
      const isMultiKey = channel.multi_key_info?.is_multi_key;
      const keyCount = channel.multi_key_info?.key_count || 0;
      const activeKeyCount = channel.multi_key_info?.enabled_key_count || 0;

      return (
        <div className="flex items-center gap-2">
          <span>{row.getValue('name')}</span>
          {isMultiKey && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer ${
                      activeKeyCount > 0
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-red-300 bg-red-50 text-red-700'
                    }`}
                    onClick={() => onManageKeys(channel)}
                  >
                    <Link className="mr-1 h-3 w-3" />
                    聚合 {activeKeyCount}/{keyCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>管理聚合密钥 ({activeKeyCount}个可用)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'group',
    header: 'Group',
    size: 150
  },
  {
    accessorKey: 'type',
    header: () => <div className="text-center">Type</div>,
    size: 150,
    cell: ({ row }) => <TypeCell row={row} channelTypes={channelTypes} />
  },
  {
    accessorKey: 'priority',
    header: () => <div className="text-center">Priority</div>,
    size: 100,
    cell: ({ row }) => (
      <EditableNumberCell
        row={row}
        field="priority"
        onDataChange={onDataChange}
        placeholder="优先级"
        min={0}
        max={100}
        step={1}
        decimalPlaces={0}
      />
    )
  },
  {
    accessorKey: 'weight',
    header: () => <div className="text-center">Weight</div>,
    size: 100,
    cell: ({ row }) => (
      <EditableNumberCell
        row={row}
        field="weight"
        onDataChange={onDataChange}
        placeholder="权重"
        min={0}
        max={100}
        step={1}
        decimalPlaces={0}
      />
    )
  },
  {
    accessorKey: 'channel_ratio',
    header: () => <div className="text-center">Channel Ratio</div>,
    size: 120,
    cell: ({ row }) => (
      <EditableNumberCell
        row={row}
        field="channel_ratio"
        onDataChange={onDataChange}
        placeholder="渠道倍率"
        min={0.1}
        max={100}
        step={0.1}
        decimalPlaces={1}
      />
    )
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    size: 150,
    cell: ({ row }) => <StatusCell row={row} onDataChange={onDataChange} />
  },
  {
    accessorKey: 'response_time',
    header: () => <div className="text-center">Response Time</div>,
    size: 120,
    cell: ({ row }) => <ResponseTimeCell row={row} />
  },
  {
    accessorKey: 'used_quota',
    header: () => <div className="text-center">Used Quota</div>,
    size: 150,
    cell: ({ row }) => <UsedQuotaCell row={row} onDataChange={onDataChange} />
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    size: 120,
    cell: ({ row }) => <BalanceCell row={row} onDataChange={onDataChange} />
  },
  {
    id: 'actions',
    size: 80,
    cell: ({ row }) => <ActionsCell row={row} onManageKeys={onManageKeys} />
  }
];

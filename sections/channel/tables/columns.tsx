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
import { toast } from 'sonner';
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Locale } from '@/locales';

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

// --- 单元格组件 ---

// Soft pastel palette — readable in both light & dark modes
const COLOR_CLASS_MAP: { [key: string]: string } = {
  green:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  orange:
    'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  black: 'border-foreground/20 bg-foreground/10 text-foreground',
  olive: 'border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300',
  brown:
    'border-amber-700/20 bg-amber-700/10 text-amber-800 dark:text-amber-300',
  violet:
    'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  purple:
    'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  teal: 'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300',
  red: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  pink: 'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300',
  yellow:
    'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  gray: 'border-muted-foreground/20 bg-muted text-muted-foreground'
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
          variant="outline"
          className={cn('whitespace-nowrap font-medium', colorClasses)}
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
  ({
    row,
    onDataChange,
    t
  }: {
    row: Row<Channel>;
    onDataChange?: () => void;
    t: Locale;
  }) => {
    const channel = row.original;
    const [isUpdating, setIsUpdating] = React.useState(false);

    const statusText = (status: number) => {
      switch (status) {
        case 1:
          return t.channelPage.status.enabled;
        case 2:
          return t.channelPage.status.manuallyDisabled;
        case 3:
          return t.channelPage.status.autoDisabled;
        default:
          return t.channelPage.status.unknown;
      }
    };

    const handleStatusChange = async (newStatus: number) => {
      if (isUpdating) return;
      const oldStatus = channel.status ?? 2;

      setIsUpdating(true);
      try {
        const result = await safeApiCall(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify({ id: channel.id, status: newStatus })
        });

        if (result.success) {
          toast.success(`${statusText(oldStatus)} → ${statusText(newStatus)}`);
          onDataChange?.();
        } else {
          throw new Error(result.message || 'Status update failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Status update failed';
        toast.error(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    };

    const isEnabled = channel.status === 1;
    const isAutoDisabled = channel.status === 3;

    const dotClass = isEnabled
      ? 'bg-emerald-500'
      : isAutoDisabled
      ? 'bg-orange-500'
      : 'bg-muted-foreground/40';
    const textClass = isEnabled
      ? 'text-emerald-700 dark:text-emerald-400'
      : isAutoDisabled
      ? 'text-orange-700 dark:text-orange-400'
      : 'text-muted-foreground';

    return (
      <div className="flex items-center justify-center gap-2">
        <Switch
          checked={isEnabled}
          disabled={isUpdating}
          onCheckedChange={() => handleStatusChange(isEnabled ? 2 : 1)}
          aria-label={statusText(channel.status ?? 2)}
        />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs',
            isUpdating && 'opacity-50'
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
          <span className={textClass}>
            {isUpdating
              ? t.channelPage.status.updating
              : statusText(channel.status ?? 2)}
          </span>
        </span>

        {/* 自动禁用信息 */}
        {channel.status === 3 && channel.auto_disabled_reason && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">⚠️</span>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="max-w-md border bg-popover p-0 text-popover-foreground shadow-lg"
              >
                <div className="space-y-3 p-3 text-xs">
                  <div className="text-sm font-semibold text-foreground">
                    自动禁用详情
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex gap-3">
                      <span className="w-12 flex-shrink-0 text-muted-foreground">
                        原因
                      </span>
                      <span className="break-all font-medium text-rose-600 dark:text-rose-400">
                        {
                          formatDisableReason(channel.auto_disabled_reason)
                            .display
                        }
                      </span>
                    </div>
                    {channel.auto_disabled_model && (
                      <div className="flex gap-3">
                        <span className="w-12 flex-shrink-0 text-muted-foreground">
                          模型
                        </span>
                        <span className="break-all font-medium text-foreground">
                          {channel.auto_disabled_model}
                        </span>
                      </div>
                    )}
                    {channel.auto_disabled_time && (
                      <div className="flex gap-3">
                        <span className="w-12 flex-shrink-0 text-muted-foreground">
                          时间
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {dayjs
                            .unix(channel.auto_disabled_time)
                            .format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="mb-1 text-muted-foreground">原始错误</div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 font-mono text-[11px] leading-relaxed text-foreground">
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

const ResponseTimeCell = memo(
  ({ row, t }: { row: Row<Channel>; t: Locale }) => {
    const testTime = row.original.test_time;
    const responseTime = row.getValue('response_time') as number;

    if (!isValidNumber(responseTime)) {
      return (
        <div className="text-center">
          <span className="text-muted-foreground">—</span>
        </div>
      );
    }

    const getTimeDisplay = () => {
      if (responseTime === 0) {
        return {
          text: t.channelPage.response.untested,
          color: 'text-muted-foreground'
        };
      }

      const timeInSeconds = responseTime / 1000;
      const formattedTime = timeInSeconds.toFixed(2) + ' s';

      if (timeInSeconds < 1) {
        return {
          text: formattedTime,
          color: 'text-emerald-700 dark:text-emerald-400'
        };
      } else if (timeInSeconds < 3) {
        return {
          text: formattedTime,
          color: 'text-yellow-700 dark:text-yellow-400'
        };
      } else if (timeInSeconds < 10) {
        return {
          text: formattedTime,
          color: 'text-orange-700 dark:text-orange-400'
        };
      } else {
        return {
          text: formattedTime,
          color: 'text-rose-700 dark:text-rose-400'
        };
      }
    };

    const getQualityLabel = () => {
      if (responseTime === 0) return null;
      if (responseTime < 1000) return t.channelPage.response.excellent;
      if (responseTime < 3000) return t.channelPage.response.good;
      if (responseTime < 10000) return t.channelPage.response.fair;
      return t.channelPage.response.slow;
    };

    const timeDisplay = getTimeDisplay();
    const testTimeFormatted = testTime
      ? dayjs.unix(testTime).format('YYYY-MM-DD HH:mm:ss')
      : t.channelPage.response.untested;

    return (
      <div className="text-center">
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <span className={cn('font-mono tabular-nums', timeDisplay.color)}>
                {timeDisplay.text}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">
                <div>
                  {t.channelPage.response.lastTest}: {testTimeFormatted}
                </div>
                {getQualityLabel() && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {getQualityLabel()}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
);
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
            weight: '权重'
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
    onManageKeys,
    onDataChange
  }: {
    row: Row<Channel>;
    onManageKeys: (channel: Channel) => void;
    onDataChange?: () => void;
  }) => {
    return (
      <CellAction
        data={row.original}
        onManageKeys={onManageKeys}
        onDataChange={onDataChange}
      />
    );
  }
);
ActionsCell.displayName = 'ActionsCell';

// --- 列定义 ---

export const createColumns = ({
  onManageKeys,
  onDataChange,
  channelTypes,
  t
}: {
  onManageKeys: (channel: Channel) => void;
  onDataChange?: () => void;
  channelTypes: ChannelType[];
  t: Locale;
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
    header: () => <div className="text-center">{t.channelPage.columns.id}</div>,
    cell: ({ row }) => (
      <div className="text-center tabular-nums text-muted-foreground">
        {row.getValue('id')}
      </div>
    )
  },
  {
    accessorKey: 'name',
    header: t.channelPage.columns.name,
    size: 220,
    cell: ({ row }) => {
      const channel = row.original;
      const name = row.getValue('name') as string;
      const isMultiKey = channel.multi_key_info?.is_multi_key;
      const keyCount = channel.multi_key_info?.key_count || 0;
      const activeKeyCount = channel.multi_key_info?.enabled_key_count || 0;

      return (
        <div className="flex min-w-0 items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block max-w-[160px] truncate font-medium">
                  {name}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="max-w-xs break-all">{name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isMultiKey && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      'flex-shrink-0 cursor-pointer font-normal',
                      activeKeyCount > 0
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    )}
                    onClick={() => onManageKeys(channel)}
                  >
                    <Link className="mr-1 h-3 w-3" />
                    {activeKeyCount}/{keyCount}
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
    header: t.channelPage.columns.group,
    size: 150,
    cell: ({ row }) => {
      const v = row.getValue('group') as string;
      return v ? (
        <Badge variant="outline" className="font-normal">
          {v}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }
  },
  {
    accessorKey: 'type',
    header: () => (
      <div className="text-center">{t.channelPage.columns.type}</div>
    ),
    size: 150,
    cell: ({ row }) => <TypeCell row={row} channelTypes={channelTypes} />
  },
  {
    accessorKey: 'priority',
    header: () => (
      <div className="text-center">{t.channelPage.columns.priority}</div>
    ),
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
    header: () => (
      <div className="text-center">{t.channelPage.columns.weight}</div>
    ),
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
    accessorKey: 'status',
    header: () => (
      <div className="text-center">{t.channelPage.columns.status}</div>
    ),
    size: 150,
    cell: ({ row }) => (
      <StatusCell row={row} onDataChange={onDataChange} t={t} />
    )
  },
  {
    accessorKey: 'response_time',
    header: () => (
      <div className="text-center">{t.channelPage.columns.responseTime}</div>
    ),
    size: 120,
    cell: ({ row }) => <ResponseTimeCell row={row} t={t} />
  },
  {
    accessorKey: 'used_quota',
    header: () => (
      <div className="text-center">{t.channelPage.columns.usedQuota}</div>
    ),
    size: 150,
    cell: ({ row }) => <UsedQuotaCell row={row} onDataChange={onDataChange} />
  },
  {
    id: 'actions',
    size: 80,
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onManageKeys={onManageKeys}
        onDataChange={onDataChange}
      />
    )
  }
];

'use client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

interface DateTimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateTimeRangePickerProps {
  value?: DateTimeRange;
  onValueChange?: (value: DateTimeRange | undefined) => void;
  className?: string;
}

// 快捷时间范围选项
const TIME_PRESETS = [
  {
    label: '今天',
    getValue: () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return { from: startOfDay, to: endOfDay };
    }
  },
  {
    label: '昨天',
    getValue: () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);
      return { from: startOfDay, to: endOfDay };
    }
  },
  {
    label: '最近7天',
    getValue: () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return { from: sevenDaysAgo, to: endOfToday };
    }
  },
  {
    label: '最近30天',
    getValue: () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return { from: thirtyDaysAgo, to: endOfToday };
    }
  },
  {
    label: '本周',
    getValue: () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return { from: startOfWeek, to: endOfToday };
    }
  },
  {
    label: '本月',
    getValue: () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      return { from: startOfMonth, to: endOfToday };
    }
  }
];

export function DateTimeRangePicker({
  value,
  onValueChange,
  className
}: DateTimeRangePickerProps) {
  const [range, setRange] = React.useState<DateTimeRange>(
    value || { from: undefined, to: undefined }
  );
  const [startTimeString, setStartTimeString] = React.useState('');
  const [endTimeString, setEndTimeString] = React.useState('');
  const [open, setOpen] = React.useState(false);

  // 格式化日期时间为字符串
  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 解析字符串为日期时间
  const parseDateTime = (dateTimeString: string): Date | undefined => {
    if (!dateTimeString) return undefined;
    try {
      // 支持多种格式
      const formats = [
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})$/
      ];

      for (const format of formats) {
        const match = dateTimeString.match(format);
        if (match) {
          const [
            ,
            year,
            month,
            day,
            hours = '00',
            minutes = '00',
            seconds = '00'
          ] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
          );
        }
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  };

  // 同步外部值到内部状态
  React.useEffect(() => {
    if (value) {
      setRange(value);
      setStartTimeString(formatDateTime(value.from));
      setEndTimeString(formatDateTime(value.to));
    }
  }, [value]);

  // 处理快捷选择
  const handlePresetSelect = (preset: (typeof TIME_PRESETS)[0]) => {
    const newRange = preset.getValue();
    setRange(newRange);
    setStartTimeString(formatDateTime(newRange.from));
    setEndTimeString(formatDateTime(newRange.to));
    onValueChange?.(newRange);
  };

  // 处理手动输入的开始时间变更
  const handleStartTimeChange = (value: string) => {
    setStartTimeString(value);
    const date = parseDateTime(value);
    if (date || value === '') {
      const newRange = { from: date, to: range.to };
      setRange(newRange);
      onValueChange?.(newRange);
    }
  };

  // 处理手动输入的结束时间变更
  const handleEndTimeChange = (value: string) => {
    setEndTimeString(value);
    const date = parseDateTime(value);
    if (date || value === '') {
      const newRange = { from: range.from, to: date };
      setRange(newRange);
      onValueChange?.(newRange);
    }
  };

  // 处理日历选择
  const handleCalendarSelect = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      // 如果选择了日期，保留原有时间部分或设置默认时间
      const from = dateRange.from ? new Date(dateRange.from) : undefined;
      const to = dateRange.to ? new Date(dateRange.to) : undefined;

      if (from && range.from) {
        from.setHours(
          range.from.getHours(),
          range.from.getMinutes(),
          range.from.getSeconds()
        );
      } else if (from) {
        from.setHours(0, 0, 0, 0);
      }

      if (to && range.to) {
        to.setHours(
          range.to.getHours(),
          range.to.getMinutes(),
          range.to.getSeconds()
        );
      } else if (to) {
        to.setHours(23, 59, 59, 999);
      }

      const newRange = { from, to };
      setRange(newRange);
      setStartTimeString(formatDateTime(from));
      setEndTimeString(formatDateTime(to));
      onValueChange?.(newRange);
    }
  };

  // 清除选择
  const handleClear = () => {
    const newRange = { from: undefined, to: undefined };
    setRange(newRange);
    setStartTimeString('');
    setEndTimeString('');
    onValueChange?.(newRange);
    setOpen(false);
  };

  // 显示文本
  const getDisplayText = () => {
    if (range.from && range.to) {
      return `${formatDateTime(range.from)} ~ ${formatDateTime(range.to)}`;
    } else if (range.from) {
      return `从 ${formatDateTime(range.from)}`;
    } else if (range.to) {
      return `到 ${formatDateTime(range.to)}`;
    }
    return '选择时间范围';
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[380px] justify-start text-left font-normal',
              !range.from && !range.to && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="truncate">{getDisplayText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* 左侧：快捷选择 */}
            <div className="border-r p-3">
              <div className="space-y-1">
                <h4 className="mb-2 text-sm font-medium leading-none">
                  快捷选择
                </h4>
                {TIME_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleClear}
                >
                  清除选择
                </Button>
              </div>
            </div>

            {/* 右侧：详细设置 */}
            <div className="space-y-3 p-3">
              <h4 className="text-sm font-medium leading-none">精确设置</h4>

              {/* 手动输入时间 */}
              <div className="space-y-2">
                <div>
                  <Label htmlFor="start-time" className="text-xs">
                    开始时间
                  </Label>
                  <Input
                    id="start-time"
                    placeholder="2025-01-01 00:00:00"
                    value={startTimeString}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-xs">
                    结束时间
                  </Label>
                  <Input
                    id="end-time"
                    placeholder="2025-01-01 23:59:59"
                    value={endTimeString}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* 日历辅助选择 */}
              <div>
                <Label className="text-xs">日历选择（辅助）</Label>
                <Calendar
                  mode="range"
                  selected={{
                    from: range.from,
                    to: range.to
                  }}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={1}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  className="rounded-md border-0"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

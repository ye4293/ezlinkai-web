'use client';

import React, { useEffect, useState } from 'react';
import { Control, useController } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelTypeOption {
  key: number;
  value: number;
  text: string;
  color?: string;
}

interface Props {
  control: Control<any>;
}

/**
 * 管理员在"编辑用户"弹窗中为当前用户针对单个渠道类型设置折扣倍率。
 * 和等级折扣、渠道折扣一起相乘：final = model_price × channel_discount × tier_discount × user_channel_ratio。
 * 留空视为 1.0（不打折）。
 */
export default function ChannelRatiosEditor({ control }: Props) {
  const [channelTypes, setChannelTypes] = useState<ChannelTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const { field } = useController({
    control,
    name: 'channel_ratios',
    defaultValue: {}
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/channel/types', {
          credentials: 'include'
        });
        const json = await res.json();
        const list: ChannelTypeOption[] = (json.data || []).map(
          (item: any) => ({
            key: item.key ?? item.value,
            value: item.value,
            text: item.text ?? String(item.value),
            color: item.color
          })
        );
        if (!cancelled) {
          setChannelTypes(list);
        }
      } catch (err) {
        console.error('Failed to load channel types:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ratios: Record<string, number> = field.value || {};

  const handleChange = (channelValue: number, raw: string) => {
    const next: Record<string, number> = { ...ratios };
    const key = String(channelValue);
    const trimmed = raw.trim();
    if (trimmed === '') {
      delete next[key];
    } else {
      const num = Number(trimmed);
      if (Number.isFinite(num) && num > 0) {
        next[key] = num;
      } else {
        // 非法输入时保留原状，等 blur/提交时再校验
        return;
      }
    }
    field.onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">渠道类型折扣</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          设置后与渠道折扣、等级折扣相乘。例：设为 0.8，最终按
          <code className="mx-1">模型官方价 × 渠道折扣 × 等级折扣 × 0.8</code>
          计费。留空视为 1.0。
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channelTypes.map((ct) => {
            const fieldKey = String(ct.value);
            const currentVal = ratios[fieldKey];
            return (
              <FormField
                key={ct.value}
                control={control}
                name={`channel_ratios.${fieldKey}` as const}
                render={() => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                    <FormLabel className="m-0 flex-1 truncate text-sm">
                      {ct.text}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.0"
                        className="w-24 text-right"
                        value={
                          currentVal === undefined ? '' : String(currentVal)
                        }
                        onChange={(e) => handleChange(ct.value, e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

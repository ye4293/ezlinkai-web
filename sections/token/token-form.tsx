'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format, addMonths, addHours, addMinutes } from 'date-fns';
import { renderQuotaWithPrompt, renderQuotaNum } from '@/utils/render';
import { Token } from '@/lib/types/token';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  expired_time: z.date().optional(),
  remain_quota: z.number().optional(), // 新增: 剩余配额
  unlimited_quota: z.boolean().optional() // 新增: 是否是无限配额
});

interface ParamsOption extends Partial<Token> {
  // group?: string;
  // models?: string;
}

export default function TokenForm() {
  const router = useRouter();
  const { tokenId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState<Boolean | null>(null);
  const [tokenData, setTokenData] = useState<Object | null>(null);
  const [displayValue, setDisplayValue] = useState<string>(''); // 用于管理显示的美元金额

  useEffect(() => {
    setIsLoading(true);

    // 获取令牌详情
    const getTokenDetail = async () => {
      if (tokenId === 'create') {
        form.setValue('remain_quota', 500000);
        setDisplayValue(renderQuotaNum(500000).toString());
        setIsLoading(false);
        return;
      }
      if (!tokenId || tokenId === 'create') return;

      const res = await fetch(`/api/token/${tokenId}`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      setTokenData(data);
      setIsExpired(data.expired_time === -1 ? true : false);
      setIsLoading(false);

      // 填充表单数据
      form.reset({
        /** 名称 */
        name: data.name,
        /** 过期时间 */
        expired_time:
          data.expired_time === -1
            ? undefined
            : new Date(data.expired_time * 1000),
        /** 额度 */
        remain_quota: data.remain_quota,
        /** 是否是无限额度 */
        unlimited_quota: data.unlimited_quota
        /** token_remind_threshold */
        // token_remind_threshold: data.token_remind_threshold
      });

      // 初始化显示值
      setDisplayValue(renderQuotaNum(data.remain_quota || 0).toString());
    };

    getTokenDetail();
  }, [tokenId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      expired_time: undefined,
      remain_quota: undefined,
      unlimited_quota: false
      // token_remind_threshold: undefined
    }
  });

  useEffect(() => {
    // Force re-render when unlimited_quota changes
    const currentQuota = form.getValues('remain_quota');
    form.setValue('remain_quota', currentQuota);
    // 同步显示值
    if (currentQuota !== undefined) {
      setDisplayValue(renderQuotaNum(currentQuota).toString());
    }
  }, [form.getValues('unlimited_quota')]);

  if (isLoading && tokenId !== 'create') {
    return (
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-left text-2xl font-bold">
            <Skeleton className="h-8 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // console.log(values);
    const params: ParamsOption = {
      ...tokenData,
      ...values,
      expired_time: values.expired_time
        ? Math.floor(values.expired_time.getTime() / 1000)
        : undefined
    };
    // if (params.expired_time) {
    //   // params.expired_time = isExpired ? -1 : Math.floor(params.expired_time.getTime() / 1000);
    //   params.expired_time = isExpired ? -1 : params.expired_time;
    // }
    if (isExpired) params.expired_time = -1;
    // params.type = Number(params.type);
    const res = await fetch(`/api/token`, {
      method: params.id ? 'PUT' : 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { success, message } = await res.json();
    // console.log('data', data);
    if (success) {
      router.push('/dashboard/token');
      router.refresh();
    } else {
      toast.error(message || 'Submit failed');
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Token Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="expired_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isExpired === true}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            // date > new Date() || date < new Date("1900-01-01")
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-end gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue('expired_time', undefined);
                    setIsExpired(true);
                  }}
                >
                  Never expires
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue('expired_time', addMonths(new Date(), 1));
                    setIsExpired(false);
                  }}
                >
                  Expires in one month
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue('expired_time', addDays(new Date(), 1));
                    setIsExpired(false);
                  }}
                >
                  Expires in one day
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue('expired_time', addHours(new Date(), 1));
                    setIsExpired(false);
                  }}
                >
                  Expires in one hour
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue('expired_time', addMinutes(new Date(), 1));
                    setIsExpired(false);
                  }}
                >
                  Expires in one minute
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                // control={form.control}
                // name="remain_quota"
                // render={({ field }) => (
                //   <FormItem>
                //     <FormLabel>
                //       Amount{' '}
                // {renderQuotaWithPrompt(
                //         form.getValues('remain_quota') || 0
                //       )}
                //     </FormLabel>
                //     <FormControl>
                //       <Input
                //         type="number"
                //         placeholder="please enter Limit"
                //         {...field}
                //         onChange={(e) => {
                //           const value = e.target.value;
                //           field.onChange(value ? Number(value) : undefined); // Parse to number
                //         }}
                //         disabled={form.getValues('unlimited_quota')}
                //       />
                control={form.control}
                name="remain_quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount {renderQuotaWithPrompt(field.value || 0)}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={displayValue}
                        onChange={(e) => {
                          // 只更新显示值，不立即转换
                          setDisplayValue(e.target.value);
                        }}
                        onBlur={(e) => {
                          // 在失去焦点时才进行最终转换
                          const dollarAmount = parseFloat(e.target.value) || 0;
                          const quotaPerUnit = parseFloat(
                            localStorage.getItem('quota_per_unit') || '500000'
                          );
                          const quotaAmount = Math.round(
                            dollarAmount * quotaPerUnit
                          );
                          field.onChange(quotaAmount);
                          // 同步显示值，确保格式一致
                          setDisplayValue(dollarAmount.toString());
                        }}
                        disabled={form.getValues('unlimited_quota')}
                      />
                    </FormControl>
                    <FormDescription>
                      Note that the token quota is only used to limit the
                      maximum usage of the token itself, and the actual usage is
                      limited by the remaining quota of the account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-end gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    const currentValue = form.getValues('unlimited_quota');
                    form.setValue('unlimited_quota', !currentValue); // Toggle the value
                    // 如果切换到有限额度，确保显示值同步
                    if (currentValue) {
                      const currentQuota = form.getValues('remain_quota') || 0;
                      setDisplayValue(renderQuotaNum(currentQuota).toString());
                    }
                    // Force re-render to reflect the change
                    form.trigger('unlimited_quota');
                  }}
                >
                  {form.getValues('unlimited_quota')
                    ? 'Cancel Unlimited Quota'
                    : 'Set to Limited Quota'}
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="button" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

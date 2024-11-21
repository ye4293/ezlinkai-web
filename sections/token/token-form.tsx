'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format, addMonths, addHours, addMinutes } from 'date-fns';
import { renderQuotaWithPrompt } from '@/utils/render';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  expired_time: z.date().optional(),
  remain_quota: z.number().optional(), // 新增: 剩余配额
  unlimited_quota: z.boolean().optional() // 新增: 是否是无限配额
});

interface ModelOption {
  id: string;
  // 添加其他可能的字段
}

export default function TokenForm() {
  const { tokenId } = useParams();
  console.log('---useParams()---', useParams());
  const [isExpired, setIsExpired] = useState<Boolean | null>(null);
  const [tokenData, setTokenData] = useState<Object | null>(null);

  useEffect(() => {
    // 获取令牌详情
    const getTokenDetail = async () => {
      if (tokenId === 'create') {
        form.setValue('remain_quota', 500000);
      }
      if (!tokenId || tokenId === 'create') return;

      const res = await fetch(`/api/token/${tokenId}`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      // console.log('---data---', data);
      setTokenData(data);
      setIsExpired(data.expired_time === -1 ? true : false);

      // 填充表单数据
      form.reset({
        /** 名称 */
        name: data.name,
        /** 过期时间 */
        expired_time:
          data.expired_time === -1
            ? undefined
            : new Date(data.expired_time * 1000),
        /** 过期时间显示 */
        // expired_time_show: data.expired_time === -1 ? true : undefined,
        /** 额度 */
        remain_quota: data.remain_quota,
        /** 是否是无限额度 */
        unlimited_quota: data.unlimited_quota
        /** token_remind_threshold */
        // token_remind_threshold: data.token_remind_threshold
      });
    };

    getTokenDetail();
  }, [tokenId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      expired_time: undefined,
      // expired_time_show: undefined,
      remain_quota: undefined,
      unlimited_quota: false
      // token_remind_threshold: undefined
    }
  });

  useEffect(() => {
    // Force re-render when unlimited_quota changes
    form.setValue('remain_quota', form.getValues('remain_quota'));
  }, [form.getValues('unlimited_quota')]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const params = {
      ...tokenData,
      ...values
      // group: values.groups.join(','),
      // models: values.models.join(',')
    };
    console.log('params', params);
    params.expired_time = isExpired
      ? -1
      : Math.floor(params.expired_time.getTime() / 1000);
    // delete params.expired_time_show
    // params.type = Number(params.type);
    // delete params.id;
    // delete params.groups;
    const res = await fetch(`/api/token`, {
      method: params.id ? 'PUT' : 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    console.log('data', data);
    if (success) {
      window.location.href = '/dashboard/token';
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
                            disabled={isExpired}
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
                control={form.control}
                name="remain_quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount{' '}
                      {renderQuotaWithPrompt(form.getValues('remain_quota'))}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="please enter Limit"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? Number(value) : undefined); // Parse to number
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

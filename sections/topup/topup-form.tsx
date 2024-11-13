'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
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
  redemptionCode: z.string().min(1, {
    message: 'Name is required.'
  })
});

export default function TopupForm() {
  // const { tokenId } = useParams();

  const [isExpired, setIsExpired] = useState<Boolean | null>(null);
  const [tokenData, setTokenData] = useState<Object | null>(null);

  // useEffect(() => {
  //   // 获取令牌详情
  //   const getTokenDetail = async () => {
  //     if (!tokenId || tokenId === 'create') return;

  //     const res = await fetch(`/api/token/${tokenId}`, {
  //       credentials: 'include'
  //     });
  //     const { data } = await res.json();
  //     console.log('---data---', data);
  //     setTokenData(data);
  //     setIsExpired(data.expired_time === -1 ? true : false);

  //     // 填充表单数据
  //     form.reset({
  //       /** 名称 */
  //       name: data.name,
  //       /** 过期时间 */
  //       expired_time:
  //         data.expired_time === -1
  //           ? undefined
  //           : new Date(data.expired_time * 1000),
  //       /** 过期时间显示 */
  //       // expired_time_show: data.expired_time === -1 ? true : undefined,
  //       /** 额度 */
  //       remain_quota: data.remain_quota,
  //       /** 是否是无限额度 */
  //       unlimited_quota: data.unlimited_quota
  //       /** token_remind_threshold */
  //       // token_remind_threshold: data.token_remind_threshold
  //     });
  //   };

  //   getTokenDetail();
  // }, [tokenId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      redemptionCode: ''
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const params = {
      key: values.redemptionCode
      // group: values.groups.join(','),
      // models: values.models.join(',')
    };
    console.log('params', params);
    // delete params.expired_time_show
    // params.type = Number(params.type);
    // delete params.id;
    // delete params.groups;

    const res = await fetch(`/api/user/topup`, {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { message, success } = await res.json();
    if (success) {
      toast.success(message || 'Successful redemption!');
      // window.location.href = '/dashboard/token';
    } else {
      toast.error(message || 'Failure to redeem!');
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          redemption
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="redemptionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redemption code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your redemption code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={!form.formState.isValid}>
                  Redeem
                </Button>
                <Toaster position="top-center" />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
// import { CHANNEL_OPTIONS } from '@/constants';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  // expired_time: z.number().optional(),
  // expired_time_show: z.boolean().optional(),
  remain_quota: z.number().optional() // 新增: 剩余配额
  // unlimited_quota: z.boolean().optional(), // 新增: 是否是无限配额
  // token_remind_threshold: z.number().optional(),
  // company: z.string().min(1, {
  //   message: 'Company name is required.'
  // }),
  // gender: z.enum(['male', 'female', 'other'], {
  //   required_error: 'Please select a gender.'
  // })
});

interface ModelOption {
  id: string;
  // 添加其他可能的字段
}

export default function ChannelForm() {
  const { tokenId } = useParams();
  console.log('---id---', tokenId);
  console.log('---useParams()---', useParams());
  // const [modelTypes, setModelTypes] = useState<string[]>([]);
  // const [groupOptions, setGroupOptions] = useState<string[]>([]);
  // const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [dateState, setDateState] = useState<Date | null>(null);
  const [tokenData, setTokenData] = useState<Object | null>(null);

  useEffect(() => {
    // 获取令牌详情
    const getTokenDetail = async () => {
      if (!tokenId) return;

      const res = await fetch(`/api/token/${tokenId}`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('---data---', data);
      setTokenData(data);

      // 填充表单数据
      form.reset({
        /** 名称 */
        name: data.name,
        /** 过期时间 */
        expired_time: data.expired_time,
        /** 过期时间显示 */
        expired_time_show: null,
        /** 额度 */
        remain_quota: data.remain_quota,
        /** 是否是无限额度 */
        unlimited_quota: data.unlimited_quota,
        /** token_remind_threshold */
        token_remind_threshold: data.token_remind_threshold
      });
    };

    getTokenDetail();
  }, [tokenId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      expired_time: undefined,
      expired_time_show: undefined,
      remain_quota: undefined,
      unlimited_quota: false,
      token_remind_threshold: undefined
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const params = {
      ...tokenData,
      ...values
      // group: values.groups.join(','),
      // models: values.models.join(',')
    };
    console.log('params', params);
    // params.type = Number(params.type);
    // delete params.id;
    // delete params.groups;
    const res = await fetch(`/api/token`, {
      method: 'PUT',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data } = await res.json();
    console.log('data', data);
  }

  const handleDateChange = (date: Date | null) => {
    setDateState(date);
  };

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="expired_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expired</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={'outline'}
                              className={cn(
                                'w-[260px] justify-start text-left font-normal',
                                !dateState && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateState ? (
                                format(dateState, 'LLL dd, y')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              {...field}
                              initialFocus
                              selected={dateState}
                              onSelect={(date) => {
                                handleDateChange(date); // 确保选择日期后更新 dateState
                                field.onChange(date); // 更新表单字段的值
                              }}
                              numberOfMonths={1}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Checkbox {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
              <FormField
                control={form.control}
                name="remain_quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="please enter Limit"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? Number(value) : undefined); // Parse to number
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

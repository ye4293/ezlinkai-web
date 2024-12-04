'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UserSelf } from '@/lib/types';
import { renderQuotaWithPrompt } from '@/utils/render';

const formSchema = z.object({
  username: z.string().min(1, {
    message: 'Username is required.'
  }),
  display_name: z.string().optional(),
  password: z.string().optional(),
  github_id: z.string().optional(),
  google_id: z.string().optional(),
  email: z.string().optional()
  // password: z.string().min(8, {
  //   message: 'Password is required.'
  // })
});

interface ModelOption {
  id: string;
  // 添加其他可能的字段
}

interface ParamsOption extends Partial<UserSelf> {
  quota?: number;
  user_remind_threshold?: number;
  password?: string;
  github_id?: string;
  google_id?: string;
  email?: string;
}

export default function UserForm() {
  const { userId } = useParams();
  console.log('---useParams()---', useParams());

  const [userData, setUserData] = useState<Object | null>(null);

  useEffect(() => {
    // 获取用户详情
    const getUserDetail = async () => {
      if (!userId || userId === 'create') return;

      const res = await fetch(`/api/user/${userId}`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('---data---', data);
      setUserData(data);

      // 填充表单数据
      form.reset({
        /** 名称 */
        username: data.username,
        display_name: data.display_name,
        password: '',
        github_id: data.github_id,
        google_id: data.google_id,
        email: data.email
      });
    };

    getUserDetail();
  }, [userId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      display_name: '',
      password: '',
      github_id: '',
      google_id: '',
      email: ''
    }
  });

  // useEffect(() => {
  //   // Force re-render when unlimited_quota changes
  //   form.setValue('remain_quota', form.getValues('remain_quota'));
  // }, [form.getValues('unlimited_quota')]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const params: ParamsOption = {
      ...userData,
      ...values
    };
    if (params.quota) params.quota = Number(params.quota);
    if (params.user_remind_threshold)
      params.user_remind_threshold = Number(params.user_remind_threshold);
    if (!params.password) delete params.password;
    console.log('params', params);
    // delete params.expired_time_show
    // params.type = Number(params.type);
    // delete params.id;
    // delete params.groups;
    const res = await fetch(`/api/user`, {
      method: params.id ? 'PUT' : 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    console.log('data', data);
    if (success) {
      window.location.href = '/dashboard/user';
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="github_id"
                disabled
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub ID</FormLabel>
                    <FormControl>
                      <Input placeholder="This is read-only" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="google_id"
                disabled
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google ID</FormLabel>
                    <FormControl>
                      <Input placeholder="This is read-only" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="email"
                disabled
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="This is read-only" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

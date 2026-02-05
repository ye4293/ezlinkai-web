'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserSelf } from '@/lib/types/user';
import { toast } from 'sonner';
import { SystemTokenCard } from '@/sections/profile/system-token-card';

const formSchema = z.object({
  username: z.string().min(1, {
    message: 'Username is required.'
  }),
  display_name: z.string().optional(),
  password: z.string().optional(),
  github_id: z.string().optional(),
  google_id: z.string().optional(),
  email: z.string().optional()
});

interface ParamsOption extends Partial<UserSelf> {
  password?: string;
  github_id?: string;
  google_id?: string;
  email?: string;
}

export default function UpdateUserForm() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<Object | null>(null);

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

  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      const userSession = await getSession();
      setSession(userSession);
    };
    initSession();
  }, []);

  useEffect(() => {
    if (!session) return;

    const getUserDetail = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userApi = [10, 100].includes(Number(session.user.role))
          ? `/api/user/${session.user.id}`
          : `/api/user/self`;
        const res = await fetch(userApi, {
          credentials: 'include'
        });
        const { data } = await res.json();
        setUserData(data);

        if (data) {
          const formData = {
            username: data.username || '',
            display_name: data.display_name || '',
            password: '',
            github_id: data.github_id || '',
            google_id: data.google_id || '',
            email: data.email || ''
          };
          form.reset(formData, {
            keepDefaultValues: false
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getUserDetail();
  }, [session, form]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="rounded-xl border bg-card">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4">
          <Card className="rounded-xl border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-2 h-10 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-full" />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const params: ParamsOption = {
      ...userData,
      ...values
    };
    if (!params.password) delete params.password;
    const res = await fetch(`/api/user/self`, {
      method: 'PUT',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { success, message } = await res.json();
    if (success) {
      router.push('/dashboard/setting');
      router.refresh();
      toast.success('更新成功');
    } else {
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Card className="rounded-xl border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">用户信息</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              管理您的账户基本信息与登录凭证
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户名</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入用户名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>显示名称</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入显示名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="留空则不修改密码"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="github_id"
                    disabled
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="未绑定"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="google_id"
                    disabled
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="未绑定"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    disabled
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>邮箱</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="未绑定"
                            className="bg-muted/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    返回
                  </Button>
                  <Button type="submit">保存更改</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <SystemTokenCard />
      </div>
    </div>
  );
}

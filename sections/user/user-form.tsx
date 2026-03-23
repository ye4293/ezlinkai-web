'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { UserSelf } from '@/lib/types/user';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';

function getQuotaPerUnit(): number {
  if (typeof window === 'undefined') return 500000;
  return parseFloat(localStorage.getItem('quota_per_unit') || '500000');
}

function quotaToDollars(quota: number): number {
  return quota / getQuotaPerUnit();
}

function dollarsToQuota(dollars: number): number {
  return Math.round(dollars * getQuotaPerUnit());
}

const formSchema = z.object({
  username: z.string().min(1, {
    message: 'Username is required.'
  }),
  display_name: z.string().optional(),
  password: z.string().optional(),
  group: z.string().optional(),
  quota: z.number().optional(),
  github_id: z.string().optional(),
  google_id: z.string().optional(),
  email: z.string().optional()
});

interface ParamsOption extends Partial<UserSelf> {
  group?: string;
  quota?: number;
  password?: string;
  github_id?: string;
  google_id?: string;
  email?: string;
}

export default function UserForm() {
  const router = useRouter();
  const { userId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<Object | null>(null);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);

  // 美元显示值（用户看到和编辑的）
  const [dollarDisplay, setDollarDisplay] = useState('0');
  // 余额调整
  const [adjustAmount, setAdjustAmount] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      display_name: '',
      password: '',
      group: '',
      quota: 0,
      github_id: '',
      google_id: '',
      email: ''
    }
  });

  useEffect(() => {
    setIsLoading(true);

    const getUserDetail = async () => {
      if (!userId || userId === 'create') {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/user/${userId}`, {
          credentials: 'include'
        });
        const { data } = await res.json();
        setUserData(data);

        if (data) {
          const formData = {
            username: data.username || '',
            display_name: data.display_name || '',
            password: '',
            group: data.group || '',
            quota: data.quota || 0,
            github_id: data.github_id || '',
            google_id: data.google_id || '',
            email: data.email || ''
          };
          form.reset(formData, {
            keepDefaultValues: false
          });
          // 将 quota 转为美元显示
          setDollarDisplay(quotaToDollars(data.quota || 0).toFixed(2));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    const searchGroup = async () => {
      try {
        const res = await fetch(`/api/group`, {
          credentials: 'include'
        });
        const { data } = await res.json();
        setGroupOptions(data || []);
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };

    Promise.all([getUserDetail(), searchGroup()]).finally(() => {
      setIsLoading(false);
    });
  }, [userId, form]);

  if (isLoading && userId !== 'create') {
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

  // 余额调整
  const handleAdjustBalance = () => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('请输入有效的调整金额');
      return;
    }

    const currentDollars = parseFloat(dollarDisplay) || 0;
    const newDollars = currentDollars + amount;
    if (newDollars < 0) {
      toast.error('调整后余额不能为负数');
      return;
    }

    const newQuota = dollarsToQuota(newDollars);
    form.setValue('quota', newQuota);
    setDollarDisplay(newDollars.toFixed(2));
    setAdjustAmount('');
    toast.success(
      `余额已调整 ${amount >= 0 ? '+' : ''}$${amount.toFixed(
        2
      )} → 当前 $${newDollars.toFixed(2)}`
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const params: ParamsOption = {
      ...userData,
      ...values
    };
    // quota 已经是原始 quota 值（在输入美元时已转换）
    if (!params.password) delete params.password;
    if (!userId || userId === 'create') {
      delete params.group;
      delete params.quota;
      delete params.github_id;
      delete params.google_id;
      delete params.email;
    }
    const res = await fetch(`/api/user`, {
      method: params.id ? 'PUT' : 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { success, message } = await res.json();
    if (success) {
      router.push('/dashboard/user');
      router.refresh();
    } else {
      toast.error(message);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本信息 - 双列 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {userId !== 'create' && (
                <FormField
                  control={form.control}
                  name="group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groupOptions.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            {userId !== 'create' && (
              <>
                <Separator />

                {/* 余额区域 - 并排 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quota"
                    render={() => (
                      <FormItem>
                        <FormLabel>Balance (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              value={dollarDisplay}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDollarDisplay(val);
                                const dollars = parseFloat(val);
                                if (!isNaN(dollars)) {
                                  form.setValue(
                                    'quota',
                                    dollarsToQuota(dollars)
                                  );
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Adjust Balance
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="+10 or -5"
                          className="pl-7"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAdjustBalance();
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAdjustBalance}
                        className="shrink-0"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Positive to add, negative to deduct.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 只读信息 - 三列 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="github_id"
                    disabled
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Read-only" {...field} />
                        </FormControl>
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
                          <Input placeholder="Read-only" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    disabled
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Read-only" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
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

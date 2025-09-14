'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton';
// import { cn } from '@/lib/utils';
import { UserSelf } from '@/lib/types/user';
import { renderQuotaWithPrompt } from '@/utils/render';
import { toast } from 'sonner';

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const params: ParamsOption = {
      ...userData,
      ...values
    };
    if (params.quota) params.quota = Number(params.quota);
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
            {userId !== 'create' && (
              <>
                <div className="grid grid-cols-1 gap-6">
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
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="quota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount{' '}
                          {renderQuotaWithPrompt(form.getValues('quota') || 0)}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Please enter the amount"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? Number(value) : undefined);
                            }}
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

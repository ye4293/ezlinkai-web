'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getSession } from 'next-auth/react';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserSelf } from '@/lib/types';
import { toast } from 'sonner';

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
    if (!params.password) delete params.password;
    // if (!session?.user?.id) {
    //   delete params.github_id;
    //   delete params.google_id;
    //   delete params.email;
    // }
    const res = await fetch(`/api/user/self`, {
      method: 'PUT',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { success, message } = await res.json();
    if (success) {
      router.push('/dashboard/setting');
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

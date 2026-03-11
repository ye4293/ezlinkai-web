'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';

const formSchema = z.object({
  redemptionCode: z.string().min(1, {
    message: 'Code is required.'
  })
});

export default function TopupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      redemptionCode: ''
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const params = {
      key: values.redemptionCode
    };

    try {
      const res = await fetch(`/api/user/topup`, {
        method: 'POST',
        body: JSON.stringify(params),
        credentials: 'include'
      });
      const { message, success } = await res.json();
      if (success) {
        toast.success(message || 'Successful redemption!');
        form.reset();
      } else {
        toast.error(message || 'Failure to redeem!');
      }
    } catch (error) {
      toast.error('An error occurred during redemption.');
    }
  }

  return (
    <Card className="mt-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          Redeem Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3">
            <FormField
              control={form.control}
              name="redemptionCode"
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input
                      placeholder="Enter your redemption code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="mt-1" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!form.formState.isValid}>
              Redeem
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

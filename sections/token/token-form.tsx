'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { CHANNEL_OPTIONS } from '@/constants';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  expired_time: z.date().optional(),
  expired_time_show: z.boolean().optional(),
  type: z.string({
    required_error: 'Please select a type.'
  }),
  groups: z.array(z.string(), {
    required_error: 'Please select at least one group.'
  }),
  key: z.string(),
  base_url: z.string(),
  model_mapping: z.string(),
  models: z.array(z.string(), {
    required_error: 'Please select at least one model.'
  }),
  customModelName: z.string()
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
  const { channelId } = useParams();
  console.log('---id---', channelId);
  console.log('---useParams()---', useParams());
  const [modelTypes, setModelTypes] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);

  useEffect(() => {
    // 获取渠道详情
    const getChannelDetail = async () => {
      if (!channelId) return;

      const res = await fetch(`/api/channel/${channelId}`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('---data---', data);

      // 填充表单数据
      form.reset({
        name: data.name,
        type: String(data.type),
        groups: data.group?.split(',') || [],
        key: data.key,
        base_url: data.base_url,
        model_mapping: data.model_mapping,
        models: data.models?.split(',') || [],
        customModelName: data.customModelName
      });
    };

    // 查询模型类型
    const getModelType = async () => {
      const res = await fetch(`/api/channel/types`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('data', data);
      setModelTypes(data);
    };

    // 查询分组
    const getGroupDict = async () => {
      const res = await fetch(`/api/group`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('data', data);
      setGroupOptions(data);
    };

    // 查询模型
    const getModelDict = async () => {
      const res = await fetch(`/api/channel/models`, {
        credentials: 'include'
      });
      const { data } = await res.json();
      console.log('data', data);
      setModelOptions(data);
    };

    getChannelDetail();
    getModelType();
    getGroupDict();
    getModelDict();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      groups: [],
      key: '',
      base_url: '',
      model_mapping: '',
      models: [],
      customModelName: ''
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const params = {
      ...values,
      group: values.groups.join(','),
      models: values.models.join(',')
    };
    params.type = Number(params.type);
    delete params.id;
    delete params.groups;
    const res = await fetch(`/api/channel`, {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data } = await res.json();
    console.log('data', data);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Channel Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ height: '300px' }}>
                        {modelTypes.map((item) => (
                          <SelectItem key={item.key} value={`${item.value}`}>
                            {item.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groups"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Groups</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const values = field.value ?? [];
                        const newValues = values.includes(value)
                          ? values.filter((v) => v !== value)
                          : [...values, value];
                        field.onChange(newValues);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select groups">
                            {field.value?.length
                              ? `${field.value.length} group(s) selected`
                              : 'Select groups'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupOptions.map((item) => (
                          <SelectItem
                            key={item}
                            value={item}
                            className={
                              field.value?.includes(item) ? 'bg-accent' : ''
                            }
                          >
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keys</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the authentication key for the channel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="This option is used to make API calls through the proxy station, please enter the proxy address in the format https://domain.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model_mapping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model redirection</FormLabel>
                    <FormControl>
                      <Input
                        type="textarea"
                        placeholder="This option is optional to modify the name of the model in the request body, which is a JSON string, the key is the name of the model in the request, and the value is the name of the model to be replaced, for example {}"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const values = field.value ?? [];
                        const newValues = values.includes(value)
                          ? values.filter((v) => v !== value)
                          : [...values, value];
                        field.onChange(newValues);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select models">
                            {field.value?.length
                              ? `${field.value.length} model(s) selected`
                              : 'Select models'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ height: '300px' }}>
                        {modelOptions.map((item) => (
                          <SelectItem
                            key={item.id}
                            value={item.id}
                            className={
                              field.value?.includes(item.id) ? 'bg-accent' : ''
                            }
                          >
                            {item.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customModelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CustomModelName</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="please enter CustomModelName"
                        {...field}
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

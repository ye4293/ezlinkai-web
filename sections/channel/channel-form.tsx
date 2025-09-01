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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Channel } from '@/lib/types';
import request from '@/app/lib/clientFetch';

const formSchema = z.object({
  type: z.string().min(1, {
    message: 'Type is required.'
  }),
  name: z.string().min(1, {
    message: 'Name is required.'
  }),
  groups: z.array(z.string()).min(1, {
    message: 'Please select at least one group.'
  }),
  key: z.string().optional(),
  // 新增批量创建相关字段
  batch_create: z.boolean().default(false),
  aggregate_mode: z.boolean().default(false),
  batch_keys: z.string().optional(),
  // 多密钥配置选项
  key_selection_mode: z.number().default(1), // 0=轮询, 1=随机
  batch_import_mode: z.number().default(1), // 0=覆盖, 1=追加
  // key: z.string().superRefine((val, ctx) => {
  //   const type = (ctx.path[0] === 'type') ? ctx.path[0] : '';
  //   if (type !== '33' && type !== '42' && !val) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       message: 'Key is required for this channel type.'
  //     });
  //   }
  // }),

  base_url: z.string().optional(),
  other: z.string().optional(),
  region: z.string().optional(),
  ak: z.string().optional(),
  sk: z.string().optional(),
  vertex_ai_project_id: z.string().optional(),
  vertex_ai_adc: z.string().optional(),
  user_id: z.string().optional(),
  model_mapping: z.string().optional(),
  models: z.array(z.string(), {
    required_error: 'Please select at least one model.'
  }),
  customModelName: z.string().optional(),
  channel_ratio: z
    .number()
    .min(0.1, {
      message: '渠道倍率必须大于0.1'
    })
    .optional(),
  priority: z
    .number()
    .min(0, {
      message: '优先级必须大于等于0'
    })
    .optional(),
  weight: z
    .number()
    .min(0, {
      message: '权重必须大于等于0'
    })
    .optional(),
  auto_disabled: z.boolean().default(true)

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

interface ModelTypesOption {
  key: string;
  value: string;
  text: string;
}

// 使用 Omit 来从 Channel 接口中排除 type 字段，然后重新定义它。这样可以避免类型冲突。
interface ParamsOption extends Omit<Channel, 'type'> {
  type: number | string;
  group?: string;
  groups?: string[];
  models?: string;
  config?: string;
  channel_ratio?: number;
  priority?: number;
  weight?: number;
  batch_create?: boolean;
  batch_keys?: string;
  auto_disabled?: boolean;
  aggregate_mode?: boolean;
  key_selection_mode?: number;
  batch_import_mode?: number;
}

export default function ChannelForm() {
  const router = useRouter();
  const { channelId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [modelTypes, setModelTypes] = useState<ModelTypesOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [relatedModels, setRelatedModels] = useState<Record<string, string[]>>(
    {}
  );
  const [channelData, setChannelData] = useState<Object | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const initializeData = async () => {
      try {
        // 准备所有需要的请求
        const requests = [
          // 查询模型类型
          fetch('/api/channel/types', { credentials: 'include' })
            .then((res) => res.json())
            .then(({ data }) => data),

          // 查询分组
          fetch('/api/group', { credentials: 'include' })
            .then((res) => res.json())
            .then(({ data }) => data),

          // 查询模型
          fetch('/api/channel/models', { credentials: 'include' })
            .then((res) => res.json())
            .then(({ data }) => data),

          // 查询相关模型
          request.get('/api/models').then(({ data }) => data)
        ];

        // 如果需要获取渠道详情，将其加入请求数组
        if (channelId && channelId !== 'create') {
          requests.push(
            fetch(`/api/channel/${channelId}`, { credentials: 'include' })
              .then((res) => res.json())
              .then(({ data }) => {
                setChannelData(data);
                return data;
              })
          );
        }

        // 同时发起所有请求
        const [
          modelTypesData,
          groupData,
          modelData,
          relatedModelsData,
          channelData
        ] = await Promise.all(requests).finally(() => {
          setIsLoading(false);
        });

        // const modelMap = modelData.map((item: any) => [item.id, item]);
        // console.log('modelMap', modelMap);
        // const modelMap1 = new Map(modelMap);
        // console.log('modelMap1', modelMap1);
        // const modelMap2 = modelMap1.values();
        // console.log('modelMap2', modelMap2);
        // const modelMap3 = Array.from(modelMap2);
        // console.log('modelMap3', modelMap3);

        // 更新状态
        setModelTypes(modelTypesData);
        setGroupOptions(groupData);
        // 模型数据去重
        setModelOptions(
          Array.from(
            new Map(modelData.map((item: any) => [item.id, item])).values()
          ) as ModelOption[]
        );
        setRelatedModels(relatedModelsData);

        // 如果有渠道数据，填充表单
        if (channelData) {
          // 解析配置数据
          let config: any = {};
          try {
            if (channelData.config) {
              config = JSON.parse(channelData.config);
            }
          } catch (error) {
            console.log('Failed to parse channel config:', error);
          }

          // 处理 auto_disabled 字段的类型转换
          // SQLite 返回 1/0，MySQL 返回 true/false
          let autoDisabledValue = true; // 默认值
          if (channelData.hasOwnProperty('auto_disabled')) {
            const rawValue = channelData.auto_disabled;
            if (typeof rawValue === 'boolean') {
              // MySQL: 直接使用布尔值
              autoDisabledValue = rawValue;
            } else if (typeof rawValue === 'number') {
              // SQLite: 转换数字为布尔值
              autoDisabledValue = rawValue === 1;
            } else {
              // 其他情况：强制转换为布尔值
              autoDisabledValue = Boolean(rawValue);
            }
          }

          form.reset({
            type: String(channelData.type),
            name: channelData.name,
            groups: channelData.group?.split(',') || [],
            key: channelData.key,
            base_url: channelData.base_url,
            other: channelData.other,
            region: config.region || '',
            ak: config.ak || '',
            sk: config.sk || '',
            vertex_ai_project_id: config.vertex_ai_project_id || '',
            vertex_ai_adc: config.vertex_ai_adc || '',
            user_id: config.user_id || '',
            model_mapping: channelData.model_mapping || '',
            models: channelData.models?.split(',') || [],
            customModelName: channelData.customModelName,
            channel_ratio: channelData.channel_ratio || 1,
            priority: channelData.priority || 0,
            weight: channelData.weight || 0,
            auto_disabled: autoDisabledValue,
            aggregate_mode: channelData.aggregate_mode || false,
            key_selection_mode:
              (channelData as any).multi_key_info?.key_selection_mode || 1,
            batch_import_mode:
              (channelData as any).multi_key_info?.batch_import_mode || 1
          });
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, [channelId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      name: undefined,
      groups: undefined,
      key: undefined,
      batch_create: false,
      aggregate_mode: false,
      batch_keys: undefined,
      key_selection_mode: 1,
      batch_import_mode: 1,
      base_url: undefined,
      other: undefined,
      region: undefined,
      ak: undefined,
      sk: undefined,
      vertex_ai_project_id: undefined,
      vertex_ai_adc: undefined,
      user_id: undefined,
      model_mapping: undefined,
      models: undefined,
      customModelName: undefined,
      channel_ratio: 1,
      priority: 0,
      weight: 0,
      auto_disabled: true
    }
  });

  const handleTypeInputChange = (value: string) => {
    if (value !== '3') {
      form.setValue('other', '');
    }
    if (value !== '3' && value !== '8') {
      form.setValue('base_url', '');
    }
    // 如果选择Vertex AI渠道，自动设置region为global
    if (value === '48') {
      form.setValue('region', 'global');
    }
  };

  // 解析Google Cloud Application Default Credentials JSON并提取project_id
  const handleVertexAiAdcChange = (value: string) => {
    try {
      if (value.trim()) {
        const jsonData = JSON.parse(value);
        if (jsonData.project_id) {
          // 自动填充Project ID
          form.setValue('vertex_ai_project_id', jsonData.project_id);
          // 确保region为global
          if (!form.getValues('region')) {
            form.setValue('region', 'global');
          }
        }
      }
    } catch (error) {
      // JSON解析失败时不做处理，用户可能还在输入过程中
      console.log('JSON parsing in progress or invalid format');
    }
  };

  const MODEL_MAPPING_EXAMPLE = {
    'gpt-3.5-turbo-0301': 'gpt-3.5-turbo',
    'gpt-4-0314': 'gpt-4',
    'gpt-4-32k-0314': 'gpt-4-32k'
  };

  const type2secretPrompt = (type: string) => {
    // inputs.type === 15 ? '按照如下格式输入：APIKey|SecretKey' : (inputs.type === 18 ? '按照如下格式输入：APPID|APISecret|APIKey' : '请输入渠道对应的鉴权密钥')
    switch (type) {
      case '15':
        return '按照如下格式输入：APIKey|SecretKey';
      case '18':
        return '按照如下格式输入：APPID|APISecret|APIKey';
      case '22':
        return '按照如下格式输入：APIKey-AppId，例如：fastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041';
      case '23':
        return '按照如下格式输入：AppId|SecretId|SecretKey';
      default:
        return '请输入渠道对应的鉴权密钥';
    }
  };

  if (isLoading && channelId !== 'create') {
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
    console.log('=== 开始提交 ===');

    // 防止重复提交
    if (isSubmitting) {
      console.log('正在提交中，忽略重复提交');
      return;
    }

    setIsSubmitting(true);
    setBatchProgress({ current: 0, total: 0 });

    try {
      // 处理customModelName，将其添加到models数组中
      let finalModels = [...(values.models || [])];
      if (values.customModelName && values.customModelName.trim()) {
        const customModels = values.customModelName
          .split(',')
          .map((model) => model.trim())
          .filter((model) => model.length > 0);

        // 将自定义模型添加到models数组中，去重
        customModels.forEach((customModel) => {
          if (!finalModels.includes(customModel)) {
            finalModels.push(customModel);
          }
        });
      }

      // --- 逻辑分支重构 ---
      const isBatchCreate =
        values.batch_create && values.batch_keys && channelId === 'create';
      const isAggregateMode = isBatchCreate && values.aggregate_mode;

      // 添加调试信息
      console.log('=== 调试信息 ===');
      console.log('values.batch_create:', values.batch_create);
      console.log('values.aggregate_mode:', values.aggregate_mode);
      console.log('channelId:', channelId);
      console.log('isBatchCreate:', isBatchCreate);
      console.log('isAggregateMode:', isAggregateMode);

      const keys = (values.batch_keys || '')
        .split('\n')
        .map((key) => key.trim())
        .filter((key) => key.length > 0);
      console.log('keys.length:', keys.length);

      const buildConfig = () => {
        const config: any = {};
        if (values.region) config.region = values.region;
        if (values.ak) config.ak = values.ak;
        if (values.sk) config.sk = values.sk;
        if (values.user_id) config.user_id = values.user_id;
        if (values.vertex_ai_project_id)
          config.vertex_ai_project_id = values.vertex_ai_project_id;
        if (values.vertex_ai_adc) config.vertex_ai_adc = values.vertex_ai_adc;
        return Object.keys(config).length > 0 ? JSON.stringify(config) : '';
      };

      const baseParams: Omit<ParamsOption, 'key' | 'name'> = {
        type: Number(values.type),
        group: values.groups.join(','),
        models: finalModels.join(','),
        base_url: values.base_url || '',
        other: values.other || '',
        config: buildConfig(),
        model_mapping: values.model_mapping || '',
        channel_ratio: values.channel_ratio || 1,
        priority: values.priority || 0,
        weight: values.weight || 0,
        auto_disabled: values.auto_disabled ?? true,
        key_selection_mode: values.key_selection_mode || 1,
        batch_import_mode: values.batch_import_mode || 1
      };

      if (isAggregateMode) {
        // --- 1. 密钥聚合模式 ---
        console.log('=== 执行路径：密钥聚合模式 ===');
        console.log('准备发送的参数:', {
          name: values.name,
          keyCount: keys.length,
          keyPreview:
            keys.slice(0, 2).join(', ') + (keys.length > 2 ? '...' : '')
        });

        if (keys.length === 0) {
          throw new Error('请输入至少一个有效的key');
        }

        const channelParams = {
          ...baseParams,
          name: values.name,
          key: keys.join('\n')
        };

        console.log('发送聚合创建请求...');
        const res = await fetch(`/api/channel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(channelParams),
          credentials: 'include'
        });

        if (!res.ok)
          throw new Error(`HTTP错误: ${res.status} ${res.statusText}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message || '创建失败');

        alert(
          `成功创建聚合渠道 "${values.name}"，包含 ${keys.length} 个密钥。`
        );
        router.push('/dashboard/channel');
        router.refresh();
      } else if (isBatchCreate) {
        // --- 2. 优化后的普通批量创建模式 ---
        console.log('=== 执行路径：普通批量创建模式 ===');
        console.log('=== 优化后的批量创建模式（分批串行处理）===');
        if (keys.length === 0) {
          throw new Error('请输入至少一个有效的key');
        }

        const startTime = Date.now();
        setBatchProgress({ current: 0, total: keys.length });
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        const createChannel = async (key: string, index: number) => {
          const channelParams = {
            ...baseParams,
            key,
            name: `${values.name}_${index + 1}`
          };
          const res = await fetch(`/api/channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(channelParams),
            credentials: 'include'
          });
          if (!res.ok)
            throw new Error(`HTTP错误: ${res.status} ${res.statusText}`);
          const result = await res.json();
          if (!result.success) throw new Error(result.message || '创建失败');
          return { success: true, index, key };
        };

        const BATCH_SIZE = 50;
        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
          const batch = keys.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map((key, keyIndex) => {
            const globalIndex = i + keyIndex;
            return createChannel(key, globalIndex).catch((error) => ({
              success: false,
              index: globalIndex,
              key,
              error: error.message
            }));
          });
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((result) => {
            if (result.success) {
              successCount++;
            } else {
              failCount++;
              const errorResult = result as {
                error: string;
                index: number;
                key: string;
              };
              errors.push(
                `第${errorResult.index + 1}个key(${errorResult.key})失败: ${
                  errorResult.error
                }`
              );
            }
            setBatchProgress((prev) => ({
              ...prev,
              current: prev.current + 1
            }));
          });
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const resultMessage = `批量创建完成！\n总数: ${
          keys.length
        }个\n成功: ${successCount}个\n失败: ${failCount}个\n用时: ${duration}秒${
          errors.length > 0
            ? '\n\n错误详情:\n' +
              errors.slice(0, 10).join('\n') +
              (errors.length > 10 ? '\n...' : '')
            : ''
        }`;
        alert(resultMessage);
        if (successCount > 0) {
          router.push('/dashboard/channel');
          router.refresh();
        }
      } else {
        // --- 3. 单个创建/编辑模式 ---
        console.log('=== 执行路径：单个创建/编辑模式 ===');
        console.log(
          'channelData?.multi_key_info:',
          (channelData as any)?.multi_key_info
        );

        const isExistingMultiKey = (channelData as any)?.multi_key_info
          ?.is_multi_key;
        console.log('isExistingMultiKey:', isExistingMultiKey);

        const params = {
          type: Number(values.type),
          name: values.name,
          group: values.groups.join(','),
          models: finalModels.join(','),
          key: values.key || '',
          base_url: values.base_url || '',
          other: values.other || '',
          config: buildConfig(),
          model_mapping: values.model_mapping || '',
          customModelName: values.customModelName || '',
          channel_ratio: values.channel_ratio || 1,
          priority: values.priority || 0,
          weight: values.weight || 0,
          auto_disabled: values.auto_disabled ?? true,
          key_selection_mode: values.key_selection_mode || 1,
          batch_import_mode: values.batch_import_mode || 1,
          ...(channelData && { id: (channelData as any).id }),
          // 如果是多密钥渠道，需要发送multi_key_info字段
          ...(isExistingMultiKey && {
            multi_key_info: {
              is_multi_key: true,
              key_selection_mode: values.key_selection_mode || 1,
              batch_import_mode: values.batch_import_mode || 1
            }
          })
        };

        console.log('最终发送的params:', params);

        const res = await fetch(`/api/channel`, {
          method: (channelData as any)?.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          credentials: 'include'
        });

        if (!res.ok)
          throw new Error(`HTTP错误: ${res.status} ${res.statusText}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.message || '未知错误');

        router.push('/dashboard/channel');
        router.refresh();
      }
    } catch (error) {
      console.error('提交过程中发生错误:', error);
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
      setBatchProgress({ current: 0, total: 0 });
    }
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
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTypeInputChange(value);
                      }}
                      value={field.value}
                    >
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
              {form.watch('type') === '3' && (
                <>
                  <FormField
                    control={form.control}
                    name="base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AZURE_OPENAI_ENDPOINT</FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-auto max-h-24 min-h-16 resize-none overflow-auto"
                            placeholder="请输入 AZURE_OPENAI_ENDPOINT，例如：https://docs-test-001.openai.azure.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>默认 API 版本</FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-auto max-h-24 min-h-16 resize-none overflow-auto"
                            placeholder="请输入默认 API 版本，例如：2024-03-01-preview，该配置可以被实际的请求查询参数所覆盖"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {form.watch('type') === '8' && (
                <FormField
                  control={form.control}
                  name="base_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Textarea
                          className="h-auto max-h-24 min-h-16 resize-none overflow-auto"
                          placeholder="请输入自定义渠道的 Base URL，例如：https://openai.justsong.cn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please name the channels"
                        {...field}
                      />
                    </FormControl>
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
                    <FormControl>
                      <div className="flex flex-row flex-wrap space-x-2">
                        {groupOptions.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              key={item}
                              id={item}
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                const values = field.value ?? [];
                                const newValues = checked
                                  ? [...values, item]
                                  : values.filter((v) => v !== item);
                                newValues.sort(
                                  (a, b) =>
                                    groupOptions.indexOf(a) -
                                    groupOptions.indexOf(b)
                                );
                                field.onChange(newValues);
                              }}
                              className="mr-2"
                            >
                              {item}
                            </Checkbox>
                            <label
                              htmlFor={item}
                              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === '18' && (
                <FormField
                  control={form.control}
                  name="other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>模型版本</FormLabel>
                      <FormControl>
                        <Textarea
                          className="h-auto max-h-24 min-h-16 resize-none overflow-auto"
                          placeholder="请输入星火大模型版本，注意是接口地址中的版本号，例如：v2.1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch('type') === '21' && (
                <FormField
                  control={form.control}
                  name="other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>知识库 ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入知识库 ID，例如：123456"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch('type') === '17' && (
                <FormField
                  control={form.control}
                  name="other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>插件参数</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入插件参数，即 X-DashScope-Plugin 请求头的取值"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch('type') === '34' && (
                <p className="rounded bg-gray-100 p-2 text-sm text-gray-600">
                  对于 Coze 而言，模型名称即 Bot ID，你可以添加一个前缀
                  `bot-`，例如：`bot-123456`。
                </p>
              )}
              {form.watch('type') === '40' && (
                <p className="rounded bg-gray-100 p-2 text-sm text-gray-600">
                  对于豆包而言，需要手动去{' '}
                  <a
                    target="_blank"
                    href="https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint"
                  >
                    模型推理页面
                  </a>{' '}
                  创建推理接入点，以接入点名称作为模型名称，例如：`ep-20240608051426-tkxvl`。
                </p>
              )}

              {/* <FormField
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
              /> */}

              {form.watch('type') !== '43' && (
                <FormField
                  control={form.control}
                  name="models"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Models</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex flex-row flex-wrap gap-4">
                            {modelOptions.map((item) => (
                              <div key={item.id} className="flex items-center">
                                <Checkbox
                                  key={item.id}
                                  id={item.id}
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    const values = field.value ?? [];
                                    const newValues = checked
                                      ? [...values, item.id]
                                      : values.filter((v) => v !== item.id);
                                    field.onChange(newValues);
                                  }}
                                  className="mr-2"
                                >
                                  {item.id}
                                </Checkbox>
                                <label
                                  htmlFor={item.id}
                                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {item.id}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => {
                                const currentType = form.watch('type');
                                const allRelatedModelIds =
                                  relatedModels[currentType];
                                const relatedModelIds = modelOptions
                                  .filter((m) =>
                                    allRelatedModelIds.includes(m.id)
                                  )
                                  .map((m) => m.id);
                                field.onChange(relatedModelIds);
                              }}
                            >
                              Fill in the relevant model
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                const allModelIds = modelOptions.map(
                                  (m) => m.id
                                );
                                field.onChange(allModelIds);
                              }}
                            >
                              Select all
                            </Button>
                            <Button
                              type="button"
                              onClick={() => field.onChange([])}
                            >
                              Clear all
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('type') !== '43' && (
                <FormField
                  control={form.control}
                  name="model_mapping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model redirection</FormLabel>
                      <FormControl>
                        <Textarea
                          className="h-auto max-h-64 min-h-40 resize-none overflow-auto"
                          placeholder={`This option is optional to modify the name of the model in the request body, which is a JSON string, the key is the name of the model in the request, and the value is the name of the model to be replaced, for example \n${JSON.stringify(
                            MODEL_MAPPING_EXAMPLE,
                            null,
                            2
                          )}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('type') === '33' && (
                <>
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="region，e.g. us-west-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ak"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AK</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS IAM Access Key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SK</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS IAM Secret Key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch('type') === '48' && (
                <>
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vertex AI Region.g. us-east5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vertex_ai_project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vertex AI Project ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vertex AI Project ID"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vertex_ai_adc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Google Cloud Application Default Credentials JSON
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-auto max-h-48 min-h-32 resize-none overflow-auto"
                            placeholder="请粘贴Google Cloud Application Default Credentials JSON内容，系统会自动提取Project ID"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleVertexAiAdcChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <div className="text-[0.8rem] text-muted-foreground">
                          粘贴JSON后会自动提取project_id填充到上方的Project
                          ID字段，并设置region为global
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch('type') === '34' && (
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="生成该密钥的用户 ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <>
                {/* 批量创建开关 - 仅在创建模式下显示 */}
                {channelId === 'create' && (
                  <>
                    <FormField
                      control={form.control}
                      name="batch_create"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              批量创建
                            </FormLabel>
                            <div className="text-[0.8rem] text-muted-foreground">
                              开启后可以批量输入多个key来创建多个渠道（并行处理，速度更快）
                            </div>
                          </div>
                          <FormControl>
                            <div className="flex items-center space-x-4">
                              {form.watch('batch_create') && (
                                <FormField
                                  control={form.control}
                                  name="aggregate_mode"
                                  render={({ field: aggregateField }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <Checkbox
                                        id="aggregate_mode"
                                        checked={aggregateField.value}
                                        onCheckedChange={
                                          aggregateField.onChange
                                        }
                                      />
                                      <label
                                        htmlFor="aggregate_mode"
                                        className="cursor-pointer text-sm font-medium leading-none"
                                      >
                                        密钥聚合模式
                                      </label>
                                    </FormItem>
                                  )}
                                />
                              )}
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* 批量创建进度显示 */}
                    {form.watch('batch_create') &&
                      isSubmitting &&
                      batchProgress.total > 0 && (
                        <div className="rounded border border-green-200 bg-green-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">
                              批量创建进度
                            </span>
                            <span className="text-sm text-green-600">
                              {batchProgress.current} / {batchProgress.total}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-green-200">
                            <div
                              className="h-2 rounded-full bg-green-600 transition-all duration-300"
                              style={{
                                width: `${
                                  batchProgress.total > 0
                                    ? (batchProgress.current /
                                        batchProgress.total) *
                                      100
                                    : 0
                                }%`
                              }}
                            ></div>
                          </div>
                          <div className="mt-1 text-xs text-green-600">
                            {batchProgress.current === batchProgress.total
                              ? '处理完成，正在跳转...'
                              : '正在并行创建渠道...'}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {/* 根据批量创建开关显示不同的密钥输入界面 */}
                {form.watch('batch_create') && channelId === 'create' ? (
                  <FormField
                    control={form.control}
                    name="batch_keys"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>批量密钥</FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-auto max-h-64 min-h-32 resize-none overflow-auto"
                            placeholder={`请按行输入多个密钥，每行一个密钥。

🚀 性能优化：
• 采用并行处理，速度快10倍
• 每批处理10个，避免服务器压力
• 自动显示创建进度

示例格式：
sk-1234567890abcdef
sk-0987654321fedcba
sk-abcdef1234567890

${type2secretPrompt(form.watch('type'))}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => {
                      // 检查当前渠道是否为多密钥聚合渠道
                      const isMultiKey = (channelData as any)?.multi_key_info
                        ?.is_multi_key;

                      return (
                        <FormItem>
                          <FormLabel>
                            {isMultiKey ? '密钥管理' : '密钥'}
                            {isMultiKey && (
                              <span className="ml-2 text-xs text-blue-600">
                                (多密钥聚合渠道)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            {isMultiKey ? (
                              <Textarea
                                className="h-auto max-h-48 min-h-24 resize-none overflow-auto"
                                placeholder={`多密钥聚合渠道密钥管理：

🔑 添加密钥：
• 每行输入一个密钥
• 支持批量粘贴多个密钥
• 根据编辑模式决定是追加还是覆盖现有密钥

⚙️ 当前配置：
• 密钥选择模式：${
                                  form.watch('key_selection_mode') === 0
                                    ? '轮询模式'
                                    : '随机模式'
                                }
• 编辑模式：${form.watch('batch_import_mode') === 0 ? '覆盖模式' : '追加模式'}

💡 提示：在渠道编辑页面可以修改密钥选择和编辑模式`}
                                {...field}
                              />
                            ) : (
                              <Input
                                placeholder={type2secretPrompt(
                                  form.watch('type')
                                )}
                                {...field}
                              />
                            )}
                          </FormControl>
                          {isMultiKey && (
                            <div className="text-xs text-gray-600">
                              <p>
                                • <strong>追加模式</strong>
                                ：新密钥将添加到现有密钥列表中
                              </p>
                              <p>
                                • <strong>覆盖模式</strong>
                                ：新密钥将替换所有现有密钥
                              </p>
                              <p>• 可在上方密钥配置区域修改编辑模式</p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
              </>

              {form.watch('type') === '37' && (
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入 Account ID，例如：d8d7c61dbc334c32d3ced580e4bf42b4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('type') !== '3' &&
                form.watch('type') !== '8' &&
                form.watch('type') !== '22' &&
                form.watch('type') !== '33' && (
                  <FormField
                    control={form.control}
                    name="base_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent</FormLabel>
                        <FormControl>
                          <Textarea
                            className="h-auto max-h-64 min-h-32 resize-none overflow-auto"
                            placeholder="This option is used to make API calls through the proxy station, please enter the proxy address in the format https://domain.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              {form.watch('type') === '22' && (
                <FormField
                  control={form.control}
                  name="base_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>私有部署地址</FormLabel>
                      <FormControl>
                        <Textarea
                          className="h-auto max-h-64 min-h-32 resize-none overflow-auto"
                          placeholder="请输入私有部署地址，格式为：https://fastgpt.run/api/openapi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="channel_ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>渠道倍率</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="请输入渠道倍率，默认为1"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === '' ? undefined : parseFloat(value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>优先级</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="请输入优先级，默认为0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === '' ? undefined : parseInt(value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>权重</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="请输入权重，默认为0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === '' ? undefined : parseInt(value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auto_disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">自动禁用</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        开启后，当渠道出现错误时系统会自动禁用该渠道。关闭后，即使出现错误也不会自动禁用。
                      </div>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 多密钥配置选项 - 只在多密钥渠道时显示 */}
              {((channelData as any)?.multi_key_info?.is_multi_key ||
                form.watch('aggregate_mode')) && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="key_selection_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>密钥选择模式</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择密钥选择模式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">轮询模式</SelectItem>
                            <SelectItem value="1">随机模式</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-[0.8rem] text-muted-foreground">
                          {field.value === 0
                            ? '按顺序轮流使用密钥'
                            : '随机选择可用密钥'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="batch_import_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>密钥编辑模式</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择密钥编辑模式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">覆盖模式</SelectItem>
                            <SelectItem value="1">追加模式</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-[0.8rem] text-muted-foreground">
                          {field.value === 0
                            ? '编辑时覆盖现有密钥'
                            : '编辑时追加到现有密钥'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="customModelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CustomModelName</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入自定义模型名称，多个模型用逗号分隔，例如：gpt-4o,claude-3.5-sonnet"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[0.8rem] text-muted-foreground">
                      输入的自定义模型将自动添加到上面选择的模型列表中
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <Button type="button" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? form.watch('batch_create') && batchProgress.total > 0
                    ? `创建中... (${batchProgress.current}/${batchProgress.total})`
                    : '提交中...'
                  : channelId !== 'create'
                  ? '更新渠道'
                  : form.watch('batch_create')
                  ? '批量创建渠道'
                  : '创建渠道'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

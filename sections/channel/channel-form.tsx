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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Channel } from '@/lib/types';

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
  key: z.string(),
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
  customModelName: z.string().optional()

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
}

export default function ChannelForm() {
  const router = useRouter();
  const { channelId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [modelTypes, setModelTypes] = useState<ModelTypesOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
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
            .then(({ data }) => data)
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
        const [modelTypesData, groupData, modelData, channelData] =
          await Promise.all(requests).finally(() => {
            setIsLoading(false);
          });

        // 更新状态
        setModelTypes(modelTypesData);
        setGroupOptions(groupData);
        setModelOptions(
          Array.from(
            new Map(modelData.map((item: any) => [item.id, item])).values()
          ) as ModelOption[]
        );

        // 如果有渠道数据，填充表单
        if (channelData) {
          form.reset({
            type: String(channelData.type),
            name: channelData.name,
            groups: channelData.group?.split(',') || [],
            key: channelData.key,
            base_url: channelData.base_url,
            other: channelData.other,
            region: channelData.region,
            ak: channelData.ak,
            sk: channelData.sk,
            vertex_ai_project_id: channelData.vertex_ai_project_id || '',
            vertex_ai_adc: channelData.vertex_ai_adc || '',
            user_id: channelData.user_id || '',
            model_mapping: channelData.model_mapping || '',
            models: channelData.models?.split(',') || [],
            customModelName: channelData.customModelName
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
      customModelName: undefined
    }
  });

  const handleTypeInputChange = (value: string) => {
    if (value !== '3') {
      form.setValue('other', '');
    }
    if (value !== '3' && value !== '8') {
      form.setValue('base_url', '');
    }
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
    // console.log('onSubmit', values);
    const params: ParamsOption = {
      ...channelData,
      ...values,
      group: values.groups.join(','),
      models: values.models.join(',')
    };
    params.type = Number(params.type);
    // delete params.id;
    delete params.groups;
    // console.log('******params*****', params);
    const res = await fetch(`/api/channel`, {
      method: params.id ? 'PUT' : 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    // console.log('data', data);
    if (success) {
      // window.location.href = '/dashboard/channel';
      router.push('/dashboard/channel');
      router.refresh();
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
                                field.value?.includes(item.id)
                                  ? 'bg-accent'
                                  : ''
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
                          className="h-auto max-h-64 min-h-32 resize-none overflow-auto"
                          placeholder="This option is optional to modify the name of the model in the request body, which is a JSON string, the key is the name of the model in the request, and the value is the name of the model to be replaced, for example {}"
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

              {form.watch('type') === '42' && (
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
                          <Input
                            placeholder="Google Cloud Application Default Credentials JSON"
                            {...field}
                          />
                        </FormControl>
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

              {form.watch('type') !== '33' && form.watch('type') !== '42' && (
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密钥</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={type2secretPrompt(field.value)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

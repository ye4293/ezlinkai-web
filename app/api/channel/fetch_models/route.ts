import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/fetch_models'
});

// POST: 获取上游API的模型列表（用于新建渠道）
export const POST = handler.post;

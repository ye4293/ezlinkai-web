import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/fetch_models/:id',
  useParams: true
});

// GET: 获取已有渠道的上游模型列表
export const GET = handler.get;

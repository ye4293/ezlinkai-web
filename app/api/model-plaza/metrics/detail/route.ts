import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/model-plaza/metrics/detail',
  requireAuth: true // 需要转发 auth header，后端 TryUserAuth 中间件会可选解析
});

export const GET = handler.get;

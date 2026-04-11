import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/log/self/stat/performance'
});

export const GET = handler.get;

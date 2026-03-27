import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/model-plaza/metrics/all',
  requireAuth: false
});

export const GET = handler.get;

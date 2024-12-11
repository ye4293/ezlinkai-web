import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/dashboard/graph'
});

export const GET = handler.get;

import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/models_by_id'
});

export const GET = handler.get;

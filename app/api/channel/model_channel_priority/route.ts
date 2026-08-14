import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/model_channel_priority'
});

export const PUT = handler.put;

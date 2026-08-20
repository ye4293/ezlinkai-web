import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/model_channel_enable'
});

export const POST = handler.post;

import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/model_channels'
});

export const GET = handler.get;

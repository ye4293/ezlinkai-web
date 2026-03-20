import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/keys/batch-toggle'
});

export const POST = handler.post;

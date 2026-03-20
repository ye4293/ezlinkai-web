import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/keys/fix-status'
});

export const POST = handler.post;

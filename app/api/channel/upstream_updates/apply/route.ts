import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/channel/upstream_updates/apply'
});

export const POST = handler.post;

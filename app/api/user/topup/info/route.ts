import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/user/topup/info'
});

export const GET = handler.get;

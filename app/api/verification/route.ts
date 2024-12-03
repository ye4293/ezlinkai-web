import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/verification',
  requireAuth: false
});

export const GET = handler.get;

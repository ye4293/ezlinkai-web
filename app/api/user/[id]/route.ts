import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: `/api/user/:id`,
  useParams: true
});

export const GET = handler.get;
export const DELETE = handler.delete;

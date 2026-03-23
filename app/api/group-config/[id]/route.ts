import { ApiHandler } from '@/app/lib/api-handler';

const handler = new ApiHandler({
  endpoint: '/api/group-config/:id',
  useParams: true
});

export const DELETE = handler.delete;

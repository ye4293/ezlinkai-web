// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import ImageTable from '../tables';
import { Separator } from '@/components/ui/separator';
import { ImageStat } from '@/lib/types';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Image', link: '/dashboard/image' }
];

type TImageListingPage = {};

export default async function ImageListingPage({}: TImageListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const taskId = searchParamsCache.get('task_id');
  const channel = searchParamsCache.get('channel');
  const username = searchParamsCache.get('username');
  const provider = searchParamsCache.get('provider');
  const modelName = searchParamsCache.get('model_name');
  const startTime = searchParamsCache.get('start_timestamp');
  const endTime = searchParamsCache.get('end_timestamp');

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(taskId && { taskid: taskId }),
    ...(channel && { channel_id: String(channel) }),
    ...(username && { username }),
    ...(provider && { provider }),
    ...(modelName && { model_name: modelName }),
    ...(startTime && { start_timestamp: String(Number(startTime) * 1000) }), // 用毫秒
    ...(endTime && { end_timestamp: String(Number(endTime) * 1000) })
  });

  const session = await auth();
  // 查看角色
  const _userRole = session?.user?.role;
  const userApi = [10, 100].includes(Number(_userRole))
    ? `/api/image`
    : `/api/image/self`;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${params}`;

  const res = await fetch(baseUrl, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`
    }
  });

  const { data } = await res.json();
  const totalData = (data && data.total) || 0;
  const imageData: ImageStat[] = (data && data.list) || [];

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <Separator />
        <ImageTable data={imageData} totalData={totalData} />
      </div>
    </PageContainer>
  );
}

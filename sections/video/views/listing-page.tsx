import { cookies } from 'next/headers';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import VideoTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { VideoStat } from '@/lib/types';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Video', link: '/dashboard/video' }
];

type TVideoListingPage = {};

export default async function VideoListingPage({}: TVideoListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const mjId = searchParamsCache.get('mj_id');
  const channel = searchParamsCache.get('channel');
  const username = searchParamsCache.get('username');
  const startTime = searchParamsCache.get('start_timestamp');
  const endTime = searchParamsCache.get('end_timestamp');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(mjId && { mj_id: mjId }),
    ...(channel && { channel }),
    ...(username && { username }),
    ...(startTime && { start_timestamp: startTime }),
    ...(endTime && { end_timestamp: endTime })
  };

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(mjId && { mj_id: mjId }),
    ...(channel && { channel: String(channel) }),
    ...(username && { username }),
    ...(startTime && { start_timestamp: String(Number(startTime) * 1000) }), // 用毫秒
    ...(endTime && { end_timestamp: String(Number(endTime) * 1000) })
  });
  // console.log('Midjourney params', params);
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  // 查看角色
  const _userRole = cookies().get('role')?.value;
  const userApi = [10, 100].includes(Number(_userRole))
    ? `/api/video`
    : `/api/video/self`;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${params}`;
  // console.log('baseUrl', baseUrl)
  const res = await fetch(
    // process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/search?page=${params.page}&pagesize=${params.pagesize}`,
    baseUrl,
    {
      credentials: 'include',
      headers: {
        Cookie: _cookie
      }
    }
  );
  const { data } = await res.json();
  // console.log('----data----', data);
  // console.log('----data----', data.currentPage)
  // console.log('----params----', params)
  const totalData = (data && data.total) || 0;
  const videoData: VideoStat[] = (data && data.list) || [];
  console.log('videoData', videoData);
  // mock api call
  // const data = await fakeUsers.getUsers(filters);
  // const totalData = data.total_users;
  // const channel: Channel[] = data.users;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        {/* <div className="flex items-start justify-between">
          <Heading
            title={`Channels (${totalData})`}
            description="Manage channels (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/channel/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div> */}
        <Separator />
        <VideoTable data={videoData} totalData={totalData} />
      </div>
    </PageContainer>
  );
}
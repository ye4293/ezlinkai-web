// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import MidjourneyTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { MidjourneyStat } from '@/lib/types/midjourney';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Midjourney', link: '/dashboard/midjourney' }
];

type TMidjourneyListingPage = {};

export default async function MidjourneyListingPage({}: TMidjourneyListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const mjId = searchParamsCache.get('mj_id');
  const channel = searchParamsCache.get('channel');
  const username = searchParamsCache.get('username');
  const type = searchParamsCache.get('type');
  const status = searchParamsCache.get('status');
  const startTime = searchParamsCache.get('start_timestamp');
  const endTime = searchParamsCache.get('end_timestamp');

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(mjId && { mj_id: mjId }),
    ...(channel && { channel_id: String(channel) }),
    ...(username && { username }),
    ...(type && { type }),
    ...(status && { status }),
    ...(startTime && { start_timestamp: String(startTime) }),
    ...(endTime && { end_timestamp: String(endTime) })
  });
  // console.log('Midjourney params', params);
  const session = await auth();
  // const _cookie = 'session=' + cookies().get('session')?.value + '==';
  // 查看角色
  const _userRole = session?.user?.role;
  const userApi = [10, 100].includes(Number(_userRole))
    ? `/api/mj`
    : `/api/mj/self`;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL + `${userApi}?${params}`;
  // console.log('baseUrl', baseUrl)
  const res = await fetch(
    // process.env.NEXT_PUBLIC_API_BASE_URL + `/api/channel/search?page=${params.page}&pagesize=${params.pagesize}`,
    baseUrl,
    {
      credentials: 'include',
      headers: {
        // Cookie: _cookie,
        Authorization: `Bearer ${session?.user?.accessToken}`
      }
    }
  );
  const { data } = await res.json();
  // console.log('----data----', data);
  // console.log('----data----', data.currentPage)
  // console.log('----params----', params)
  const totalUsers = (data && data.total) || 0;
  const mjData: MidjourneyStat[] = (data && data.list) || [];
  // console.log('mjData', mjData);
  // mock api call
  // const data = await fakeUsers.getUsers(filters);
  // const totalUsers = data.total_users;
  // const channel: Channel[] = data.users;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        {/* <div className="flex items-start justify-between">
          <Heading
            title={`Channels (${totalUsers})`}
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
        <MidjourneyTable data={mjData} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}

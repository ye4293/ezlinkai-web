import { cookies } from 'next/headers';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import UserTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { UserSelf } from '@/lib/types';
// import { fakeUsers } from '@/constants/mock-api';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'User', link: '/dashboard/user' }
];

type TUserListingPage = {};

export default async function UserListingPage({}: TUserListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const status = searchParamsCache.get('status');
  const pageLimit = searchParamsCache.get('limit');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { genders: status })
  };

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(status && { status: status })
  });
  const _cookie = 'session=' + cookies().get('session')?.value + '==';
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/user/search?${params}`;
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
  // console.log('---user data---');
  // console.log('---user data---', data);
  // console.log('----data----', data.currentPage)
  // console.log('----params----', params)
  const totalUsers = (data && data.total) || 0;
  const user: UserSelf[] = (data && data.list) || [];
  // mock api call
  // const data = await fakeUsers.getUsers(filters);
  // const totalUsers = data.total_users;
  // const channel: Channel[] = data.users;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`User (${totalUsers})`}
            description="Manage User (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/user/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <UserTable data={user} totalData={totalUsers} />
      </div>
    </PageContainer>
  );
}

import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import TokenTable from '../tables';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Token } from '@/lib/types/token';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Token', link: '/dashboard/token' }
];

type TTokenListingPage = {};

export default async function TokenListingPage({}: TTokenListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const status = searchParamsCache.get('status');
  const pageLimit = searchParamsCache.get('limit');

  const params = new URLSearchParams({
    page: String(page),
    pagesize: String(pageLimit),
    ...(search && { keyword: search }),
    ...(status && { status: status })
  });
  const session = await auth();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL + `/api/token/search?${params}`;
  const res = await fetch(baseUrl, {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${session?.user?.accessToken}`
    }
  });
  const { data } = await res.json();
  const totalData = (data && data.total) || 0;
  const token: Token[] = (data && data.list) || [];

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-start justify-between">
          <Heading
            title={`Token (${totalData})`}
            description="Manage Token (Server side table functionalities.)"
          />

          <Link
            href={'/dashboard/token/create'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link>
        </div>
        <Separator />
        <TokenTable data={token} totalData={totalData} />
      </div>
    </PageContainer>
  );
}

// import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { getUnixTime } from 'date-fns';
// import { AreaGraph } from '../area-graph';
import { BarGraph } from '../bar-graph';
// import { PieGraph } from '../pie-graph';
import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
import { RecentSales } from '../recent-sales';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { renderQuota } from '@/utils/render';
import request from '@/app/lib/serverFetch';
import { DashboardResult } from '@/lib/types/dashboard';

export default async function OverViewPage() {
  const session = await auth();
  // console.log('----session', session);
  // const params = {
  //   time: Math.trunc(getUnixTime(new Date()))
  // };
  // const _cookie = 'session=' + cookies().get('session')?.value + '==';
  // 查看角色
  const _userRole = session?.user?.role;
  const userApi = [10, 100].includes(Number(_userRole))
    ? `/api/dashboard/`
    : `/api/dashboard/self`;
  // console.log('----overview cookie', _cookie);
  const res: DashboardResult = await request.get(userApi);
  // console.log('res****', res);
  const dashboardData = res.data || {};
  // const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + userApi, {
  //   credentials: 'include',
  //   headers: {
  //     // Cookie: _cookie,
  //     Authorization: `Bearer ${session?.user?.accessToken}`
  //   }
  // });
  // console.log('----dashboard res', res);
  // const dashboard = await res.json();
  // console.log('dashboard', dashboard);
  // const dashboardData = dashboard.data || {};

  return (
    <PageContainer scrollable>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Hi, Welcome back 👋
          </h2>
          <div className="hidden items-center space-x-2 md:flex">
            <CalendarDateRangePicker />
            <Button>Download</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Credits</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {/* <div className="text-2xl font-bold">
                    {renderQuota(dashboardData.current_quota || 0)}
                  </div> */}
                  <p className="text-xs text-muted-foreground">
                    Available Credits
                  </p>
                  <div className="text-xl font-bold">
                    {renderQuota(dashboardData.current_quota || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Used Credits</p>
                  <div className="text-xl font-bold">
                    {renderQuota(dashboardData.used_quota || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">PM</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {/* <div className="text-2xl font-bold">
                    {renderQuota(dashboardData.current_quota || 0)}
                  </div> */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">TPM</p>
                      <div className="text-xl font-bold">
                        {dashboardData.tpm || 0}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">RPM</p>
                      <div className="text-xl font-bold">
                        {dashboardData.rpm || 0}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">QPM</p>
                  <div className="text-xl font-bold">
                    {renderQuota(dashboardData.quota_pm || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">PD</CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </CardHeader>
                <CardContent>
                  {/* <div className="text-2xl font-bold">
                    {dashboardData.quota_pm || 0}
                  </div> */}
                  <p className="text-xs text-muted-foreground">
                    Today's Request
                  </p>
                  <div className="text-xl font-bold">
                    {dashboardData.request_pd || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Today's Usage</p>
                  <div className="text-xl font-bold">
                    {renderQuota(dashboardData.used_pd || 0)}
                  </div>
                </CardContent>
              </Card>
              {/* <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ dashboardData.used_pd || 0 }</div>
                  <p className="text-xs text-muted-foreground">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card> */}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4">
                <BarGraph session={session} />
              </div>
              <Card className="col-span-4 md:col-span-3">
                <CardHeader>
                  <CardTitle>Most Popular AI Models</CardTitle>
                  <CardDescription>
                    {dashboardData.model_stats?.length || 0} models today.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales dataList={dashboardData.model_stats || []} />
                </CardContent>
              </Card>
              {/* <div className="col-span-4">
                <AreaGraph />
              </div>
              <div className="col-span-4 md:col-span-3">
                <PieGraph />
              </div> */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

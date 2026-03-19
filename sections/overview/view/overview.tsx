'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { BarGraph } from '../bar-graph';
import PageContainer from '@/components/layout/page-container';
import { RecentSales } from '../recent-sales';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { renderQuota } from '@/utils/render';
import { Skeleton } from '@/components/ui/skeleton';
import request from '@/app/lib/clientFetch';
import { Dashboard, DashboardResult } from '@/lib/types/dashboard';

const isAdmin = (role: unknown) => [10, 100].includes(Number(role));

export default function OverViewPage() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const [dashboardData, setDashboardData] = useState<Dashboard>({
    current_quota: 0,
    used_quota: 0,
    tpm: 0,
    rpm: 0,
    quota_pm: 0,
    request_pd: 0,
    used_pd: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const userApi = isAdmin(userRole)
          ? '/api/dashboard'
          : '/api/dashboard/self';

        const res: DashboardResult = await request.get(userApi);

        if (res?.success && res?.data) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error('Dashboard data fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [userRole, status]);

  return (
    <PageContainer scrollable>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Hi, Welcome back 👋
          </h2>
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
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Available Credits
                      </p>
                      <div className="text-xl font-bold">
                        {renderQuota(dashboardData.current_quota || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used Credits
                      </p>
                      <div className="text-xl font-bold">
                        {renderQuota(dashboardData.used_quota || 0)}
                      </div>
                    </>
                  )}
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
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Today's Request
                      </p>
                      <div className="text-xl font-bold">
                        {dashboardData.request_pd || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Today's Usage
                      </p>
                      <div className="text-xl font-bold">
                        {renderQuota(dashboardData.used_pd || 0)}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
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
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div className="flex items-center" key={i}>
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="ml-4 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RecentSales dataList={dashboardData.model_stats || []} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

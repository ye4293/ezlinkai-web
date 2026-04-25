'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Wallet, Zap, CalendarDays } from 'lucide-react';
import { BarGraph } from '../bar-graph';
import { AnalyticsContent } from '../analytics-content';
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
import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

const isAdmin = (role: unknown) => [10, 100].includes(Number(role));

export default function OverViewPage() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const userRole = session?.user?.role;
  const userName = session?.user?.name || session?.user?.username || '';
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

  const current = dashboardData.current_quota || 0;
  const used = dashboardData.used_quota || 0;
  const total = current + used;
  const usedRatio = total > 0 ? Math.round((used / total) * 100) : 0;
  const lowBalance = total > 0 && usedRatio >= 80;

  return (
    <PageContainer scrollable>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {t.dashboard.welcome}
            {userName ? `, ${userName}` : ''} 👋
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {t.dashboard.welcomeBack}
            </span>
          </h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              {t.dashboard.tabs.overview}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              {t.dashboard.tabs.analytics}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Balance card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.dashboard.cards.balance.title}
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  ) : (
                    <>
                      <div
                        className={cn(
                          'text-3xl font-semibold tabular-nums tracking-tight',
                          lowBalance && 'text-amber-600 dark:text-amber-500'
                        )}
                      >
                        {renderQuota(current)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.dashboard.cards.balance.used}{' '}
                        <span className="tabular-nums text-foreground/80">
                          {renderQuota(used)}
                        </span>
                        {total > 0 && (
                          <>
                            {' · '}
                            <span className="tabular-nums">
                              {usedRatio}%
                            </span>{' '}
                            {t.dashboard.cards.balance.usedRatio}
                          </>
                        )}
                      </p>
                      {total > 0 && (
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              lowBalance ? 'bg-amber-500' : 'bg-primary'
                            )}
                            style={{ width: `${Math.min(usedRatio, 100)}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Throughput card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.dashboard.cards.throughput.title}
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-semibold tabular-nums tracking-tight">
                        {(dashboardData.tpm || 0).toLocaleString()}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.dashboard.cards.throughput.tpm}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            {t.dashboard.cards.throughput.rpm}
                          </span>{' '}
                          <span className="font-medium tabular-nums text-foreground">
                            {(dashboardData.rpm || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {t.dashboard.cards.throughput.qpm}
                          </span>{' '}
                          <span className="font-medium tabular-nums text-foreground">
                            {renderQuota(dashboardData.quota_pm || 0)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Today's usage card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.dashboard.cards.today.title}
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-semibold tabular-nums tracking-tight">
                        {(dashboardData.request_pd || 0).toLocaleString()}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.dashboard.cards.today.requests}
                      </p>
                      <div className="mt-3 text-xs">
                        <span className="text-muted-foreground">
                          {t.dashboard.cards.today.spend}
                        </span>{' '}
                        <span className="font-medium tabular-nums text-foreground">
                          {renderQuota(dashboardData.used_pd || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              <div className="lg:col-span-4">
                <BarGraph session={session} />
              </div>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t.dashboard.popularModels.title}</CardTitle>
                  <CardDescription>
                    {t.dashboard.popularModels.description.replace(
                      '{count}',
                      String(dashboardData.model_stats?.length || 0)
                    )}
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
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsContent
              session={session}
              modelStats={dashboardData.model_stats || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

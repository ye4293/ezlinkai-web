'use client';

import * as React from 'react';
import { getUnixTime } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import request from '@/app/lib/clientFetch';
import { GraphData, GraphResult } from '@/lib/types/dashboard';

interface BarGraphProps {
  session: any;
}

export const description = 'An interactive bar chart';

const chartConfig = {
  // views: {
  //   label: 'Page Views'
  // },
  quota: {
    label: 'Consumption',
    color: 'hsl(var(--chart-1))'
  },
  token: {
    label: 'Tokens',
    color: 'hsl(var(--chart-2))'
  },
  count: {
    label: 'Times',
    color: 'hsl(var(--chart-3))'
  }
} satisfies ChartConfig;

export function BarGraph({ session }: BarGraphProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('quota');
  const [graphData, setGraphData] = React.useState<GraphData[]>([]);

  // 数据获取移到 useEffect 中
  React.useEffect(() => {
    const fetchData = async () => {
      // 获取图表数据
      const _userRole = session?.user?.role;
      const graphApi = [10, 100].includes(Number(_userRole))
        ? `/api/dashboard/graph`
        : `/api/dashboard/graph/self`;
      const params = new URLSearchParams({
        time: String(Math.trunc(getUnixTime(new Date()))),
        target: activeChart
      });
      // const res = await fetch(`${graphApi}?${params}`, {
      //   credentials: 'include'
      // });
      // const { data } = await res.json();
      const res: GraphResult = await request.get(`${graphApi}?${params}`);

      // 空值检查，防止 res.data 为 undefined
      if (!res?.data || !Array.isArray(res.data)) {
        console.error('API 返回数据异常:', res);
        setGraphData([]);
        return;
      }

      if (activeChart === 'quota') {
        res.data = res.data.map((item: GraphData) => ({
          ...item,
          amount: parseFloat((item.amount / 500000).toFixed(3))
        }));
      }
      setGraphData(res.data);
      // const graphRes = await fetch(
      //   process.env.NEXT_PUBLIC_API_BASE_URL + `${graphApi}?${params}`,
      //   {
      //     credentials: 'include',
      //     headers: {
      //       Authorization: `Bearer ${session?.user?.accessToken}`
      //     }
      //   }
      // );
      // const { data } = await graphRes.json();
      // setGraphData(data);
      // console.log('graphData', graphData);
    };
    fetchData();
  }, [session, activeChart]);

  // const total = React.useMemo(
  //   () => graphData.reduce((acc: number, curr: any) => acc + curr.amount, 0),
  //   [graphData]
  // );
  // const total = React.useMemo(
  //   () => ({
  //     quota: graphData.reduce((acc: number, curr: any) => acc + curr.amount, 0),
  //     token: graphData.reduce((acc: number, curr: any) => acc + curr.amount, 0),
  //     count: graphData.reduce((acc: number, curr: any) => acc + curr.amount, 0),
  //   }),
  //   [graphData]
  // );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Data Analysis</CardTitle>
          <CardDescription>Showing usage for one day</CardDescription>
        </div>
        <div className="flex">
          {['quota', 'token', 'count'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                {/* <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span> */}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={graphData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              // tickFormatter={(value) => {
              //   const date = new Date(value);
              //   return date.toLocaleDateString('en-US', {
              //     month: 'short',
              //     day: 'numeric'
              //   });
              // }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="amount"
                  labelFormatter={(value) => {
                    return `${value}:00`; // 显示小时格式
                  }}
                />
              }
            />
            <Bar dataKey="amount" fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

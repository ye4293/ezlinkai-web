import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import ModelOverviewTable from '@/sections/model/model-overview-table';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Model', link: '/dashboard/model' }
];

export const metadata = {
  title: 'Model'
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title="模型"
          description="模型及挂载渠道的动态优先级视图。点击模型名查看渠道详情。"
        />
        <Separator />
        <ModelOverviewTable />
      </div>
    </PageContainer>
  );
}

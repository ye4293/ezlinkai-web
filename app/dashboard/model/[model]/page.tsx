import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import ModelChannelsTable from '@/sections/model/model-channels-table';

const breadcrumbItems = (model: string) => [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Model', link: '/dashboard/model' },
  { title: model, link: `/dashboard/model/${model}` }
];

export const metadata = {
  title: 'Model Detail'
};

export default async function Page({
  params
}: {
  params: Promise<{ model: string }>;
}) {
  const { model: rawModel } = await params;
  const model = decodeURIComponent(rawModel);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems(model)} />
        <Heading
          title={`模型：${model}`}
          description="该模型挂载的所有渠道（跨分组），按动态优先级降序排列。"
        />
        <Separator />
        <ModelChannelsTable model={model} />
      </div>
    </PageContainer>
  );
}

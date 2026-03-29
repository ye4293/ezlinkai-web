import ModelDetailView from '@/sections/model-plaza/model-detail-view';

export const metadata = {
  title: '模型详情',
  description: '查看模型的性能监控数据'
};

export default function ModelDetailPage() {
  return <ModelDetailView />;
}

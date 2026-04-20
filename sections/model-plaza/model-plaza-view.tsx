'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  LayoutGrid,
  Table,
  Copy,
  Check,
  Zap,
  Hash,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  Users,
  Receipt
} from 'lucide-react';
import type {
  ModelPlazaItem,
  ModelPlazaResponse,
  GroupConfigItem,
  ProviderInfo
} from '@/lib/types/model-plaza';
import type { ModelMetricsMini } from '@/lib/types/model-metrics';
import StatusBadge from './components/status-badge';
import ProviderLogo, { ProviderLogoMark } from './components/provider-logo';
import { get } from '@/app/lib/clientFetch';

function formatPrice(price: number): string {
  if (price === 0) return '$0';
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function getDiscountPercent(discount: number): number {
  return Math.round((1 - discount) * 100);
}

// --- 复制按钮 ---
function CopyButton({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
      title={title}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

// --- 模型卡片 ---
function ModelPriceCard({
  model,
  selectedGroup,
  t,
  metrics,
  onClick
}: {
  model: ModelPlazaItem;
  selectedGroup: string;
  t: any;
  metrics?: ModelMetricsMini;
  onClick?: () => void;
}) {
  const groupPrice = model.group_prices?.find(
    (gp) => gp.group_key === selectedGroup
  );
  const combinedDiscount =
    groupPrice?.combined_discount ?? model.channel_discount ?? 1;
  const discountPercent = getDiscountPercent(combinedDiscount);
  const hasDiscount = discountPercent > 0;

  const finalInputPrice =
    groupPrice?.final_input_price ?? model.base_input_price ?? 0;
  const finalOutputPrice =
    groupPrice?.final_output_price ?? model.base_output_price ?? 0;
  const finalFixedPrice =
    groupPrice?.final_fixed_price ?? model.base_fixed_price ?? 0;

  return (
    <Card
      className="group relative flex cursor-pointer flex-col overflow-hidden border border-border/60 bg-card transition-all hover:border-border hover:shadow-lg dark:hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* 顶部区域 */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-semibold leading-tight">
              {model.model_name}
            </h3>
            <CopyButton
              text={model.model_name}
              title={t.modelPlaza.copyModel}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <ProviderLogo provider={model.provider} />
            <Badge
              variant="secondary"
              className="gap-0.5 text-[10px] leading-none"
            >
              {model.price_type === 'fixed' ? (
                <>
                  <Hash className="h-2.5 w-2.5" />
                  {t.modelPlaza.perCallShort}
                </>
              ) : (
                <>
                  <Zap className="h-2.5 w-2.5" />
                  {t.modelPlaza.tokenBasedShort}
                </>
              )}
            </Badge>
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {metrics && <StatusBadge status={metrics.status} />}
          {hasDiscount && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>

      {/* 价格区域 */}
      <div className="mt-auto border-t border-border/60 px-4 py-3.5">
        {model.price_type === 'fixed' ? (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">
              {t.modelPlaza.perUnit}
            </span>
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground/70 line-through">
                  {formatPrice(model.base_fixed_price)}
                </span>
              )}
              <span className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                {formatPrice(finalFixedPrice)}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.modelPlaza.input}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                {hasDiscount && (
                  <span className="text-[10px] text-muted-foreground/70 line-through">
                    {formatPrice(model.base_input_price)}
                  </span>
                )}
                <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                  {formatPrice(finalInputPrice)}
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                    /M
                  </span>
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.modelPlaza.output}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                {hasDiscount && (
                  <span className="text-[10px] text-muted-foreground/70 line-through">
                    {formatPrice(model.base_output_price)}
                  </span>
                )}
                <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                  {formatPrice(finalOutputPrice)}
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                    /M
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 监控指标 mini */}
      {metrics && metrics.status !== 'no_data' && (
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-1.5 text-[10px] text-muted-foreground">
          <span>{metrics.avg_latency.toFixed(1)}s latency</span>
          <span>{metrics.avg_speed.toFixed(0)} t/s</span>
        </div>
      )}
    </Card>
  );
}

// --- 筛选项组件 ---
function FilterSection({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-1.5 px-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  icon,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      }`}
    >
      {icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`shrink-0 text-[11px] tabular-nums ${
            active ? 'text-accent-foreground/60' : 'text-muted-foreground/60'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FilterBadge({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

// --- 主视图 ---
export default function ModelPlazaView() {
  const { t } = useLocale();
  useDocumentTitle('模型广场');
  const router = useRouter();

  const [models, setModels] = useState<ModelPlazaItem[]>([]);
  const [groups, setGroups] = useState<GroupConfigItem[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metricsMap, setMetricsMap] = useState<
    Record<string, ModelMetricsMini>
  >({});

  const [keyword, setKeyword] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPriceType, setSelectedPriceType] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(48);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pagesize', String(pageSize));
      if (keyword) params.set('keyword', keyword);
      if (selectedProvider) params.set('provider', selectedProvider);
      if (selectedPriceType) params.set('price_type', selectedPriceType);

      const res = await fetch(`/api/model-plaza?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const data: ModelPlazaResponse = json.data;
        setModels(data.models || []);
        setGroups(data.groups || []);
        setProviders(data.providers || []);
        setTotal(data.total);

        if (!selectedGroup && data.groups?.length > 0) {
          setSelectedGroup(data.groups[0].group_key);
        }
      }
    } catch (err) {
      console.error('Failed to fetch model plaza data:', err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    keyword,
    selectedProvider,
    selectedPriceType,
    selectedGroup
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 获取模型监控迷你摘要
  useEffect(() => {
    get<any>('/api/model-plaza/metrics/all')
      .then((res: any) => {
        if (res?.success && res.data) {
          setMetricsMap(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  // --- 筛选栏内容 ---
  const filterContent = (
    <>
      <FilterSection title={t.modelPlaza.providers} icon={Sparkles}>
        <div className="space-y-0.5">
          <FilterRow
            active={selectedProvider === ''}
            onClick={() => {
              setSelectedProvider('');
              setPage(1);
            }}
            label={t.modelPlaza.all}
            count={total}
          />
          {providers.map((p) => (
            <FilterRow
              key={p.name}
              active={selectedProvider === p.name}
              onClick={() => {
                setSelectedProvider(selectedProvider === p.name ? '' : p.name);
                setPage(1);
              }}
              icon={<ProviderLogoMark provider={p.name} size={14} />}
              label={p.name}
              count={p.count}
            />
          ))}
        </div>
      </FilterSection>

      {groups.length > 0 && (
        <FilterSection title={t.modelPlaza.userTier} icon={Users}>
          <div className="flex flex-wrap gap-1.5 px-1.5">
            {groups.map((g) => (
              <FilterBadge
                key={g.group_key}
                active={selectedGroup === g.group_key}
                onClick={() => setSelectedGroup(g.group_key)}
              >
                {g.display_name}
                {g.discount < 1 && (
                  <span className="ml-1 opacity-60">
                    {Math.round(g.discount * 100)}%
                  </span>
                )}
              </FilterBadge>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title={t.modelPlaza.billingType} icon={Receipt}>
        <div className="space-y-0.5">
          <FilterRow
            active={selectedPriceType === ''}
            onClick={() => {
              setSelectedPriceType('');
              setPage(1);
            }}
            label={t.modelPlaza.all}
          />
          <FilterRow
            active={selectedPriceType === 'ratio'}
            onClick={() => {
              setSelectedPriceType(
                selectedPriceType === 'ratio' ? '' : 'ratio'
              );
              setPage(1);
            }}
            icon={<Zap className="h-3.5 w-3.5" />}
            label={t.modelPlaza.tokenBased}
          />
          <FilterRow
            active={selectedPriceType === 'fixed'}
            onClick={() => {
              setSelectedPriceType(
                selectedPriceType === 'fixed' ? '' : 'fixed'
              );
              setPage(1);
            }}
            icon={<Hash className="h-3.5 w-3.5" />}
            label={t.modelPlaza.perCall}
          />
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* 左侧筛选栏 - 桌面 */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r bg-muted/20 p-4 lg:block">
        {filterContent}
      </aside>

      {/* 移动端筛选抽屉 */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-background p-4 shadow-xl">
            {filterContent}
            <Button
              className="mt-2 w-full"
              onClick={() => setShowMobileFilters(false)}
            >
              {t.modelPlaza.all}
            </Button>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {/* 顶栏 */}
        <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            {/* 移动端筛选按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 lg:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            {/* 搜索 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.modelPlaza.search}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 pl-9"
              />
            </div>

            {/* 模型数量 */}
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
              {t.modelPlaza.subtitle.replace('{count}', String(total))}
            </span>

            {/* 视图切换 */}
            <div className="flex shrink-0 overflow-hidden rounded-md border">
              <button
                onClick={() => setViewMode('card')}
                className={`px-2 py-1.5 transition-colors ${
                  viewMode === 'card'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`border-l px-2 py-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="p-4">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                  <div className="border-t border-border/60 p-4">
                    <Skeleton className="h-5 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {models.map((model) => (
                <ModelPriceCard
                  key={model.model_name}
                  model={model}
                  selectedGroup={selectedGroup}
                  t={t}
                  metrics={metricsMap[model.model_name]}
                  onClick={() =>
                    router.push(
                      `/model-plaza/${encodeURIComponent(model.model_name)}`
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.modelName}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.provider}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.billingType}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.inputPrice}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.outputPrice}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.modelPlaza.discount}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => {
                    const groupPrice = model.group_prices?.find(
                      (gp) => gp.group_key === selectedGroup
                    );
                    const combinedDiscount =
                      groupPrice?.combined_discount ??
                      model.channel_discount ??
                      1;
                    const discountPercent =
                      getDiscountPercent(combinedDiscount);
                    const hasDiscount = discountPercent > 0;

                    return (
                      <tr
                        key={model.model_name}
                        className="group border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {model.model_name}
                            </span>
                            <CopyButton
                              text={model.model_name}
                              title={t.modelPlaza.copyModel}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ProviderLogo provider={model.provider} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {model.price_type === 'fixed'
                            ? t.modelPlaza.perCallShort
                            : t.modelPlaza.tokenBasedShort}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {model.price_type === 'fixed' ? (
                            <span>
                              {hasDiscount && (
                                <span className="mr-1.5 text-muted-foreground/60 line-through">
                                  {formatPrice(model.base_fixed_price)}
                                </span>
                              )}
                              <span className="font-medium">
                                {formatPrice(
                                  groupPrice?.final_fixed_price ??
                                    model.base_fixed_price
                                )}
                              </span>
                            </span>
                          ) : (
                            <span>
                              {hasDiscount && (
                                <span className="mr-1.5 text-muted-foreground/60 line-through">
                                  {formatPrice(model.base_input_price)}
                                </span>
                              )}
                              <span className="font-medium">
                                {formatPrice(
                                  groupPrice?.final_input_price ??
                                    model.base_input_price
                                )}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {model.price_type !== 'fixed' ? (
                            <span>
                              {hasDiscount && (
                                <span className="mr-1.5 text-muted-foreground/60 line-through">
                                  {formatPrice(model.base_output_price)}
                                </span>
                              )}
                              <span className="font-medium">
                                {formatPrice(
                                  groupPrice?.final_output_price ??
                                    model.base_output_price
                                )}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasDiscount ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                              -{discountPercent}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 空状态 */}
          {!loading && models.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <Search className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">
                {t.modelPlaza.noResults}
              </p>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.modelPlaza.prevPage}
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="gap-1"
              >
                {t.modelPlaza.nextPage}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

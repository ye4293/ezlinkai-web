'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

// 模型分类规则
const MODEL_CATEGORIES: Record<
  string,
  { label: string; match: (model: string) => boolean }
> = {
  openai: {
    label: 'OpenAI',
    match: (model) => {
      const m = model.toLowerCase();
      return (
        m.includes('gpt') ||
        m.includes('dall-e') ||
        m.includes('whisper') ||
        m.includes('tts-1') ||
        m.includes('text-embedding-3') ||
        m.includes('text-moderation') ||
        m.includes('babbage') ||
        m.includes('davinci') ||
        m.includes('curie') ||
        m.includes('ada') ||
        m.startsWith('o1') ||
        m.startsWith('o3') ||
        m.startsWith('o4')
      );
    }
  },
  anthropic: {
    label: 'Anthropic',
    match: (model) => model.toLowerCase().includes('claude')
  },
  gemini: {
    label: 'Gemini',
    match: (model) => {
      const m = model.toLowerCase();
      return (
        m.includes('gemini') || m.includes('gemma') || m.includes('learnlm')
      );
    }
  },
  deepseek: {
    label: 'DeepSeek',
    match: (model) => model.toLowerCase().includes('deepseek')
  },
  zhipu: {
    label: '智谱',
    match: (model) => {
      const m = model.toLowerCase();
      return (
        m.includes('glm') || m.includes('chatglm') || m.includes('cogview')
      );
    }
  },
  qwen: {
    label: '通义千问',
    match: (model) => model.toLowerCase().includes('qwen')
  },
  moonshot: {
    label: 'Moonshot',
    match: (model) => {
      const m = model.toLowerCase();
      return m.includes('moonshot') || m.includes('kimi');
    }
  },
  minimax: {
    label: 'MiniMax',
    match: (model) => {
      const m = model.toLowerCase();
      return m.includes('abab') || m.includes('minimax');
    }
  },
  mistral: {
    label: 'Mistral',
    match: (model) => {
      const m = model.toLowerCase();
      return (
        m.includes('mistral') ||
        m.includes('codestral') ||
        m.includes('pixtral')
      );
    }
  },
  xai: {
    label: 'xAI',
    match: (model) => model.toLowerCase().includes('grok')
  },
  llama: {
    label: 'Llama',
    match: (model) => model.toLowerCase().includes('llama')
  },
  cohere: {
    label: 'Cohere',
    match: (model) => {
      const m = model.toLowerCase();
      return (
        m.includes('command') || m.includes('c4ai-') || m.includes('embed-')
      );
    }
  }
};

// 对模型进行分类
const categorizeModels = (models: string[]) => {
  const categorized: Record<string, { label: string; models: string[] }> = {};
  const uncategorized: string[] = [];

  models.forEach((model) => {
    let found = false;
    for (const [key, category] of Object.entries(MODEL_CATEGORIES)) {
      if (category.match(model)) {
        if (!categorized[key]) {
          categorized[key] = {
            label: category.label,
            models: []
          };
        }
        categorized[key].models.push(model);
        found = true;
        break;
      }
    }
    if (!found) {
      uncategorized.push(model);
    }
  });

  // 添加"其他"分类
  if (uncategorized.length > 0) {
    categorized['other'] = {
      label: '其他',
      models: uncategorized
    };
  }

  return categorized;
};

interface ModelSelectModalProps {
  open: boolean;
  models: string[];
  selected: string[];
  loading?: boolean;
  onConfirm: (selectedModels: string[]) => void;
  onCancel: () => void;
}

export const ModelSelectModal: React.FC<ModelSelectModalProps> = ({
  open,
  models = [],
  selected = [],
  loading = false,
  onConfirm,
  onCancel
}) => {
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  // 已选中的模型集合
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // 过滤后的模型
  const filteredModels = useMemo(() => {
    return models.filter((m) =>
      String(m || '')
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
  }, [models, keyword]);

  // 分类模型：新获取的模型和已有模型
  const newModels = useMemo(() => {
    return filteredModels.filter((model) => !selectedSet.has(model));
  }, [filteredModels, selectedSet]);

  const existingModels = useMemo(() => {
    return filteredModels.filter((model) => selectedSet.has(model));
  }, [filteredModels, selectedSet]);

  // 按厂商分类
  const newModelsByCategory = useMemo(
    () => categorizeModels(newModels),
    [newModels]
  );
  const existingModelsByCategory = useMemo(
    () => categorizeModels(existingModels),
    [existingModels]
  );

  // 同步外部选中值
  useEffect(() => {
    if (open) {
      setCheckedList([...selected]);
      // 设置默认 tab
      setActiveTab(newModels.length > 0 ? 'new' : 'existing');
    }
  }, [open, selected, newModels.length]);

  const handleConfirm = () => {
    onConfirm(checkedList);
  };

  // 切换单个模型选中状态
  const toggleModel = (model: string) => {
    setCheckedList((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      } else {
        return [...prev, model];
      }
    });
  };

  // 分类全选/取消全选
  const handleCategoryToggle = (
    categoryModels: string[],
    isChecked: boolean
  ) => {
    setCheckedList((prev) => {
      if (isChecked) {
        const newSet = new Set(prev);
        categoryModels.forEach((model) => newSet.add(model));
        return Array.from(newSet);
      } else {
        return prev.filter((model) => !categoryModels.includes(model));
      }
    });
  };

  // 检查分类是否全选
  const isCategoryAllSelected = (categoryModels: string[]) => {
    return (
      categoryModels.length > 0 &&
      categoryModels.every((model) => checkedList.includes(model))
    );
  };

  // 检查分类是否部分选中
  const isCategoryIndeterminate = (categoryModels: string[]) => {
    const selectedCount = categoryModels.filter((model) =>
      checkedList.includes(model)
    ).length;
    return selectedCount > 0 && selectedCount < categoryModels.length;
  };

  // 渲染分类模型列表
  const renderCategoryModels = (
    modelsByCategory: Record<string, { label: string; models: string[] }>,
    keyPrefix: string
  ) => {
    const categoryEntries = Object.entries(modelsByCategory);
    if (categoryEntries.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          暂无模型
        </div>
      );
    }

    return (
      <Accordion type="multiple" defaultValue={categoryEntries.map(([k]) => k)}>
        {categoryEntries.map(([key, categoryData]) => {
          const selectedCount = categoryData.models.filter((m) =>
            checkedList.includes(m)
          ).length;

          return (
            <AccordionItem key={`${keyPrefix}-${key}`} value={key}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isCategoryAllSelected(categoryData.models)}
                      // @ts-ignore
                      indeterminate={isCategoryIndeterminate(
                        categoryData.models
                      )}
                      onCheckedChange={(checked) => {
                        handleCategoryToggle(
                          categoryData.models,
                          checked as boolean
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-medium">
                      {categoryData.label} ({categoryData.models.length})
                    </span>
                  </div>
                  <Badge variant="outline" className="mr-2">
                    已选 {selectedCount}/{categoryData.models.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-3">
                  {categoryData.models.map((model) => (
                    <label
                      key={model}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted"
                    >
                      <Checkbox
                        checked={checkedList.includes(model)}
                        onCheckedChange={() => toggleModel(model)}
                      />
                      <span className="truncate text-sm" title={model}>
                        {model}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  // 当前 tab 的模型
  const currentModels = activeTab === 'new' ? newModels : existingModels;
  const currentSelectedCount = currentModels.filter((m) =>
    checkedList.includes(m)
  ).length;

  // 全选当前 tab
  const handleSelectAllCurrent = (isChecked: boolean) => {
    handleCategoryToggle(currentModels, isChecked);
  };

  const isAllCurrentSelected =
    currentModels.length > 0 &&
    currentModels.every((m) => checkedList.includes(m));
  const isCurrentIndeterminate =
    currentSelectedCount > 0 && currentSelectedCount < currentModels.length;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>选择模型</span>
            <Badge variant="secondary">新获取的模型 ({models.length})</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索模型..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : (
          <>
            {/* Tab 切换 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new" disabled={newModels.length === 0}>
                  新获取的模型 ({newModels.length})
                </TabsTrigger>
                <TabsTrigger
                  value="existing"
                  disabled={existingModels.length === 0}
                >
                  已有的模型 ({existingModels.length})
                </TabsTrigger>
              </TabsList>

              {/* 模型列表 */}
              <div className="max-h-[400px] overflow-y-auto">
                <TabsContent value="new" className="m-0">
                  {renderCategoryModels(newModelsByCategory, 'new')}
                </TabsContent>
                <TabsContent value="existing" className="m-0">
                  {renderCategoryModels(existingModelsByCategory, 'existing')}
                </TabsContent>
              </div>
            </Tabs>

            {/* 底部统计 */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                已选择 {currentSelectedCount} / {currentModels.length}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={isAllCurrentSelected}
                  // @ts-ignore
                  indeterminate={isCurrentIndeterminate}
                  onCheckedChange={(checked) =>
                    handleSelectAllCurrent(checked as boolean)
                  }
                />
                <span className="text-sm">全选当前分类</span>
              </label>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelSelectModal;

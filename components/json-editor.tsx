'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface JSONEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  extraText?: string;
  template?: Record<string, string>;
  templateLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

// 唯一 ID 生成器
let counter = 0;
const generateUniqueId = () => `kv_${counter++}`;

export default function JSONEditor({
  value = '',
  onChange,
  label,
  placeholder,
  extraText,
  template,
  templateLabel = '填入模板',
  keyPlaceholder = '键名（请求的模型）',
  valuePlaceholder = '值（实际发送的模型）'
}: JSONEditorProps) {
  // 将对象转换为键值对数组
  const objectToKeyValueArray = useCallback(
    (obj: Record<string, string>): KeyValuePair[] => {
      if (!obj || typeof obj !== 'object') return [];
      return Object.entries(obj).map(([key, value]) => ({
        id: generateUniqueId(),
        key,
        value: String(value)
      }));
    },
    []
  );

  // 将键值对数组转换为对象
  const keyValueArrayToObject = useCallback(
    (arr: KeyValuePair[]): Record<string, string> => {
      const result: Record<string, string> = {};
      arr.forEach((item) => {
        if (item.key) {
          result[item.key] = item.value;
        }
      });
      return result;
    },
    []
  );

  // 初始化键值对数组
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>(() => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return objectToKeyValueArray(parsed);
      } catch {
        return [];
      }
    }
    return [];
  });

  // 手动模式下的本地文本缓冲
  const [manualText, setManualText] = useState(() => {
    if (typeof value === 'string') return value;
    return '';
  });

  // 编辑模式
  const [editMode, setEditMode] = useState<'visual' | 'manual'>(() => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        const keyCount = Object.keys(parsed).length;
        return keyCount > 10 ? 'manual' : 'visual';
      } catch {
        return 'manual';
      }
    }
    return 'visual';
  });

  const [jsonError, setJsonError] = useState('');

  // 计算重复的键
  const duplicateKeys = useMemo(() => {
    const keyCount: Record<string, number> = {};
    const duplicates = new Set<string>();

    keyValuePairs.forEach((pair) => {
      if (pair.key) {
        keyCount[pair.key] = (keyCount[pair.key] || 0) + 1;
        if (keyCount[pair.key] > 1) {
          duplicates.add(pair.key);
        }
      }
    });

    return duplicates;
  }, [keyValuePairs]);

  // 数据同步 - 当value变化时更新键值对数组
  useEffect(() => {
    try {
      let parsed: Record<string, string> = {};
      if (typeof value === 'string' && value.trim()) {
        parsed = JSON.parse(value);
      }

      const currentObj = keyValueArrayToObject(keyValuePairs);
      if (JSON.stringify(parsed) !== JSON.stringify(currentObj)) {
        setKeyValuePairs(objectToKeyValueArray(parsed));
      }
      setJsonError('');
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      }
    }
  }, [value, keyValueArrayToObject, objectToKeyValueArray, keyValuePairs]);

  // 外部 value 变化时同步手动文本
  useEffect(() => {
    if (editMode !== 'manual') {
      if (typeof value === 'string') setManualText(value);
      else setManualText('');
    }
  }, [value, editMode]);

  // 处理可视化编辑的数据变化
  const handleVisualChange = useCallback(
    (newPairs: KeyValuePair[]) => {
      setKeyValuePairs(newPairs);
      const jsonObject = keyValueArrayToObject(newPairs);
      const jsonString =
        Object.keys(jsonObject).length === 0
          ? ''
          : JSON.stringify(jsonObject, null, 2);

      setJsonError('');
      onChange?.(jsonString);
    },
    [onChange, keyValueArrayToObject]
  );

  // 处理手动编辑的数据变化
  const handleManualChange = useCallback(
    (newValue: string) => {
      setManualText(newValue);
      if (newValue && newValue.trim()) {
        try {
          const parsed = JSON.parse(newValue);
          setKeyValuePairs(objectToKeyValueArray(parsed));
          setJsonError('');
          onChange?.(newValue);
        } catch (error) {
          if (error instanceof Error) {
            setJsonError(error.message);
          }
        }
      } else {
        setKeyValuePairs([]);
        setJsonError('');
        onChange?.('');
      }
    },
    [onChange, objectToKeyValueArray]
  );

  // 切换编辑模式
  const toggleEditMode = useCallback(
    (mode: 'visual' | 'manual') => {
      if (mode === 'manual' && editMode === 'visual') {
        const jsonObject = keyValueArrayToObject(keyValuePairs);
        setManualText(
          Object.keys(jsonObject).length === 0
            ? ''
            : JSON.stringify(jsonObject, null, 2)
        );
        setEditMode('manual');
      } else if (mode === 'visual' && editMode === 'manual') {
        try {
          let parsed: Record<string, string> = {};
          if (manualText && manualText.trim()) {
            parsed = JSON.parse(manualText);
          }
          setKeyValuePairs(objectToKeyValueArray(parsed));
          setJsonError('');
          setEditMode('visual');
        } catch (error) {
          if (error instanceof Error) {
            setJsonError(error.message);
          }
        }
      }
    },
    [
      editMode,
      manualText,
      keyValuePairs,
      keyValueArrayToObject,
      objectToKeyValueArray
    ]
  );

  // 添加键值对
  const addKeyValue = useCallback(() => {
    const newPairs = [...keyValuePairs];
    newPairs.push({
      id: generateUniqueId(),
      key: '',
      value: ''
    });
    handleVisualChange(newPairs);
  }, [keyValuePairs, handleVisualChange]);

  // 删除键值对
  const removeKeyValue = useCallback(
    (id: string) => {
      const newPairs = keyValuePairs.filter((pair) => pair.id !== id);
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange]
  );

  // 更新键名
  const updateKey = useCallback(
    (id: string, newKey: string) => {
      const newPairs = keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, key: newKey } : pair
      );
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange]
  );

  // 更新值
  const updateValue = useCallback(
    (id: string, newValue: string) => {
      const newPairs = keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, value: newValue } : pair
      );
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange]
  );

  // 填入模板
  const fillTemplate = useCallback(() => {
    if (template) {
      const templateString = JSON.stringify(template, null, 2);
      setManualText(templateString);
      setKeyValuePairs(objectToKeyValueArray(template));
      onChange?.(templateString);
      setJsonError('');
    }
  }, [template, onChange, objectToKeyValueArray]);

  return (
    <Card className="rounded-lg border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2 pt-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{label}</span>
          <Tabs
            value={editMode}
            onValueChange={(v) => toggleEditMode(v as 'visual' | 'manual')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="visual" className="px-3 py-1 text-xs">
                可视化
              </TabsTrigger>
              <TabsTrigger value="manual" className="px-3 py-1 text-xs">
                手动编辑
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {template && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fillTemplate}
          >
            {templateLabel}
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* JSON错误提示 */}
        {jsonError && (
          <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            JSON 格式错误: {jsonError}
          </div>
        )}

        {/* 重复键警告 */}
        {duplicateKeys.size > 0 && (
          <div className="mb-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">存在重复的键名：</span>
              <span>{Array.from(duplicateKeys).join(', ')}</span>
            </div>
            <div className="mt-1 text-xs opacity-80">
              注意：JSON中重复的键只会保留最后一个同名键的值
            </div>
          </div>
        )}

        {/* 编辑器内容 */}
        {editMode === 'visual' ? (
          <div className="space-y-2">
            {keyValuePairs.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                暂无数据，点击下方按钮添加键值对
              </div>
            )}

            {keyValuePairs.map((pair) => {
              const isDuplicate = duplicateKeys.has(pair.key);

              return (
                <div key={pair.id} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder={keyPlaceholder}
                      value={pair.key}
                      onChange={(e) => updateKey(pair.id, e.target.value)}
                      className={isDuplicate ? 'border-yellow-500' : ''}
                    />
                    {isDuplicate && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            重复的键名，此值将被后面的同名键覆盖
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder={valuePlaceholder}
                      value={pair.value}
                      onChange={(e) => updateValue(pair.id, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeKeyValue(pair.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyValue}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                添加键值对
              </Button>
            </div>
          </div>
        ) : (
          <Textarea
            placeholder={placeholder}
            value={manualText}
            onChange={(e) => handleManualChange(e.target.value)}
            className="min-h-32 font-mono text-sm"
          />
        )}

        {/* 额外说明文字 */}
        {extraText && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {extraText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

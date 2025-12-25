'use client';
import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  RefreshCcw,
  Copy
} from 'lucide-react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: '系统设置', link: '/dashboard/setting' },
  { title: '模型定价设置', link: '/dashboard/setting/pricing' }
];

interface Option {
  key: string;
  value: any;
}

interface ModelPriceInfo {
  model_name: string;
  model_ratio: number;
  completion_ratio: number;
  fixed_price: number;
  input_price: number;
  output_price: number;
  price_type: string;
  has_ratio: boolean;
}

interface EditingRow {
  model_name: string;
  model_ratio: string;
  completion_ratio: string;
  fixed_price: string;
}

// 未设置倍率模型的编辑数据
interface UnsetModelEditData {
  // 价格输入（$/1M tokens）
  input_price: string; // 文字输入价格
  output_price: string; // 文字输出价格
  image_input_price: string; // 图片输入价格
  image_output_price: string; // 图片输出价格
  audio_input_price: string; // 音频输入价格
  audio_output_price: string; // 音频输出价格
  // 计算后的倍率
  model_ratio: string;
  completion_ratio: string;
  image_input_ratio: string;
  image_output_ratio: string;
  audio_input_ratio: string;
  audio_output_ratio: string;
}

// 视频定价规则
interface VideoPricingRule {
  model: string; // 模型名或通配符
  type: string; // 类型: image-to-video, text-to-video, *
  mode: string; // 模式: standard, professional, *
  duration: string; // 时长: 5, 10, 15, *
  resolution: string; // 分辨率: 480P, 720P, 1080P, *
  pricing_type: string; // per_second 或 fixed
  price: number; // 价格
  currency: string; // 货币: USD, CNY
  priority: number; // 优先级
}

// 价格转倍率的换算函数
// 所有倍率都是相对于"文字输入价格"来计算的
// ModelRatio = 文字输入价格($/1M tokens) / 2
// CompletionRatio = 文字输出价格 / 文字输入价格
// AudioInputRatio = 音频输入价格 / 文字输入价格
// AudioOutputRatio = 音频输出价格 / 文字输入价格
// ImageInputRatio = 图片输入价格 / 文字输入价格
// ImageOutputRatio = 图片输出价格 / 文字输入价格
const priceToModelRatio = (inputPrice: number): number => {
  return inputPrice / 2;
};

const priceToRatio = (price: number, baseInputPrice: number): number => {
  if (baseInputPrice === 0) return 1;
  return price / baseInputPrice;
};

export default function PricingPage() {
  // ==================== 模型倍率设置状态 ====================
  const [perCallPricing, setPerCallPricing] = useState('');
  const [modelRatio, setModelRatio] = useState('');
  const [completionRatio, setCompletionRatio] = useState('');
  const [audioInputRatio, setAudioInputRatio] = useState('');
  const [audioOutputRatio, setAudioOutputRatio] = useState('');
  const [imageInputRatio, setImageInputRatio] = useState('');
  const [imageOutputRatio, setImageOutputRatio] = useState('');

  // ==================== 可视化倍率设置状态 ====================
  const [configuredModels, setConfiguredModels] = useState<ModelPriceInfo[]>(
    []
  );
  const [configuredTotal, setConfiguredTotal] = useState(0);
  const [configuredPage, setConfiguredPage] = useState(1);
  const [configuredPageSize, setConfiguredPageSize] = useState(20);
  const [configuredKeyword, setConfiguredKeyword] = useState('');

  // ==================== 未设置倍率模型状态 ====================
  const [unsetModels, setUnsetModels] = useState<ModelPriceInfo[]>([]);
  const [unsetTotal, setUnsetTotal] = useState(0);
  const [unsetPage, setUnsetPage] = useState(1);
  const [unsetPageSize, setUnsetPageSize] = useState(10);
  const [unsetKeyword, setUnsetKeyword] = useState('');
  // 未设置模型的编辑数据
  const [unsetEditData, setUnsetEditData] = useState<
    Record<string, UnsetModelEditData>
  >({});

  // ==================== 视频模型定价状态 ====================
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  // 视频定价规则列表（直接编辑规则，不按模型展示）
  const [videoPricingRules, setVideoPricingRules] = useState<
    VideoPricingRule[]
  >([]);
  // 搜索关键字
  const [videoRuleKeyword, setVideoRuleKeyword] = useState('');

  // ==================== 加载状态 ====================
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isConfiguredLoading, setIsConfiguredLoading] = useState(true);
  const [isUnsetLoading, setIsUnsetLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== 编辑状态 ====================
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  // ==================== 默认值 ====================
  const defaultPerCallPricing = `{}`;
  const defaultModelRatio = `{}`;
  const defaultCompletionRatio = `{}`;

  // 格式化JSON字符串
  const formatJSON = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  const validateJSON = (jsonString: string, fieldName: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      toast.error(`${fieldName} JSON格式错误，请检查语法`);
      return false;
    }
  };

  // ==================== 获取模型倍率设置数据 ====================
  const fetchPricingOptions = async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch('/api/option');
      if (!response.ok) throw new Error('Failed to fetch pricing options');
      const result = await response.json();
      if (result.success && result.data) {
        const options = result.data;

        const perCallOption = options.find(
          (o: Option) => o.key === 'PerCallPricing'
        );
        setPerCallPricing(
          formatJSON(perCallOption?.value) || defaultPerCallPricing
        );

        const modelRatioOption = options.find(
          (o: Option) => o.key === 'ModelRatio'
        );
        setModelRatio(formatJSON(modelRatioOption?.value) || defaultModelRatio);

        const completionOption = options.find(
          (o: Option) => o.key === 'CompletionRatio'
        );
        setCompletionRatio(
          formatJSON(completionOption?.value) || defaultCompletionRatio
        );

        const audioInputOption = options.find(
          (o: Option) => o.key === 'AudioInputRatio'
        );
        setAudioInputRatio(formatJSON(audioInputOption?.value) || '{}');

        const audioOutputOption = options.find(
          (o: Option) => o.key === 'AudioOutputRatio'
        );
        setAudioOutputRatio(formatJSON(audioOutputOption?.value) || '{}');

        const imageInputOption = options.find(
          (o: Option) => o.key === 'ImageInputRatio'
        );
        setImageInputRatio(formatJSON(imageInputOption?.value) || '{}');

        const imageOutputOption = options.find(
          (o: Option) => o.key === 'ImageOutputRatio'
        );
        setImageOutputRatio(formatJSON(imageOutputOption?.value) || '{}');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load pricing settings'
      );
    } finally {
      setIsDataLoading(false);
    }
  };

  // ==================== 获取已配置倍率的模型 ====================
  const fetchConfiguredModels = useCallback(async () => {
    try {
      setIsConfiguredLoading(true);
      const params = new URLSearchParams({
        page: configuredPage.toString(),
        pagesize: configuredPageSize.toString(),
        keyword: configuredKeyword
      });
      const response = await fetch(`/api/pricing/models?${params}`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const result = await response.json();
      if (result.success) {
        setConfiguredModels(result.data.list || []);
        setConfiguredTotal(result.data.total || 0);
      }
    } catch (error) {
      console.error('Fetch configured models error:', error);
    } finally {
      setIsConfiguredLoading(false);
    }
  }, [configuredPage, configuredPageSize, configuredKeyword]);

  // ==================== 获取未配置倍率的模型 ====================
  const fetchUnsetModels = useCallback(async () => {
    try {
      setIsUnsetLoading(true);
      const params = new URLSearchParams({
        page: unsetPage.toString(),
        pagesize: unsetPageSize.toString(),
        keyword: unsetKeyword
      });
      const response = await fetch(`/api/pricing/unset?${params}`);
      if (!response.ok) throw new Error('Failed to fetch unset models');
      const result = await response.json();
      if (result.success) {
        setUnsetModels(result.data.list || []);
        setUnsetTotal(result.data.total || 0);
        // 初始化编辑数据
        const editData: Record<string, UnsetModelEditData> = {};
        (result.data.list || []).forEach((m: ModelPriceInfo) => {
          editData[m.model_name] = {
            input_price: '',
            output_price: '',
            image_input_price: '',
            image_output_price: '',
            audio_input_price: '',
            audio_output_price: '',
            model_ratio: '',
            completion_ratio: '',
            image_input_ratio: '',
            image_output_ratio: '',
            audio_input_ratio: '',
            audio_output_ratio: ''
          };
        });
        setUnsetEditData(editData);
      }
    } catch (error) {
      console.error('Fetch unset models error:', error);
    } finally {
      setIsUnsetLoading(false);
    }
  }, [unsetPage, unsetPageSize, unsetKeyword]);

  // ==================== 获取视频定价规则 ====================
  const fetchVideoPricingRules = useCallback(async () => {
    try {
      setIsVideoLoading(true);
      // 从所有 options 中获取 VideoPricingRules
      const response = await fetch('/api/option/');
      if (!response.ok) {
        setVideoPricingRules([]);
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // 后端返回的是数组格式 [{key: "xxx", value: "xxx"}, ...]
        const videoPricingOption = result.data.find(
          (opt: { key: string; value: string }) =>
            opt.key === 'VideoPricingRules'
        );
        if (videoPricingOption && videoPricingOption.value) {
          try {
            const rules = JSON.parse(videoPricingOption.value);
            if (Array.isArray(rules)) {
              setVideoPricingRules(rules);
            } else {
              setVideoPricingRules([]);
            }
          } catch (e) {
            console.error('Parse video pricing rules error:', e);
            setVideoPricingRules([]);
          }
        } else {
          setVideoPricingRules([]);
        }
      }
    } catch (error) {
      console.error('Fetch video pricing rules error:', error);
      setVideoPricingRules([]);
    } finally {
      setIsVideoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricingOptions();
    fetchVideoPricingRules();
  }, []);

  useEffect(() => {
    fetchConfiguredModels();
  }, [fetchConfiguredModels]);

  useEffect(() => {
    fetchUnsetModels();
  }, [fetchUnsetModels]);

  // ==================== 保存模型倍率设置 ====================
  const handleSaveRatioSettings = async () => {
    setIsLoading(true);
    try {
      // 验证JSON格式
      if (
        !validateJSON(perCallPricing, '模型固定价格') ||
        !validateJSON(modelRatio, '模型倍率') ||
        !validateJSON(completionRatio, '模型补全倍率') ||
        !validateJSON(audioInputRatio, '音频输入倍率') ||
        !validateJSON(audioOutputRatio, '音频输出倍率') ||
        !validateJSON(imageInputRatio, '图片输入倍率') ||
        !validateJSON(imageOutputRatio, '图片输出倍率')
      ) {
        setIsLoading(false);
        return;
      }

      const saveOption = async (key: string, value: string) => {
        const response = await fetch('/api/option', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
        if (!response.ok) throw new Error(`Failed to save ${key}`);
      };

      await saveOption('PerCallPricing', perCallPricing);
      await saveOption('ModelRatio', modelRatio);
      await saveOption('CompletionRatio', completionRatio);
      await saveOption('AudioInputRatio', audioInputRatio);
      await saveOption('AudioOutputRatio', audioOutputRatio);
      await saveOption('ImageInputRatio', imageInputRatio);
      await saveOption('ImageOutputRatio', imageOutputRatio);

      toast.success('模型倍率设置保存成功！');
      fetchConfiguredModels();
      fetchUnsetModels();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 可视化编辑相关 ====================
  const startEditing = (model: ModelPriceInfo) => {
    setEditingRow({
      model_name: model.model_name,
      model_ratio: model.model_ratio.toString(),
      completion_ratio: model.completion_ratio.toString(),
      fixed_price: model.fixed_price.toString()
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
  };

  const saveEditing = async () => {
    if (!editingRow) return;

    try {
      setIsLoading(true);
      const payload: any = { model_name: editingRow.model_name };

      if (editingRow.model_ratio) {
        payload.model_ratio = parseFloat(editingRow.model_ratio);
      }
      if (editingRow.completion_ratio) {
        payload.completion_ratio = parseFloat(editingRow.completion_ratio);
      }
      if (editingRow.fixed_price && parseFloat(editingRow.fixed_price) > 0) {
        payload.fixed_price = parseFloat(editingRow.fixed_price);
      }

      const response = await fetch('/api/pricing/model', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('保存成功');
        setEditingRow(null);
        fetchConfiguredModels();
        fetchUnsetModels();
        fetchPricingOptions();
      } else {
        toast.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新未设置模型的编辑数据
  const updateUnsetEditData = (
    modelName: string,
    field: keyof UnsetModelEditData,
    value: string
  ) => {
    setUnsetEditData((prev) => {
      const currentData = prev[modelName] || {
        input_price: '',
        output_price: '',
        image_input_price: '',
        image_output_price: '',
        audio_input_price: '',
        audio_output_price: '',
        model_ratio: '',
        completion_ratio: '',
        image_input_ratio: '',
        image_output_ratio: '',
        audio_input_ratio: '',
        audio_output_ratio: ''
      };

      const newData = { ...currentData, [field]: value };

      // 获取文字输入价格（基准价格）
      const baseInputPrice = parseFloat(newData.input_price) || 0;

      // 辅助函数：格式化倍率
      const formatRatio = (ratio: number): string => {
        if (ratio === 0) return '';
        // 如果是整数或接近整数，显示整数
        if (Math.abs(ratio - Math.round(ratio)) < 0.0001) {
          return Math.round(ratio).toString();
        }
        // 否则保留合适的小数位
        return parseFloat(ratio.toFixed(6)).toString();
      };

      // 当文字输入价格变化时，重新计算所有倍率
      if (field === 'input_price') {
        const inputPrice = parseFloat(value);
        if (!isNaN(inputPrice) && inputPrice > 0) {
          // 模型倍率 = 文字输入价格 / 2
          newData.model_ratio = formatRatio(priceToModelRatio(inputPrice));

          // 补全倍率 = 文字输出价格 / 文字输入价格
          const outputPrice = parseFloat(newData.output_price);
          if (!isNaN(outputPrice) && outputPrice > 0) {
            newData.completion_ratio = formatRatio(
              priceToRatio(outputPrice, inputPrice)
            );
          }

          // 图片输入倍率 = 图片输入价格 / 文字输入价格
          const imageInputPrice = parseFloat(newData.image_input_price);
          if (!isNaN(imageInputPrice) && imageInputPrice > 0) {
            newData.image_input_ratio = formatRatio(
              priceToRatio(imageInputPrice, inputPrice)
            );
          }

          // 图片输出倍率 = 图片输出价格 / 文字输入价格
          const imageOutputPrice = parseFloat(newData.image_output_price);
          if (!isNaN(imageOutputPrice) && imageOutputPrice > 0) {
            newData.image_output_ratio = formatRatio(
              priceToRatio(imageOutputPrice, inputPrice)
            );
          }

          // 音频输入倍率 = 音频输入价格 / 文字输入价格
          const audioInputPrice = parseFloat(newData.audio_input_price);
          if (!isNaN(audioInputPrice) && audioInputPrice > 0) {
            newData.audio_input_ratio = formatRatio(
              priceToRatio(audioInputPrice, inputPrice)
            );
          }

          // 音频输出倍率 = 音频输出价格 / 文字输入价格
          const audioOutputPrice = parseFloat(newData.audio_output_price);
          if (!isNaN(audioOutputPrice) && audioOutputPrice > 0) {
            newData.audio_output_ratio = formatRatio(
              priceToRatio(audioOutputPrice, inputPrice)
            );
          }
        } else {
          // 如果文字输入价格无效，清空所有自动计算的倍率
          newData.model_ratio = '';
        }
      }

      // 当文字输出价格变化时，计算补全倍率
      if (field === 'output_price' && baseInputPrice > 0) {
        const outputPrice = parseFloat(value);
        if (!isNaN(outputPrice) && outputPrice > 0) {
          newData.completion_ratio = formatRatio(
            priceToRatio(outputPrice, baseInputPrice)
          );
        } else {
          newData.completion_ratio = '';
        }
      }

      // 当图片输入价格变化时，计算图片输入倍率
      if (field === 'image_input_price' && baseInputPrice > 0) {
        const imageInputPrice = parseFloat(value);
        if (!isNaN(imageInputPrice) && imageInputPrice > 0) {
          newData.image_input_ratio = formatRatio(
            priceToRatio(imageInputPrice, baseInputPrice)
          );
        } else {
          newData.image_input_ratio = '';
        }
      }

      // 当图片输出价格变化时，计算图片输出倍率
      if (field === 'image_output_price' && baseInputPrice > 0) {
        const imageOutputPrice = parseFloat(value);
        if (!isNaN(imageOutputPrice) && imageOutputPrice > 0) {
          newData.image_output_ratio = formatRatio(
            priceToRatio(imageOutputPrice, baseInputPrice)
          );
        } else {
          newData.image_output_ratio = '';
        }
      }

      // 当音频输入价格变化时，计算音频输入倍率
      if (field === 'audio_input_price' && baseInputPrice > 0) {
        const audioInputPrice = parseFloat(value);
        if (!isNaN(audioInputPrice) && audioInputPrice > 0) {
          newData.audio_input_ratio = formatRatio(
            priceToRatio(audioInputPrice, baseInputPrice)
          );
        } else {
          newData.audio_input_ratio = '';
        }
      }

      // 当音频输出价格变化时，计算音频输出倍率
      if (field === 'audio_output_price' && baseInputPrice > 0) {
        const audioOutputPrice = parseFloat(value);
        if (!isNaN(audioOutputPrice) && audioOutputPrice > 0) {
          newData.audio_output_ratio = formatRatio(
            priceToRatio(audioOutputPrice, baseInputPrice)
          );
        } else {
          newData.audio_output_ratio = '';
        }
      }

      return {
        ...prev,
        [modelName]: newData
      };
    });
  };

  // 保存所有已填写数据的未配置模型
  const saveAllUnsetModels = async () => {
    // 找出所有已填写模型倍率的模型
    const modelsToSave = Object.entries(unsetEditData)
      .filter(([_, data]) => data.model_ratio || data.completion_ratio)
      .map(([modelName, editData]) => {
        const modelData: any = {
          model_name: modelName,
          model_ratio: editData.model_ratio
            ? parseFloat(editData.model_ratio)
            : 1,
          completion_ratio: editData.completion_ratio
            ? parseFloat(editData.completion_ratio)
            : 1
        };

        if (editData.image_input_ratio) {
          modelData.image_input_ratio = parseFloat(editData.image_input_ratio);
        }
        if (editData.image_output_ratio) {
          modelData.image_output_ratio = parseFloat(
            editData.image_output_ratio
          );
        }
        if (editData.audio_input_ratio) {
          modelData.audio_input_ratio = parseFloat(editData.audio_input_ratio);
        }
        if (editData.audio_output_ratio) {
          modelData.audio_output_ratio = parseFloat(
            editData.audio_output_ratio
          );
        }

        return modelData;
      });

    if (modelsToSave.length === 0) {
      toast.error('请至少填写一个模型的倍率');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/pricing/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: modelsToSave })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`成功配置 ${modelsToSave.length} 个模型`);
        setSelectedModels(new Set());
        fetchConfiguredModels();
        fetchUnsetModels();
        fetchPricingOptions();
      } else {
        toast.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 批量设置选中模型的默认倍率（1.0）
  const batchSetDefaultRatio = async () => {
    if (selectedModels.size === 0) {
      toast.error('请先选择要配置的模型');
      return;
    }

    try {
      setIsLoading(true);
      const models = Array.from(selectedModels).map((modelName) => ({
        model_name: modelName,
        model_ratio: 1,
        completion_ratio: 1
      }));

      const response = await fetch('/api/pricing/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`成功配置 ${selectedModels.size} 个模型为默认倍率`);
        setSelectedModels(new Set());
        fetchConfiguredModels();
        fetchUnsetModels();
        fetchPricingOptions();
      } else {
        toast.error(result.message || '批量保存失败');
      }
    } catch (error) {
      console.error('Batch save error:', error);
      toast.error('批量保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算已填写数据的模型数量
  const filledModelsCount = Object.values(unsetEditData).filter(
    (data) => data.model_ratio || data.completion_ratio
  ).length;

  // ==================== 视频定价相关函数 ====================
  // 添加新规则
  const addVideoRule = () => {
    const newRule: VideoPricingRule = {
      model: '',
      type: '*',
      mode: '*',
      duration: '*',
      resolution: '*',
      pricing_type: 'fixed',
      price: 0,
      currency: 'USD',
      priority: 10
    };
    setVideoPricingRules([...videoPricingRules, newRule]);
  };

  // 复制规则
  const duplicateVideoRule = (index: number) => {
    const ruleToCopy = videoPricingRules[index];
    const newRule: VideoPricingRule = { ...ruleToCopy };
    // 插入到原规则后面
    const newRules = [...videoPricingRules];
    newRules.splice(index + 1, 0, newRule);
    setVideoPricingRules(newRules);
  };

  // 更新规则
  const updateVideoRule = (
    index: number,
    field: keyof VideoPricingRule,
    value: string | number
  ) => {
    const newRules = [...videoPricingRules];
    if (field === 'price' || field === 'priority') {
      newRules[index] = { ...newRules[index], [field]: Number(value) || 0 };
    } else {
      newRules[index] = { ...newRules[index], [field]: value };
    }
    setVideoPricingRules(newRules);
  };

  // 删除规则
  const deleteVideoRule = (index: number) => {
    const newRules = videoPricingRules.filter((_, i) => i !== index);
    setVideoPricingRules(newRules);
  };

  // 过滤显示的规则（按关键字搜索）
  const filteredVideoRules = videoPricingRules.filter(
    (rule) =>
      !videoRuleKeyword ||
      rule.model.toLowerCase().includes(videoRuleKeyword.toLowerCase())
  );

  // 保存视频定价规则
  const saveVideoPricingRules = async () => {
    try {
      setIsLoading(true);

      // 过滤掉没有填写模型名的规则
      const validRules = videoPricingRules.filter(
        (r) => r.model && r.model.trim() !== ''
      );

      // 保存到后端
      const response = await fetch('/api/option/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'VideoPricingRules',
          value: JSON.stringify(validRules)
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`成功保存 ${validRules.length} 条视频定价规则`);
        setVideoPricingRules(validRules);
      } else {
        toast.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('Save video pricing error:', error);
      toast.error('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 分页组件 ====================
  const renderPagination = (
    page: number,
    pageSize: number,
    total: number,
    setPage: (p: number) => void,
    setPageSize: (s: number) => void
  ) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          显示第 {Math.min((page - 1) * pageSize + 1, total)} 条-第{' '}
          {Math.min(page * pageSize, total)} 条，共 {total} 条
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">每页条数:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(parseInt(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '-';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  if (error)
    return <div className="p-4 text-red-500">加载价格设置失败: {error}</div>;
  if (isDataLoading) return <div className="p-4">加载中...</div>;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">模型定价设置</h2>
        </div>
        <Separator />

        <Tabs defaultValue="ratio-settings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:inline-flex lg:w-auto">
            <TabsTrigger value="ratio-settings">模型倍率设置</TabsTrigger>
            <TabsTrigger value="visual-pricing">可视化倍率设置</TabsTrigger>
            <TabsTrigger value="unset-models">未设置倍率模型</TabsTrigger>
            <TabsTrigger value="video-pricing">视频模型定价</TabsTrigger>
          </TabsList>

          {/* ==================== 模型倍率设置 Tab ==================== */}
          <TabsContent value="ratio-settings" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleSaveRatioSettings} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? '保存中...' : '保存设置'}
              </Button>
            </div>

            {/* 模型固定价格 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">模型固定价格</Label>
              <Textarea
                value={perCallPricing}
                onChange={(e) => setPerCallPricing(e.target.value)}
                placeholder="{}"
                className="h-32 font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                一次调用消耗多少刀，优先级大于模型倍率
              </p>
            </div>

            {/* 模型倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">模型倍率</Label>
              <Textarea
                value={modelRatio}
                onChange={(e) => setModelRatio(e.target.value)}
                placeholder="{}"
                className="h-60 font-mono text-sm"
              />
            </div>

            {/* 提示缓存倍率 - 暂时留空 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">提示缓存倍率</Label>
              <Textarea
                value="{}"
                disabled
                placeholder="{}"
                className="h-32 bg-muted font-mono text-sm"
              />
            </div>

            {/* 模型补全倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                模型补全倍率（仅对自定义模型有效）
              </Label>
              <Textarea
                value={completionRatio}
                onChange={(e) => setCompletionRatio(e.target.value)}
                placeholder="{}"
                className="h-60 font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                仅对自定义模型有效
              </p>
            </div>

            {/* 图片输入倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                图片输入倍率（仅部分模型支持该计费）
              </Label>
              <Textarea
                value={imageInputRatio}
                onChange={(e) => setImageInputRatio(e.target.value)}
                placeholder="{}"
                className="h-32 font-mono text-sm"
              />
            </div>

            {/* 图片输出倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                图片输出倍率（仅部分模型支持该计费）
              </Label>
              <Textarea
                value={imageOutputRatio}
                onChange={(e) => setImageOutputRatio(e.target.value)}
                placeholder="{}"
                className="h-32 font-mono text-sm"
              />
            </div>

            {/* 音频输入倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                音频输入倍率（仅部分模型支持该计费）
              </Label>
              <Textarea
                value={audioInputRatio}
                onChange={(e) => setAudioInputRatio(e.target.value)}
                placeholder="{}"
                className="h-32 font-mono text-sm"
              />
            </div>

            {/* 音频输出倍率 */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                音频输出倍率（仅部分模型支持该计费）
              </Label>
              <Textarea
                value={audioOutputRatio}
                onChange={(e) => setAudioOutputRatio(e.target.value)}
                placeholder="{}"
                className="h-32 font-mono text-sm"
              />
            </div>
          </TabsContent>

          {/* ==================== 可视化倍率设置 Tab ==================== */}
          <TabsContent value="visual-pricing" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索模型名称..."
                  value={configuredKeyword}
                  onChange={(e) => {
                    setConfiguredKeyword(e.target.value);
                    setConfiguredPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  fetchConfiguredModels();
                  fetchPricingOptions();
                }}
                disabled={isLoading}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">模型名称</TableHead>
                    <TableHead className="w-[100px]">模型倍率</TableHead>
                    <TableHead className="w-[100px]">补全倍率</TableHead>
                    <TableHead className="w-[120px]">按次计费(元)</TableHead>
                    <TableHead className="w-[130px]">输入价格($/1M)</TableHead>
                    <TableHead className="w-[130px]">输出价格($/1M)</TableHead>
                    <TableHead className="w-[100px]">计费类型</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isConfiguredLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : configuredModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    configuredModels.map((model) => (
                      <TableRow key={model.model_name}>
                        <TableCell className="font-mono text-xs">
                          {model.model_name}
                        </TableCell>
                        <TableCell>
                          {editingRow?.model_name === model.model_name ? (
                            <Input
                              type="number"
                              step="0.001"
                              value={editingRow.model_ratio}
                              onChange={(e) =>
                                setEditingRow({
                                  ...editingRow,
                                  model_ratio: e.target.value
                                })
                              }
                              className="h-8 w-20"
                            />
                          ) : (
                            formatPrice(model.model_ratio)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRow?.model_name === model.model_name ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editingRow.completion_ratio}
                              onChange={(e) =>
                                setEditingRow({
                                  ...editingRow,
                                  completion_ratio: e.target.value
                                })
                              }
                              className="h-8 w-20"
                            />
                          ) : (
                            formatPrice(model.completion_ratio)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRow?.model_name === model.model_name ? (
                            <Input
                              type="number"
                              step="0.001"
                              value={editingRow.fixed_price}
                              onChange={(e) =>
                                setEditingRow({
                                  ...editingRow,
                                  fixed_price: e.target.value
                                })
                              }
                              className="h-8 w-24"
                            />
                          ) : model.fixed_price > 0 ? (
                            formatPrice(model.fixed_price)
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {model.input_price > 0
                            ? `$${formatPrice(model.input_price)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {model.output_price > 0
                            ? `$${formatPrice(model.output_price)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              model.price_type === 'fixed'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}
                          >
                            {model.price_type === 'fixed'
                              ? '按次计费'
                              : '按量计费'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingRow?.model_name === model.model_name ? (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={saveEditing}
                                disabled={isLoading}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditing(model)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {renderPagination(
              configuredPage,
              configuredPageSize,
              configuredTotal,
              setConfiguredPage,
              setConfiguredPageSize
            )}
          </TabsContent>

          {/* ==================== 未设置倍率模型 Tab ==================== */}
          <TabsContent value="unset-models" className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 提示：</strong>直接输入模型的官方价格（$/1M
                tokens），系统将自动换算成倍率。所有倍率都相对于文字输入价格计算。
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-600 dark:text-blue-400 md:grid-cols-3">
                <span>• 模型倍率 = 文字输入价格 / 2</span>
                <span>• 补全倍率 = 文字输出价格 / 文字输入价格</span>
                <span>• 图片输入倍率 = 图片输入价格 / 文字输入价格</span>
                <span>• 图片输出倍率 = 图片输出价格 / 文字输入价格</span>
                <span>• 音频输入倍率 = 音频输入价格 / 文字输入价格</span>
                <span>• 音频输出倍率 = 音频输出价格 / 文字输入价格</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              此页面仅显示未设置默认价格或倍率的模型。设置后将自动从列表中移除。
            </p>

            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索模型名称..."
                  value={unsetKeyword}
                  onChange={(e) => {
                    setUnsetKeyword(e.target.value);
                    setUnsetPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={batchSetDefaultRatio}
                  disabled={isLoading || selectedModels.size === 0}
                >
                  批量设为1.0 ({selectedModels.size})
                </Button>
                <Button
                  onClick={saveAllUnsetModels}
                  disabled={isLoading || filledModelsCount === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  保存已填写 ({filledModelsCount})
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table className="w-full min-w-[1400px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 px-1">
                      <Checkbox
                        checked={
                          unsetModels.length > 0 &&
                          unsetModels.every((m) =>
                            selectedModels.has(m.model_name)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedModels(
                              new Set(unsetModels.map((m) => m.model_name))
                            );
                          } else {
                            setSelectedModels(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[160px] px-1">模型名称</TableHead>
                    <TableHead
                      colSpan={6}
                      className="border-l bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30"
                    >
                      价格输入 ($/1M tokens)
                    </TableHead>
                    <TableHead
                      colSpan={6}
                      className="border-l bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30"
                    >
                      倍率（自动计算）
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="w-8 px-1"></TableHead>
                    <TableHead className="w-[160px] px-1"></TableHead>
                    <TableHead className="w-[70px] border-l bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      文字输入
                    </TableHead>
                    <TableHead className="w-[70px] bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      文字输出
                    </TableHead>
                    <TableHead className="w-[70px] bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      图片输入
                    </TableHead>
                    <TableHead className="w-[70px] bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      图片输出
                    </TableHead>
                    <TableHead className="w-[70px] bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      音频输入
                    </TableHead>
                    <TableHead className="w-[70px] bg-blue-50/50 px-1 text-center text-xs dark:bg-blue-950/30">
                      音频输出
                    </TableHead>
                    <TableHead className="w-[65px] border-l bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      模型
                    </TableHead>
                    <TableHead className="w-[65px] bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      补全
                    </TableHead>
                    <TableHead className="w-[65px] bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      图片入
                    </TableHead>
                    <TableHead className="w-[65px] bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      图片出
                    </TableHead>
                    <TableHead className="w-[65px] bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      音频入
                    </TableHead>
                    <TableHead className="w-[65px] bg-green-50/50 px-1 text-center text-xs dark:bg-green-950/30">
                      音频出
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUnsetLoading ? (
                    <TableRow>
                      <TableCell colSpan={14} className="h-24 text-center">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : unsetModels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="h-24 text-center">
                        🎉 太棒了！所有模型都已配置倍率
                      </TableCell>
                    </TableRow>
                  ) : (
                    unsetModels.map((model) => (
                      <TableRow key={model.model_name}>
                        <TableCell className="px-1">
                          <Checkbox
                            checked={selectedModels.has(model.model_name)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedModels);
                              if (checked) {
                                newSet.add(model.model_name);
                              } else {
                                newSet.delete(model.model_name);
                              }
                              setSelectedModels(newSet);
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className="truncate px-1 font-mono text-xs"
                          title={model.model_name}
                        >
                          {model.model_name}
                        </TableCell>
                        {/* 价格输入区域 */}
                        <TableCell className="border-l bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="0.1"
                            value={
                              unsetEditData[model.model_name]?.input_price || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'input_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="0.4"
                            value={
                              unsetEditData[model.model_name]?.output_price ||
                              ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'output_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="-"
                            value={
                              unsetEditData[model.model_name]
                                ?.image_input_price || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'image_input_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="-"
                            value={
                              unsetEditData[model.model_name]
                                ?.image_output_price || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'image_output_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="-"
                            value={
                              unsetEditData[model.model_name]
                                ?.audio_input_price || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'audio_input_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-blue-50/30 px-0.5 dark:bg-blue-950/20">
                          <Input
                            type="text"
                            placeholder="-"
                            value={
                              unsetEditData[model.model_name]
                                ?.audio_output_price || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'audio_output_price',
                                e.target.value
                              )
                            }
                            className="h-7 px-1 text-center text-xs"
                          />
                        </TableCell>
                        {/* 倍率显示区域（自动计算，也可手动修改） */}
                        <TableCell className="border-l bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]?.model_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'model_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]
                                ?.completion_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'completion_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]
                                ?.image_input_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'image_input_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]
                                ?.image_output_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'image_output_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]
                                ?.audio_input_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'audio_input_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                        <TableCell className="bg-green-50/30 px-0.5 dark:bg-green-950/20">
                          <Input
                            type="text"
                            placeholder="自动"
                            value={
                              unsetEditData[model.model_name]
                                ?.audio_output_ratio || ''
                            }
                            onChange={(e) =>
                              updateUnsetEditData(
                                model.model_name,
                                'audio_output_ratio',
                                e.target.value
                              )
                            }
                            className="h-7 bg-muted/30 px-1 text-center text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {renderPagination(
              unsetPage,
              unsetPageSize,
              unsetTotal,
              setUnsetPage,
              setUnsetPageSize
            )}
          </TabsContent>

          {/* ==================== 视频模型定价 Tab ==================== */}
          <TabsContent value="video-pricing" className="space-y-4">
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>💡 提示：</strong>配置视频生成模型的定价规则。
                同一模型可以有多条规则（不同的 type/mode/duration/resolution
                组合）。
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-purple-700 dark:text-purple-300">
                <li>
                  <strong>通配符 *</strong>：匹配任意值（包括空值）
                </li>
                <li>
                  <strong>前缀通配符 wan*</strong>：匹配以 wan 开头的所有模型
                </li>
                <li>
                  <strong>per_second</strong>：按秒计费，最终价格 = 价格 ×
                  视频时长
                </li>
                <li>
                  <strong>fixed</strong>：固定价格，不论时长都按此价格计费
                </li>
                <li>
                  <strong>priority</strong>
                  ：优先级越高越优先匹配，精确规则应设置更高优先级（如20），兜底规则设置低优先级（如5）
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索模型名称..."
                    value={videoRuleKeyword}
                    onChange={(e) => setVideoRuleKeyword(e.target.value)}
                    className="w-64 pl-10"
                  />
                </div>
                <Button variant="outline" onClick={addVideoRule}>
                  + 添加规则
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  共 {videoPricingRules.length} 条规则
                </span>
                <Button onClick={saveVideoPricingRules} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? '保存中...' : '保存规则'}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table className="w-full min-w-[1300px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">模型 (model)</TableHead>
                    <TableHead className="w-[100px]">类型 (type)</TableHead>
                    <TableHead className="w-[100px]">模式 (mode)</TableHead>
                    <TableHead className="w-[90px]">时长 (duration)</TableHead>
                    <TableHead className="w-[100px]">分辨率</TableHead>
                    <TableHead className="w-[110px]">计费类型</TableHead>
                    <TableHead className="w-[90px]">价格</TableHead>
                    <TableHead className="w-[80px]">货币</TableHead>
                    <TableHead className="w-[70px]">优先级</TableHead>
                    <TableHead className="w-[90px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isVideoLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-10 text-center">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredVideoRules.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-10 text-center text-muted-foreground"
                      >
                        暂无定价规则，点击"添加规则"创建
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVideoRules.map((rule, index) => {
                      // 找到原始索引（用于更新和删除）
                      const originalIndex = videoPricingRules.indexOf(rule);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={rule.model}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'model',
                                  e.target.value
                                )
                              }
                              placeholder="wan* 或 kling-v1"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rule.type}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'type',
                                  e.target.value
                                )
                              }
                              placeholder="*"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rule.mode}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'mode',
                                  e.target.value
                                )
                              }
                              placeholder="*"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rule.duration}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'duration',
                                  e.target.value
                                )
                              }
                              placeholder="*"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={rule.resolution}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'resolution',
                                  e.target.value
                                )
                              }
                              placeholder="*"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={rule.pricing_type}
                              onValueChange={(value) =>
                                updateVideoRule(
                                  originalIndex,
                                  'pricing_type',
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">fixed</SelectItem>
                                <SelectItem value="per_second">
                                  per_second
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={rule.price}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'price',
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={rule.currency}
                              onValueChange={(value) =>
                                updateVideoRule(
                                  originalIndex,
                                  'currency',
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="CNY">CNY</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={rule.priority}
                              onChange={(e) =>
                                updateVideoRule(
                                  originalIndex,
                                  'priority',
                                  e.target.value
                                )
                              }
                              placeholder="10"
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                onClick={() =>
                                  duplicateVideoRule(originalIndex)
                                }
                                title="复制规则"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => deleteVideoRule(originalIndex)}
                                title="删除规则"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>配置示例：</strong>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  阿里云按秒计费：model=wan*, resolution=720P,
                  pricing_type=per_second, price=0.6, currency=CNY
                </li>
                <li>
                  可灵固定价格：model=kling-v1, mode=standard, duration=5,
                  pricing_type=fixed, price=3.5, currency=CNY, priority=20
                </li>
                <li>
                  兜底规则：model=kling-v1, mode=*, duration=*,
                  pricing_type=fixed, price=5.0, currency=CNY, priority=5
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

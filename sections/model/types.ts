// 与后端 controller/dynamic_priority_view.go 对齐的类型定义

export interface ModelOverviewItem {
  model: string;
  total_channels: number;
  enabled_channels: number;
  top_dynamic_priority: number;
}

export interface ModelChannelItem {
  channel_id: number;
  channel_name: string;
  channel_type: number;
  groups: string[]; // 该渠道该模型挂载的所有分组（聚合）
  group_count: number;
  enabled: boolean;
  auto_disabled: boolean; // 该渠道该模型是否被模型级自动禁用（渠道仍启用）
  channel_status: number;
  priority: number;
  dynamic_priority: number;
  weight: number;
  unit_price: number;
}

// 后端返回结构：{ success, message, data: { list, total, page, pageSize } }
export interface ModelOverviewResponse {
  success: boolean;
  message?: string;
  data: {
    list: ModelOverviewItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

// 模型渠道列表响应（分页）
export interface ModelChannelsResponse {
  success: boolean;
  message?: string;
  data: {
    list: ModelChannelItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

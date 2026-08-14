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
  group: string;
  enabled: boolean;
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

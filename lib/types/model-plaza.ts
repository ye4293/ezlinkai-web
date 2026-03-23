export interface GroupPrice {
  group_key: string;
  display_name: string;
  group_discount: number;
  combined_discount: number;
  final_input_price: number;
  final_output_price: number;
  final_fixed_price: number;
}

export interface ModelPlazaItem {
  model_name: string;
  provider: string;
  price_type: 'ratio' | 'fixed';
  base_input_price: number;
  base_output_price: number;
  base_fixed_price: number;
  channel_discount: number;
  group_prices: GroupPrice[];
}

export interface GroupConfigItem {
  id: number;
  group_key: string;
  display_name: string;
  discount: number;
  sort_order: number;
  description: string;
}

export interface ProviderInfo {
  name: string;
  count: number;
}

export interface ModelPlazaResponse {
  models: ModelPlazaItem[];
  groups: GroupConfigItem[];
  providers: ProviderInfo[];
  total: number;
  page: number;
  page_size: number;
}

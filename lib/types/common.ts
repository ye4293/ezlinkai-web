export type Result = {
  data?: Object;
  success: boolean;
  message: string;
};

export type Result2 = {
  data?: string;
  success: boolean;
  message: string;
};

export type NoDataResult = {
  success: boolean;
  message: string;
};

export type ResultNumber = {
  data: number;
  success: boolean;
  message: string;
};

export type PayResult = {
  data?: {
    payment_uri: string;
    qr_code: string;
    status: string;
  };
  success: boolean;
  message: string;
};

export type ListResult = {
  data?: {
    /** 当前页 */
    currentPage: number;
    /** 列表数据 */
    list: Array<any>;
    // 每页条数
    pageSize: number;
    // 总条数
    total: number;
  };
  success: boolean;
  message: string;
};

export interface ListParams {
  /** 当前页 */
  page?: number;
  /** 每页条数 */
  pagesize?: number;
  /** 关键字 */
  keyword?: string | number;
}

export type ListArrayResult = {
  data?: Array<any>;
  success: boolean;
  message: string;
};

export type SettingParams = {
  key: string;
  value: string;
};

export interface ChargeAmountResult {
  data: {
    /** 当前页 */
    app_order_id: string;
    /** 列表数据 */
    charge_url: string;
  };
  success: boolean;
  message: string;
}

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse
} from 'axios';
import { getSession } from 'next-auth/react';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // 基础URL
  timeout: 60000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig<any>) => {
    const session = await getSession();
    if (session?.user?.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${session.user.accessToken}`
      } as AxiosRequestHeaders;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    const { data, status } = response;
    // 根据后端约定的状态码判断请求是否成功
    // console.log(response.status);
    // console.log(response.statusText);
    if (status === 200) {
      return data;
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      // console.log(error.response);
      switch (error.response.status) {
        case 401:
          // 未授权处理
          break;
        case 403:
          // 禁止访问处理
          break;
        case 404:
          // 资源不存在处理
          break;
        default:
          // 其他错误处理
          break;
      }
      // console.log(error.response.status);
      // console.log(error.response.statusText);
      // console.log('error.response', error.response)
      return error.response;
    }
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export function get<T>(url: string, params?: any): Promise<T> {
  return request.get(url, { params });
}

// 封装 POST 请求
export function post<T>(url: string, data?: any): Promise<T> {
  return request.post(url, data);
}

// 封装 PUT 请求
export function put<T>(url: string, data?: any): Promise<T> {
  return request.put(url, data);
}

// 封装 DELETE 请求
export function del<T>(url: string): Promise<T> {
  return request.delete(url);
}

export default request;

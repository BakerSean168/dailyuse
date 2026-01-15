/**
 * 核心API客户端
 * 提供统一的HTTP请求接口
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  IApiClient,
  HttpClientConfig,
  RequestOptions,
  UploadOptions,
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
} from './types';
import { InterceptorManager } from './interceptors';
import { environmentConfig } from './config';

/**
 * 默认HTTP客户端配置
 */
const defaultConfig: HttpClientConfig = {
  baseURL: environmentConfig.apiBaseUrl,
  timeout: environmentConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  enableAuth: true,
  authType: 'bearer',
  enableLogging: environmentConfig.logLevel !== 'silent',
  enableRetry: true,
  retryCount: 3,
  retryDelay: 1000,
  enableCache: false,
  cacheTimeout: 300000, // 5分钟
  responseExtractStrategy: 'auto', // 默认自动提取 data（向后兼容）
};

/**
 * 核心API客户端类
 */
export class ApiClient implements IApiClient {
  private instance: AxiosInstance;
  private config: HttpClientConfig;
  private requestCache = new Map<string, { data: any; timestamp: number }>();

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.instance = axios.create(this.config);

    // 设置拦截器
    new InterceptorManager(this.instance, this.config);
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const cacheKey = this.getCacheKey('GET', url, options);

    // 检查缓存
    if (options.enableCache !== false && this.config.enableCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.instance.get(url, {
      ...options,
      params: options.params,
    });

    const result = this.extractData<T>(response.data);
    
    // 缓存结果
    if (options.enableCache !== false && this.config.enableCache) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.post(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.put(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.delete(url, options);
    return this.extractData<T>(response.data);
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.instance.patch(url, data, options);
    return this.extractData<T>(response.data);
  }

  /**
   * 文件上传
   */
  async upload<T = any>(
    url: string,
    file: File | FormData,
    options: UploadOptions = {},
  ): Promise<T> {
    let formData: FormData;

    if (file instanceof FormData) {
      formData = file;
    } else {
      // 验证文件
      this.validateFile(file, options);

      formData = new FormData();
      formData.append('file', file);
    }

    const response = await this.instance.post(url, formData, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (options.onUploadProgress) {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;

          options.onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            progress,
          });
        }
      },
    });

    return this.extractData<T>(response.data);
  }

  /**
   * 文件下载
   */
  async download(url: string, filename?: string, options: RequestOptions = {}): Promise<void> {
    const response = await this.instance.get(url, {
      ...options,
      responseType: 'blob',
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = filename || this.getFilenameFromResponse(response) || 'download';
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * GET请求 - 返回完整响应（包含 message）
   * 
   * 使用场景：需要显示后端返回的 message 或其他元数据
   * 
   * @example
   * ```typescript
   * const response = await apiClient.getWithMessage<User[]>('/users');
   * console.log(response.message); // "查询成功"
   * console.log(response.data);    // User[]
   * console.log(response.timestamp); // 1234567890
   * ```
   */
  async getWithMessage<T = any>(url: string, options: RequestOptions = {}): Promise<SuccessResponse<T>> {
    const originalStrategy = this.config.responseExtractStrategy;
    this.config.responseExtractStrategy = 'full';
    try {
      const response = await this.get<SuccessResponse<T>>(url, options);
      return response;
    } finally {
      this.config.responseExtractStrategy = originalStrategy;
    }
  }

  /**
   * POST请求 - 返回完整响应（包含 message）
   */
  async postWithMessage<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<SuccessResponse<T>> {
    const originalStrategy = this.config.responseExtractStrategy;
    this.config.responseExtractStrategy = 'full';
    try {
      const response = await this.post<SuccessResponse<T>>(url, data, options);
      return response;
    } finally {
      this.config.responseExtractStrategy = originalStrategy;
    }
  }

  /**
   * PUT请求 - 返回完整响应（包含 message）
   */
  async putWithMessage<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<SuccessResponse<T>> {
    const originalStrategy = this.config.responseExtractStrategy;
    this.config.responseExtractStrategy = 'full';
    try {
      const response = await this.put<SuccessResponse<T>>(url, data, options);
      return response;
    } finally {
      this.config.responseExtractStrategy = originalStrategy;
    }
  }

  /**
   * DELETE请求 - 返回完整响应（包含 message）
   */
  async deleteWithMessage<T = any>(url: string, options: RequestOptions = {}): Promise<SuccessResponse<T>> {
    const originalStrategy = this.config.responseExtractStrategy;
    this.config.responseExtractStrategy = 'full';
    try {
      const response = await this.delete<SuccessResponse<T>>(url, options);
      return response;
    } finally {
      this.config.responseExtractStrategy = originalStrategy;
    }
  }

  /**
   * 取消请求
   */
  cancelRequest(requestId: string): void {
    // TODO: 实现请求取消逻辑
    console.warn('请求取消功能暂未实现', requestId);
  }

  /**
   * 清除缓存
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.requestCache.clear();
    }
  }

  /**
   * 获取Axios实例（用于特殊需求）
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * 验证文件
   */
  private validateFile(file: File, options: UploadOptions): void {
    // 文件大小验证
    if (options.maxFileSize && file.size > options.maxFileSize) {
      throw new Error(`文件大小超过限制: ${options.maxFileSize / 1024 / 1024}MB`);
    }

    // 文件类型验证
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileType = file.type;
      const isAllowed = options.allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.slice(0, -1));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
    }
  }

  /**
   * 从响应中提取数据
   * 
   * 支持三种提取策略：
   * 1. 'auto'（默认）：自动提取 data 字段，简化调用但丢失 message
   * 2. 'full'：返回完整 SuccessResponse，包含 data、message、timestamp
   * 3. 'raw'：返回原始响应数据，不做任何处理
   * 
   * 使用示例：
   * ```typescript
   * // 策略1: 自动提取（默认）
   * const users = await api.get<User[]>('/users'); // 直接得到 User[]
   * 
   * // 策略2: 完整响应（推荐用于需要 message 的场景）
   * const response = await api.get<User[]>('/users'); // 得到 SuccessResponse<User[]>
   * console.log(response.message); // 可以访问 message
   * console.log(response.data);    // 可以访问数据
   * 
   * // 策略3: 原始数据
   * const raw = await api.get('/users'); // 得到原始后端返回
   * ```
   */
  private extractData<T>(responseData: any): T {
    const strategy = this.config.responseExtractStrategy || 'auto';

    // 策略3: 原始数据，不做任何处理
    if (strategy === 'raw') {
      return responseData as T;
    }

    // 检查是否为标准的API响应格式 { code, ok, data, message, ... }
    if (responseData && typeof responseData === 'object' && 'ok' in responseData) {
      const apiResponse = responseData as ApiResponse<any>;

      if (apiResponse.ok === true) {
        const successResponse = apiResponse as SuccessResponse<any>;

        // 策略2: 返回完整响应（包含 data、message、timestamp）
        if (strategy === 'full') {
          return successResponse as T;
        }

        // 策略1: 自动提取 data 字段（默认，向后兼容）
        return successResponse.data as T;
      } else {
        // 错误响应（不应该到这里，因为拦截器已处理）
        const errorResponse = apiResponse as ErrorResponse;
        throw new Error(errorResponse.message || '请求失败');
      }
    }

    // 非标准格式，直接返回（向后兼容旧接口）
    return responseData as T;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(method: string, url: string, options: any): string {
    const params = options.params ? JSON.stringify(options.params) : '';
    return `${method}:${url}:${params}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const timeout = this.config.cacheTimeout || 300000;

    if (now - cached.timestamp > timeout) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 从响应头获取文件名
   */
  private getFilenameFromResponse(response: any): string | null {
    const contentDisposition = response.headers['content-disposition'];
    if (!contentDisposition) return null;

    const matches = contentDisposition.match(/filename[^;=\\n]*=((['\"]*)(.*?)\\2|[^;\\n]*)/);
    return matches && matches[3] ? matches[3] : null;
  }
}

/**
 * 创建API客户端实例
 */
export function createApiClient(config?: Partial<HttpClientConfig>): ApiClient {
  return new ApiClient(config);
}

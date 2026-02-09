/**
 * HTTP Module  Re-exports from @dailyuse/http-client
 *
 * 所有 HTTP 客户端功能已提取至独立包 @dailyuse/http-client。
 * 此处保留 re-export 以保证向后兼容。
 *
 * @module @dailyuse/infrastructure-client/http
 */

//  Types 
export type {
  AxiosHttpClientConfig,
  TokenProvider,
  TokenRefreshHandler,
} from '@dailyuse/http-client';
export { DEFAULT_HTTP_CLIENT_CONFIG } from '@dailyuse/http-client';

//  Axios Instance Factory 
export { createAxiosInstance } from '@dailyuse/http-client';

//  IHttpClient 实现 
export { AxiosHttpClient, HttpClientError } from '@dailyuse/http-client';

//  Result HTTP Client 
export { ResultHttpClient } from '@dailyuse/http-client';

//  便捷工厂函数 
export { createHttpClient, createResultHttpClient } from '@dailyuse/http-client';

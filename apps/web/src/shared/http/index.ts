/**
 * Web App — Shared HTTP Client
 *
 * 使用 @dailyuse/http-client 包创建全局 AxiosHttpClient 实例。
 * 自动注入 Token（从 Pinia authenticationStore 读取）、
 * 处理 401 自动刷新、剥离后端 HttpResponse 信封。
 *
 * 所有 Web 模块通过此实例与后端通信，不再直接使用 fetch。
 *
 * @module shared/http
 */

export { httpClient, tokenProvider } from './httpClient';

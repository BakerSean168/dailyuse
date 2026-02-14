/**
 * Web App — Shared HTTP Client
 *
 * 使用 @dailyuse/http-client 包创建全局 HTTP Client 实例。
 * 自动注入 Token（从 Pinia authenticationStore 读取）、
 * 处理 401 自动刷新、剥离后端 HttpResponse 信封。
 *
 * 提供两种风格：
 * - httpClient: 抛出异常 (Legacy)
 * - resultHttpClient: 返回 Result<T>，永不抛异常 (Recommended)
 *
 * @module shared/http
 */

export { httpClient, resultHttpClient, tokenProvider } from './httpClient';

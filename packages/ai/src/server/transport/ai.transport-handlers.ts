/**
 * AI transport handler mapping.
 * AI 传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 *
 * Residual 246: no dual AITransportHandlers type alias — returns AIApplicationPort.
 */

import type { AIApplicationPort } from '../application';

/**
 * Shared transport mapping for HTTP and Electron controllers.
 * Controllers depend on AIApplicationPort; this keeps mapping in one place.
 */
export function createAITransportHandlers(api: AIApplicationPort): AIApplicationPort {
  return api;
}

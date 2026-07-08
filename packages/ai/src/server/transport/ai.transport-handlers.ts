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
 */

import type { AIApplicationPort } from '../application';

/**
 * Transport handler shape consumed by controllers.
 * 控制器消费的传输处理器形状。
 *
 * Currently identical to `AIApplicationPort`. We keep the indirection so
 * controllers never import the infrastructure layer directly.
 * 当前与 `AIApplicationPort` 完全一致。保留间接层使控制器
 * 永远不直接导入基础设施层。
 */
export type AITransportHandlers = AIApplicationPort;

export function createAITransportHandlers(api: AIApplicationPort): AITransportHandlers {
  return api;
}

/**
 * Authentication transport handler mapping.
 * Authentication 传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { AuthenticationUseCases } from '../controllers/auth.controller';
import type { AuthenticationApplicationPort } from '../infrastructure-server';

/**
 * Creates transport handlers from the application port.
 * 从应用端口创建传输层处理器。
 *
 * The authentication application port already matches the controller port signature,
 * so this mapping is identity (thin and boring — exactly as it should be).
 * 认证应用端口已经与控制器端口签名一致，所以这个映射是恒等映射（薄且无趣 — 正是理想状态）。
 */
export function createAuthenticationTransportHandlers(
  api: AuthenticationApplicationPort,
): AuthenticationUseCases {
  return api;
}

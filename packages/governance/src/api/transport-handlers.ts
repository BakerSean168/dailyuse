/**
 * Governance transport handler mapping.
 * Governance 传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { GovernanceUseCases } from '../controllers/governance.controller';
import type { GovernanceApplicationPort } from '../infrastructure-server';

export function createGovernanceTransportHandlers(
  api: GovernanceApplicationPort,
): GovernanceUseCases {
  return api;
}

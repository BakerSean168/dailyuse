/**
 * Repository transport handler mapping.
 * Repository 传输层处理器映射。
 *
 * This file converts the module facade into the function signatures required by
 * controllers. It is shared by HTTP and Electron transports so the mapping is
 * defined once.
 *
 * 这个文件把模块门面转换成控制器所需的函数签名。
 * HTTP 和 Electron 共用这一层，避免重复定义同样的 handler 映射。
 */

import type { RepositoryUseCases } from '../controllers/repository.controller';
import type { RepositoryApplicationPort } from '../infrastructure-server';

/**
 * Creates controller-compatible handlers from the application port.
 * 从应用层门面创建控制器兼容的处理器。
 *
 * The `RepositoryApplicationPort` and `RepositoryUseCases` are structurally
 * compatible, so this is a direct pass-through.
 *
 * RepositoryApplicationPort 与 RepositoryUseCases 结构兼容，
 * 因此这里只是直接透传。
 */
export function createRepositoryTransportHandlers(
  api: RepositoryApplicationPort,
): RepositoryUseCases {
  return api;
}

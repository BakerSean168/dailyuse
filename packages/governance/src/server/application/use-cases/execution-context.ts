/**
 * Execution context — extracted from auth token by middleware.
 * 执行上下文 — 由中间件从认证 token 中提取。
 *
 * @internal Use-case implementation detail — not part of the public API.
 * @internal 用例实现细节 — 非公开 API。
 */

import type { IdentityId } from '@memoflow/contracts/primitives';

export interface ExecutionContext {
  identityId: IdentityId;
}

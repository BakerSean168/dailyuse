/**
 * HTTP-based composition helper for the governance client application module.
 * 基于 HTTP 的治理客户端应用层组合辅助。
 *
 * Wires the transport adapter into the single client-side facade so UI callers
 * depend on one deep module instead of hand-assembling adapters in multiple places.
 * 将传输适配器接入单一前端门面，
 * 让 UI 调用方依赖一个更深的模块，而不是在多处手工拼装适配器。
 */
import type { IResultHttpClient } from '@dailyuse/http-client';
import { createRuleHttpAdapter } from '../infrastructure-client';
import { createGovernanceClientService, type GovernanceClientService } from './services/governance-client-service';

/**
 * Creates the governance client facade from a shared Result HTTP client.
 * 基于共享 Result HTTP client 创建治理客户端门面。
 */
export function createGovernanceServiceFromHttpClient(
  httpClient: IResultHttpClient,
): GovernanceClientService {
  const adapter = createRuleHttpAdapter(httpClient);
  return createGovernanceClientService(adapter);
}

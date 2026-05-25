import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  TestAIProviderReq,
  TestAIProviderRes,
} from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import type { IAIChatExecutionPort } from '../../ports';
import { resolveProviderConfigForConnectionTest } from './ai-provider-config-helpers';

export class TestAIProviderConnectionUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
  ) {}

  async execute(
    request: TestAIProviderReq,
    cx: ExecutionContext,
  ): Promise<Result<TestAIProviderRes>> {
    const startedAt = Date.now();

    try {
      const providerConfig = await resolveProviderConfigForConnectionTest(
        this.providerConfigRepository,
        cx.identityId,
        request,
      );
      const result = await this.chatExecutionPort.complete({
        identityId: cx.identityId,
        providerConfig,
        messages: [{ role: 'user', content: request.testPrompt ?? 'Hello, this is a test.' }],
      });

      return ok({
        ok: true,
        response: result.content,
        model: providerConfig.model,
        latencyMs: Date.now() - startedAt,
      });
    } catch (err) {
      return ok({
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown provider error',
        latencyMs: Date.now() - startedAt,
      });
    }
  }
}

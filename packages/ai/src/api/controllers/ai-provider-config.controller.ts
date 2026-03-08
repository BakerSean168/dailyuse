import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  CreateAIProviderConfigSchema,
  type CreateAIProviderConfigRes,
  TestAIProviderSchema,
  type TestAIProviderRes,
  UpdateAIProviderConfigSchema,
  type UpdateAIProviderConfigRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';
import type { AIProviderConfigService } from '../../application-server/use-cases/commands/a-i-provider-config-service';

export class AIProviderConfigController {
  constructor(private readonly service: AIProviderConfigService) {}

  async create(input: unknown, identityId: string): Promise<Result<CreateAIProviderConfigRes>> {
    const parsed = CreateAIProviderConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.createProvider(identityId, parsed.data));
  }

  async update(id: string, input: unknown): Promise<Result<UpdateAIProviderConfigRes>> {
    const parsed = UpdateAIProviderConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.updateProvider(id, parsed.data));
  }

  async list(identityId: string) {
    return ok({ data: await this.service.listProviders(identityId) });
  }

  async get(id: string) {
    return ok(await this.service.getProvider(id));
  }

  async delete(id: string) {
    await this.service.deleteProvider(id);
    return ok(undefined);
  }

  async test(input: unknown): Promise<Result<TestAIProviderRes>> {
    const parsed = TestAIProviderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.testConnection(parsed.data));
  }

  async setDefault(id: string, identityId: string) {
    await this.service.setDefaultProvider(id, identityId);
    return ok(undefined);
  }
}

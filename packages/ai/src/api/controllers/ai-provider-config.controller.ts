import { fail, ok, type Result } from '@dailyuse/contracts/result';
import {
  CreateAIProviderConfigSchema,
  type CreateAIProviderConfigRes,
  type CreateAIProviderConfigReq,
  TestAIProviderSchema,
  type TestAIProviderReq,
  type TestAIProviderRes,
  UpdateAIProviderConfigSchema,
  type UpdateAIProviderConfigReq,
  type UpdateAIProviderConfigRes,
  type AIProviderConfigClientDTO,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIProviderConfigControllerService {
  createProvider(
    identityId: string,
    request: CreateAIProviderConfigReq,
  ): Promise<CreateAIProviderConfigRes>;
  updateProvider(id: string, request: UpdateAIProviderConfigReq): Promise<UpdateAIProviderConfigRes>;
  listProviders(identityId: string): Promise<AIProviderConfigClientDTO[]>;
  getProvider(id: string): Promise<AIProviderConfigClientDTO>;
  deleteProvider(id: string): Promise<void>;
  testConnection(identityId: string, request: TestAIProviderReq): Promise<TestAIProviderRes>;
  setDefaultProvider(id: string, identityId: string): Promise<void>;
}

export class AIProviderConfigController {
  constructor(private readonly service: AIProviderConfigControllerService) {}

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

  async test(input: unknown, identityId: string): Promise<Result<TestAIProviderRes>> {
    const parsed = TestAIProviderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return ok(await this.service.testConnection(identityId, parsed.data));
  }

  async setDefault(id: string, identityId: string) {
    await this.service.setDefaultProvider(id, identityId);
    return ok(undefined);
  }
}

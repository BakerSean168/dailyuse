import { fail, ok, type Result } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
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
  type ListAIProviderConfigsRes,
} from '@dailyuse/contracts/ai';
import { formatZodErrors } from '@dailyuse/utils/result';

interface AIProviderConfigControllerService {
  createProvider(
    request: CreateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateAIProviderConfigRes>>;
  updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateAIProviderConfigRes>>;
  listProviders(cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO[]>>;
  getProvider(id: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>>;
  deleteProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  testConnection(request: TestAIProviderReq, cx: ExecutionContext): Promise<Result<TestAIProviderRes>>;
  setDefaultProvider(id: string, cx: ExecutionContext): Promise<Result<void>>;
  refreshProviderModels(providerId: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>>;
}

export class AIProviderConfigController {
  constructor(private readonly service: AIProviderConfigControllerService) {}

  async create(input: unknown, cx: ExecutionContext): Promise<Result<CreateAIProviderConfigRes>> {
    const parsed = CreateAIProviderConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.createProvider(parsed.data, cx);
  }

  async update(
    id: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<UpdateAIProviderConfigRes>> {
    const parsed = UpdateAIProviderConfigSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.updateProvider(id, parsed.data, cx);
  }

  async list(cx: ExecutionContext): Promise<Result<ListAIProviderConfigsRes>> {
    const result = await this.service.listProviders(cx);
    if (!result.ok) return result;
    // Single list envelope: contracts ListAIProviderConfigsRes (no bare-array dual-track).
    return ok({ data: result.data });
  }

  async get(id: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>> {
    return this.service.getProvider(id, cx);
  }

  async delete(id: string, cx: ExecutionContext): Promise<Result<null>> {
    const result = await this.service.deleteProvider(id, cx);
    if (!result.ok) return result;
    // Serialize as data:null so HttpResponse keeps the data key (no ActionSuccess dual-track).
    return ok(null);
  }

  async test(input: unknown, cx: ExecutionContext): Promise<Result<TestAIProviderRes>> {
    const parsed = TestAIProviderSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }

    return this.service.testConnection(parsed.data, cx);
  }

  async setDefault(id: string, cx: ExecutionContext): Promise<Result<null>> {
    const result = await this.service.setDefaultProvider(id, cx);
    if (!result.ok) return result;
    return ok(null);
  }

  async refreshModels(id: string, cx: ExecutionContext): Promise<Result<AIProviderConfigClientDTO>> {
    return this.service.refreshProviderModels(id, cx);
  }
}

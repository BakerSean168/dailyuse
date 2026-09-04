import { fail, ok, type Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import {
  CreateAIProviderConfigSchema,
  CommitAIProviderOnboardingSchema,
  ProbeAIProviderConnectionSchema,
  TestAIProviderOnboardingModelSchema,
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
  type ListAIProviderCatalogRes,
  type CommitAIProviderOnboardingReq,
  type ProbeAIProviderConnectionReq,
  type ProbeAIProviderConnectionRes,
  type TestAIProviderOnboardingModelReq,
  type TestAIProviderOnboardingModelRes,
  type RefreshAIProviderModelsRes,
} from '@memoflow/contracts/ai';
import { formatZodErrors } from '@memoflow/utils/result';

interface AIProviderConfigControllerService {
  getProviderCatalog(): Promise<Result<ListAIProviderCatalogRes>>;
  probeProviderConnection(
    request: ProbeAIProviderConnectionReq,
    cx: ExecutionContext,
  ): Promise<Result<ProbeAIProviderConnectionRes>>;
  testProviderOnboardingModel(
    request: TestAIProviderOnboardingModelReq,
    cx: ExecutionContext,
  ): Promise<Result<TestAIProviderOnboardingModelRes>>;
  commitProviderOnboarding(
    request: CommitAIProviderOnboardingReq,
    cx: ExecutionContext,
  ): Promise<Result<AIProviderConfigClientDTO>>;
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
  refreshProviderModels(providerId: string, cx: ExecutionContext): Promise<Result<RefreshAIProviderModelsRes>>;
}

export class AIProviderConfigController {
  constructor(private readonly service: AIProviderConfigControllerService) {}

  async create(input: unknown, cx: ExecutionContext): Promise<Result<CreateAIProviderConfigRes>> {
    const onboarding = CommitAIProviderOnboardingSchema.safeParse(input);
    if (onboarding.success) {
      return this.service.commitProviderOnboarding(onboarding.data, cx);
    }

    // Temporary compatibility lane for clients that have not migrated to V2 yet.
    const legacy = CreateAIProviderConfigSchema.safeParse(input);
    if (!legacy.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors([...onboarding.error.issues, ...legacy.error.issues]),
      });
    }

    return this.service.createProvider(legacy.data, cx);
  }

  async catalog(): Promise<Result<ListAIProviderCatalogRes>> {
    return this.service.getProviderCatalog();
  }

  async probe(input: unknown, cx: ExecutionContext): Promise<Result<ProbeAIProviderConnectionRes>> {
    const parsed = ProbeAIProviderConnectionSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.service.probeProviderConnection(parsed.data, cx);
  }

  async testOnboardingModel(
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<TestAIProviderOnboardingModelRes>> {
    const parsed = TestAIProviderOnboardingModelSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.service.testProviderOnboardingModel(parsed.data, cx);
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

  async refreshModels(id: string, cx: ExecutionContext): Promise<Result<RefreshAIProviderModelsRes>> {
    return this.service.refreshProviderModels(id, cx);
  }
}

/**
 * AI Provider Config - Domain Aggregate
 */

import { AggregateRoot } from '@dailyuse/utils';
import { AIProviderType } from '@dailyuse/contracts/ai';
import type {
  AIEventMap,
  AIModelInfo,
  AIProviderConfigClientDTO,
  AIProviderConfigServerDTO,
} from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiProviderConfigId } from '../../domain-shared/value-objects/ai-provider-config-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

export interface AIProviderConfigState {
  id: AiProviderConfigId;
  identityId: IIdentityId;
  name: string;
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
  defaultModel: string | null;
  availableModels: AIModelInfo[];
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class AIProviderConfig extends AggregateRoot<AiProviderConfigId> {
  private _props: Omit<AIProviderConfigState, 'id'>;

  private constructor(state: AIProviderConfigState) {
    super(state.id);
    const { id, ...rest } = state;
    void id;
    this._props = { ...rest };
  }

  // ===== Getters =====

  public get identityId(): IIdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get providerType(): AIProviderType {
    return this._props.providerType;
  }

  public get baseUrl(): string {
    return this._props.baseUrl;
  }

  public get apiKey(): string {
    return this._props.apiKey;
  }

  public get defaultModel(): string | null {
    return this._props.defaultModel;
  }

  public get availableModels(): AIModelInfo[] {
    return [...this._props.availableModels];
  }

  public get isActive(): boolean {
    return this._props.isActive;
  }

  public get isDefault(): boolean {
    return this._props.isDefault;
  }

  public get priority(): number {
    return this._props.priority;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ===== Factory Methods =====

  public static create(params: {
    identityId: string;
    name: string;
    providerType: AIProviderType;
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
    isDefault?: boolean;
    priority?: number;
  }): AIProviderConfig {
    const now = new Date();
    const instance = new AIProviderConfig({
      id: AiProviderConfigId.generate(),
      identityId: IdentityId.of(params.identityId),
      name: params.name.trim(),
      providerType: params.providerType,
      baseUrl: AIProviderConfig.normalizeBaseUrl(params.baseUrl),
      apiKey: params.apiKey,
      defaultModel: params.defaultModel ?? null,
      availableModels: [],
      isActive: true,
      isDefault: params.isDefault ?? false,
      priority: params.priority ?? 100,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    instance.addDomainEvent<AIEventMap['ai.provider_config.created']>('ai.provider_config.created', {
      identityId: String(instance._props.identityId),
      providerConfig: instance.toServerDTO(),
    });

    return instance;
  }

  public static load(state: AIProviderConfigState): AIProviderConfig {
    return new AIProviderConfig(state);
  }

  // ===== Business Methods =====

  public updateName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error('Provider name must be 1-50 characters');
    }
    this._props.name = trimmed;
    this._props.updatedAt = new Date();
  }

  public updateBaseUrl(baseUrl: string): void {
    this._props.baseUrl = AIProviderConfig.normalizeBaseUrl(baseUrl);
    this._props.updatedAt = new Date();
  }

  public updateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key cannot be empty');
    }
    this._props.apiKey = apiKey;
    this._props.updatedAt = new Date();
  }

  public setDefaultModel(modelId: string | null): void {
    if (modelId && !this._props.availableModels.some((m) => m.id === modelId)) {
      console.warn(`Model ${modelId} not in available models list`);
    }
    this._props.defaultModel = modelId;
    this._props.updatedAt = new Date();
  }

  public updateAvailableModels(models: AIModelInfo[]): void {
    this._props.availableModels = models;
    this._props.updatedAt = new Date();

    this.addDomainEvent<AIEventMap['ai.provider_config.models_updated']>(
      'ai.provider_config.models_updated',
      {
      identityId: String(this._props.identityId),
      providerConfig: this.toServerDTO(),
      modelCount: models.length,
      },
    );
  }

  public activate(): void {
    this._props.isActive = true;
    this._props.updatedAt = new Date();
  }

  public deactivate(): void {
    this._props.isActive = false;
    if (this._props.isDefault) {
      this._props.isDefault = false;
    }
    this._props.updatedAt = new Date();
  }

  public setAsDefault(): void {
    if (!this._props.isActive) {
      throw new Error('Cannot set inactive provider as default');
    }
    this._props.isDefault = true;
    this._props.updatedAt = new Date();

    this.addDomainEvent<AIEventMap['ai.provider_config.set_default']>(
      'ai.provider_config.set_default',
      {
        identityId: String(this._props.identityId),
        providerConfig: this.toServerDTO(),
      },
    );
  }

  public unsetDefault(): void {
    this._props.isDefault = false;
    this._props.updatedAt = new Date();
  }

  public updatePriority(priority: number): void {
    if (priority < 1 || priority > 999) {
      throw new Error('Priority must be between 1 and 999');
    }
    this._props.priority = priority;
    this._props.updatedAt = new Date();
  }

  // ===== DTO Conversion =====

  public toServerDTO(): AIProviderConfigServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      providerType: this._props.providerType,
      baseUrl: this._props.baseUrl,
      apiKey: this._props.apiKey,
      defaultModel: this._props.defaultModel,
      availableModels: [...this._props.availableModels],
      isActive: this._props.isActive,
      isDefault: this._props.isDefault,
      priority: this._props.priority,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  public toClientDTO(): AIProviderConfigClientDTO {
    return {
      id: String(this.id) as AIProviderConfigClientDTO['id'],
      identityId: String(this._props.identityId) as AIProviderConfigClientDTO['identityId'],
      name: this._props.name,
      providerType: this._props.providerType,
      baseUrl: this._props.baseUrl,
      apiKeyMasked: AIProviderConfig.maskApiKey(this._props.apiKey),
      defaultModel: this._props.defaultModel,
      availableModels: [...this._props.availableModels],
      isActive: this._props.isActive,
      isDefault: this._props.isDefault,
      priority: this._props.priority,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  // ===== Static Helpers =====

  public static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    const prefix = apiKey.slice(0, 3);
    const suffix = apiKey.slice(-4);
    return `${prefix}****${suffix}`;
  }

  public static normalizeBaseUrl(url: string): string {
    let normalized = url.trim();
    while (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
}

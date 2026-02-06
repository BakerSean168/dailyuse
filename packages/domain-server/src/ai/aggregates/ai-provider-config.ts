/**
 * AI Provider Config - Domain Aggregate
 * AI 服务提供商配置聚合根
 *
 * DDD 聚合根设计：
 * - 封装 Provider 配置的业务逻辑
 * - 提供 Client/Server/Persistence DTO 转换
 * - API Key 在服务端完整存储，客户端返回掩码版本
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  AIProviderType,
} from '@dailyuse/contracts/ai';
import type {
  AIModelInfo,
  AIProviderConfigClientDTO,
  AIProviderConfigServerDTO,
  AIProviderConfigPersistenceDTO,
  AIProviderConfigServer as IAIProviderConfigServer,
} from '@dailyuse/contracts/ai';
import type { IdentityId as IIdentityId } from '@dailyuse/contracts/primitives';
import { AiProviderConfigId } from '@dailyuse/domain-shared/ai';
import { IdentityId } from '@dailyuse/domain-shared/shared';

/**
 * AIProviderConfig 聚合根
 *
 * 职责：
 * - 管理用户自定义的 AI 服务提供商配置
 * - API Key 安全处理（掩码生成）
 * - 默认 Provider 管理
 */
export class AIProviderConfig extends AggregateRoot<AiProviderConfigId> implements IAIProviderConfigServer {
  private _identityId: IIdentityId;
  private _name: string;
  private _providerType: AIProviderType;
  private _baseUrl: string;
  private _apiKey: string;
  private _defaultModel: string | null;
  private _availableModels: AIModelInfo[];
  private _isActive: boolean;
  private _isDefault: boolean;
  private _priority: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(dto: AIProviderConfigServerDTO) {
    super(AiProviderConfigId.of(dto.id ?? AiProviderConfigId.generate()));
    this._identityId = IdentityId.of(dto.identityId);
    this._name = dto.name;
    this._providerType = dto.providerType;
    this._baseUrl = dto.baseUrl;
    this._apiKey = dto.apiKey;
    this._defaultModel = dto.defaultModel;
    this._availableModels = dto.availableModels;
    this._isActive = dto.isActive;
    this._isDefault = dto.isDefault;
    this._priority = dto.priority ?? 100;
    this._version = dto.version ?? 1;
    this._createdAt = new Date(dto.createdAt);
    this._updatedAt = new Date(dto.updatedAt);
    this._deletedAt = dto.deletedAt != null ? new Date(dto.deletedAt) : null;
  }

  // ===== Getters =====

  public get identityId(): IIdentityId {
    return this._identityId;
  }

  public get name(): string {
    return this._name;
  }

  public get providerType(): AIProviderType {
    return this._providerType;
  }

  public get baseUrl(): string {
    return this._baseUrl;
  }

  public get apiKey(): string {
    return this._apiKey;
  }

  public get defaultModel(): string | null {
    return this._defaultModel;
  }

  public get availableModels(): AIModelInfo[] {
    return [...this._availableModels];
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isDefault(): boolean {
    return this._isDefault;
  }

  public get priority(): number {
    return this._priority;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get version(): number {
    return this._version;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== Factory Methods =====

  /**
   * 创建新的 AI Provider 配置
   */
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
    const now = Date.now();
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

    instance.addDomainEvent('ai.provider_config.created', {
      identityId: instance._identityId,
      providerConfigId: instance.id,
      name: instance.name,
      providerType: instance.providerType,
      isDefault: instance.isDefault,
    });

    return instance;
  }

  /**
   * 从 ServerDTO 重建聚合根
   */
  public static fromServerDTO(dto: AIProviderConfigServerDTO): AIProviderConfig {
    return new AIProviderConfig(dto);
  }

  /**
   * 从 PersistenceDTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: AIProviderConfigPersistenceDTO): AIProviderConfig {
    return new AIProviderConfig({
      id: AiProviderConfigId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      providerType: dto.providerType,
      baseUrl: dto.baseUrl,
      apiKey: dto.apiKey,
      defaultModel: dto.defaultModel,
      availableModels: dto.availableModels,
      isActive: dto.isActive,
      isDefault: dto.isDefault,
      priority: dto.priority ?? 100,
      version: dto.version ?? 1,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt != null ? dto.deletedAt.getTime() : null,
    });
  }

  // ===== Business Methods =====

  /**
   * 更新配置名称
   */
  public updateName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      throw new Error('Provider name must be 1-50 characters');
    }
    this._name = trimmed;
    this._updatedAt = new Date();
  }

  /**
   * 更新 API 地址
   */
  public updateBaseUrl(baseUrl: string): void {
    this._baseUrl = AIProviderConfig.normalizeBaseUrl(baseUrl);
    this._updatedAt = new Date();
  }

  /**
   * 更新 API Key
   */
  public updateApiKey(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API Key cannot be empty');
    }
    this._apiKey = apiKey;
    this._updatedAt = new Date();
  }

  /**
   * 设置默认模型
   */
  public setDefaultModel(modelId: string | null): void {
    if (modelId && !this._availableModels.some((m) => m.id === modelId)) {
      // 允许设置不在列表中的模型（可能模型列表尚未刷新）
      console.warn(`Model ${modelId} not in available models list`);
    }
    this._defaultModel = modelId;
    this._updatedAt = new Date();
  }

  /**
   * 更新可用模型列表
   */
  public updateAvailableModels(models: AIModelInfo[]): void {
    this._availableModels = models;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.provider_config.models_updated', {
      identityId: this._identityId,
      providerConfigId: this.id,
      modelCount: models.length,
    });
  }

  /**
   * 激活配�?
   */
  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * 停用配置
   */
  public deactivate(): void {
    this._isActive = false;
    // 停用时自动取消默�?
    if (this._isDefault) {
      this._isDefault = false;
    }
    this._updatedAt = new Date();
  }

  /**
   * 设为默认 Provider
   */
  public setAsDefault(): void {
    if (!this._isActive) {
      throw new Error('Cannot set inactive provider as default');
    }
    this._isDefault = true;
    this._updatedAt = new Date();

    this.addDomainEvent('ai.provider_config.set_default', {
      identityId: this._identityId,
      providerConfigId: this.id,
      providerName: this._name,
    });
  }

  /**
   * 取消默认
   */
  public unsetDefault(): void {
    this._isDefault = false;
    this._updatedAt = new Date();
  }

  /**
   * 更新优先�?
   * @param priority 优先级数字，数字越小优先级越高（1 最高）
   */
  public updatePriority(priority: number): void {
    if (priority < 1 || priority > 999) {
      throw new Error('Priority must be between 1 and 999');
    }
    this._priority = priority;
    this._updatedAt = new Date();
  }

  // ===== DTO Conversion =====

  /**
   * 转换为服务端 DTO（包含完整 API Key）
   */
  public toServerDTO(): AIProviderConfigServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      providerType: this._providerType,
      baseUrl: this._baseUrl,
      apiKey: this._apiKey,
      defaultModel: this._defaultModel,
      availableModels: [...this._availableModels],
      isActive: this._isActive,
      isDefault: this._isDefault,
      priority: this._priority,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): AIProviderConfigPersistenceDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      providerType: this._providerType,
      baseUrl: this._baseUrl,
      apiKey: this._apiKey,
      defaultModel: this._defaultModel,
      availableModels: [...this._availableModels],
      isActive: this._isActive,
      isDefault: this._isDefault,
      priority: this._priority,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  /**
   * 转换为客户端 DTO（API Key 掩码处理）
   */
  public toClientDTO(): AIProviderConfigClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      providerType: this._providerType,
      baseUrl: this._baseUrl,
      apiKeyMasked: AIProviderConfig.maskApiKey(this._apiKey),
      defaultModel: this._defaultModel,
      availableModels: [...this._availableModels],
      isActive: this._isActive,
      isDefault: this._isDefault,
      priority: this._priority,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  // ===== Static Helpers =====

  /**
   * 生成 API Key 掩码
   * 例如: "sk-1234567890abcdef" -> "sk-****cdef"
   */
  public static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    const prefix = apiKey.slice(0, 3);
    const suffix = apiKey.slice(-4);
    return `${prefix}****${suffix}`;
  }

  /**
   * 规范�?API 地址
   * - 移除尾部斜杠
   * - 确保 https 协议（生产环境）
   */
  public static normalizeBaseUrl(url: string): string {
    let normalized = url.trim();
    // 移除尾部斜杠
    while (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
}

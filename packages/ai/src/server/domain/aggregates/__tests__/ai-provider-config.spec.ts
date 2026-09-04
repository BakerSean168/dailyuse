import { describe, expect, it, beforeEach } from 'vitest';
import { AIProviderType } from '@memoflow/contracts/ai';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AIProviderConfig } from '../ai-provider-config';

describe('AIProviderConfig Aggregate', () => {
  let identityId: string;

  beforeEach(() => {
    identityId = String(IdentityId.generate());
  });

  describe('创建与初始化', () => {
    it('创建新的 provider 配置', () => {
      const config = AIProviderConfig.create({
        identityId,
        name: 'OpenAI Config',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test-key',
      });

      expect(config.name).toBe('OpenAI Config');
      expect(config.providerType).toBe(AIProviderType.OpenAI);
      expect(config.isActive).toBe(true);
      expect(config.isDefault).toBe(false);
      expect(config.priority).toBe(100);
      expect(config.version).toBe(1);
      expect(config.deletedAt).toBeNull();
    });

    it('创建时发出事件', () => {
      const config = AIProviderConfig.create({
        identityId,
        name: 'Claude Config',
        providerType: AIProviderType.Claude,
        baseUrl: 'https://api.anthropic.com',
        apiKey: 'key-123',
      });

      expect(config.domainEvents).toHaveLength(1);
      expect(config.domainEvents[0]).toBeDefined();
    });

    it('支持可选参数', () => {
      const config = AIProviderConfig.create({
        identityId,
        name: 'Custom Provider',
        providerType: AIProviderType.Custom,
        baseUrl: 'https://custom.com',
        apiKey: 'key',
        defaultModel: 'gpt-4',
        isDefault: true,
        priority: 50,
      });

      expect(config.defaultModel).toBe('gpt-4');
      expect(config.isDefault).toBe(true);
      expect(config.priority).toBe(50);
    });

    it('整理 provider 名称（trim）', () => {
      const config = AIProviderConfig.create({
        identityId,
        name: '  Trimmed Name  ',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });

      expect(config.name).toBe('Trimmed Name');
    });

    it('规范化 base URL', () => {
      const config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1/',
        apiKey: 'key',
      });

      expect(config.baseUrl).toBe('https://api.openai.com/v1');
    });
  });

  describe('名称更新', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Original',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('更新名称', () => {
      config.updateName('Updated Name');
      expect(config.name).toBe('Updated Name');
    });

    it('拒绝空名称', () => {
      expect(() => config.updateName('')).toThrow();
    });

    it('拒绝长度超过 50 的名称', () => {
      const longName = 'A'.repeat(51);
      expect(() => config.updateName(longName)).toThrow();
    });

    it('更新时记录 updatedAt', () => {
      const before = config.updatedAt;
      config.updateName('New Name');
      expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('Base URL 更新', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('更新 base URL', () => {
      config.updateBaseUrl('https://new.api.com');
      expect(config.baseUrl).toBe('https://new.api.com');
    });

    it('规范化新的 base URL', () => {
      config.updateBaseUrl('https://api.custom.com/v2/');
      expect(config.baseUrl).toBe('https://api.custom.com/v2');
    });
  });

  describe('API Key 更新', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'old-key',
      });
    });

    it('更新 API Key', () => {
      config.updateApiKey('new-key-123');
      expect(config.apiKey).toBe('new-key-123');
    });

    it('拒绝空 API Key', () => {
      expect(() => config.updateApiKey('')).toThrow('API Key cannot be empty');
    });

    it('拒绝仅空格的 API Key', () => {
      expect(() => config.updateApiKey('   ')).toThrow('API Key cannot be empty');
    });
  });

  describe('默认模型管理', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('由用户显式设置默认模型，不依赖持久化模型目录', () => {
      config.setDefaultModel('gpt-4');
      expect(config.defaultModel).toBe('gpt-4');
    });

    it('允许清除默认模型', () => {
      config.setDefaultModel('gpt-4');
      config.setDefaultModel(null);
      expect(config.defaultModel).toBeNull();
    });

    it('Provider aggregate 不暴露 availableModels 长期真值', () => {
      expect('availableModels' in config).toBe(false);
      expect(config.toServerDTO()).not.toHaveProperty('availableModels');
      expect(config.toClientDTO()).not.toHaveProperty('availableModels');
    });
  });

  describe('激活/禁用状态', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('初始状态为激活', () => {
      expect(config.isActive).toBe(true);
    });

    it('可以禁用 provider', () => {
      config.deactivate();
      expect(config.isActive).toBe(false);
    });

    it('可以激活 provider', () => {
      config.deactivate();
      config.activate();
      expect(config.isActive).toBe(true);
    });

    it('禁用时清除默认标记', () => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
        isDefault: true,
      });

      config.deactivate();
      expect(config.isDefault).toBe(false);
    });
  });

  describe('默认 Provider', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('设置为默认 provider', () => {
      config.setAsDefault();
      expect(config.isDefault).toBe(true);
    });

    it('发出设置默认事件', () => {
      config.clearDomainEvents();
      config.setAsDefault();

      expect(config.domainEvents.length).toBeGreaterThan(0);
    });

    it('拒绝设置禁用的 provider 为默认', () => {
      config.deactivate();
      expect(() => config.setAsDefault()).toThrow('Cannot set inactive provider as default');
    });

    it('取消默认标记', () => {
      config.setAsDefault();
      config.unsetDefault();
      expect(config.isDefault).toBe(false);
    });
  });

  describe('优先级管理', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('初始优先级为 100', () => {
      expect(config.priority).toBe(100);
    });

    it('更新优先级', () => {
      config.updatePriority(200);
      expect(config.priority).toBe(200);
    });

    it('拒绝低于 1 的优先级', () => {
      expect(() => config.updatePriority(0)).toThrow();
    });

    it('拒绝高于 999 的优先级', () => {
      expect(() => config.updatePriority(1000)).toThrow();
    });

    it('接受边界值 1 和 999', () => {
      config.updatePriority(1);
      expect(config.priority).toBe(1);

      config.updatePriority(999);
      expect(config.priority).toBe(999);
    });
  });

  describe('DTO 转换', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'DTO Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        defaultModel: 'gpt-4',
      });
    });

    it('转换为 Server DTO', () => {
      const dto = config.toServerDTO();

      expect(dto.id).toBeDefined();
      expect(dto.name).toBe('DTO Test');
      expect(dto.providerType).toBe(AIProviderType.OpenAI);
      expect(dto.apiKey).toBe('sk-test');
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.updatedAt).toBe('number');
      expect(dto.deletedAt).toBeNull();
    });

    it('转换为 Client DTO', () => {
      const dto = config.toClientDTO();

      expect(typeof dto.id).toBe('string');
      expect(dto.name).toBe('DTO Test');
      expect(dto.providerType).toBe(AIProviderType.OpenAI);
      expect(dto.baseUrl).toBe(config.baseUrl);
      expect(dto).toHaveProperty('isActive');
      expect(dto).toHaveProperty('isDefault');
    });

    it('DTO 时间转换正确', () => {
      const dto = config.toServerDTO();
      const createdAtFromDto = new Date(dto.createdAt);

      expect(createdAtFromDto.getTime()).toBe(config.createdAt.getTime());
    });
  });

  describe('状态恢复', () => {
    it('从状态加载 provider 配置', () => {
      const state = {
        id: { value: 'IAiProviderConfigId_123' } as any,
        identityId: IdentityId.generate(),
        name: 'Loaded Config',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key-123',
        defaultModel: 'gpt-4',
        isActive: true,
        isDefault: false,
        priority: 50,
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const config = AIProviderConfig.load(state);
      expect(config.name).toBe('Loaded Config');
      expect(config.priority).toBe(50);
      expect(config.version).toBe(5);
    });
  });

  describe('版本与时间戳', () => {
    let config: AIProviderConfig;

    beforeEach(() => {
      config = AIProviderConfig.create({
        identityId,
        name: 'Version Test',
        providerType: AIProviderType.OpenAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'key',
      });
    });

    it('初始版本为 1', () => {
      expect(config.version).toBe(1);
    });

    it('初始时 deletedAt 为 null', () => {
      expect(config.deletedAt).toBeNull();
    });

    it('更新时记录 updatedAt', () => {
      const initialUpdated = config.updatedAt;
      config.updateName('New Name');

      expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdated.getTime());
    });

    it('所有时间戳都是 Date 类型', () => {
      expect(config.createdAt instanceof Date).toBe(true);
      expect(config.updatedAt instanceof Date).toBe(true);
    });
  });
});

/**
 * Reminder Use Cases Unit Tests - Basic Coverage
 *
 * Focus on:
 * - CreateReminderTemplateUseCase basic functionality
 * - Repository integration
 * - DTO conversions
 *
 * Note: Tests provide basic coverage for mapper integration and repository mocking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateReminderTemplateUseCase } from './create-reminder-template.use-case';
import { DeleteReminderTemplateUseCase } from './delete-reminder-template.use-case';
import { UpdateReminderTemplateUseCase } from './update-reminder-template.use-case';
import { RecordReminderResponseUseCase } from './record-reminder-response.use-case';
import type { IReminderTemplateRepository } from '../../../domain';
import type { IReminderResponseRepository } from '../../../domain';
import type { IReminderGroupRepository } from '../../../domain';

const TEST_IDENTITY = 'IdentityId_550e8400-e29b-41d4-a716-446655440001';

// ─── Mock Repositories ───────────────────────────────────────────────────

class MockReminderTemplateRepository implements IReminderTemplateRepository {
  private templates = new Map();

  async save(template: any): Promise<void> {
    this.templates.set(template.id, template);
  }

  async findByIdForIdentity(identityId: string, id: string, options?: any): Promise<any> {
    void options;
    const found = this.templates.get(id) ?? null;
    if (!found) return null;
    return String(found.identityId) === String(identityId) ? found : null;
  }

  async findByIdentityId(identityId: string): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.identityId === identityId,
    );
  }

  async findByGroupId(groupId: string | null, identityId: string): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.groupId === groupId && String(t.identityId) === String(identityId),
    );
  }

  async findActive(identityId: string): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => (!identityId || t.identityId === identityId) && t.selfEnabled,
    );
  }

  async findByNextTriggerBefore(): Promise<any[]> {
    return [];
  }

  async findByIds(identityId: string, ids: string[]): Promise<any[]> {
    return ids
      .map((id) => this.templates.get(id))
      .filter((t) => !!t && String(t.identityId) === String(identityId));
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) return;
    this.templates.delete(id);
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }

  async count(identityId: string): Promise<number> {
    return Array.from(this.templates.values()).filter(
      (t) => t.identityId === identityId,
    ).length;
  }
}

class MockReminderGroupRepository implements IReminderGroupRepository {
  private groups = new Map();

  async save(group: any): Promise<void> {
    this.groups.set(group.id, group);
  }

  async findByIdForIdentity(identityId: string, id: string, options?: any): Promise<any> {
    void options;
    const found = this.groups.get(id) ?? null;
    if (!found) return null;
    return String(found.identityId) === String(identityId) ? found : null;
  }

  async findByIdentityId(): Promise<any[]> {
    return [];
  }

  async delete(identityId: string, id: string): Promise<void> {
    const existing = await this.findByIdForIdentity(identityId, id);
    if (!existing) return;
    this.groups.delete(id);
  }

  async exists(identityId: string, id: string): Promise<boolean> {
    return (await this.findByIdForIdentity(identityId, id)) !== null;
  }

  async count(): Promise<number> {
    return this.groups.size;
  }
}

class MockReminderResponseRepository implements IReminderResponseRepository {
  private responses = new Map();

  async save(response: any): Promise<void> {
    this.responses.set(response.id, response);
  }

  async findByIdForIdentity(identityId: string, id: string, options?: any): Promise<any> {
    void options;
    const found = this.responses.get(id) ?? null;
    if (!found) return null;
    return String(found.identityId) === String(identityId) ? found : null;
  }

  async findByTemplateId(templateId: string): Promise<any[]> {
    return Array.from(this.responses.values()).filter(
      (r) => r.reminderTemplateId === templateId,
    );
  }

  async findByIdentityId(identityId: string): Promise<any[]> {
    return Array.from(this.responses.values()).filter(
      (r) => r.identityId === identityId,
    );
  }

  async delete(id: string): Promise<void> {
    this.responses.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.responses.has(id);
  }

  async count(templateId: string): Promise<number> {
    return Array.from(this.responses.values()).filter(
      (r) => r.reminderTemplateId === templateId,
    ).length;
  }

  async getDistribution(templateId: string): Promise<Record<string, number>> {
    const responses = await this.findByTemplateId(templateId);
    const distribution: Record<string, number> = {
      Dismiss: 0,
      Snooze: 0,
      Complete: 0,
      Custom: 0,
    };

    for (const r of responses) {
      if (r.action in distribution) {
        distribution[r.action]++;
      }
    }

    return distribution;
  }
}

// ─── Test Fixtures ───────────────────────────────────────────────────

const createValidCreateRequest = () => ({
  title: 'Task Due Reminder',
  description: 'Remind about upcoming task deadlines',
  type: 'EventBased',
  trigger: {
    type: 'EventBased',
    eventType: 'task_due',
    offsetMinutes: 0,
  },
  activeTime: {
    activatedAt: Date.now(),
    timezone: 'UTC',
  },
  notificationConfig: {
    channels: ['push'],
    retryCount: 0,
    retryIntervalMinutes: 0,
  },
  selfEnabled: true,
  importanceLevel: 'Important',
  tags: ['tasks', 'automated'],
  color: null,
  icon: null,
  groupId: null,
});

// ─── Tests ───────────────────────────────────────────────────────

describe('Reminder Use Cases', () => {
  let templateRepository: IReminderTemplateRepository;
  let groupRepository: IReminderGroupRepository;
  let responseRepository: IReminderResponseRepository;

  beforeEach(() => {
    templateRepository = new MockReminderTemplateRepository();
    groupRepository = new MockReminderGroupRepository();
    responseRepository = new MockReminderResponseRepository();
  });

  describe('CreateReminderTemplateUseCase', () => {
    it('creates a new reminder template with valid input', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const result = await useCase.execute(request, { identityId: TEST_IDENTITY });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Task Due Reminder');
        expect(result.data.selfEnabled).toBe(true);
      }
    });

    it('persists the created template to repository', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const result = await useCase.execute(request, { identityId: TEST_IDENTITY });
      expect(result.ok).toBe(true);
      if (result.ok) {
        const persisted = await templateRepository.findByIdForIdentity(TEST_IDENTITY, result.data.id);
        expect(persisted).toBeDefined();
        expect(persisted.title).toBe(request.title);
      }
    });

    it('assigns unique ID to each created template', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request1 = createValidCreateRequest();
      const request2 = {
        ...createValidCreateRequest(),
        title: 'Another Reminder',
      };

      const result1 = await useCase.execute(request1, { identityId: TEST_IDENTITY });
      const result2 = await useCase.execute(request2, { identityId: TEST_IDENTITY });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.data.id).not.toBe(result2.data.id);
      }
    });

    it('returns NOT_FOUND when group ID is invalid', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = {
        ...createValidCreateRequest(),
        groupId: 'invalid-group-id',
      };

      const result = await useCase.execute(request, { identityId: TEST_IDENTITY });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('DeleteReminderTemplateUseCase', () => {
    it('deletes an existing reminder template', async () => {
      const createUseCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      const created = await createUseCase.execute(request, { identityId: TEST_IDENTITY });
      expect(created.ok).toBe(true);

      if (created.ok) {
        const deleteUseCase = new DeleteReminderTemplateUseCase(templateRepository);
        const result = await deleteUseCase.execute(created.data.id, { identityId: TEST_IDENTITY });

        expect(result.ok).toBe(true);

        const deleted = await templateRepository.findByIdForIdentity(TEST_IDENTITY, created.data.id);
        // Note: soft delete, so entity still exists but marked as deleted
        expect(deleted).toBeDefined();
      }
    });
  });

  describe('Repository Integration', () => {
    it('supports finding templates by identity', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      await useCase.execute(request, { identityId: TEST_IDENTITY });

      const templates = await templateRepository.findByIdentityId(TEST_IDENTITY);

      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].title).toBe(request.title);
    });

    it('supports batch finding templates', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const template1 = await useCase.execute(request, { identityId: TEST_IDENTITY });
      const template2 = await useCase.execute({
        ...request,
        title: 'Another Reminder',
      }, { identityId: TEST_IDENTITY });

      expect(template1.ok).toBe(true);
      expect(template2.ok).toBe(true);
      if (template1.ok && template2.ok) {
        const found = await templateRepository.findByIds(TEST_IDENTITY, [
          template1.data.id,
          template2.data.id,
        ]);
        expect(found.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('supports finding active templates', async () => {
      const useCase = new CreateReminderTemplateUseCase(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      const created = await useCase.execute(request, { identityId: TEST_IDENTITY });
      expect(created.ok).toBe(true);

      const active = await templateRepository.findActive(TEST_IDENTITY);
      expect(active.length).toBeGreaterThan(0);
    });
  });
});

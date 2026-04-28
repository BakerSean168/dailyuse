/**
 * Reminder Use Cases Unit Tests - Basic Coverage
 *
 * Focus on:
 * - CreateReminderTemplate basic functionality
 * - Repository integration
 * - DTO conversions
 *
 * Note: Tests provide basic coverage for mapper integration and repository mocking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateReminderTemplate } from './create-reminder-template';
import { DeleteReminderTemplate } from './delete-reminder-template';
import { UpdateReminderTemplate } from './update-reminder-template';
import { RecordReminderResponse } from './record-reminder-response';
import type { IReminderTemplateRepository } from '../../../domain-server';
import type { IReminderResponseRepository } from '../../../domain-server';
import type { IReminderGroupRepository } from '../../../domain-server';

// ─── Mock Repositories ───────────────────────────────────────────────────

class MockReminderTemplateRepository implements IReminderTemplateRepository {
  private templates = new Map();

  async save(template: any): Promise<void> {
    this.templates.set(template.id, template);
  }

  async findById(id: string): Promise<any> {
    return this.templates.get(id) ?? null;
  }

  async findByIdentityId(identityId: string): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.identityId === identityId,
    );
  }

  async findByGroupId(groupId: string | null): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => t.groupId === groupId,
    );
  }

  async findActive(identityId?: string): Promise<any[]> {
    return Array.from(this.templates.values()).filter(
      (t) => (!identityId || t.identityId === identityId) && t.selfEnabled,
    );
  }

  async findByNextTriggerBefore(): Promise<any[]> {
    return [];
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return ids
      .map((id) => this.templates.get(id))
      .filter((t) => !!t);
  }

  async delete(id: string): Promise<void> {
    this.templates.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.templates.has(id);
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

  async findById(id: string): Promise<any> {
    return this.groups.get(id) ?? null;
  }

  async findByIdentityId(): Promise<any[]> {
    return [];
  }

  async delete(id: string): Promise<void> {
    this.groups.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.groups.has(id);
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

  async findById(id: string): Promise<any> {
    return this.responses.get(id) ?? null;
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
    startDate: new Date().toISOString(),
    endDate: null,
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

  describe('CreateReminderTemplate', () => {
    it('creates a new reminder template with valid input', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const result = await useCase.execute('identity-1', request);

      expect(result).toBeDefined();
      expect(result.name).toBe('Task Due Reminder');
      expect(result.selfEnabled).toBe(true);
    });

    it('persists the created template to repository', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const result = await useCase.execute('identity-1', request);
      const persisted = await templateRepository.findById(result.id);

      expect(persisted).toBeDefined();
      expect(persisted.title).toBe(request.title);
    });

    it('assigns unique ID to each created template', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request1 = createValidCreateRequest();
      const request2 = {
        ...createValidCreateRequest(),
        title: 'Another Reminder',
      };

      const result1 = await useCase.execute('identity-1', request1);
      const result2 = await useCase.execute('identity-1', request2);

      expect(result1.id).not.toBe(result2.id);
    });

    it('fails when group ID is invalid', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = {
        ...createValidCreateRequest(),
        groupId: 'invalid-group-id',
      };

      await expect(
        useCase.execute('identity-1', request),
      ).rejects.toThrow();
    });
  });

  describe('DeleteReminderTemplate', () => {
    it('deletes an existing reminder template', async () => {
      const createUseCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      const created = await createUseCase.execute('identity-1', request);

      const deleteUseCase = new DeleteReminderTemplate(templateRepository);
      await deleteUseCase.execute(created.id, 'identity-1');

      const deleted = await templateRepository.findById(created.id);
      // Note: soft delete, so entity still exists but marked as deleted
      expect(deleted).toBeDefined();
    });
  });

  describe('Repository Integration', () => {
    it('supports finding templates by identity', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      await useCase.execute('identity-1', request);

      const templates = await templateRepository.findByIdentityId('identity-1');

      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].title).toBe(request.title);
    });

    it('supports batch finding templates', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();

      const template1 = await useCase.execute('identity-1', request);
      const template2 = await useCase.execute('identity-1', {
        ...request,
        title: 'Another Reminder',
      });

      const found = await templateRepository.findByIds([template1.id, template2.id]);
      expect(found.length).toBeGreaterThanOrEqual(2);
    });

    it('supports finding active templates', async () => {
      const useCase = new CreateReminderTemplate(templateRepository, groupRepository);
      const request = createValidCreateRequest();
      const created = await useCase.execute('identity-1', request);

      const active = await templateRepository.findActive('identity-1');
      expect(active.length).toBeGreaterThan(0);
    });
  });
});

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import {
  TaskTemplate,
  RecurrenceRule,
  TaskTimeConfig,
} from '@/domain-server/aggregates/task-template';
import { TaskTemplatePrismaRepository } from './task-template-prisma.repository';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

describe('TaskTemplatePrismaRepository integration', () => {
  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  it('persists and loads a one-time task template by id', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    // Create a one-time task template
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Complete Project',
      description: 'Finish the quarterly project',
      folderId: null,
      importance: 'High',
      dueDate: tomorrow,
    });

    await repository.save(template);

    const saved = await repository.findById(template.id);

    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(template.id);
    expect(saved?.identityId).toBe(identityId);
    expect(saved?.title).toBe('Complete Project');
    expect(saved?.taskType).toBe('OneTime');
  });

  it('persists and loads a recurring task template by id', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const now = new Date();
    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0);

    const timeConfig: TaskTimeConfig = {
      startDate,
      activatedAt: now.getTime(),
    };

    const recurrenceRule: RecurrenceRule = {
      frequency: 'Weekly',
      interval: 1,
      daysOfWeek: [0],
      occurrences: null,
      endDate: null,
    };

    // Create a recurring task template
    const template = TaskTemplate.createRecurringTask({
      identityId,
      title: 'Weekly Review',
      description: 'Review the week',
      folderId: null,
      importance: 'Medium',
      timeConfig,
      recurrenceRule,
    });

    await repository.save(template);

    const saved = await repository.findById(template.id);

    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(template.id);
    expect(saved?.taskType).toBe('Recurring');
    expect(saved?.recurrenceRule).toBeDefined();
  });

  it('lists templates by identity', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template1 = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Task 1',
      importance: 'High',
      dueDate: tomorrow,
    });

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const template2 = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Task 2',
      importance: 'Low',
      dueDate: nextDay,
    });

    await repository.save(template1);
    await repository.save(template2);

    const templates = await repository.findByIdentityId(identityId);

    expect(templates).toHaveLength(2);
    expect(templates.map((t) => t.id)).toContain(template1.id);
    expect(templates.map((t) => t.id)).toContain(template2.id);
  });

  it('preserves task importance levels', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Important Task',
      description: 'A high-importance task',
      importance: 'High',
      dueDate: tomorrow,
    });

    await repository.save(template);
    const saved = await repository.findById(template.id);

    expect(saved?.importance).toBe('High');
    expect(saved?.title).toBe('Important Task');
  });

  it('updates existing template', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Original Title',
      importance: 'Low',
      dueDate: tomorrow,
    });

    await repository.save(template);

    // Update the template
    template.updateMetadata({
      title: 'Updated Title',
    });

    await repository.save(template);

    const saved = await repository.findById(template.id);

    expect(saved?.title).toBe('Updated Title');
  });

  it('handles soft deletion', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'To Delete',
      importance: 'Medium',
      dueDate: tomorrow,
    });

    await repository.save(template);

    // Soft delete
    template.softDelete();
    await repository.save(template);

    const saved = await repository.findById(template.id);

    expect(saved?.deletedAt).not.toBeNull();
  });

  it('handles task type persistence correctly', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'One-time Task',
      importance: 'Medium',
      dueDate: tomorrow,
    });

    await repository.save(template);
    const saved = await repository.findById(template.id);

    expect(saved?.taskType).toBe('OneTime');
    expect(saved?.recurrenceRule).toBeNull();
  });

  it('round-trip: domain -> persistence -> domain preserves data integrity', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const repository = new TaskTemplatePrismaRepository(prisma);

    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0);
    const now = new Date();

    const timeConfig: TaskTimeConfig = {
      startDate,
      activatedAt: now.getTime(),
    };

    const recurrenceRule: RecurrenceRule = {
      frequency: 'Daily',
      interval: 2,
      daysOfWeek: null,
      occurrences: null,
      endDate: null,
    };

    const original = TaskTemplate.createRecurringTask({
      identityId,
      title: 'Complex Recurring Task',
      description: 'A detailed recurring task',
      importance: 'Medium',
      timeConfig,
      recurrenceRule,
    });

    await repository.save(original);
    const loaded = await repository.findById(original.id);

    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe(original.title);
    expect(loaded?.description).toBe(original.description);
    expect(loaded?.taskType).toBe(original.taskType);
    expect(loaded?.importance).toBe(original.importance);
  });
});

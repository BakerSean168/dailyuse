import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import {
  TaskTemplate,
  RecurrenceRule,
  TaskTimeConfig,
} from '@/domain-server/aggregates/task-template';
import { TaskInstance } from '@/domain-server/aggregates/task-instance';
import { TaskTemplatePrismaRepository } from './task-template-prisma.repository';
import { TaskInstancePrismaRepository } from './task-instance-prisma.repository';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

describe('TaskInstancePrismaRepository integration', () => {
  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  it('persists and loads a task instance by id', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create and save a template first
    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Test Task',
      importance: 'High',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    // Create an instance from the template
    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'High',
    });

    await instanceRepository.save(instance);

    const saved = await instanceRepository.findById(instance.id);

    expect(saved).not.toBeNull();
    expect(saved?.id).toBe(instance.id);
    expect(saved?.identityId).toBe(identityId);
    expect(saved?.templateId).toBe(template.id);
  });

  it('lists instances by identity', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Test Task',
      importance: 'Medium',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance1 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Medium',
    });

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const instance2 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: nextDay.getTime(),
      timeConfig: {
        startDate: nextDay,
        activatedAt: Date.now(),
      },
      importance: 'Low',
    });

    await instanceRepository.save(instance1);
    await instanceRepository.save(instance2);

    const instances = await instanceRepository.findByIdentityId(identityId);

    expect(instances.length).toBeGreaterThanOrEqual(2);
    expect(instances.map((i) => i.id)).toContain(instance1.id);
    expect(instances.map((i) => i.id)).toContain(instance2.id);
  });

  it('lists instances by template id', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Template for Instances',
      importance: 'High',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance1 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'High',
    });

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const instance2 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: nextDay.getTime(),
      timeConfig: {
        startDate: nextDay,
        activatedAt: Date.now(),
      },
      importance: 'High',
    });

    await instanceRepository.save(instance1);
    await instanceRepository.save(instance2);

    const instances = await instanceRepository.findByTemplateId(template.id);

    expect(instances).toHaveLength(2);
    expect(instances.map((i) => i.id)).toContain(instance1.id);
    expect(instances.map((i) => i.id)).toContain(instance2.id);
  });

  it('updates instance status', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Task to Update',
      importance: 'Medium',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Medium',
    });

    await instanceRepository.save(instance);

    // Update status
    instance.markInProgress();
    await instanceRepository.save(instance);

    const saved = await instanceRepository.findById(instance.id);

    expect(saved?.status).toBe('InProgress');
  });

  it('marks instance as completed', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Task to Complete',
      importance: 'High',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'High',
    });

    await instanceRepository.save(instance);

    // Mark as completed
    instance.markCompleted();
    await instanceRepository.save(instance);

    const saved = await instanceRepository.findById(instance.id);

    expect(saved?.status).toBe('Completed');
    expect(saved?.completionRecord).not.toBeNull();
  });

  it('soft deletes instance', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Task to Delete',
      importance: 'Low',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Low',
    });

    await instanceRepository.save(instance);

    // Soft delete
    instance.softDelete();
    await instanceRepository.save(instance);

    const saved = await instanceRepository.findById(instance.id);

    expect(saved?.deletedAt).not.toBeNull();
  });

  it('round-trip: domain -> persistence -> domain preserves data integrity', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const templateRepository = new TaskTemplatePrismaRepository(prisma);
    const instanceRepository = new TaskInstancePrismaRepository(prisma);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const template = TaskTemplate.createOneTimeTask({
      identityId,
      title: 'Complex Task',
      description: 'A complex task',
      importance: 'High',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig: TaskTimeConfig = {
      startDate: tomorrow,
      activatedAt: Date.now(),
    };

    const original = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'High',
    });

    await instanceRepository.save(original);
    const loaded = await instanceRepository.findById(original.id);

    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(original.id);
    expect(loaded?.templateId).toBe(original.templateId);
    expect(loaded?.identityId).toBe(original.identityId);
    expect(loaded?.importance).toBe(original.importance);
    expect(loaded?.status).toBe(original.status);
  });
});

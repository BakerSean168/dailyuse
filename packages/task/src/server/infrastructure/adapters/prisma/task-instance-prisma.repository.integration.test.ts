import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import { TaskTemplate } from '@/server/domain/aggregates/task-template';
import { TaskTimeConfig } from '@/server/domain/value-objects';
import { TaskInstance } from '@/server/domain/aggregates/task-instance';
import { TaskTemplatePrismaRepository } from './task-template-prisma.repository';
import { TaskInstancePrismaRepository } from './task-instance-prisma.repository';
import {
  cleanTaskTables,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../../__tests__/integration-helpers';

function makeAllDayTimeConfig(startDate: Date): TaskTimeConfig {
  return TaskTimeConfig.createAllDay(startDate);
}

describe('TaskInstancePrismaRepository integration', () => {
  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanTaskTables();
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
      importance: 'Important',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    // Create an instance from the template
    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Important',
    });

    await instanceRepository.save(instance);

    const saved = await instanceRepository.findByIdForIdentity(identityId, instance.id);

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
      importance: 'Moderate',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance1 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Moderate',
    });

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const instance2 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: nextDay.getTime(),
      timeConfig: makeAllDayTimeConfig(nextDay),
      importance: 'Minor',
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
      importance: 'Important',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance1 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Important',
    });

    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 2);

    const instance2 = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: nextDay.getTime(),
      timeConfig: makeAllDayTimeConfig(nextDay),
      importance: 'Important',
    });

    await instanceRepository.save(instance1);
    await instanceRepository.save(instance2);

    const instances = await instanceRepository.findByTemplateId(template.id, String(template.identityId));

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
      importance: 'Moderate',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Moderate',
    });

    await instanceRepository.save(instance);

    // Update status
    instance.start();
    await instanceRepository.save(instance);

    const saved = await instanceRepository.findByIdForIdentity(identityId, instance.id);

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
      importance: 'Important',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Important',
    });

    await instanceRepository.save(instance);

    // Mark as completed
    instance.complete();
    await instanceRepository.save(instance);

    const saved = await instanceRepository.findByIdForIdentity(identityId, instance.id);

    expect(saved?.status).toBe('Completed');
    expect(saved?.actualEndTime).not.toBeNull();
  });

  it('deletes instance', async () => {
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
      importance: 'Minor',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const instance = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Minor',
    });

    await instanceRepository.save(instance);

    await instanceRepository.delete(instance.id);

    const saved = await instanceRepository.findByIdForIdentity(identityId, instance.id);

    expect(saved).toBeNull();
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
      importance: 'Important',
      dueDate: tomorrow,
    });
    await templateRepository.save(template);

    const timeConfig = makeAllDayTimeConfig(tomorrow);

    const original = TaskInstance.create({
      templateId: template.id,
      identityId,
      instanceDate: tomorrow.getTime(),
      timeConfig,
      importance: 'Important',
    });

    await instanceRepository.save(original);
    const loaded = await instanceRepository.findByIdForIdentity(String(original.identityId), original.id);

    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(original.id);
    expect(loaded?.templateId).toBe(original.templateId);
    expect(loaded?.identityId).toBe(original.identityId);
    expect(loaded?.importance).toBe(original.importance);
    expect(loaded?.status).toBe(original.status);
  });
});

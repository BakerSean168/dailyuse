import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ReminderType } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '@/server/domain/aggregates/reminder-group';
import { ReminderTemplate } from '@/server/domain/aggregates/reminder-template';
import { ReminderTemplatePrismaRepository } from './reminder-template-prisma.repository';
import { ReminderGroupPrismaRepository } from './reminder-group-prisma.repository';
import {
  cleanAll,
  disconnectPrisma,
  getPrisma,
  seedAccount,
} from '../../../__tests__/integration-helpers';

function createReminderTemplate(identityId: string, groupId: string) {
  const template = ReminderTemplate.create({
    identityId: identityId as IdentityId,
    title: 'Stretch and reset',
    type: ReminderType.Recurring,
    trigger: {
      type: 'FixedTime',
      fixedTime: { time: '09:30', timezone: null },
      interval: null,
    },
    activeTime: { activatedAt: Date.now() - 60_000 },
    notificationConfig: {
      channels: ['InApp'],
      title: 'Stretch break',
      body: 'Take five minutes away from the screen.',
      sound: { enabled: true, soundName: null },
      vibration: { enabled: true, pattern: null },
      actions: null,
    },
    description: 'Keep the workday sustainable.',
    importanceLevel: ImportanceLevel.Important,
    tags: ['health', 'focus'],
    color: '#14b8a6',
    icon: 'sparkles',
    groupId,
  });

  template.updateResponseMetrics({
    clickRate: 78,
    ignoreRate: 12,
    avgResponseTime: 6,
    snoozeCount: 1,
    effectivenessScore: 84,
    sampleSize: 25,
    lastAnalysisTime: Date.now(),
  });
  template.applyFrequencyAdjustment({
    originalInterval: 3600,
    adjustedInterval: 5400,
    adjustmentReason: 'Lower interruption during focus blocks',
    adjustmentTime: Date.now(),
    isAutoAdjusted: true,
    userConfirmed: false,
    rejectionReason: null,
  });
  template.recordTrigger();

  return template;
}

describe('ReminderTemplatePrismaRepository integration', () => {
  afterAll(async () => {
    await cleanAll();
    await disconnectPrisma();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  it('persists and reloads group relation, history children, smart-frequency fields, and nullables', async () => {
    const identityId = IdentityId.generate();
    await seedAccount({ id: identityId });

    const prisma = await getPrisma();
    const groupRepository = new ReminderGroupPrismaRepository(prisma);
    const repository = new ReminderTemplatePrismaRepository(prisma);
    const group = ReminderGroup.create({
      identityId,
      name: 'Wellbeing',
      description: 'Healthy cadence reminders',
      color: '#22c55e',
      icon: 'leaf',
    });
    await groupRepository.save(group);

    const template = createReminderTemplate(identityId, group.id);
    await repository.save(template);

    const row = await prisma.reminderTemplate.findUnique({
      where: { id: String(template.id) },
      include: { history: true },
    });
    const loaded = await repository.findById(String(template.id), { includeHistory: true });

    expect(row).not.toBeNull();
    expect(row?.activeHours).toBeNull();
    expect(row?.reminderGroupId).toBe(group.id);
    expect(row?.history).toHaveLength(1);
    expect(row?.trigger).toContain('FixedTime');
    expect(row?.notificationConfig).toContain('Stretch break');

    expect(loaded).not.toBeNull();
    expect(loaded?.groupId).toBe(group.id);
    expect(loaded?.type).toBe(ReminderType.Recurring);
    expect(loaded?.history).toHaveLength(1);
    expect(loaded?.responseMetrics?.clickRate).toBe(78);
    expect(loaded?.frequencyAdjustment?.adjustedInterval).toBe(5400);
    expect(loaded?.description).toBe('Keep the workday sustainable.');
  });

  it('lists templates by identity without leaking foreign reminders', async () => {
    const identityId = IdentityId.generate();
    const otherIdentityId = IdentityId.generate();
    await seedAccount({ id: identityId });
    await seedAccount({ id: otherIdentityId });

    const prisma = await getPrisma();
    const groupRepository = new ReminderGroupPrismaRepository(prisma);
    const repository = new ReminderTemplatePrismaRepository(prisma);
    const firstGroup = ReminderGroup.create({ identityId, name: 'Health' });
    const otherGroup = ReminderGroup.create({ identityId: otherIdentityId, name: 'Foreign' });
    await groupRepository.save(firstGroup);
    await groupRepository.save(otherGroup);

    await repository.save(createReminderTemplate(identityId, firstGroup.id));
    await repository.save(createReminderTemplate(identityId, firstGroup.id));
    await repository.save(createReminderTemplate(otherIdentityId, otherGroup.id));

    const templates = await repository.findByIdentityId(identityId);

    expect(templates).toHaveLength(2);
    expect(templates.every((template) => template.identityId === identityId)).toBe(true);
  });
});

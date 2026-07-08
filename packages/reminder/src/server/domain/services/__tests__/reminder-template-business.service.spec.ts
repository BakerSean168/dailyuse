import { describe, expect, it } from 'vitest';
import { ControlMode, ReminderStatus, ReminderType } from '@dailyuse/contracts/reminder';
import { IdentityId } from '@dailyuse/domain-shared';
import { ReminderGroup } from '../../aggregates/reminder-group';
import { ReminderTemplate } from '../../aggregates/reminder-template';
import { ReminderTemplateBusinessService } from '../reminder-template-business-service';

function createTemplate(overrides: {
  identityId?: IdentityId;
  status?: ReminderStatus;
  groupId?: string | null;
  deleted?: boolean;
} = {}) {
  const template = ReminderTemplate.create({
    identityId: overrides.identityId ?? IdentityId.generate(),
    title: 'Template',
    type: ReminderType.Recurring,
    groupId: overrides.groupId ?? undefined,
    trigger: {
      type: 'FixedTime',
      fixedTime: { time: '08:00', timezone: null },
      interval: null,
    },
    activeTime: { activatedAt: Date.now() - 60_000 },
    notificationConfig: {
      channels: ['InApp'],
      title: null,
      body: null,
      sound: null,
      vibration: null,
      actions: null,
    },
  });

  if (overrides.status === ReminderStatus.Paused) {
    template.pause();
  }
  if (overrides.deleted) {
    template.softDelete();
  }

  return template;
}

function createGroup(identityId: string, overrides: { controlMode?: ControlMode; status?: ReminderStatus } = {}) {
  const group = ReminderGroup.create({
    identityId,
    name: 'Group',
    controlMode: overrides.controlMode,
  });

  if (overrides.status === ReminderStatus.Paused) {
    group.pause();
  }

  return group;
}

describe('ReminderTemplateBusinessService', () => {
  const service = new ReminderTemplateBusinessService();

  it('respects the global reminder switch before group logic', () => {
    const template = createTemplate();
    const result = service.calculateEffectiveEnabled(template, null, false);

    expect(result.isEffectivelyEnabled).toBe(false);
    expect(result.reason).toBe('全局提醒总开关已关闭');
  });

  it('uses template status for ungrouped and individual-control templates', () => {
    const identityId = IdentityId.generate();
    const group = createGroup(String(identityId), {
      controlMode: ControlMode.Individual,
      status: ReminderStatus.Paused,
    });

    expect(service.calculateEffectiveEnabled(createTemplate({ identityId }), null).isEffectivelyEnabled).toBe(
      true,
    );
    expect(
      service.calculateEffectiveEnabled(
        createTemplate({ identityId, status: ReminderStatus.Paused, groupId: group.id }),
        group,
      ).isEffectivelyEnabled,
    ).toBe(false);
  });

  it('uses group status for group-control templates and reports reasons', () => {
    const identityId = IdentityId.generate();
    const pausedGroup = createGroup(String(identityId), {
      controlMode: ControlMode.Group,
      status: ReminderStatus.Paused,
    });
    const activeGroup = createGroup(String(identityId), {
      controlMode: ControlMode.Group,
      status: ReminderStatus.Active,
    });

    const paused = service.calculateEffectiveEnabled(
      createTemplate({ identityId, groupId: pausedGroup.id }),
      pausedGroup,
    );
    const active = service.calculateEffectiveEnabled(
      createTemplate({
        identityId,
        groupId: activeGroup.id,
        status: ReminderStatus.Paused,
      }),
      activeGroup,
    );

    expect(paused.isEffectivelyEnabled).toBe(false);
    expect(paused.reason).toContain('分组已暂停');
    expect(active.isEffectivelyEnabled).toBe(true);
    expect(active.reason).toContain('模板自身状态已暂停，但当前由分组接管');
  });

  it('calculates batch status using the provided group map', () => {
    const identityId = IdentityId.generate();
    const group = createGroup(String(identityId), { controlMode: ControlMode.Group });
    const template = createTemplate({ identityId, groupId: group.id });
    const standalone = createTemplate({ identityId });

    const result = service.calculateEffectiveEnabledBatch(
      [template, standalone],
      new Map([[group.id, group]]),
    );

    expect(result.get(template.id)?.controlMode).toBe(ControlMode.Group);
    expect(result.get(standalone.id)?.groupStatus).toBeNull();
  });

  it('validates group assignment and deletion semantics', () => {
    const identityId = IdentityId.generate();
    const template = createTemplate({ identityId });
    const foreignGroup = createGroup(String(IdentityId.generate()));

    expect(service.validateGroupAssignment(template, null)).toEqual({ valid: true });
    expect(service.validateGroupAssignment(template, foreignGroup)).toEqual(
      expect.objectContaining({ valid: false }),
    );
    expect(service.validateTemplateDeletion(createTemplate({ deleted: true }), false)).toEqual({
      valid: false,
      reason: '模板已被软删除，无法再次软删除',
    });
    expect(service.validateTemplateDeletion(template, true)).toEqual({ valid: true });
  });
});

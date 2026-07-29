import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControlMode, ReminderStatus, ReminderType } from '@memoflow/contracts/reminder';
import { IdentityId } from '@memoflow/domain-shared';
import { ReminderGroup } from '../../aggregates/reminder-group';
import { ReminderTemplate } from '../../aggregates/reminder-template';
import { ReminderTemplateControlService } from '../reminder-template-control-service';

function createTemplate(overrides: {
  identityId?: IdentityId;
  groupId?: string | null;
  status?: ReminderStatus;
} = {}) {
  const template = ReminderTemplate.create({
    identityId: overrides.identityId ?? IdentityId.generate(),
    title: 'Template',
    type: ReminderType.Recurring,
    groupId: overrides.groupId ?? undefined,
    trigger: {
      type: 'FixedTime',
      fixedTime: { time: '09:00', timezone: null },
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

describe('ReminderTemplateControlService', () => {
  const templateRepository = {
    findByGroupId: vi.fn(),
    findByIdentityId: vi.fn(),
  } as any;
  const groupRepository = {
    findByIdForIdentity: vi.fn(),
    findByIds: vi.fn(),
  } as any;
  const preferenceRepository = {
    findByIdentityId: vi.fn(),
  } as any;

  let service: ReminderTemplateControlService;

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceRepository.findByIdentityId.mockResolvedValue(null);
    groupRepository.findByIdForIdentity.mockResolvedValue(null);
    groupRepository.findByIds.mockResolvedValue([]);
    service = new ReminderTemplateControlService(
      templateRepository,
      groupRepository,
      preferenceRepository,
    );
  });

  it('returns a global paused status when the identity disables all reminders', async () => {
    const template = createTemplate();
    preferenceRepository.findByIdentityId.mockResolvedValue({ globalReminderEnabled: false });

    const result = await service.calculateEffectiveStatus(template);

    expect(result.effectiveStatus).toBe(ReminderStatus.Paused);
    expect(result.isEffectivelyEnabled).toBe(false);
    expect(result.lifecycleSource).toBe('global');
  });

  it('uses template status for ungrouped templates', async () => {
    const active = await service.calculateEffectiveStatus(createTemplate());
    const paused = await service.calculateEffectiveStatus(
      createTemplate({ status: ReminderStatus.Paused }),
    );

    expect(active.effectiveStatus).toBe(ReminderStatus.Active);
    expect(active.statusReason).toBe('未分组，使用模板自身状态');
    expect(paused.effectiveStatus).toBe(ReminderStatus.Paused);
  });

  it('falls back to template status when the referenced group is missing', async () => {
    const template = createTemplate({ groupId: 'missing-group' });

    const result = await service.calculateEffectiveStatus(template);

    expect(groupRepository.findByIdForIdentity).toHaveBeenCalled();
    expect(result.lifecycleSource).toBe('template');
    expect(result.statusReason).toBe('分组不存在，使用模板自身状态');
  });

  it('uses template status in individual control mode even when the group is paused', async () => {
    const identityId = IdentityId.generate();
    const group = createGroup(String(identityId), {
      controlMode: ControlMode.Individual,
      status: ReminderStatus.Paused,
    });
    const template = createTemplate({ identityId, groupId: group.id });

    const result = await service.calculateEffectiveStatus(template, group);

    expect(result.effectiveStatus).toBe(ReminderStatus.Active);
    expect(result.lifecycleSource).toBe('template');
    expect(result.groupEnabled).toBe(false);
  });

  it('uses group status in group control mode', async () => {
    const identityId = IdentityId.generate();
    const pausedGroup = createGroup(String(identityId), {
      controlMode: ControlMode.Group,
      status: ReminderStatus.Paused,
    });
    const activeGroup = createGroup(String(identityId), {
      controlMode: ControlMode.Group,
      status: ReminderStatus.Active,
    });

    const pausedResult = await service.calculateEffectiveStatus(
      createTemplate({ identityId, groupId: pausedGroup.id }),
      pausedGroup,
    );
    const activeResult = await service.calculateEffectiveStatus(
      createTemplate({
        identityId,
        groupId: activeGroup.id,
        status: ReminderStatus.Paused,
      }),
      activeGroup,
    );

    expect(pausedResult.effectiveStatus).toBe(ReminderStatus.Paused);
    expect(pausedResult.lifecycleSource).toBe('group');
    expect(activeResult.effectiveStatus).toBe(ReminderStatus.Active);
    expect(activeResult.statusReason).toContain('模板自身已暂停，但当前由分组接管');
  });

  it('calculates batch status and filters enabled templates for group and identity queries', async () => {
    const identityId = IdentityId.generate();
    const group = createGroup(String(identityId), {
      controlMode: ControlMode.Individual,
      status: ReminderStatus.Active,
    });
    const enabled = createTemplate({ identityId, groupId: group.id });
    const paused = createTemplate({
      identityId,
      groupId: group.id,
      status: ReminderStatus.Paused,
    });
    const ungrouped = createTemplate({ identityId });

    groupRepository.findByIdForIdentity.mockResolvedValue(group);
    groupRepository.findByIds.mockResolvedValue([group]);
    templateRepository.findByGroupId.mockResolvedValue([enabled, paused]);
    templateRepository.findByIdentityId.mockResolvedValue([enabled, paused, ungrouped]);

    const batch = await service.calculateEffectiveStatusBatch([enabled, paused, ungrouped]);
    const inGroup = await service.getEffectivelyEnabledTemplatesInGroup(String(group.identityId), group.id);
    const byIdentity = await service.getEffectivelyEnabledTemplatesByIdentityId(String(identityId));

    expect(batch).toHaveLength(3);
    expect(batch.find((item) => item.templateId === enabled.id)?.isEffectivelyEnabled).toBe(true);
    expect(batch.find((item) => item.templateId === paused.id)?.isEffectivelyEnabled).toBe(false);
    expect(await service.isTemplateEffectivelyEnabled(enabled)).toBe(true);
    expect(inGroup.map((item) => item.id)).toEqual([enabled.id]);
    expect(byIdentity.map((item) => item.id)).toEqual([enabled.id, ungrouped.id]);
  });
});

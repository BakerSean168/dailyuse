import type { ComposerTranslation } from 'vue-i18n';
import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';

type Translate = ComposerTranslation;

export function getTemplateLifecycleSummary(t: Translate, template: ReminderTemplateClientDTO) {
  if (template.lifecycleSource === 'global') return t('reminder.lifecycle.sourceGlobal');
  if (template.lifecycleSource === 'group') return t('reminder.lifecycle.sourceGroup');
  return template.groupName
    ? t('reminder.lifecycle.sourceTemplateInGroup')
    : t('reminder.lifecycle.sourceTemplateAtRoot');
}

export function getTemplateLifecycleBadgeText(t: Translate, template: ReminderTemplateClientDTO) {
  if (template.lifecycleSource === 'global') return t('reminder.lifecycle.badgeGlobalPaused');
  if (template.lifecycleSource === 'group') return t('reminder.lifecycle.badgeGroupControlled');
  return t('reminder.lifecycle.badgeSelfControlled');
}

export function getTemplateEffectiveStatusLabel(t: Translate, template: ReminderTemplateClientDTO) {
  return template.effectiveEnabled
    ? t('reminder.lifecycle.statusRunning')
    : t('reminder.lifecycle.statusPaused');
}

export function getTemplateEffectiveResultLabel(t: Translate, template: ReminderTemplateClientDTO) {
  return template.effectiveEnabled
    ? t('reminder.lifecycle.resultRunningNow')
    : t('reminder.lifecycle.resultPausedNow');
}

export function getTemplateSelfSwitchLabel(t: Translate, template: ReminderTemplateClientDTO) {
  return template.selfEnabled
    ? t('reminder.lifecycle.selfEnabledVerbose')
    : t('reminder.lifecycle.selfPausedVerbose');
}

export function getTemplateSelfSwitchShortLabel(t: Translate, template: ReminderTemplateClientDTO) {
  return template.selfEnabled
    ? t('reminder.lifecycle.enabledShort')
    : t('reminder.lifecycle.pausedShort');
}

export function getGlobalSwitchLabel(t: Translate, template: ReminderTemplateClientDTO) {
  return template.globalReminderEnabled
    ? t('reminder.lifecycle.enabledShort')
    : t('reminder.lifecycle.globalPausedAll');
}

export function getGroupControlModeLabel(t: Translate, template: ReminderTemplateClientDTO) {
  if (!template.groupControlMode) return t('reminder.lifecycle.noGroup');
  return template.groupControlMode === 'Group'
    ? t('reminder.lifecycle.groupControlModeGroup')
    : t('reminder.lifecycle.groupControlModeIndividual');
}

export function getGroupSwitchLabel(t: Translate, template: ReminderTemplateClientDTO) {
  if (template.groupEnabled === null) return t('reminder.lifecycle.noGroup');
  return template.groupEnabled
    ? t('reminder.lifecycle.groupEnabled')
    : t('reminder.lifecycle.groupPaused');
}

export function getGroupControlModeText(
  t: Translate,
  group: Pick<ReminderGroupClientDTO, 'controlMode'>,
) {
  return group.controlMode === 'Group'
    ? t('reminder.lifecycle.groupControlModeGroup')
    : t('reminder.lifecycle.groupControlModeIndividual');
}

export function getGroupPolicyText(
  t: Translate,
  group: Pick<ReminderGroupClientDTO, 'controlMode' | 'enabled'>,
) {
  if (group.controlMode === 'Group') {
    return group.enabled
      ? t('reminder.lifecycle.groupPolicyGroupEnabled')
      : t('reminder.lifecycle.groupPolicyGroupPaused');
  }
  return t('reminder.lifecycle.groupPolicyIndividual');
}

export function getGroupTemplateCountLabel(
  t: Translate,
  group: Pick<ReminderGroupClientDTO, 'stats'>,
) {
  return t('reminder.linear.templateCountValue', { count: group.stats.totalTemplates });
}

export function getGroupActiveStatusLabel(
  t: Translate,
  group: Pick<ReminderGroupClientDTO, 'stats'>,
) {
  return t('reminder.linear.currentStatusValue', { count: group.stats.activeTemplates });
}

export function getTemplateTriggerLabel(t: Translate, template: ReminderTemplateClientDTO) {
  if (template.trigger?.fixedTime?.time) {
    return t('reminder.templateDetail.triggerSummaryTime', {
      time: template.trigger.fixedTime.time,
    });
  }
  if (template.trigger?.interval?.minutes) {
    return t('reminder.templateDetail.triggerSummaryInterval', {
      minutes: template.trigger.interval.minutes,
    });
  }
  return t('reminder.templateDetail.notConfigured');
}

export function getGroupSidebarSummary(
  t: Translate,
  group: Pick<ReminderGroupClientDTO, 'id' | 'controlMode' | 'enabled'>,
  templates: Array<
    Pick<ReminderTemplateClientDTO, 'groupId' | 'lifecycleSource' | 'effectiveEnabled'>
  >,
) {
  const scopedTemplates = templates.filter((template) => template.groupId === group.id);
  const pausedByGlobal = scopedTemplates.filter(
    (template) => template.lifecycleSource === 'global',
  ).length;
  const pausedByGroup = scopedTemplates.filter(
    (template) => template.lifecycleSource === 'group' && !template.effectiveEnabled,
  ).length;

  if (pausedByGlobal > 0) {
    return t('reminder.linear.sidebarGlobalPaused', { count: pausedByGlobal });
  }
  if (pausedByGroup > 0) {
    return t('reminder.linear.sidebarGroupPaused', { count: pausedByGroup });
  }
  return getGroupPolicyText(t, group);
}

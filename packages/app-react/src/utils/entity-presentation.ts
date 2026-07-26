import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { formatProductDateTime, emptyKind } from './product-time';

// Soft residual 1101: presentation 0-fallback toTimestamp keep-boundary (≠ projection/AI/notification).
function toTimestamp(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * Residual 1204: app-react formatDateTime — session product-time + empty catalog dash.
 * Uses toTimestamp 0-fallback; empty → '-'.
 */
export function formatDateTime(value: number | string | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return emptyKind('dash');
  }
  return formatProductDateTime(timestamp, emptyKind('dash'));
}

export function getReminderDisplayTitle(template: Pick<ReminderTemplateClientDTO, 'name'>): string {
  return template.name;
}

export function getReminderTriggerText(
  template: Pick<ReminderTemplateClientDTO, 'trigger'>,
): string {
  const parts: string[] = [];

  if (template.trigger.type) {
    parts.push(template.trigger.type);
  }

  if (template.trigger.interval?.minutes) {
    parts.push(`Every ${template.trigger.interval.minutes} min`);
  }

  if (template.trigger.fixedTime?.time) {
    parts.push(template.trigger.fixedTime.time);
  }

  return parts.join(' · ') || 'No trigger configured';
}

export function getReminderImportanceText(
  template: Pick<ReminderTemplateClientDTO, 'importanceLevel'>,
): string {
  return template.importanceLevel;
}

export function getReminderNextTriggerText(
  template: Pick<ReminderTemplateClientDTO, 'nextTriggerAt'>,
): string {
  return template.nextTriggerAt ? formatDateTime(template.nextTriggerAt) : 'Not scheduled';
}

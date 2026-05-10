import type {
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';
import type {
  RepositoryClientDTO,
  ResourceClientDTO,
} from '@dailyuse/contracts/repository';

import { formatFileSize } from './file-utils';

function stripTrailingExtension(value: string): string {
  return value.replace(/\.[^.]+$/, '');
}

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

export function formatDateTime(value: number | string | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function getResourceDisplayName(resource: Pick<ResourceClientDTO, 'name' | 'path'>): string {
  const rawName = resource.name?.trim() || resource.path?.split('/').pop()?.trim() || 'resource';
  const withoutExtension = stripTrailingExtension(rawName).trim();
  return withoutExtension || rawName;
}

export function getResourceTypeText(resource: Pick<ResourceClientDTO, 'type' | 'mimeType' | 'extension'>): string {
  if (resource.mimeType?.startsWith('text/markdown') || resource.extension === '.md') {
    return 'Markdown';
  }

  if (resource.mimeType?.startsWith('image/')) {
    return 'Image';
  }

  if (resource.mimeType?.startsWith('video/')) {
    return 'Video';
  }

  if (resource.mimeType?.startsWith('audio/')) {
    return 'Audio';
  }

  return resource.type;
}

export function getResourceStatusText(resource: Pick<ResourceClientDTO, 'status'>): string {
  return resource.status;
}

export function getResourceFormattedSize(resource: Pick<ResourceClientDTO, 'size'>): string {
  return formatFileSize(resource.size);
}

export function getRepositoryStatusText(
  repository: Pick<RepositoryClientDTO, 'status'>,
): string {
  return repository.status;
}

export function getReminderDisplayTitle(
  template: Pick<ReminderTemplateClientDTO, 'name'>,
): string {
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

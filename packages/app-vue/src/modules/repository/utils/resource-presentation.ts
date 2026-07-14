import { File, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from '@lucide/vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

type ResourcePresentationInput = Pick<
  ResourceClientDTO,
  | 'name'
  | 'path'
  | 'extension'
  | 'mimeType'
  | 'size'
  | 'type'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
>;

function stripTrailingExtension(value: string): string {
  return value.replace(/\.[^.]+$/, '');
}

function toTimestamp(value: string | number | null | undefined): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatTimestamp(value: string | number | null | undefined): string {
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

export function getResourceDisplayName(resource: {
  name?: string | null;
  path?: string | null;
}): string {
  const rawName = resource.name?.trim() || resource.path?.split('/').pop()?.trim() || 'resource';
  const withoutExtension = stripTrailingExtension(rawName).trim();
  return withoutExtension || rawName;
}

export function getResourceFormattedSize(resource: Pick<ResourcePresentationInput, 'size'>): string {
  const bytes = resource.size;
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const fixed = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${fixed} ${units[unitIndex]}`;
}

export function getResourceCreatedAtText(
  resource: Pick<ResourcePresentationInput, 'createdAt'>,
): string {
  return formatTimestamp(resource.createdAt);
}

export function getResourceUpdatedAtText(
  resource: Pick<ResourcePresentationInput, 'updatedAt'>,
): string {
  return formatTimestamp(resource.updatedAt);
}

export function getResourceTypeText(resource: Pick<ResourcePresentationInput, 'mimeType' | 'extension' | 'type'>): string {
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

export function getResourceStatusText(resource: Pick<ResourcePresentationInput, 'status'>): string {
  return resource.status;
}

export function isMarkdownResource(resource: ResourceClientDTO): boolean {
  return (
    resource.mimeType?.startsWith('text/markdown') ||
    resource.extension === '.md' ||
    resource.name?.endsWith('.md') ||
    false
  );
}

export function getResourceMediaType(
  resource: ResourceClientDTO,
): 'image' | 'video' | 'audio' | null {
  const mime = resource.mimeType || '';
  const ext = (resource.extension || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.avif'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/')) return 'video';
  if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/')) return 'audio';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
    return 'audio';
  }
  return null;
}

export function getResourceIcon(resource: ResourceClientDTO): LucideIcon {
  const mime = resource.mimeType || '';
  const ext = resource.extension || '';
  if (mime.startsWith('text/markdown') || ext === '.md') return FileText;
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(ext)) {
    return FileImage;
  }
  if (mime.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(ext)) {
    return FileVideo;
  }
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(ext)) {
    return FileAudio;
  }
  return File;
}

import { File, FileAudio, FileImage, FileText, FileVideo, type LucideIcon } from 'lucide-vue-next';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

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
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return null;
}

export function getResourceIcon(resource: ResourceClientDTO): LucideIcon {
  const mime = resource.mimeType || '';
  const ext = resource.extension || '';
  if (mime.startsWith('text/markdown') || ext === '.md') return FileText;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('video/')) return FileVideo;
  if (mime.startsWith('audio/')) return FileAudio;
  return File;
}

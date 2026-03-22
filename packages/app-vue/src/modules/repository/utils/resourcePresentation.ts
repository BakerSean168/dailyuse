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

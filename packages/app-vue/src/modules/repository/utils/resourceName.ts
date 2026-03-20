import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export function normalizeRenamedResourceName(
  resource: Pick<ResourceClientDTO, 'name' | 'extension'>,
  nextName: string,
): string {
  const trimmedName = nextName.trim();
  if (!trimmedName) {
    return '';
  }

  const extension = normalizeExtension(resource.extension);
  if (!extension || hasExtension(trimmedName)) {
    return trimmedName;
  }

  return `${trimmedName}${extension}`;
}

function normalizeExtension(extension?: string | null): string {
  if (!extension) {
    return '';
  }

  return extension.startsWith('.') ? extension : `.${extension}`;
}

function hasExtension(value: string): boolean {
  return /\.[^./\\]+$/.test(value);
}

export const __test__ = {
  hasExtension,
};

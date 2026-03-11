import { computed, type ComputedRef, type Ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type {
  RepositoryUploadFailure,
  RepositoryUploadResult,
} from '../../repository/composables/useRepository';
import { useRepository } from '../../repository/composables/useRepository';

export interface EditorSelectionRange {
  from: number;
  to: number;
}

export interface InsertTextAtRange {
  (text: string, selection?: EditorSelectionRange): void;
}

export interface InsertUploadedImagesOptions {
  files: File[];
  currentNoteName?: string | null;
  insertText: InsertTextAtRange;
  selection?: EditorSelectionRange;
  tags?: string[];
  now?: Date;
}

export interface InsertExistingImageOptions {
  resource: ResourceClientDTO;
  insertText: InsertTextAtRange;
  selection?: EditorSelectionRange;
}

export interface ResourceInsertionResult {
  insertedText: string;
  insertedResources: ResourceClientDTO[];
  failures: RepositoryUploadFailure[];
}

export interface ResourceInsertionFeedback {
  successCount: number;
  failureCount: number;
  hasSuccess: boolean;
  hasFailure: boolean;
  isPartial: boolean;
}

interface ResourceInsertionDependencies {
  resources: Ref<ResourceClientDTO[]> | ComputedRef<ResourceClientDTO[]>;
  uploadResources: (files: File[], tags?: string[]) => Promise<RepositoryUploadResult>;
}

export function createResourceInsertion(dependencies: ResourceInsertionDependencies) {
  const imageResources = computed(() => filterImageResources(dependencies.resources.value));

  async function insertUploadedImages(
    options: InsertUploadedImagesOptions,
  ): Promise<ResourceInsertionResult> {
    const imageFiles = options.files.filter(isImageFile);
    if (imageFiles.length === 0) {
      return {
        insertedText: '',
        insertedResources: [],
        failures: [],
      };
    }

    const timestamp = options.now ?? new Date();
    const renamedFiles = imageFiles.map((file, index) =>
      renameFile(
        file,
        buildPastedImageFileName({
          noteName: options.currentNoteName,
          originalName: file.name,
          mimeType: file.type,
          index,
          now: timestamp,
        }),
      ),
    );

    const uploadResult = await dependencies.uploadResources(renamedFiles, options.tags ?? []);
    const insertedResources = uploadResult.successes.filter(
      (resource) => isImageResource(resource) && Boolean(resource.path),
    );
    const insertedText = insertedResources
      .map((resource) => buildMarkdownImageReference(resource))
      .join('\n');

    if (insertedText) {
      options.insertText(insertedText, options.selection);
    }

    return {
      insertedText,
      insertedResources,
      failures: uploadResult.failures,
    };
  }

  function insertExistingImage(options: InsertExistingImageOptions): string {
    const markdown = buildMarkdownImageReference(options.resource);
    options.insertText(markdown, options.selection);
    return markdown;
  }

  return {
    imageResources,
    insertUploadedImages,
    insertExistingImage,
  };
}

export function useResourceInsertion() {
  const repository = useRepository();

  return createResourceInsertion({
    resources: repository.resources,
    uploadResources: (files, tags = []) => repository.uploadResources(files, tags),
  });
}

export function filterImageResources(resources: ResourceClientDTO[]): ResourceClientDTO[] {
  return [...resources]
    .filter((resource) => isImageResource(resource) && Boolean(resource.path))
    .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0));
}

export function getResourceInsertionFeedback(
  result: Pick<ResourceInsertionResult, 'insertedResources' | 'failures'>,
): ResourceInsertionFeedback {
  const successCount = result.insertedResources.length;
  const failureCount = result.failures.length;

  return {
    successCount,
    failureCount,
    hasSuccess: successCount > 0,
    hasFailure: failureCount > 0,
    isPartial: successCount > 0 && failureCount > 0,
  };
}

export function isImageResource(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension'>,
): boolean {
  if (resource.mimeType?.startsWith('image/')) {
    return true;
  }

  return /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(resource.extension ?? '');
}

export function isImageFile(file: Pick<File, 'type' | 'name'>): boolean {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(file.name);
}

export function buildMarkdownImageReference(
  resource: Pick<ResourceClientDTO, 'name' | 'displayName' | 'path'>,
): string {
  if (!resource.path) {
    throw new Error('Repository image resource is missing a path.');
  }

  return `![${escapeMarkdownAltText(deriveImageAltText(resource))}](${resource.path})`;
}

export function deriveImageAltText(
  resource: Pick<ResourceClientDTO, 'name' | 'displayName'>,
): string {
  const rawName = resource.displayName?.trim() || resource.name.trim();
  const withoutExtension = rawName.replace(/\.[^.]+$/, '').trim();
  return withoutExtension || 'image';
}

export function buildPastedImageFileName(input: {
  noteName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  index: number;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const noteSlug = slugifyNoteName(input.noteName);
  const extension =
    resolveFileExtension(input.originalName ?? undefined) ||
    resolveExtensionFromMimeType(input.mimeType ?? undefined) ||
    'png';

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const sequence = String(input.index + 1).padStart(2, '0');

  return `${noteSlug}-${date}-${time}-${sequence}.${extension}`;
}

function slugifyNoteName(noteName?: string | null): string {
  const raw = (noteName ?? 'note')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase();

  const slug = raw
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || 'note';
}

function resolveFileExtension(fileName?: string): string | null {
  if (!fileName) {
    return null;
  }

  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match?.[1] ?? null;
}

function resolveExtensionFromMimeType(mimeType?: string): string | null {
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/avif': 'avif',
  };

  return mimeType ? (mimeMap[mimeType.toLowerCase()] ?? null) : null;
}

function renameFile(file: File, nextName: string): File {
  return new File([file], nextName, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

function escapeMarkdownAltText(value: string): string {
  return value.replace(/([\[\]\\])/g, '\\$1');
}

export const __test__ = {
  buildPastedImageFileName,
  buildMarkdownImageReference,
  deriveImageAltText,
  filterImageResources,
  getResourceInsertionFeedback,
  isImageFile,
  isImageResource,
  createResourceInsertion,
};

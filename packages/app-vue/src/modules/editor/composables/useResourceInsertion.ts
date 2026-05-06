import { computed, type ComputedRef, type Ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type {
  RepositoryUploadFailure,
  RepositoryUploadResult,
} from '../../repository/composables/useRepository';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';
import { getResourceDisplayName } from '../../repository/utils/resourcePresentation';
import { serializeMarkdownResourceReference } from '../utils/markdownResourceReferences';

export interface EditorSelectionRange {
  from: number;
  to: number;
}

export interface InsertTextAtRange {
  (text: string, selection?: EditorSelectionRange): void;
}

export type ResourceInsertionMode = 'path' | 'base64';

export type ResourceInsertionTemplate =
  | 'auto'
  | 'image'
  | 'note-link'
  | 'attachment-link'
  | 'media';

export type ResourceInsertionKind = 'image' | 'note' | 'file' | 'media' | 'other';

export interface ResourceInsertionItem {
  resource: ResourceClientDTO;
  kind: ResourceInsertionKind;
  searchableText: string;
  tags: string[];
  updatedAt: number;
}

export interface InsertUploadedImagesOptions {
  files: File[];
  currentNoteName?: string | null;
  insertText: InsertTextAtRange;
  selection?: EditorSelectionRange;
  tags?: string[];
  now?: Date;
  mode?: ResourceInsertionMode;
  maxBase64Bytes?: number;
}

export interface InsertExistingResourceOptions {
  resource: ResourceClientDTO;
  insertText: InsertTextAtRange;
  selection?: EditorSelectionRange;
  mode?: ResourceInsertionMode;
  template?: ResourceInsertionTemplate;
  maxBase64Bytes?: number;
}

export interface ExportMarkdownAsSelfContainedOptions {
  markdown: string;
  maxBase64Bytes?: number;
}

export interface ResourceInsertionResult {
  insertedText: string;
  insertedResources: ResourceClientDTO[];
  failures: RepositoryUploadFailure[];
  mode: ResourceInsertionMode;
}

export interface ResourceInsertionFeedback {
  successCount: number;
  failureCount: number;
  hasSuccess: boolean;
  hasFailure: boolean;
  isPartial: boolean;
}

export interface ResourceInsertionRecentEntry {
  resourceId: ResourceClientDTO['id'];
  insertedAt: number;
  mode: ResourceInsertionMode;
  template: ResourceInsertionTemplate;
}

export interface SelfContainedExportFailure {
  resourceId: string | null;
  path: string;
  reason: 'missing-resource' | 'too-large' | 'read-failed' | 'unsupported-resource';
}

export interface SelfContainedExportResult {
  markdown: string;
  convertedCount: number;
  skippedCount: number;
  failures: SelfContainedExportFailure[];
}

interface ResourceInsertionDependencies {
  resources: Ref<ResourceClientDTO[]> | ComputedRef<ResourceClientDTO[]>;
  uploadResources: (files: File[], tags?: string[]) => Promise<RepositoryUploadResult>;
  readResourceAsDataUrl: (resource: ResourceClientDTO) => Promise<string>;
  recentEntries?: Ref<ResourceInsertionRecentEntry[]> | ComputedRef<ResourceInsertionRecentEntry[]>;
  persistRecentEntry?: (entry: ResourceInsertionRecentEntry) => void;
}

export interface UseResourceInsertionResult {
  imageResources: ComputedRef<ResourceClientDTO[]>;
  resourceItems: ComputedRef<ResourceInsertionItem[]>;
  recentResources: ComputedRef<
    Array<{
      entry: ResourceInsertionRecentEntry;
      resource: ResourceClientDTO;
      item: ResourceInsertionItem;
    }>
  >;
  searchResources: (query: string, kinds?: ResourceInsertionKind[]) => ResourceInsertionItem[];
  insertUploadedImages: (options: InsertUploadedImagesOptions) => Promise<ResourceInsertionResult>;
  insertExistingImage: (options: InsertExistingResourceOptions) => Promise<string>;
  insertExistingResource: (options: InsertExistingResourceOptions) => Promise<string>;
  exportMarkdownAsSelfContained: (
    options: ExportMarkdownAsSelfContainedOptions,
  ) => Promise<SelfContainedExportResult>;
}

const DEFAULT_BASE64_SIZE_LIMIT = 2 * 1024 * 1024;

export function createResourceInsertion(
  dependencies: ResourceInsertionDependencies,
): UseResourceInsertionResult {
  const resources = computed(() => dependencies.resources.value);
  const resourceItems = computed(() => buildResourceInsertionItems(resources.value));
  const imageResources = computed(() =>
    resourceItems.value.filter((item) => item.kind === 'image').map((item) => item.resource),
  );
  const recentEntries = computed(() => dependencies.recentEntries?.value ?? []);
  const recentResources = computed(() => {
    const resourceMap = new Map<string, ResourceClientDTO>(
      resources.value.map((resource) => [String(resource.id), resource]),
    );

    return recentEntries.value
      .map((entry) => {
        const resource = resourceMap.get(String(entry.resourceId)) ?? null;
        if (!resource) {
          return null;
        }

        return {
          entry,
          resource,
          item: toResourceInsertionItem(resource),
        };
      })
      .filter(
        (
          item,
        ): item is {
          entry: ResourceInsertionRecentEntry;
          resource: ResourceClientDTO;
          item: ResourceInsertionItem;
        } => item !== null,
      );
  });

  async function insertUploadedImages(
    options: InsertUploadedImagesOptions,
  ): Promise<ResourceInsertionResult> {
    const imageFiles = options.files.filter(isImageFile);
    const mode = options.mode ?? 'path';

    if (imageFiles.length === 0) {
      return {
        insertedText: '',
        insertedResources: [],
        failures: [],
        mode,
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

    const snippets = await Promise.all(
      insertedResources.map((resource) =>
        buildResourceMarkdown(resource, {
          mode,
          template: 'image',
          readResourceAsDataUrl: dependencies.readResourceAsDataUrl,
          maxBase64Bytes: options.maxBase64Bytes,
        }),
      ),
    );

    const insertedText = snippets.join('\n');

    if (insertedText) {
      options.insertText(insertedText, options.selection);
      for (const resource of insertedResources) {
        recordRecentInsertion(resource, mode, 'image');
      }
    }

    return {
      insertedText,
      insertedResources,
      failures: uploadResult.failures,
      mode,
    };
  }

  async function insertExistingResource(options: InsertExistingResourceOptions): Promise<string> {
    const mode = options.mode ?? 'path';
    const template = options.template ?? 'auto';
    const markdown = await buildResourceMarkdown(options.resource, {
      mode,
      template,
      readResourceAsDataUrl: dependencies.readResourceAsDataUrl,
      maxBase64Bytes: options.maxBase64Bytes,
    });

    options.insertText(markdown, options.selection);
    recordRecentInsertion(options.resource, mode, template);

    return markdown;
  }

  async function exportMarkdownAsSelfContained(
    options: ExportMarkdownAsSelfContainedOptions,
  ): Promise<SelfContainedExportResult> {
    const { resolveMarkdownResourceReferences, replaceMarkdownReferences } =
      await import('../utils/markdownResourceReferences');

    const references = resolveMarkdownResourceReferences(options.markdown, resources.value).filter(
      (reference) => reference.kind === 'image' && reference.isRepositoryReference,
    );

    const replacements: Array<{ reference: (typeof references)[number]; destination: string }> = [];
    const failures: SelfContainedExportFailure[] = [];
    const maxBase64Bytes = options.maxBase64Bytes ?? DEFAULT_BASE64_SIZE_LIMIT;

    for (const reference of references) {
      if (!reference.resource) {
        failures.push({
          resourceId: null,
          path: reference.destination,
          reason: 'missing-resource',
        });
        continue;
      }

      if (!isImageResource(reference.resource)) {
        failures.push({
          resourceId: reference.resource.id,
          path: reference.destination,
          reason: 'unsupported-resource',
        });
        continue;
      }

      if (reference.resource.size > maxBase64Bytes) {
        failures.push({
          resourceId: reference.resource.id,
          path: reference.destination,
          reason: 'too-large',
        });
        continue;
      }

      try {
        const dataUrl = await dependencies.readResourceAsDataUrl(reference.resource);
        replacements.push({
          reference,
          destination: dataUrl,
        });
      } catch {
        failures.push({
          resourceId: reference.resource.id,
          path: reference.destination,
          reason: 'read-failed',
        });
      }
    }

    return {
      markdown: replaceMarkdownReferences(options.markdown, replacements),
      convertedCount: replacements.length,
      skippedCount: failures.length,
      failures,
    };
  }

  function searchResources(
    query: string,
    kinds: ResourceInsertionKind[] = [],
  ): ResourceInsertionItem[] {
    const normalizedQuery = query.trim().toLowerCase();
    const kindSet = new Set(kinds);

    return resourceItems.value.filter((item) => {
      if (kindSet.size > 0 && !kindSet.has(item.kind)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return item.searchableText.includes(normalizedQuery);
    });
  }

  function recordRecentInsertion(
    resource: ResourceClientDTO,
    mode: ResourceInsertionMode,
    template: ResourceInsertionTemplate,
  ) {
    dependencies.persistRecentEntry?.({
      resourceId: resource.id,
      insertedAt: Date.now(),
      mode,
      template,
    });
  }

  return {
    imageResources,
    resourceItems,
    recentResources,
    searchResources,
    insertUploadedImages,
    insertExistingImage(options: InsertExistingResourceOptions) {
      return insertExistingResource({
        ...options,
        template: 'image',
      });
    },
    insertExistingResource,
    exportMarkdownAsSelfContained,
  };
}

export function useResourceInsertion() {
  const repository = useRepositoryResourceGateway();

  return createResourceInsertion({
    resources: repository.resources,
    uploadResources: (files, tags = []) => repository.uploadResources(files, tags),
    readResourceAsDataUrl: (resource) => repository.readResourceAsDataUrl(resource),
    recentEntries: repository.recentEntries,
    persistRecentEntry: (entry) => repository.persistRecentEntry(entry),
  });
}

export function buildResourceInsertionItems(
  resources: ResourceClientDTO[],
): ResourceInsertionItem[] {
  return [...resources]
    .map((resource) => toResourceInsertionItem(resource))
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export function toResourceInsertionItem(resource: ResourceClientDTO): ResourceInsertionItem {
  const tags = Array.isArray(resource.metadata?.tags) ? resource.metadata.tags : [];
  const searchableText = [
    getResourceDisplayName(resource),
    resource.name,
    resource.path,
    resource.mimeType,
    ...tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    resource,
    kind: classifyResourceInsertionKind(resource),
    searchableText,
    tags,
    updatedAt: toTimestamp(resource.updatedAt),
  };
}

export function classifyResourceInsertionKind(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension' | 'name'>,
): ResourceInsertionKind {
  const mimeType = resource.mimeType || '';
  const extension = (resource.extension || '').toLowerCase();
  const name = (resource.name || '').toLowerCase();

  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(name)) {
    return 'image';
  }

  if (mimeType.startsWith('text/markdown') || extension === '.md' || name.endsWith('.md')) {
    return 'note';
  }

  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'media';
  }

  if (
    mimeType === 'application/pdf' ||
    ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx'].includes(extension)
  ) {
    return 'file';
  }

  return 'other';
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

export async function buildResourceMarkdown(
  resource: ResourceClientDTO,
  options: {
    mode?: ResourceInsertionMode;
    template?: ResourceInsertionTemplate;
    readResourceAsDataUrl: (resource: ResourceClientDTO) => Promise<string>;
    maxBase64Bytes?: number;
  },
): Promise<string> {
  const mode = options.mode ?? 'path';
  const template = options.template ?? 'auto';
  const effectiveTemplate = resolveInsertionTemplate(resource, template);

  if (mode === 'base64') {
    if (effectiveTemplate !== 'image') {
      throw new Error('Base64 insertion is only supported for images.');
    }

    const maxBase64Bytes = options.maxBase64Bytes ?? DEFAULT_BASE64_SIZE_LIMIT;
    if (resource.size > maxBase64Bytes) {
      throw new Error('Resource exceeds the base64 insertion size limit.');
    }

    const dataUrl = await options.readResourceAsDataUrl(resource);
    return serializeMarkdownResourceReference({
      kind: 'image',
      label: deriveImageAltText(resource),
      destination: dataUrl,
    });
  }

  return buildPathMarkdownReference(resource, effectiveTemplate);
}

export function buildPathMarkdownReference(
  resource: Pick<ResourceClientDTO, 'name' | 'path' | 'mimeType' | 'extension'>,
  template: Exclude<ResourceInsertionTemplate, 'auto'>,
): string {
  if (!resource.path) {
    throw new Error('Repository resource is missing a path.');
  }

  if (template === 'image') {
    return serializeMarkdownResourceReference({
      kind: 'image',
      label: deriveImageAltText(resource),
      destination: resource.path,
    });
  }

  const label = deriveResourceLabel(resource);

  return serializeMarkdownResourceReference({
    kind: 'link',
    label,
    destination: resource.path,
  });
}

export function deriveImageAltText(
  resource: Pick<ResourceClientDTO, 'name' | 'path'>,
): string {
  const rawName = getResourceDisplayName(resource).trim() || resource.name.trim();
  const withoutExtension = rawName.replace(/\.[^.]+$/, '').trim();
  return withoutExtension || 'image';
}

export function deriveResourceLabel(
  resource: Pick<ResourceClientDTO, 'name' | 'path'>,
): string {
  return getResourceDisplayName(resource).trim() || 'resource';
}

export function resolveInsertionTemplate(
  resource: Pick<ResourceClientDTO, 'mimeType' | 'extension' | 'name'>,
  template: ResourceInsertionTemplate,
): Exclude<ResourceInsertionTemplate, 'auto'> {
  if (template !== 'auto') {
    return template;
  }

  const kind = classifyResourceInsertionKind(
    resource as Pick<ResourceClientDTO, 'mimeType' | 'extension' | 'name'>,
  );

  switch (kind) {
    case 'image':
      return 'image';
    case 'note':
      return 'note-link';
    case 'file':
      return 'attachment-link';
    case 'media':
      return 'media';
    default:
      return 'attachment-link';
  }
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

export const __test__ = {
  buildPastedImageFileName,
  buildPathMarkdownReference,
  buildResourceInsertionItems,
  buildResourceMarkdown,
  classifyResourceInsertionKind,
  createResourceInsertion,
  deriveImageAltText,
  deriveResourceLabel,
  getResourceInsertionFeedback,
  isImageFile,
  isImageResource,
  resolveInsertionTemplate,
  toResourceInsertionItem,
};

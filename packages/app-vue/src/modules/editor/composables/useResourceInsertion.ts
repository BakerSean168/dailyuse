import { computed } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useRepositoryResourceGateway } from '../../repository/services/repository-resource-gateway';
import {
  buildResourceInsertionItems,
  toResourceInsertionItem,
  isImageFile,
  isImageResource,
  buildResourceMarkdown,
  renameFile,
  buildPastedImageFileName,
  buildPathMarkdownReference,
  classifyResourceInsertionKind,
  deriveImageAltText,
  deriveResourceLabel,
  getResourceInsertionFeedback,
  resolveInsertionTemplate,
  exportMarkdownAsSelfContainedHelper,
} from './resourceInsertionHelpers';
import type {
  ResourceInsertionDependencies,
  UseResourceInsertionResult,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
  ResourceInsertionKind,
  ResourceInsertionItem,
  ResourceInsertionRecentEntry,
  ResourceInsertionResult,
  InsertUploadedImagesOptions,
  InsertExistingResourceOptions,
  ExportMarkdownAsSelfContainedOptions,
  SelfContainedExportResult,
} from './resourceInsertionTypes';

export type {
  EditorSelectionRange,
  InsertTextAtRange,
  ResourceInsertionMode,
  ResourceInsertionTemplate,
  ResourceInsertionKind,
  ResourceInsertionItem,
  InsertUploadedImagesOptions,
  InsertExistingResourceOptions,
  ExportMarkdownAsSelfContainedOptions,
  ResourceInsertionResult,
  ResourceInsertionFeedback,
  ResourceInsertionRecentEntry,
  SelfContainedExportFailure,
  SelfContainedExportResult,
  ResourceInsertionDependencies,
  UseResourceInsertionResult,
} from './resourceInsertionTypes';

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
    return exportMarkdownAsSelfContainedHelper(
      options.markdown,
      resources.value,
      dependencies.readResourceAsDataUrl,
      options.maxBase64Bytes,
    );
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

// Re-export helpers for backward compatibility and tests
export {
  buildResourceInsertionItems,
  toResourceInsertionItem,
  classifyResourceInsertionKind,
  getResourceInsertionFeedback,
  isImageResource,
  isImageFile,
  buildResourceMarkdown,
  buildPathMarkdownReference,
  deriveImageAltText,
  deriveResourceLabel,
  resolveInsertionTemplate,
  buildPastedImageFileName,
} from './resourceInsertionHelpers';

export const __test__ = {
  createResourceInsertion,
  buildPastedImageFileName,
  buildPathMarkdownReference,
  buildResourceInsertionItems,
  buildResourceMarkdown,
  classifyResourceInsertionKind,
  deriveImageAltText,
  deriveResourceLabel,
  getResourceInsertionFeedback,
  isImageFile,
  isImageResource,
  resolveInsertionTemplate,
  toResourceInsertionItem,
};

/**
 * Type definitions for resource insertion.
 *
 * Extracted from useResourceInsertion.ts to reduce composable size.
 */

import type { ComputedRef, Ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type {
  RepositoryUploadFailure,
  RepositoryUploadResult,
} from '../../repository/composables/useRepository';

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

export interface ResourceInsertionDependencies {
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

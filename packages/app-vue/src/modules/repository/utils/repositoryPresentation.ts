import type { ComposerTranslation } from 'vue-i18n';
import type { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';

type Translate = ComposerTranslation;

/**
 * Maps a RepositoryStatus to its i18n label.
 */
export function getStatusLabel(t: Translate, status: RepositoryStatus): string {
  const keyMap: Record<RepositoryStatus, string> = {
    Active: 'repository.presentation.statusActive',
    Archived: 'repository.presentation.statusArchived',
    Deleted: 'repository.presentation.statusDeleted',
  };
  return t(keyMap[status] ?? status);
}

/**
 * Maps a RepositoryType to its i18n label.
 */
export function getTypeLabel(t: Translate, type: RepositoryType): string {
  const keyMap: Record<RepositoryType, string> = {
    Markdown: 'repository.presentation.typeMarkdown',
    Code: 'repository.presentation.typeCode',
    Mixed: 'repository.presentation.typeMixed',
  };
  return t(keyMap[type] ?? type);
}

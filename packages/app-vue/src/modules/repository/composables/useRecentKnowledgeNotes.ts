/**
 * Recent knowledge notes for shell/AI surfaces.
 *
 * Uses GitHub note projections on Web and the local Vault scan on Desktop.
 * Does not call legacy database Repository/Resource CRUD endpoints.
 */
import { inject, ref } from 'vue';
import { unwrapOrThrowError } from '@memoflow/contracts/result';
import {
  EMAIL_VERIFICATION_MESSAGE_KEY,
  isEmailVerificationRequiredError,
} from '@memoflow/http-client';
import { DESKTOP_BRIDGE_KEY, REPOSITORY_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import {
  getGlobalResultErrorT,
  translateResultError,
} from '../../../shared/utils/translate-result-error';

export type RecentKnowledgeNote = {
  id: string;
  title: string;
  path: string;
  updatedAt: number;
  source: 'projection' | 'local-vault';
};

export function useRecentKnowledgeNotes() {
  const service = useStrictInject(REPOSITORY_SERVICE_KEY, 'RepositoryService');
  const desktopBridge = inject(DESKTOP_BRIDGE_KEY, undefined);
  const t = getGlobalResultErrorT();

  const notes = ref<RecentKnowledgeNote[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  /** i18n message key when the session needs email verification (UI degrade). */
  const errorMessageKey = ref<string | null>(null);
  const emailVerificationRequired = ref(false);

  async function load(limit = 20): Promise<void> {
    isLoading.value = true;
    error.value = null;
    errorMessageKey.value = null;
    // Clear prior degrade; re-set only if this load hits EMAIL_VERIFICATION_REQUIRED.
    emailVerificationRequired.value = false;
    try {
      notes.value = desktopBridge
        ? await loadLocalVaultNotes(limit)
        : await loadProjectionNotes(limit);
    } catch (loadError) {
      notes.value = [];
      error.value = translateResultError(loadError, t, {
        scope: 'repository',
        fallbackKey: 'common.operationFailed',
      });
    } finally {
      isLoading.value = false;
    }
  }

  async function loadProjectionNotes(limit: number): Promise<RecentKnowledgeNote[]> {
    const result = await service.listKnowledgeNoteProjections({ limit });
    if (!result.ok) {
      // Empty connection / unavailable projection is a normal empty state.
      if (
        result.error.code === 'SERVICE_UNAVAILABLE' ||
        result.error.code === 'NOT_FOUND' ||
        result.error.code === 'UNAUTHORIZED'
      ) {
        return [];
      }
      if (isEmailVerificationRequiredError(result.error)) {
        emailVerificationRequired.value = true;
        const ctx = result.error.context as { messageKey?: string } | undefined;
        errorMessageKey.value = ctx?.messageKey ?? EMAIL_VERIFICATION_MESSAGE_KEY;
        error.value = translateResultError(result.error, t, {
          scope: 'repository',
          fallbackKey: 'common.operationFailed',
        });
        return [];
      }
      throw unwrapOrThrowError(result);
    }

    return [...result.data.notes]
      .filter((note) => note.deletedAt == null)
      .sort((left, right) => Number(right.updatedAt) - Number(left.updatedAt))
      .slice(0, limit)
      .map((note) => ({
        id: note.id,
        title: note.title,
        path: note.relativePath,
        updatedAt: Number(note.updatedAt),
        source: 'projection' as const,
      }));
  }

  async function loadLocalVaultNotes(limit: number): Promise<RecentKnowledgeNote[]> {
    if (typeof service.scanLocalVault !== 'function') {
      return [];
    }
    const result = await service.scanLocalVault();
    if (!result.ok) {
      if (
        result.error.code === 'SERVICE_UNAVAILABLE' ||
        result.error.code === 'NOT_FOUND' ||
        result.error.code === 'UNAUTHORIZED'
      ) {
        return [];
      }
      throw unwrapOrThrowError(result);
    }

    return [...result.data.notes]
      .sort((left, right) => Number(right.updatedAt) - Number(left.updatedAt))
      .slice(0, limit)
      .map((note) => ({
        id: note.relativePath,
        title: note.title,
        path: note.relativePath,
        updatedAt: Number(note.updatedAt),
        source: 'local-vault' as const,
      }));
  }

  return {
    notes,
    isLoading,
    error,
    errorMessageKey,
    emailVerificationRequired,
    load,
  };
}

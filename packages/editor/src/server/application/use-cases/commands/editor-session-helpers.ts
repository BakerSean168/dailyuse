import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import { EditorSession } from '../../../domain/entities/editor-session';
import { SessionRestorer } from '../../../domain/services/session-restorer';

const restorer = new SessionRestorer();

/**
 * Persist session, groups, and tabs to their respective repositories.
 */
export async function persistSessionState(
  session: EditorSession,
  sessionRepo: IEditorSessionRepository,
  groupRepo: IEditorGroupRepository,
  tabRepo: IEditorTabRepository,
): Promise<void> {
  await sessionRepo.save(session);

  if (session.groups.length > 0) {
    await groupRepo.saveBatch(session.groups);
    const tabs = session.groups.flatMap((group) => group.tabs);
    if (tabs.length > 0) {
      await tabRepo.saveBatch(tabs);
    }
  }
}

/**
 * Load a session with all its groups and tabs hydrated.
 */
export async function loadSessionWithGroups(
  sessionId: string,
  sessionRepo: IEditorSessionRepository,
  groupRepo: IEditorGroupRepository,
  tabRepo: IEditorTabRepository,
): Promise<EditorSession | null> {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    return null;
  }

  const groups = await groupRepo.findBySessionId(sessionId);
  for (const group of groups) {
    const tabs = await tabRepo.findByGroupId(String(group.id));
    group.restoreTabs(tabs);
  }

  return restorer.restore(session, groups);
}

/**
 * Count total open tabs across all groups in a session.
 */
export function countOpenTabs(session: EditorSession): number {
  return session.groups.reduce((count, group) => count + group.tabs.length, 0);
}

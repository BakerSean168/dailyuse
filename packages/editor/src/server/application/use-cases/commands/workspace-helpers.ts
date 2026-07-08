import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import { EditorSession } from '../../../domain/entities/editor-session';
import { SessionRestorer } from '../../../domain/services/session-restorer';

const restorer = new SessionRestorer();

export async function persistWorkspaceSessionState(
  session: EditorSession,
  sessionRepository: IEditorSessionRepository,
  groupRepository: IEditorGroupRepository,
  tabRepository: IEditorTabRepository,
): Promise<void> {
  await sessionRepository.save(session);

  const currentGroups = session.groups;
  const persistedGroups = await groupRepository.findBySessionId(String(session.id));
  const currentGroupIds = new Set(currentGroups.map((group) => String(group.id)));

  for (const persistedGroup of persistedGroups) {
    if (!currentGroupIds.has(String(persistedGroup.id))) {
      await tabRepository.deleteByGroupId(String(persistedGroup.id));
      await groupRepository.delete(String(persistedGroup.id));
    }
  }

  if (currentGroups.length === 0) {
    return;
  }

  await groupRepository.saveBatch(currentGroups);

  for (const group of currentGroups) {
    const currentTabs = group.tabs;
    const persistedTabs = await tabRepository.findByGroupId(String(group.id));
    const currentTabIds = new Set(currentTabs.map((tab) => String(tab.id)));

    for (const persistedTab of persistedTabs) {
      if (!currentTabIds.has(String(persistedTab.id))) {
        await tabRepository.delete(String(persistedTab.id));
      }
    }
  }

  const tabs = currentGroups.flatMap((group) => group.tabs);
  if (tabs.length > 0) {
    await tabRepository.saveBatch(tabs);
  }
}

export async function loadWorkspaceSessionWithGroups(
  sessionId: string,
  sessionRepository: IEditorSessionRepository,
  groupRepository: IEditorGroupRepository,
  tabRepository: IEditorTabRepository,
): Promise<EditorSession | null> {
  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    return null;
  }

  const groups = await groupRepository.findBySessionId(sessionId);
  for (const group of groups) {
    const tabs = await tabRepository.findByGroupId(String(group.id));
    group.restoreTabs(tabs);
  }

  return restorer.restore(session, groups);
}

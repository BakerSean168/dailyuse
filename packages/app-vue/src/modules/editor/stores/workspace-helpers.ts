import type { EditorSessionClientDTO, EditorTabClientDTO } from '@dailyuse/contracts/editor';

export function findTabByResourceId(
  sessions: EditorSessionClientDTO[],
  resourceId: string,
): EditorTabClientDTO | null {
  for (const session of sessions) {
    for (const group of session.groups) {
      const tab = group.tabs.find((item) => item.resourceId === resourceId);
      if (tab) {
        return tab;
      }
    }
  }

  return null;
}

export function findTabLocation(
  sessions: EditorSessionClientDTO[],
  tabId: string,
): {
  session: EditorSessionClientDTO;
  group: EditorSessionClientDTO['groups'][number];
  tab: EditorTabClientDTO;
} | null {
  for (const session of sessions) {
    for (const group of session.groups) {
      const tab = group.tabs.find((item) => item.id === tabId);
      if (tab) {
        return { session, group, tab };
      }
    }
  }

  return null;
}

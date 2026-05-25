import { EditorSession } from '../entities/editor-session';
import type { EditorGroup } from '../entities/editor-group';

export class SessionRestorer {
  public restore(session: EditorSession, groups?: EditorGroup[]): EditorSession {
    if (groups) {
      session.restoreGroups(groups);
    } else {
      session.normalizeActiveState();
    }
    return session;
  }
}

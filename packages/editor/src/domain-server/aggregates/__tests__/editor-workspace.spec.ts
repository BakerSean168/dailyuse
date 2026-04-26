import { describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { EditorWorkspace } from '../editor-workspace';
import { EditorSession } from '../../entities/editor-session';

describe('EditorWorkspace', () => {
  it('creates a default session and marks it as active', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Knowledge Base',
      projectPath: '/tmp/memoflow',
    });

    expect(workspace.sessions).toHaveLength(1);
    expect(workspace.getActiveSession()).toBeDefined();
    expect(workspace.lastActiveSessionId).toBe(workspace.getActiveSession()?.id);
    expect(workspace.layout.isSidebarVisible).toBe(true);
  });

  it('falls back to another session when the active one is removed', () => {
    const identityId = IdentityId.generate();
    const workspace = EditorWorkspace.create({
      identityId,
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });
    const additionalSession = EditorSession.create({
      workspaceId: workspace.id,
      identityId,
      name: 'Secondary Session',
    });

    workspace.addSession(additionalSession);
    workspace.setActiveSession(additionalSession.id);

    expect(workspace.getActiveSession()?.id).toBe(additionalSession.id);

    expect(workspace.removeSession(additionalSession.id)).toBe(true);
    expect(workspace.getActiveSession()?.id).toBe(workspace.sessions[0]?.id);
  });
});

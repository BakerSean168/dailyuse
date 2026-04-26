import { describe, expect, it, vi } from 'vitest';
import { SessionRestorer } from '../SessionRestorer';
import { EditorSession } from '../../entities/editor-session';
import { EditorWorkspaceId } from '../../../domain-shared/value-objects/editor-workspace-id';
import { IdentityId } from '@dailyuse/domain-shared/shared';

describe('SessionRestorer', () => {
  it('restores groups if provided', () => {
    const restorer = new SessionRestorer();
    const session = EditorSession.create({
      workspaceId: EditorWorkspaceId.generate(),
      identityId: IdentityId.generate(),
      name: 'Test Session',
    });

    // Mock the restoreGroups method
    const restoreGroupsSpy = vi.spyOn(session, 'restoreGroups').mockImplementation(() => {});

    restorer.restore(session, [] as any[]);

    expect(restoreGroupsSpy).toHaveBeenCalledWith([]);
  });

  it('normalizes active state if no groups provided', () => {
    const restorer = new SessionRestorer();
    const session = EditorSession.create({
      workspaceId: EditorWorkspaceId.generate(),
      identityId: IdentityId.generate(),
      name: 'Test Session',
    });

    // Mock the normalizeActiveState method
    const normalizeActiveStateSpy = vi.spyOn(session, 'normalizeActiveState').mockImplementation(() => {});

    restorer.restore(session);

    expect(normalizeActiveStateSpy).toHaveBeenCalled();
  });
});

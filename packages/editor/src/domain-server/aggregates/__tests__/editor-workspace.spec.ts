import { describe, expect, it } from 'vitest';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { EditorWorkspace } from '../editor-workspace';
import { EditorSession } from '../../entities/editor-session';
import { ProjectType } from '@dailyuse/contracts/editor';

describe('EditorWorkspace', () => {
  it('creates a default session and marks it as active', () => {
    const identityId = IdentityId.generate();
    const workspace = EditorWorkspace.create({
      identityId,
      name: 'Knowledge Base',
      projectPath: '/tmp/memoflow',
    });

    expect(workspace.sessions).toHaveLength(1);
    expect(workspace.getActiveSession()).toBeDefined();
    expect(workspace.lastActiveSessionId).toBe(workspace.getActiveSession()?.id);
    expect(workspace.layout.isSidebarVisible).toBe(true);
    expect(workspace.identityId).toBe(identityId);
    expect(workspace.name).toBe('Knowledge Base');
    expect(workspace.projectPath).toBe('/tmp/memoflow');
    expect(workspace.description).toBeNull();
    expect(workspace.projectType).toBe('Other');
    expect(workspace.isActive).toBe(false);
    expect(workspace.lastAccessedAt).toBeNull();
  });

  it('can create without default session', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Knowledge Base',
      projectPath: '/tmp/memoflow',
      createDefaultSession: false,
    });
    expect(workspace.sessions).toHaveLength(0);
    expect(workspace.lastActiveSessionId).toBeNull();
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

  it('handles removing non-existent session', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });
    expect(workspace.removeSession('non-existent' as any)).toBe(false);
  });

  it('throws error when setting non-existent session as active', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });
    expect(() => workspace.setActiveSession('non-existent' as any)).toThrow(/not found/);
  });

  it('gets a specific session by id', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });
    const session = workspace.sessions[0];
    expect(workspace.getSession(session.id)).toEqual(session);
    expect(workspace.getSession('non-existent' as any)).toBeUndefined();
  });

  it('updates simple properties', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });

    workspace.updateName('New Name');
    expect(workspace.name).toBe('New Name');

    workspace.updateDescription('Desc');
    expect(workspace.description).toBe('Desc');

    workspace.updateProjectPath('/new/path');
    expect(workspace.projectPath).toBe('/new/path');
  });

  it('updates layout and settings', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });

    workspace.updateLayout({ isSidebarVisible: false });
    expect(workspace.layout.isSidebarVisible).toBe(false);

    workspace.updateSettings({ theme: 'dark' });
    expect(workspace.settings.theme).toBe('dark');
  });

  it('handles active state', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });

    expect(workspace.isActive).toBe(false);

    workspace.activate();
    expect(workspace.isActive).toBe(true);
    expect(workspace.lastAccessedAt).toBeInstanceOf(Date);

    workspace.deactivate();
    expect(workspace.isActive).toBe(false);
  });

  it('emits a workspace-deleted event', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });

    workspace.pullDomainEvents();
    workspace.delete();

    const [event] = workspace.pullDomainEvents();
    expect(event?.eventType).toBe('editor:workspace-deleted');
    expect(event?.payload).toEqual({ workspaceId: workspace.id });
  });

  it('converts to Server DTO', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });
    workspace.activate();

    const dto = workspace.toServerDTO();
    expect(dto.id).toBe(workspace.id);
    expect(dto.name).toBe('Workspace');
    expect(dto.isActive).toBe(true);
    expect(dto.sessions).toHaveLength(1);
    expect(dto.lastAccessedAt).toBeTypeOf('number');
  });

  it('can be loaded from state', () => {
    const workspace = EditorWorkspace.create({
      identityId: IdentityId.generate(),
      name: 'Workspace',
      projectPath: '/tmp/workspace',
    });

    const loaded = EditorWorkspace.load((workspace as any));
    expect(loaded.id).toBe(workspace.id);
    expect(loaded.name).toBe('Workspace');
  });
});

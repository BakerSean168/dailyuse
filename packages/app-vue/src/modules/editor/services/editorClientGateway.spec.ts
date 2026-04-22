import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setEditorRuntimeService } from './editorServiceRuntime';

const editorService = {
  listWorkspaces: vi.fn(),
  getWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  listSessions: vi.fn(),
  createSession: vi.fn(),
  createTab: vi.fn(),
  updateTab: vi.fn(),
  activateTab: vi.fn(),
  deleteTab: vi.fn(),
  getContent: vi.fn(),
  saveContent: vi.fn(),
  autoSaveContent: vi.fn(),
} as const;

describe('editor client gateway', () => {
  beforeEach(() => {
    Object.values(editorService).forEach((mock) => mock.mockReset());
    setEditorRuntimeService(editorService as never);
  });

  it('creates and resolves a workspace via the injected editor service', async () => {
    editorService.getWorkspace.mockResolvedValueOnce({ ok: true, data: null });
    editorService.listWorkspaces.mockResolvedValueOnce({ ok: true, data: [] });
    editorService.createWorkspace.mockResolvedValueOnce({ ok: true, data: { id: 'repository-1' } });
    editorService.listSessions.mockResolvedValueOnce({ ok: true, data: [{ workspaceId: 'repository-1' }] });

    const service = await import('./editorClientGateway');
    const workspace = await service.ensureEditorWorkspace('repository-1');
    const sessions = await service.listEditorSessions('repository-1');

    expect(workspace?.id).toBe('repository-1');
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.workspaceId).toBe('repository-1');
  });

  it('reads and saves content through the editor service', async () => {
    editorService.getContent.mockResolvedValue({
      ok: true,
      data: { resourceId: 'resource-1', name: 'note', content: '# Hello' },
    });
    editorService.saveContent.mockResolvedValue({ ok: true, data: null });

    const service = await import('./editorClientGateway');
    const content = await service.getEditorContent('resource-1');
    const saved = await service.saveEditorContent({ resourceId: 'resource-1', content: '# Updated' });

    expect(content?.content).toBe('# Hello');
    expect(editorService.getContent).toHaveBeenCalledWith('resource-1');
    expect(editorService.saveContent).toHaveBeenCalledWith('resource-1', { content: '# Updated' });
    expect(saved).toBe(true);
  });
});

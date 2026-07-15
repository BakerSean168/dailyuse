import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setEditorRuntimeService } from './editor-service-runtime';

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

  it('delegates concurrent workspace ensures to the atomic server operation', async () => {
    editorService.createWorkspace.mockResolvedValue({
      ok: true,
      data: { id: 'editor-workspace-1', projectPath: 'repository-1' },
    });
    editorService.listSessions.mockResolvedValueOnce({
      ok: true,
      data: [{ workspaceId: 'editor-workspace-1' }],
    });

    const service = await import('./editor-client-gateway');
    const [first, second] = await Promise.all([
      service.ensureEditorWorkspace('repository-1'),
      service.ensureEditorWorkspace('repository-1'),
    ]);
    const sessions = await service.listEditorSessions('editor-workspace-1');

    expect(first?.id).toBe('editor-workspace-1');
    expect(second?.id).toBe('editor-workspace-1');
    expect(editorService.createWorkspace).toHaveBeenCalledTimes(2);
    expect(editorService.getWorkspace).not.toHaveBeenCalled();
    expect(editorService.listWorkspaces).not.toHaveBeenCalled();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.workspaceId).toBe('editor-workspace-1');
  }, 10000);

  it('reads and saves content through the editor service', async () => {
    editorService.getContent.mockResolvedValue({
      ok: true,
      data: { resourceId: 'resource-1', name: 'note', content: '# Hello' },
    });
    editorService.saveContent.mockResolvedValue({ ok: true, data: null });

    const service = await import('./editor-client-gateway');
    const content = await service.getEditorContent('resource-1');
    const saved = await service.saveEditorContent({ resourceId: 'resource-1', content: '# Updated' });

    expect(content?.content).toBe('# Hello');
    expect(editorService.getContent).toHaveBeenCalledWith('resource-1');
    expect(editorService.saveContent).toHaveBeenCalledWith('resource-1', { content: '# Updated' });
    expect(saved).toBe(true);
  });
});

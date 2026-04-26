import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../workspace-layout';

describe('WorkspaceLayout', () => {
  it('creates the documented default layout', () => {
    const layout = WorkspaceLayout.createDefault();

    expect(layout.sidebarPosition).toBe('Left');
    expect(layout.sidebarWidth).toBe(300);
    expect(layout.panelPosition).toBe('Bottom');
    expect(layout.isSidebarVisible).toBe(true);
    expect(layout.isPanelVisible).toBe(false);
  });

  it('clamps sidebar width and panel height to the supported range', () => {
    const layout = WorkspaceLayout.createDefault()
      .setSidebarWidth(999)
      .setPanelHeight(10);

    expect(layout.sidebarWidth).toBe(600);
    expect(layout.panelHeight).toBe(100);
  });

  it('returns a new instance when toggling visibility flags', () => {
    const original = WorkspaceLayout.createDefault();
    const updated = original.toggleSidebar().togglePanel();

    expect(original.isSidebarVisible).toBe(true);
    expect(original.isPanelVisible).toBe(false);
    expect(updated.isSidebarVisible).toBe(false);
    expect(updated.isPanelVisible).toBe(true);
  });
});

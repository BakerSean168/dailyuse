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

  it('moves sidebar', () => {
    let layout = WorkspaceLayout.createDefault();
    expect(layout.isSidebarOnLeft).toBe(true);

    layout = layout.moveSidebarToRight();
    expect(layout.sidebarPosition).toBe('Right');
    expect(layout.isSidebarOnLeft).toBe(false);

    layout = layout.moveSidebarToLeft();
    expect(layout.sidebarPosition).toBe('Left');
  });

  it('checks panel position', () => {
    const layout = WorkspaceLayout.createDefault();
    expect(layout.isPanelOnBottom).toBe(true);
  });

  it('converts to DTO', () => {
    const layout = WorkspaceLayout.createDefault();
    const dto = layout.toDTO();
    expect(dto.sidebarPosition).toBe('Left');

    const layout2 = WorkspaceLayout.create(dto);
    expect(layout2.sidebarPosition).toBe('Left');

    const layout3 = WorkspaceLayout.fromDTO(dto);
    expect(layout3.sidebarPosition).toBe('Left');
  });

});

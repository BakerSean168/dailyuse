/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  CHAT_MIN,
  COMPOSER_MAX,
  COMPOSER_SIDE_GAP,
  PANEL_DEFAULT_FLOOR,
  PANEL_MIN,
  computeComposerLayout,
  computePanelGeometry,
  panelWidthFromPointer,
  resolveComposerDensity,
} from './panel-geometry';

describe('computePanelGeometry', () => {
  it('keeps AI and panel above mins in wide split viewports', () => {
    for (const viewportWidth of [1200, 1440]) {
      const geo = computePanelGeometry({
        viewportWidth,
        sidebarOccupiedWidth: 260,
      });
      expect(geo.canSplit).toBe(true);
      expect(geo.panelWidth).toBeGreaterThanOrEqual(PANEL_MIN);
      expect(geo.aiWidth).toBeGreaterThanOrEqual(CHAT_MIN);
      expect(geo.defaultPanelWidth).toBeGreaterThanOrEqual(PANEL_DEFAULT_FLOOR);
    }
  });

  it('covers 1024/1200/1440 with sidebar open or collapsed', () => {
    // 1024 - 260 = 764 workspace; max panel = 764 - 420 = 344 < PANEL_MIN → cannot split
    const at1024Open = computePanelGeometry({
      viewportWidth: 1024,
      sidebarOccupiedWidth: 260,
    });
    expect(at1024Open.canSplit).toBe(false);
    expect(at1024Open.aiWidth + at1024Open.panelWidth).toBe(at1024Open.workspaceWidth);

    // collapse sidebar frees the AI budget
    const at1024Collapsed = computePanelGeometry({
      viewportWidth: 1024,
      sidebarOccupiedWidth: 0,
    });
    expect(at1024Collapsed.canSplit).toBe(true);
    expect(at1024Collapsed.aiWidth).toBeGreaterThanOrEqual(CHAT_MIN);
    expect(at1024Collapsed.panelWidth).toBeGreaterThanOrEqual(PANEL_MIN);

    for (const viewportWidth of [1200, 1440]) {
      const open = computePanelGeometry({
        viewportWidth,
        sidebarOccupiedWidth: 260,
      });
      expect(open.canSplit).toBe(true);
      expect(open.aiWidth).toBeGreaterThanOrEqual(CHAT_MIN);
    }
  });

  it('treats collapsed sidebar as zero occupied width', () => {
    const open = computePanelGeometry({
      viewportWidth: 1200,
      sidebarOccupiedWidth: 260,
      preferredPanelWidth: 480,
    });
    const collapsed = computePanelGeometry({
      viewportWidth: 1200,
      sidebarOccupiedWidth: 0,
      preferredPanelWidth: 480,
    });
    expect(collapsed.workspaceWidth).toBe(1200);
    expect(collapsed.aiWidth).toBeGreaterThan(open.aiWidth);
  });

  it('clamps preferred width without rewriting caller preference', () => {
    const preferred = 9999;
    const geo = computePanelGeometry({
      viewportWidth: 1200,
      sidebarOccupiedWidth: 260,
      preferredPanelWidth: preferred,
    });
    expect(geo.panelWidth).toBeLessThan(preferred);
    expect(geo.aiWidth).toBeGreaterThanOrEqual(CHAT_MIN);
  });

  it('marks narrow viewports as unable to split', () => {
    const geo = computePanelGeometry({
      viewportWidth: 900,
      sidebarOccupiedWidth: 260,
    });
    // workspace 640; max panel = 640-420 = 220 < PANEL_MIN
    expect(geo.canSplit).toBe(false);
  });
});

describe('panelWidthFromPointer', () => {
  it('clamps drag width into the legal panel range', () => {
    const width = panelWidthFromPointer(200, 1200, 260);
    const geo = computePanelGeometry({
      viewportWidth: 1200,
      sidebarOccupiedWidth: 260,
    });
    expect(width).toBeGreaterThanOrEqual(geo.panelMin);
    expect(width).toBeLessThanOrEqual(geo.panelMax);
  });
});

describe('computeComposerLayout', () => {
  it('centers composer inside AI host and respects side gaps', () => {
    const hostWidth = 520;
    const hostLeft = 260;
    const layout = computeComposerLayout(hostWidth, hostLeft);
    expect(layout.width).toBe(hostWidth - 2 * COMPOSER_SIDE_GAP);
    expect(layout.left).toBe(hostLeft + COMPOSER_SIDE_GAP);
  });

  it('caps floating composer width to COMPOSER_MAX', () => {
    const layout = computeComposerLayout(1400, 0);
    expect(layout.width).toBe(COMPOSER_MAX);
    expect(layout.left).toBe((1400 - COMPOSER_MAX) / 2);
  });
});

describe('resolveComposerDensity', () => {
  it('uses compact density for floating focus host', () => {
    expect(resolveComposerDensity(1200, 'floating')).toBe('compact');
  });

  it('uses icon density on narrow AI columns', () => {
    expect(resolveComposerDensity(420, 'inline')).toBe('icon');
    expect(resolveComposerDensity(560, 'inline')).toBe('compact');
    expect(resolveComposerDensity(800, 'inline')).toBe('comfortable');
  });
});

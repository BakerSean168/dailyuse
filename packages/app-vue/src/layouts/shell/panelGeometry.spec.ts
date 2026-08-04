/** @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  AI_HARD_MIN,
  BUSINESS_HARD_MIN,
  BUSINESS_PREFERRED_RATIO,
  COMPOSER_MAX,
  COMPOSER_SIDE_GAP,
  computeComposerLayout,
  computePanelGeometry,
  panelWidthFromPointer,
  resolveComposerDensity,
  shouldAutoCollapseSidebar,
} from './panel-geometry';

describe('computePanelGeometry', () => {
  it('keeps AI and panel above mins in wide split viewports', () => {
    for (const viewportWidth of [1200, 1440]) {
      const geo = computePanelGeometry({
        viewportWidth,
        sidebarOccupiedWidth: 260,
      });
      expect(geo.canSplit).toBe(true);
      expect(geo.panelWidth).toBeGreaterThanOrEqual(BUSINESS_HARD_MIN);
      expect(geo.aiWidth).toBeGreaterThanOrEqual(AI_HARD_MIN);
    }
  });

  it('covers 1024/1200/1440 with sidebar open or collapsed', () => {
    // 1024 - 260 = 764 workspace, less than the combined 320 + 520 hard minimums.
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
    expect(at1024Collapsed.aiWidth).toBeGreaterThanOrEqual(AI_HARD_MIN);
    expect(at1024Collapsed.panelWidth).toBeGreaterThanOrEqual(BUSINESS_HARD_MIN);

    for (const viewportWidth of [1200, 1440]) {
      const open = computePanelGeometry({
        viewportWidth,
        sidebarOccupiedWidth: 260,
      });
      expect(open.canSplit).toBe(true);
      expect(open.aiWidth).toBeGreaterThanOrEqual(AI_HARD_MIN);
    }
  });

  it.each([
    { viewportWidth: 1024, sidebarOccupiedWidth: 260, canSplit: false, panel: 520, ai: 244 },
    { viewportWidth: 1024, sidebarOccupiedWidth: 0, canSplit: true, panel: 655, ai: 369 },
    { viewportWidth: 1200, sidebarOccupiedWidth: 260, canSplit: true, panel: 602, ai: 338 },
    { viewportWidth: 1200, sidebarOccupiedWidth: 0, canSplit: true, panel: 768, ai: 432 },
    { viewportWidth: 1280, sidebarOccupiedWidth: 260, canSplit: true, panel: 653, ai: 367 },
    { viewportWidth: 1280, sidebarOccupiedWidth: 0, canSplit: true, panel: 819, ai: 461 },
    { viewportWidth: 1440, sidebarOccupiedWidth: 260, canSplit: true, panel: 755, ai: 425 },
    { viewportWidth: 1440, sidebarOccupiedWidth: 0, canSplit: true, panel: 922, ai: 518 },
  ])(
    'uses the desktop geometry contract at $viewportWidth with sidebar $sidebarOccupiedWidth',
    ({ viewportWidth, sidebarOccupiedWidth, canSplit, panel, ai }) => {
      const geometry = computePanelGeometry({ viewportWidth, sidebarOccupiedWidth });
      expect(geometry.canSplit).toBe(canSplit);
      expect(geometry.panelWidth).toBe(panel);
      expect(geometry.aiWidth).toBe(ai);
      expect(geometry.panelWidth).toBeGreaterThan(geometry.aiWidth);
    },
  );

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
    expect(geo.aiWidth).toBeGreaterThanOrEqual(AI_HARD_MIN);
  });

  it('makes the business workspace dominant at the 1280px desktop reference size', () => {
    const geo = computePanelGeometry({
      viewportWidth: 1280,
      sidebarOccupiedWidth: 240,
    });

    expect(BUSINESS_HARD_MIN).toBeGreaterThan(AI_HARD_MIN);
    expect(BUSINESS_PREFERRED_RATIO).toBe(0.64);
    expect(geo.canSplit).toBe(true);
    expect(geo.aiWidth).toBeGreaterThanOrEqual(340);
    expect(geo.aiWidth).toBeLessThanOrEqual(390);
    expect(geo.panelWidth).toBeGreaterThanOrEqual(650);
    expect(geo.panelWidth).toBeLessThanOrEqual(700);
    expect(geo.panelWidth).toBeGreaterThan(geo.aiWidth);
  });

  it('marks narrow viewports as unable to split', () => {
    const geo = computePanelGeometry({
      viewportWidth: 900,
      sidebarOccupiedWidth: 260,
    });
    // workspace 640 cannot satisfy the combined 840px hard minimum.
    expect(geo.canSplit).toBe(false);
  });
});

describe('shouldAutoCollapseSidebar', () => {
  it('releases sidebar space only for an effectively narrow viewport', () => {
    expect(shouldAutoCollapseSidebar(853)).toBe(true);
    expect(shouldAutoCollapseSidebar(959)).toBe(true);
    expect(shouldAutoCollapseSidebar(960)).toBe(false);
    expect(shouldAutoCollapseSidebar(1024)).toBe(false);
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

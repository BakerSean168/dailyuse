import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';
import { test } from './fixtures/desktop-screenshot-fixture';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
const outputDir = path.join(
  workspaceRoot,
  'reports',
  'local-deploy-validation',
  'product-review-2026-08-01',
  'electron-layout-matrix',
);

interface ShellGeometry {
  viewportWidth: number;
  sidebarWidth: number;
  sidebarVisible: boolean;
  aiWidth: number;
  aiVisible: boolean;
  panelWidth: number;
  panelVisible: boolean;
}

async function readShellGeometry(page: import('@playwright/test').Page): Promise<ShellGeometry> {
  return page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const ai = document.querySelector<HTMLElement>('[data-testid="shell-ai-column"]');
    const panel = document.querySelector<HTMLElement>('.business-panel')?.parentElement ?? null;
    const rectWidth = (element: Element | null) =>
      element ? Math.round(element.getBoundingClientRect().width) : 0;
    const visible = (element: HTMLElement | null) =>
      Boolean(element && getComputedStyle(element).display !== 'none' && rectWidth(element) > 0);

    return {
      viewportWidth: window.innerWidth,
      sidebarWidth: rectWidth(sidebar),
      sidebarVisible: visible(sidebar as HTMLElement | null),
      aiWidth: rectWidth(ai),
      aiVisible: visible(ai),
      panelWidth: rectWidth(panel),
      panelVisible: visible(panel),
    };
  });
}

test('captures and verifies the Electron workspace geometry matrix', async ({ desktop }) => {
  mkdirSync(outputDir, { recursive: true });
  await expect(desktop.page.getByTestId('shell-ai-column')).toBeAttached();

  const desktopSizes = [1024, 1200, 1280, 1440] as const;
  for (const width of desktopSizes) {
    await desktop.setZoomFactor(1);
    await desktop.setWindowSize(width, 900);
    await expect
      .poll(() => desktop.page.evaluate(() => window.innerWidth))
      .toBeGreaterThan(width - 80);

    const geometry = await readShellGeometry(desktop.page);
    expect(geometry.panelVisible).toBe(true);
    if (width === 1024) {
      expect(geometry.aiVisible).toBe(false);
    } else {
      expect(geometry.aiVisible).toBe(true);
      expect(geometry.aiWidth).toBeGreaterThanOrEqual(320);
      expect(geometry.panelWidth).toBeGreaterThanOrEqual(520);
      expect(geometry.panelWidth).toBeGreaterThan(geometry.aiWidth);
    }
    if (width === 1280) {
      expect(geometry.aiWidth).toBeGreaterThanOrEqual(340);
      expect(geometry.aiWidth).toBeLessThanOrEqual(390);
      expect(geometry.panelWidth).toBeGreaterThanOrEqual(650);
      expect(geometry.panelWidth).toBeLessThanOrEqual(700);
    }

    await desktop.page.screenshot({
      path: path.join(outputDir, `workspace-${width}x900-100pct.png`),
      fullPage: false,
    });
  }

  for (const factor of [1.25, 1.5] as const) {
    await desktop.setWindowSize(1280, 900);
    await desktop.setZoomFactor(factor);
    await expect
      .poll(() => desktop.page.evaluate(() => window.devicePixelRatio))
      .toBeGreaterThan(0);

    const geometry = await readShellGeometry(desktop.page);
    expect(geometry.panelVisible).toBe(true);
    expect(geometry.aiVisible).toBe(false);
    if (factor === 1.5) {
      expect(geometry.sidebarVisible).toBe(false);
      expect(geometry.panelWidth).toBeGreaterThanOrEqual(520);
    }
    await desktop.page.screenshot({
      path: path.join(outputDir, `workspace-1280x900-${Math.round(factor * 100)}pct.png`),
      fullPage: false,
    });
  }

  await desktop.setZoomFactor(1);
});

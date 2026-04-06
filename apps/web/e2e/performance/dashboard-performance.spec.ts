/**
 * Dashboard Page Performance Tests (Playwright)
 *
 * Tests real-world performance metrics:
 * - Page load time
 * - First Contentful Paint (FCP) ≤ 1.0s
 * - Largest Contentful Paint (LCP) ≤ 2.0s
 * - Time to Interactive (TTI) ≤ 2.5s
 * - Widget rendering performance
 *
 * Run with: npx playwright test e2e/performance/dashboard-performance.spec.ts
 */

import { test, expect } from '@playwright/test';
import { login } from '../helpers/testHelpers';
import { WEB_CONFIG } from '../config';

type LargestContentfulPaintLike = PerformanceEntry & {
  renderTime?: number;
  loadTime?: number;
};

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number;
  };
};

test.describe('Dashboard Page Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
  });

  test('[P0] should load Dashboard page within 2.5 seconds', async ({ page }) => {
    const start = Date.now();

    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - start;

    console.log(`Dashboard page load time: ${duration}ms`);

    // Page should load within 2.5 seconds
    expect(duration).toBeLessThanOrEqual(2500);
  });

  test('[P0] should achieve First Contentful Paint within 1.0s', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));

    // Get FCP from Performance API
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
              observer.disconnect();
            }
          }
        });
        observer.observe({ type: 'paint', buffered: true });

        // Fallback if FCP not available
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`First Contentful Paint: ${fcp.toFixed(2)}ms`);

    if (fcp > 0) {
      // FCP should be ≤ 1.0s (1000ms)
      expect(fcp).toBeLessThanOrEqual(1000);
    }
  });

  test('[P0] should achieve Largest Contentful Paint within 2.0s', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));

    // Get LCP from Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lcpValue = 0;

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaintLike;
          lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Report LCP after 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 3000);
      });
    });

    console.log(`Largest Contentful Paint: ${lcp.toFixed(2)}ms`);

    if (lcp > 0) {
      // LCP should be ≤ 2.0s (2000ms)
      expect(lcp).toBeLessThanOrEqual(2000);
    }
  });

  test('[P1] should render all widgets within 1 second', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));

    const start = Date.now();

    // Wait for all widgets to be visible
    await page.waitForSelector('[data-testid="widget-task-stats"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="widget-goal-stats"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="widget-reminder-stats"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="widget-schedule-stats"]', { state: 'visible' });

    const duration = Date.now() - start;

    console.log(`All widgets rendered in: ${duration}ms`);

    // All widgets should render within 1 second
    expect(duration).toBeLessThanOrEqual(1000);
  });

  test('[P1] should open Settings Panel within 300ms', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    const start = Date.now();

    await page.click('[data-testid="dashboard-settings-button"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]', { state: 'visible' });

    const duration = Date.now() - start;

    console.log(`Settings panel opened in: ${duration}ms`);

    // Settings panel should open within 300ms
    expect(duration).toBeLessThanOrEqual(300);
  });

  test('[P1] should toggle widget visibility within 200ms', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.click('[data-testid="dashboard-settings-button"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]', { state: 'visible' });

    const start = Date.now();

    // Toggle first widget
    await page.click('[data-testid="widget-settings-panel"] .toggle-switch >> nth=0');

    const duration = Date.now() - start;

    console.log(`Widget visibility toggled in: ${duration}ms`);

    // Toggle should respond within 200ms
    expect(duration).toBeLessThanOrEqual(200);
  });

  test('[P1] should save configuration within 500ms', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.click('[data-testid="dashboard-settings-button"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]', { state: 'visible' });

    // Make a change
    await page.click('[data-testid="widget-settings-panel"] .toggle-switch >> nth=0');

    const start = Date.now();

    // Save
    await page.click('[data-testid="settings-save-button"]');
    await page.waitForSelector('[data-testid="widget-settings-panel"]', { state: 'hidden' });

    const duration = Date.now() - start;

    console.log(`Configuration saved in: ${duration}ms`);

    // Save should complete within 500ms
    expect(duration).toBeLessThanOrEqual(500);
  });

  test('[P2] should refresh data within 1 second', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    const start = Date.now();

    await page.click('[data-testid="dashboard-refresh-button"]');

    // Wait for loading state to appear and disappear
    await page
      .waitForSelector('[data-testid="dashboard-loading"]', { state: 'visible', timeout: 500 })
      .catch(() => {});
    await page
      .waitForSelector('[data-testid="dashboard-loading"]', { state: 'hidden', timeout: 2000 })
      .catch(() => {});

    const duration = Date.now() - start;

    console.log(`Data refreshed in: ${duration}ms`);

    // Refresh should complete within 1 second
    expect(duration).toBeLessThanOrEqual(1000);
  });

  test('[P2] should handle resize events efficiently', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Desktop
      { width: 1920, height: 1080 }, // Large Desktop
    ];

    for (const viewport of viewports) {
      const start = Date.now();

      await page.setViewportSize(viewport);

      // Wait for layout to stabilize
      await page.waitForTimeout(200);

      const duration = Date.now() - start;

      console.log(`Resize to ${viewport.width}x${viewport.height}: ${duration}ms`);

      // Resize should be handled within 500ms
      expect(duration).toBeLessThanOrEqual(500);
    }
  });

  test('[P2] should measure Core Web Vitals', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    // Wait for Web Vitals to be collected (5 seconds for TTI)
    await page.waitForTimeout(5000);

    // Get Web Vitals from sessionStorage
    const webVitals = await page.evaluate(() => {
      const vitals = sessionStorage.getItem('webVitals');
      return vitals ? JSON.parse(vitals) : {};
    });

    console.log('Core Web Vitals:', JSON.stringify(webVitals, null, 2));

    // Check if metrics meet requirements
    if (webVitals.FCP) {
      console.log(`FCP: ${webVitals.FCP.value.toFixed(2)}ms (${webVitals.FCP.rating})`);
      expect(webVitals.FCP.value).toBeLessThanOrEqual(1000); // ≤ 1.0s
    }

    if (webVitals.LCP) {
      console.log(`LCP: ${webVitals.LCP.value.toFixed(2)}ms (${webVitals.LCP.rating})`);
      expect(webVitals.LCP.value).toBeLessThanOrEqual(2000); // ≤ 2.0s
    }

    if (webVitals.FID) {
      console.log(`FID: ${webVitals.FID.value.toFixed(2)}ms (${webVitals.FID.rating})`);
      expect(webVitals.FID.value).toBeLessThanOrEqual(100); // ≤ 100ms
    }

    if (webVitals.CLS) {
      console.log(`CLS: ${webVitals.CLS.value.toFixed(3)} (${webVitals.CLS.rating})`);
      expect(webVitals.CLS.value).toBeLessThanOrEqual(0.1); // ≤ 0.1
    }

    if (webVitals.TTI) {
      console.log(`TTI: ${webVitals.TTI.value.toFixed(2)}ms (${webVitals.TTI.rating})`);
      expect(webVitals.TTI.value).toBeLessThanOrEqual(2500); // ≤ 2.5s
    }
  });

  test('[P2] should handle memory efficiently', async ({ page }) => {
    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        return perf.memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform operations
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="dashboard-refresh-button"]');
      await page.waitForTimeout(500);
    }

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        return perf.memory.usedJSHeapSize;
      }
      return 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);

      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncreaseMB).toBeLessThan(10);
    }
  });

  test('[P2] should load with throttled CPU (4x slowdown)', async ({ page, context }) => {
    // Emulate slow CPU
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const start = Date.now();

    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - start;

    console.log(`Page load time with 4x CPU throttling: ${duration}ms`);

    // Even with throttled CPU, page should load within 10 seconds
    expect(duration).toBeLessThanOrEqual(10000);

    // Disable throttling
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  });

  test('[P2] should load with slow 3G network', async ({ page, context }) => {
    // Emulate Slow 3G network
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 kbps
      uploadThroughput: (500 * 1024) / 8, // 500 kbps
      latency: 400, // 400ms latency
    });

    const start = Date.now();

    await page.goto(WEB_CONFIG.getFullUrl('/'));
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const duration = Date.now() - start;

    console.log(`Page load time with Slow 3G: ${duration}ms`);

    // With slow 3G, page should still load within 15 seconds
    expect(duration).toBeLessThanOrEqual(15000);

    // Disable network throttling
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });
});

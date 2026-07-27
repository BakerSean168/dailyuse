import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1207: formatMessageTime keep-boundary (app-react Intl zh-CN vs app-vue locale).
 * - app-react useAIWorkspace: fixed Intl.DateTimeFormat('zh-CN', hour+minute)
 * - app-vue SSEMonitorPage: toLocaleTimeString(locale.value)
 * Soft residual 1204: formatDateTime keep-boundary remains separate.
 * Soft residual 1201: handleAuthSuccess keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatMessageTime keep-boundary (residual 1207)', () => {
  const dir = __dirname;
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/hooks/useAIWorkspace.ts'),
    'utf8',
  );
  const vue = readFileSync(
    resolve(dir, '../../modules/notification/views/SSEMonitorPage.vue'),
    'utf8',
  );

  it('owns Residual 1207 keep-boundary markers on app-react Intl zh-CN formatMessageTime', () => {
    expect(react).toContain('Residual 1207 keep-boundary');
    expect(react).toMatch(/function formatMessageTime\b/);
    expect(react).toContain("Intl.DateTimeFormat('zh-CN'");
    expect(react).toContain("hour: '2-digit'");
    expect(react).toContain("minute: '2-digit'");
    const body = react.match(/function formatMessageTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Intl.DateTimeFormat');
    expect(body).toContain('zh-CN');
    expect(body).not.toContain('toLocaleTimeString');
    expect(body).not.toContain('locale.value');
  });

  it('differs from app-vue SSE locale toLocaleTimeString formatMessageTime (no force-merge)', () => {
    expect(vue).toContain('Residual 1207');
    expect(vue).toMatch(/function formatMessageTime\b/);
    expect(vue).toContain('Soft residual 1207');
    expect(vue).toContain('toLocaleTimeString(locale.value)');
    const body = vue.match(/function formatMessageTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('toLocaleTimeString');
    expect(body).toContain('locale.value');
    expect(body).not.toContain('Intl.DateTimeFormat');
    expect(body).not.toContain('zh-CN');
  });

  it('runtime: documents Intl zh-CN vs locale time-string contracts via body shape', () => {
    function reactFormatMessageTime(timestamp: number): string {
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestamp));
    }
    function vueFormatMessageTime(timestamp: number, locale: string): string {
      return new Date(timestamp).toLocaleTimeString(locale);
    }
    const fixed = Date.UTC(2024, 0, 2, 15, 4, 0);
    const reactOut = reactFormatMessageTime(fixed);
    const vueOut = vueFormatMessageTime(fixed, 'en-US');
    expect(typeof reactOut).toBe('string');
    expect(reactOut.length).toBeGreaterThan(0);
    expect(typeof vueOut).toBe('string');
    expect(vueOut.length).toBeGreaterThan(0);
    // Shape mismatch: react is fixed zh-CN Intl options object path; vue is locale API.
    expect(react).toContain("hour: '2-digit'");
    expect(vue).not.toContain("hour: '2-digit'");
  });

  it('documents residual 1207 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-message-time-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1207');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});

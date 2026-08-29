import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('InterventionWindow renderer entry (ROUTINE-4104)', () => {
  const rendererDir = resolve(__dirname, '..');
  const main = readFileSync(resolve(rendererDir, 'main.ts'), 'utf8');
  const bootstrap = readFileSync(resolve(rendererDir, 'bootstrap/intervention-window.ts'), 'utf8');

  it('boots the dedicated intervention surface before the full desktop application', () => {
    expect(main).toContain("path === '/intervention-window'");
    expect(main).toContain("import('./bootstrap/intervention-window')");
    expect(main.indexOf('isInterventionWindowHashRoute(hashPath)')).toBeLessThan(
      main.indexOf("import('./bootstrap/app')"),
    );
    expect(bootstrap).toContain("from '../intervention-window/InterventionWindowApp.vue'");
    expect(bootstrap).not.toContain('@memoflow/app-vue');
  });
});

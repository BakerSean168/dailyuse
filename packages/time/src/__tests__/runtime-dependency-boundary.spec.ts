import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

describe('@memoflow/time runtime dependency boundary', () => {
  it('ships @internationalized/date because the public facade imports it at runtime', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as PackageManifest;

    expect(manifest.dependencies?.['@internationalized/date']).toBe('3.11.0');
    expect(manifest.devDependencies?.['@internationalized/date']).toBeUndefined();
  });
});

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function vueFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return vueFiles(path);
    return entry.isFile() && entry.name.endsWith('.vue') ? [path] : [];
  });
}

describe('icon button accessibility contract', () => {
  it('gives every icon-only Button an explicit accessible name', () => {
    const sourceRoot = resolve(process.cwd(), 'src');
    const violations: string[] = [];

    for (const file of vueFiles(sourceRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/<Button\b[\s\S]*?>/g)) {
        const openingTag = match[0];
        if (!/size\s*=\s*['"]icon['"]/.test(openingTag)) continue;
        if (/aria-(?:label|labelledby)\s*=/.test(openingTag)) continue;

        const line = source.slice(0, match.index).split('\n').length;
        violations.push(`${relative(sourceRoot, file)}:${line}`);
      }
    }

    expect(violations, `Unnamed icon Buttons:\n${violations.join('\n')}`).toEqual([]);
  });
});

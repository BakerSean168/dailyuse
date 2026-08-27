import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(__dirname, 'index.ts'), 'utf8');

describe('Task router TASK-5203', () => {
  it('places occurrence and plan routes before the legacy template-id fallback', () => {
    const occurrence = source.indexOf("path: 'occurrences/:id'");
    const plans = source.indexOf("path: 'plans'");
    const planDetail = source.indexOf("path: 'plans/:id'");
    const legacy = source.indexOf("path: ':id'");
    expect(occurrence).toBeGreaterThan(-1);
    expect(plans).toBeGreaterThan(occurrence);
    expect(planDetail).toBeGreaterThan(plans);
    expect(legacy).toBeGreaterThan(planDetail);
    expect(source).toContain("name: 'task-occurrence-detail'");
    expect(source).toContain("name: 'task-plans'");
    expect(source).toContain("name: 'task-plan-detail'");
  });
});

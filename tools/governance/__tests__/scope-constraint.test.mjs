import { describe, expect, it } from 'vitest';
import {
  collectScopedProjects,
  extractSourceTagsFromEslint,
  filterRequiredFeatureScopes,
  findMissingScopeConstraints,
} from '../lib/scope-constraint.mjs';

describe('collectScopedProjects', () => {
  it('collects unique scope tags', () => {
    const scopes = collectScopedProjects([
      { name: 'goal', tags: ['scope:goal', 'layer:domain'] },
      { name: 'task', tags: ['scope:task'] },
      { name: 'goal-app', tags: ['scope:goal'] },
    ]);
    expect(scopes).toEqual(['scope:goal', 'scope:task']);
  });
});

describe('filterRequiredFeatureScopes', () => {
  it('keeps feature/app scopes and drops shared/meta', () => {
    const filtered = filterRequiredFeatureScopes([
      'scope:goal',
      'scope:shared',
      'scope:web',
      'scope:meta',
      'scope:tools',
    ]);
    expect(filtered).toEqual(['scope:goal', 'scope:web']);
  });
});

describe('extractSourceTagsFromEslint', () => {
  it('parses sourceTag entries', () => {
    const source = `
      { sourceTag: 'scope:goal', onlyDependOnLibsWithTags: ['scope:shared'] },
      { sourceTag: "scope:task", onlyDependOnLibsWithTags: ['scope:shared'] },
    `;
    expect(extractSourceTagsFromEslint(source)).toEqual(['scope:goal', 'scope:task']);
  });
});

describe('findMissingScopeConstraints', () => {
  it('flags missing required scopes (positive fixture)', () => {
    const result = findMissingScopeConstraints({
      requiredScopes: ['scope:goal', 'scope:task'],
      configuredSourceTags: ['scope:goal'],
    });
    expect(result.missing).toEqual(['scope:task']);
  });

  it('passes when all required scopes are configured (negative fixture)', () => {
    const result = findMissingScopeConstraints({
      requiredScopes: ['scope:goal', 'scope:task'],
      configuredSourceTags: ['scope:goal', 'scope:task', 'layer:domain'],
    });
    expect(result.missing).toEqual([]);
  });
});

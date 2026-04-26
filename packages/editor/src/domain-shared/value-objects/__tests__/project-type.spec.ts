import { describe, expect, it } from 'vitest';
import { ProjectType } from '../project-type';

describe('ProjectType', () => {
  it('validates type', () => {
    expect(ProjectType.isValid('Markdown')).toBe(true);
    expect(ProjectType.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(ProjectType.of('Code')).toBe('Code');
  });

  it('throws on invalid value', () => {
    expect(() => ProjectType.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(ProjectType.getAll()).toEqual(['Markdown', 'Code', 'Mixed', 'Other']);
  });

  it('checks type category', () => {
    expect(ProjectType.isMarkdown(ProjectType.Markdown)).toBe(true);
    expect(ProjectType.isMarkdown(ProjectType.Code)).toBe(false);
    expect(ProjectType.isCode(ProjectType.Code)).toBe(true);
    expect(ProjectType.isCode(ProjectType.Markdown)).toBe(false);
    expect(ProjectType.isMixed(ProjectType.Mixed)).toBe(true);
    expect(ProjectType.isMixed(ProjectType.Markdown)).toBe(false);
  });
});

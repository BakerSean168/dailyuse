import { describe, expect, it } from 'vitest';
import type { CodeSnippetId } from '@memoflow/contracts/governance';
import { CodeSnippet } from '../code-snippet';
import { Language } from '../language';
import { RuleTag } from '../rule-tag';
import { SnippetType } from '../snippet-type';

describe('governance rich value objects', () => {
  it('normalizes and validates rule tags', () => {
    const created = RuleTag.create(' Domain Driven Design ');
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(created.data.value).toBe('domain-driven-design');
    expect(created.data.length).toBe('domain-driven-design'.length);
    expect(created.data.contains('Driven')).toBe(true);
    expect(created.data.startsWith('domain')).toBe(true);
    expect(created.data.endsWith('DESIGN')).toBe(true);
    expect(created.data.toDTO()).toEqual({ value: 'domain-driven-design' });
    expect(created.data.toString()).toBe('domain-driven-design');

    const fromDTO = RuleTag.fromDTO({ value: 'already-normalized' });
    expect(fromDTO.value).toBe('already-normalized');

    const empty = RuleTag.create('   ');
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.error.code).toBe('VALIDATION_ERROR');
    }

    const tooLong = RuleTag.create('a'.repeat(51));
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) {
      expect(tooLong.error.code).toBe('VALIDATION_ERROR');
    }

    const invalidChars = RuleTag.create('bad_tag!');
    expect(invalidChars.ok).toBe(false);
    if (!invalidChars.ok) {
      expect(invalidChars.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('covers code snippet creation, updates, and persistence mapping', () => {
    const created = CodeSnippet.create({
      language: 'TypeScript',
      content: 'const answer = 42;',
      type: 'GoodExample',
      caption: 'Preferred pattern',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    expect(created.data.language).toBe(Language.TypeScript);
    expect(created.data.content).toBe('const answer = 42;');
    expect(created.data.type).toBe(SnippetType.GoodExample);
    expect(created.data.caption).toBe('Preferred pattern');
    expect(created.data.hasCaption).toBe(true);
    expect(created.data.contentSize).toBeGreaterThan(0);
    expect(created.data.contentSizeInKB).toBeCloseTo(created.data.contentSize / 1024);
    expect(created.data.lineCount).toBe(1);
    expect(created.data.isGoodExample).toBe(true);
    expect(created.data.isBadExample).toBe(false);
    expect(created.data.getTypeDisplayText()).toBe('✓ Good Example');

    const dto = created.data.toDTO();
    expect(dto.id).toBe(created.data.id);
    expect(created.data.toPersistenceDTO()).toEqual(dto);

    const updatedContent = created.data.updateContent('const answer = 43;\nconsole.log(answer);');
    expect(updatedContent.ok).toBe(true);
    if (updatedContent.ok) {
      expect(updatedContent.data.lineCount).toBe(2);
    }

    const updatedCaption = created.data.updateCaption(null);
    expect(updatedCaption.ok).toBe(true);
    if (updatedCaption.ok) {
      expect(updatedCaption.data.hasCaption).toBe(false);
      expect(updatedCaption.data.caption).toBeNull();
    }

    const updatedLanguage = created.data.updateLanguage(Language.JSON);
    expect(updatedLanguage.ok).toBe(true);
    if (updatedLanguage.ok) {
      expect(updatedLanguage.data.language).toBe(Language.JSON);
    }

    const fromDTO = CodeSnippet.fromDTO({
      id: '550e8400-e29b-41d4-a716-446655440000' as CodeSnippetId,
      language: 'JSON',
      content: '{\"answer\":42}',
      type: 'BadExample',
      caption: null,
    });
    expect(fromDTO.ok).toBe(true);
    if (fromDTO.ok) {
      expect(fromDTO.data.isBadExample).toBe(true);
      expect(fromDTO.data.getTypeDisplayText()).toBe('✗ Bad Example');
    }

    const fromPersistence = CodeSnippet.fromPersistenceDTO({
      id: '660e8400-e29b-41d4-a716-446655440000',
      language: 'Prisma',
      content: 'model User { id String @id }',
      type: 'GoodExample',
      caption: 'Schema',
    });
    expect(fromPersistence.ok).toBe(true);
    if (fromPersistence.ok) {
      expect(fromPersistence.data.language).toBe(Language.Prisma);
      expect(fromPersistence.data.caption).toBe('Schema');
    }

    const emptyContent = CodeSnippet.create({
      language: 'TypeScript',
      content: '   ',
      type: 'GoodExample',
      caption: null,
    });
    expect(emptyContent.ok).toBe(false);

    const oversized = CodeSnippet.create({
      language: 'TypeScript',
      content: 'x'.repeat(10 * 1024 + 1),
      type: 'GoodExample',
      caption: null,
    });
    expect(oversized.ok).toBe(false);

    const longCaption = CodeSnippet.create({
      language: 'TypeScript',
      content: 'const x = 1;',
      type: 'GoodExample',
      caption: 'a'.repeat(201),
    });
    expect(longCaption.ok).toBe(false);

    const invalidLanguage = CodeSnippet.create({
      language: 'Rust',
      content: 'fn main() {}',
      type: 'GoodExample',
      caption: null,
    });
    expect(invalidLanguage.ok).toBe(false);

    const invalidType = CodeSnippet.fromPersistenceDTO({
      id: '770e8400-e29b-41d4-a716-446655440000',
      language: 'TypeScript',
      content: 'const x = 1;',
      type: 'Neutral',
      caption: null,
    });
    expect(invalidType.ok).toBe(false);
  });
});


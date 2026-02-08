import { describe, it, expect } from 'vitest';
import { ConflictError, ValidationError } from '@dailyuse/utils';
import { Rule } from '../rule';

const baseExample = {
  title: 'Props object example',
  description: 'Show props object usage',
  language: 'typescript',
  code: 'class Rule { constructor(private readonly props) {} }',
};

function makeParams() {
  return {
    code: 'DDD-001',
    title: 'Entity Props Pattern',
    description: 'Use a props object in entities to simplify construction.',
    severity: 'mandatory',
    status: 'draft',
    tags: [' DDD ', 'Entity Props'],
    examples: {
      good: [baseExample],
      bad: [baseExample],
    },
  };
}

describe('Rule.create', () => {
  it('normalizes tags to kebab-case', () => {
    const rule = Rule.create(makeParams());
    expect(rule.tags).toEqual(['ddd', 'entity-props']);
  });

  it('throws validation error when required fields are missing', () => {
    const params = makeParams();
    params.code = '';
    expect(() => Rule.create(params)).toThrow(ValidationError);
  });

  it('throws validation error when examples are missing', () => {
    const params = makeParams();
    params.examples.good = [];
    expect(() => Rule.create(params)).toThrow(ValidationError);
  });

  it('throws validation error when severity is invalid', () => {
    const params = makeParams();
    params.severity = 'critical' as typeof params.severity;
    expect(() => Rule.create(params)).toThrow(ValidationError);
  });

  it('throws validation error when status is invalid', () => {
    const params = makeParams();
    params.status = 'archived' as typeof params.status;
    expect(() => Rule.create(params)).toThrow(ValidationError);
  });

  it('surfaces structured validation errors for empty tags', () => {
    const params = makeParams();
    params.tags = ['   '];

    try {
      Rule.create(params);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.context?.fields).toHaveProperty('tags.0');
      return;
    }

    throw new Error('Expected ValidationError to be thrown');
  });

  it('throws conflict error when code is not unique', () => {
    const params = makeParams();
    expect(() => Rule.create(params, { isCodeUnique: () => false })).toThrow(ConflictError);
  });
});

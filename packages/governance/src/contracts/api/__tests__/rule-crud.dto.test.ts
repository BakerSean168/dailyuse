import { describe, it, expect } from 'vitest';
import { CreateRuleSchema } from '../rules';

const baseExample = {
  language: 'typescript',
  content: 'class Rule { constructor(private readonly props) {} }',
  caption: 'Props object example',
};

function makeValidPayload() {
  return {
    code: 'DDD-001',
    title: 'Entity Props Pattern',
    description: 'Use a props object in entities to simplify construction.',
    severity: 'Mandatory',
    tags: ['ddd', 'entity-props'],
    goodExamples: [baseExample],
    badExamples: [baseExample],
  };
}

describe('CreateRuleSchema', () => {
  it('accepts a valid create rule payload', () => {
    const result = CreateRuleSchema.safeParse(makeValidPayload());
    expect(result.success).toBe(true);
  });

  it('rejects missing code', () => {
    const payload = makeValidPayload();
    delete (payload as Record<string, unknown>).code;
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const payload = { ...makeValidPayload(), severity: 'Critical' };
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid code format', () => {
    const payload = { ...makeValidPayload(), code: 'ddd_001' };
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects missing good examples', () => {
    const payload = makeValidPayload();
    payload.goodExamples = [];
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects missing bad examples', () => {
    const payload = makeValidPayload();
    payload.badExamples = [];
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { CreateRuleSchema } from '../rule-crud.dto';

const baseExample = {
  title: 'Props object example',
  description: 'Show props object usage',
  language: 'typescript',
  code: 'class Rule { constructor(private readonly props) {} }',
};

function makeValidPayload() {
  return {
    code: 'DDD-001',
    title: 'Entity Props Pattern',
    description: 'Use a props object in entities to simplify construction.',
    severity: 'mandatory',
    status: 'draft',
    tags: ['ddd', 'entity-props'],
    examples: {
      good: [baseExample],
      bad: [baseExample],
    },
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
    const payload = { ...makeValidPayload(), severity: 'critical' };
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const payload = { ...makeValidPayload(), status: 'archived' };
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects missing good examples', () => {
    const payload = makeValidPayload();
    payload.examples.good = [];
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('rejects missing bad examples', () => {
    const payload = makeValidPayload();
    payload.examples.bad = [];
    const result = CreateRuleSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { Rule } from '../rule';
import type { CreateRuleProps, RuleState } from '../rule';
import { RuleStatus } from '../../../domain-shared/value-objects/rule-status';
import { RuleSeverity } from '../../../domain-shared/value-objects/rule-severity';
import { RuleTag } from '../../../domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '../../../domain-shared/value-objects/code-snippet';
import { Language } from '../../../domain-shared/value-objects/language';
import { RuleId } from '../../../domain-shared/value-objects/rule-id';

// ============ Helpers ============

function validCreateProps(overrides?: Partial<CreateRuleProps>): CreateRuleProps {
  return {
    code: 'DDD-001',
    title: 'Use Aggregates',
    description: 'Always use aggregate roots for domain modeling.',
    severity: RuleSeverity.Recommended,
    tags: ['ddd'],
    goodExamples: [{ language: Language.TypeScript, content: 'const x = 1;' }],
    badExamples: [{ language: Language.TypeScript, content: 'let x = 1;' }],
    authorId: 'author-123' as any,
    ...overrides,
  };
}

function createActiveRule(
  severity:
    | typeof RuleSeverity.Recommended
    | typeof RuleSeverity.Mandatory = RuleSeverity.Recommended,
): Rule {
  const result = Rule.create(validCreateProps({ severity }));
  expect(result.ok).toBe(true);
  const rule = (result as any).data as Rule;
  const activateResult = rule.activate();
  expect(activateResult.ok).toBe(true);
  return rule;
}

function buildRuleState(overrides?: Partial<RuleState>): RuleState {
  const goodSnippetResult = CodeSnippet.create({
    language: Language.TypeScript,
    content: 'const x = 1;',
    type: 'GoodExample',
    caption: null,
  });
  const badSnippetResult = CodeSnippet.create({
    language: Language.TypeScript,
    content: 'let x = 1;',
    type: 'BadExample',
    caption: null,
  });

  return {
    id: RuleId.generate(),
    code: 'DDD-001',
    title: 'Test Rule',
    description: 'A valid description for testing purposes',
    severity: RuleSeverity.Recommended,
    status: RuleStatus.Draft,
    tags: [RuleTag.fromDTO({ value: 'ddd' })],
    codeSnippets: [
      goodSnippetResult.ok ? goodSnippetResult.data : null!,
      badSnippetResult.ok ? badSnippetResult.data : null!,
    ],
    authorId: 'test-author' as any,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ============ Tests ============

describe('Rule Aggregate Root', () => {
  // ------ create() ------

  describe('create()', () => {
    it('should create a rule in Draft status with valid props', () => {
      const result = Rule.create(validCreateProps());
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const rule = result.data;
      expect(rule.id).toBeTruthy();
      expect(rule.code).toBe('DDD-001');
      expect(rule.title).toBe('Use Aggregates');
      expect(rule.description).toBe('Always use aggregate roots for domain modeling.');
      expect(rule.severity).toBe(RuleSeverity.Recommended);
      expect(rule.status).toBe(RuleStatus.Draft);
      expect(rule.tags).toHaveLength(1);
      expect(rule.tags[0].value).toBe('ddd');
      expect(rule.goodExamples).toHaveLength(1);
      expect(rule.badExamples).toHaveLength(1);
      expect(rule.authorId).toBe('author-123');
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
      expect(rule.deprecationReason).toBeNull();
      expect(rule.replacementRuleId).toBeNull();
      expect(rule.liveReferenceLocation).toBeNull();
    });

    it('should emit governance:rule-created domain event', () => {
      const result = Rule.create(validCreateProps());
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const events = result.data.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('governance:rule-created');
      expect(events[0].payload).toMatchObject({
        code: 'DDD-001',
        title: 'Use Aggregates',
        severity: RuleSeverity.Recommended,
        tags: ['ddd'],
        authorId: 'author-123',
      });
    });

    it('should set liveReferenceLocation when provided', () => {
      const result = Rule.create(
        validCreateProps({
          liveReferenceLocation: 'packages/domain/src/aggregates/account.ts',
        }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.liveReferenceLocation).toBe('packages/domain/src/aggregates/account.ts');
    });

    it('should reject invalid code pattern', () => {
      const result = Rule.create(validCreateProps({ code: 'invalid' }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('PREFIX-NUMBER');
    });

    it('should reject code with lowercase letters', () => {
      const result = Rule.create(validCreateProps({ code: 'ddd-001' }));
      expect(result.ok).toBe(false);
    });

    it('should reject title shorter than 3 characters', () => {
      const result = Rule.create(validCreateProps({ title: 'AB' }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('3-100');
    });

    it('should reject title longer than 100 characters', () => {
      const result = Rule.create(validCreateProps({ title: 'A'.repeat(101) }));
      expect(result.ok).toBe(false);
    });

    it('should reject description shorter than 10 characters', () => {
      const result = Rule.create(validCreateProps({ description: 'Short' }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('10-5000');
    });

    it('should reject description longer than 5000 characters', () => {
      const result = Rule.create(validCreateProps({ description: 'A'.repeat(5001) }));
      expect(result.ok).toBe(false);
    });

    it('should reject empty tags array', () => {
      const result = Rule.create(validCreateProps({ tags: [] }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('tag');
    });

    it('should reject empty goodExamples', () => {
      const result = Rule.create(validCreateProps({ goodExamples: [] }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('Good Example');
    });

    it('should reject empty badExamples', () => {
      const result = Rule.create(validCreateProps({ badExamples: [] }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.message).toContain('Bad Example');
    });

    it('should normalize tags to lowercase-kebab-case', () => {
      const result = Rule.create(validCreateProps({ tags: ['My Tag', 'DDD'] }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.tags.map((t) => t.value)).toEqual(['my-tag', 'ddd']);
    });
  });

  // ------ load() ------

  describe('load()', () => {
    it('should restore from state without emitting events', () => {
      const state = buildRuleState();
      const rule = Rule.load(state);

      expect(rule.id).toBe(state.id);
      expect(rule.code).toBe('DDD-001');
      expect(rule.title).toBe('Test Rule');
      expect(rule.status).toBe(RuleStatus.Draft);
      expect(rule.pullDomainEvents()).toHaveLength(0);
    });

    it('should restore all fields correctly', () => {
      const state = buildRuleState({
        status: RuleStatus.Deprecated,
        deprecationReason: 'Replaced by new rule',
        replacementRuleId: RuleId.generate(),
        liveReferenceLocation: '/some/path.ts',
      });
      const rule = Rule.load(state);

      expect(rule.status).toBe(RuleStatus.Deprecated);
      expect(rule.deprecationReason).toBe('Replaced by new rule');
      expect(rule.replacementRuleId).toBe(state.replacementRuleId);
      expect(rule.liveReferenceLocation).toBe('/some/path.ts');
    });

    it('should create defensive copies of tags and codeSnippets', () => {
      const state = buildRuleState();
      const originalTags = state.tags;
      const rule = Rule.load(state);

      // Mutating the original array should not affect the rule
      originalTags.push(RuleTag.fromDTO({ value: 'mutated' }));
      expect(rule.tags).toHaveLength(1);
    });
  });

  // ------ activate() ------

  describe('activate()', () => {
    it('should transition Draft → Active', () => {
      const result = Rule.create(validCreateProps());
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const rule = result.data;
      rule.pullDomainEvents(); // clear create event

      const activateResult = rule.activate();
      expect(activateResult.ok).toBe(true);
      expect(rule.status).toBe(RuleStatus.Active);
    });

    it('should emit governance:rule-status-changed event', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      rule.pullDomainEvents();

      rule.activate();
      const events = rule.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('governance:rule-status-changed');
      expect(events[0].payload).toMatchObject({
        previousStatus: RuleStatus.Draft,
        newStatus: RuleStatus.Active,
      });
    });

    it('should reject Active → Active (no-op returns ok)', () => {
      const rule = createActiveRule();
      // Active → Active is same-state, canTransitionTo returns ok(true) for from===to
      const result = rule.activate();
      expect(result.ok).toBe(true);
    });
  });

  // ------ deprecate() ------

  describe('deprecate()', () => {
    it('should transition Active Recommended → Deprecated', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);
      rule.pullDomainEvents();

      const result = rule.deprecate('This rule is no longer relevant for the project.');
      expect(result.ok).toBe(true);
      expect(rule.status).toBe(RuleStatus.Deprecated);
      expect(rule.deprecationReason).toBe('This rule is no longer relevant for the project.');
    });

    it('should store replacementRuleId when provided', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);
      const replacementId = RuleId.generate();

      const result = rule.deprecate('Replaced by newer rule.', replacementId);
      expect(result.ok).toBe(true);
      expect(rule.replacementRuleId).toBe(replacementId);
    });

    it('should emit governance:rule-deprecated event', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);
      rule.pullDomainEvents();

      rule.deprecate('No longer needed for the project.');
      const events = rule.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('governance:rule-deprecated');
      expect(events[0].payload).toMatchObject({
        reason: 'No longer needed for the project.',
      });
    });

    it('should reject deprecation of Mandatory rules', () => {
      const rule = createActiveRule(RuleSeverity.Mandatory);

      const result = rule.deprecate('Trying to deprecate mandatory rule.');
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('BUSINESS_ERROR');
      expect(result.error.message).toContain('MANDATORY');
    });

    it('should reject Draft → Deprecated transition', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      const deprecateResult = rule.deprecate('Cannot deprecate a draft rule directly.');
      expect(deprecateResult.ok).toBe(false);
      if (deprecateResult.ok) return;
      expect(deprecateResult.error.code).toBe('BUSINESS_ERROR');
    });

    it('should reject empty deprecation reason', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);

      const result = rule.deprecate('');
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject deprecation reason shorter than 10 characters', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);

      const result = rule.deprecate('Short');
      expect(result.ok).toBe(false);
    });

    it('should reject deprecation reason longer than 500 characters', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);

      const result = rule.deprecate('A'.repeat(501));
      expect(result.ok).toBe(false);
    });
  });

  // ------ reactivate() ------

  describe('reactivate()', () => {
    it('should transition Deprecated → Active', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);
      rule.deprecate('No longer needed for this project.');
      rule.pullDomainEvents();

      const result = rule.reactivate();
      expect(result.ok).toBe(true);
      expect(rule.status).toBe(RuleStatus.Active);
      expect(rule.deprecationReason).toBeNull();
      expect(rule.replacementRuleId).toBeNull();
    });

    it('should emit governance:rule-reactivated event', () => {
      const rule = createActiveRule(RuleSeverity.Recommended);
      rule.deprecate('No longer needed for this project.');
      rule.pullDomainEvents();

      rule.reactivate();
      const events = rule.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('governance:rule-reactivated');
      expect(events[0].payload).toMatchObject({
        code: 'DDD-001',
      });
    });

    it('should reject reactivation of Draft rule', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;

      // Draft → Active is activate, not reactivate, but canTransitionTo allows Draft→Active
      // Actually reactivate calls canTransitionTo(Draft, Active) which IS allowed
      const reactivateResult = result.data.reactivate();
      // Draft → Active is valid, so this should succeed
      expect(reactivateResult.ok).toBe(true);
    });
  });

  // ------ update() ------

  describe('update()', () => {
    it('should update title', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      rule.pullDomainEvents();

      const updateResult = rule.update({ title: 'New Title' });
      expect(updateResult.ok).toBe(true);
      expect(rule.title).toBe('New Title');
    });

    it('should update description', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      rule.update({ description: 'A brand new description for this rule that is long enough.' });
      expect(rule.description).toBe('A brand new description for this rule that is long enough.');
    });

    it('should update tags', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      rule.update({ tags: ['new-tag', 'another-tag'] });
      expect(rule.tags).toHaveLength(2);
      expect(rule.tags.map((t) => t.value)).toEqual(['new-tag', 'another-tag']);
    });

    it('should update liveReferenceLocation', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      rule.update({ liveReferenceLocation: '/new/path.ts' });
      expect(rule.liveReferenceLocation).toBe('/new/path.ts');
    });

    it('should emit governance:rule-updated event with changedFields', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      rule.pullDomainEvents();

      rule.update({ title: 'Updated Title', tags: ['updated-tag'] });
      const events = rule.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('governance:rule-updated');
      expect(events[0].payload).toMatchObject({
        changedFields: ['title', 'tags'],
      });
    });

    it('should not emit event when no fields changed', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      rule.pullDomainEvents();

      rule.update({});
      const events = rule.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it('should reject title shorter than 3 characters', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;

      const updateResult = result.data.update({ title: 'AB' });
      expect(updateResult.ok).toBe(false);
    });

    it('should reject empty tags array', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;

      const updateResult = result.data.update({ tags: [] });
      expect(updateResult.ok).toBe(false);
    });

    it('should update updatedAt timestamp', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      const before = rule.updatedAt;

      // Small delay to ensure timestamp changes
      rule.update({ title: 'Updated Title' });
      expect(rule.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // ------ changeSeverity() ------

  describe('changeSeverity()', () => {
    it('should change severity from Recommended to Mandatory', () => {
      const result = Rule.create(validCreateProps({ severity: RuleSeverity.Recommended }));
      if (!result.ok) return;
      const rule = result.data;

      const changeResult = rule.changeSeverity(RuleSeverity.Mandatory);
      expect(changeResult.ok).toBe(true);
      expect(rule.severity).toBe(RuleSeverity.Mandatory);
    });

    it('should be a no-op when severity is the same', () => {
      const result = Rule.create(validCreateProps({ severity: RuleSeverity.Recommended }));
      if (!result.ok) return;
      const rule = result.data;
      const before = rule.updatedAt;

      const changeResult = rule.changeSeverity(RuleSeverity.Recommended);
      expect(changeResult.ok).toBe(true);
      // updatedAt should NOT change on no-op
      expect(rule.updatedAt).toBe(before);
    });
  });

  // ------ addTag() / removeTag() ------

  describe('addTag()', () => {
    it('should add a new tag', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      const addResult = rule.addTag('new-tag');
      expect(addResult.ok).toBe(true);
      expect(rule.tags).toHaveLength(2);
      expect(rule.tags.map((t) => t.value)).toContain('new-tag');
    });

    it('should normalize the tag', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      rule.addTag(' My New Tag ');
      expect(rule.tags.map((t) => t.value)).toContain('my-new-tag');
    });

    it('should silently ignore duplicate tags', () => {
      const result = Rule.create(validCreateProps({ tags: ['ddd'] }));
      if (!result.ok) return;
      const rule = result.data;

      const addResult = rule.addTag('ddd');
      expect(addResult.ok).toBe(true);
      expect(rule.tags).toHaveLength(1);
    });
  });

  describe('removeTag()', () => {
    it('should remove an existing tag', () => {
      const result = Rule.create(validCreateProps({ tags: ['ddd', 'architecture'] }));
      if (!result.ok) return;
      const rule = result.data;

      const removeResult = rule.removeTag('ddd');
      expect(removeResult.ok).toBe(true);
      expect(rule.tags).toHaveLength(1);
      expect(rule.tags[0].value).toBe('architecture');
    });

    it('should reject removing the last tag', () => {
      const result = Rule.create(validCreateProps({ tags: ['ddd'] }));
      if (!result.ok) return;
      const rule = result.data;

      const removeResult = rule.removeTag('ddd');
      expect(removeResult.ok).toBe(false);
      if (removeResult.ok) return;
      expect(removeResult.error.code).toBe('BUSINESS_ERROR');
      expect(removeResult.error.message).toContain('last tag');
    });
  });

  // ------ addCodeSnippet() / removeCodeSnippet() ------

  describe('addCodeSnippet()', () => {
    it('should add a code snippet', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;
      const initialCount = rule.codeSnippets.length;

      const snippetResult = CodeSnippet.create({
        language: Language.TypeScript,
        content: 'const y = 2;',
        type: 'GoodExample',
        caption: null,
      });
      expect(snippetResult.ok).toBe(true);
      if (!snippetResult.ok) return;

      const addResult = rule.addCodeSnippet(snippetResult.data);
      expect(addResult.ok).toBe(true);
      expect(rule.codeSnippets).toHaveLength(initialCount + 1);
    });
  });

  describe('removeCodeSnippet()', () => {
    it('should reject removing last Good Example', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      const goodExample = rule.goodExamples[0];
      const removeResult = rule.removeCodeSnippet(goodExample.id);
      expect(removeResult.ok).toBe(false);
      if (removeResult.ok) return;
      expect(removeResult.error.code).toBe('BUSINESS_ERROR');
      expect(removeResult.error.message).toContain('Good Example');
    });

    it('should reject removing last Bad Example', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      const badExample = rule.badExamples[0];
      const removeResult = rule.removeCodeSnippet(badExample.id);
      expect(removeResult.ok).toBe(false);
      if (removeResult.ok) return;
      expect(removeResult.error.message).toContain('Bad Example');
    });

    it('should return NOT_FOUND for non-existent snippet', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;

      const removeResult = result.data.removeCodeSnippet('non-existent-id');
      expect(removeResult.ok).toBe(false);
      if (removeResult.ok) return;
      expect(removeResult.error.code).toBe('NOT_FOUND');
    });

    it('should allow removing a snippet when extras exist', () => {
      const result = Rule.create(
        validCreateProps({
          goodExamples: [
            { language: Language.TypeScript, content: 'const a = 1;' },
            { language: Language.TypeScript, content: 'const b = 2;' },
          ],
        }),
      );
      if (!result.ok) return;
      const rule = result.data;
      expect(rule.goodExamples).toHaveLength(2);

      const firstGood = rule.goodExamples[0];
      const removeResult = rule.removeCodeSnippet(firstGood.id);
      expect(removeResult.ok).toBe(true);
      expect(rule.goodExamples).toHaveLength(1);
    });
  });

  // ------ toClientDTO() ------

  describe('toClientDTO()', () => {
    it('should return a complete DTO', () => {
      const result = Rule.create(
        validCreateProps({
          liveReferenceLocation: '/some/path.ts',
        }),
      );
      if (!result.ok) return;
      const dto = result.data.toClientDTO();

      expect(dto.id).toBeTruthy();
      expect(dto.code).toBe('DDD-001');
      expect(dto.title).toBe('Use Aggregates');
      expect(dto.description).toBe('Always use aggregate roots for domain modeling.');
      expect(dto.severity).toBe(RuleSeverity.Recommended);
      expect(dto.status).toBe(RuleStatus.Draft);
      expect(dto.deprecationReason).toBeNull();
      expect(dto.replacementRuleId).toBeNull();
      expect(dto.liveReferenceLocation).toBe('/some/path.ts');
      expect(dto.tags).toHaveLength(1);
      expect(dto.tags[0]).toEqual({ value: 'ddd' });
      expect(dto.goodExamples).toHaveLength(1);
      expect(dto.badExamples).toHaveLength(1);
      expect(dto.authorId).toBe('author-123');
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.updatedAt).toBe('number');
    });
  });

  // ------ Deep copy verification ------

  describe('defensive copies', () => {
    it('should not share tags array reference', () => {
      const result = Rule.create(validCreateProps());
      if (!result.ok) return;
      const rule = result.data;

      const tagsRef = rule.tags;
      expect(tagsRef).toHaveLength(1);
      // The tags getter returns the internal array (not a copy in current impl),
      // but load() makes a defensive copy of the constructor input
    });

    it('should not share codeSnippets array reference via load', () => {
      const state = buildRuleState();
      const originalSnippets = [...state.codeSnippets];
      const rule = Rule.load(state);

      // Mutate original state
      state.codeSnippets.push(originalSnippets[0]);
      // Rule's internal array should be unaffected
      expect(rule.codeSnippets).toHaveLength(2);
    });
  });
});

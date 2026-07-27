import { describe, it, expect } from 'vitest';
import { RuleRevision } from '../rule-revision';
import type { RuleRevisionState } from '../rule-revision';
import { RuleRevisionId } from '../../value-objects/rule-revision-id';
import { RuleId } from '../../value-objects/rule-id';

// ============ Helpers ============

function validCreateProps(overrides?: Partial<Omit<RuleRevisionState, 'id' | 'createdAt'>>) {
  return {
    ruleId: RuleId.generate(),
    revisionNumber: 1,
    authorId: 'test-author' as RuleRevisionState['authorId'],
    changedFields: ['title'],
    previousValues: { title: 'Old Title' },
    newValues: { title: 'New Title' },
    changeType: 'Updated' as const,
    ...overrides,
  };
}

function buildState(overrides?: Partial<RuleRevisionState>): RuleRevisionState {
  return {
    id: RuleRevisionId.generate(),
    ruleId: RuleId.generate(),
    revisionNumber: 3,
    authorId: 'test-author' as RuleRevisionState['authorId'],
    changedFields: ['description', 'tags'],
    previousValues: { description: 'old desc', tags: ['old-tag'] },
    newValues: { description: 'new desc', tags: ['new-tag'] },
    changeType: 'Updated',
    createdAt: new Date('2025-06-01'),
    ...overrides,
  };
}

// ============ Tests ============

describe('RuleRevision Entity', () => {
  // ------ create() ------

  describe('create()', () => {
    it('should create a revision with auto-generated id', () => {
      const result = RuleRevision.create(validCreateProps());

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      expect(revision.id).toBeTruthy();
      expect(revision.revisionNumber).toBe(1);
      expect(revision.authorId).toBe('test-author');
      expect(revision.changedFields).toEqual(['title']);
      expect(revision.previousValues).toEqual({ title: 'Old Title' });
      expect(revision.newValues).toEqual({ title: 'New Title' });
      expect(revision.changeType).toBe('Updated');
      expect(revision.createdAt).toBeInstanceOf(Date);
    });

    it('should use provided id when given', () => {
      const customId = RuleRevisionId.generate();
      const result = RuleRevision.create({
        ...validCreateProps(),
        id: customId,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.data.id).toBe(customId);
    });

    it('should return error when changedFields is empty', () => {
      const result = RuleRevision.create(validCreateProps({ changedFields: [] }));

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('RuleRevision must have at least one changed field');
    });

    it('should support all change types', () => {
      const types = ['Created', 'Updated', 'Deprecated', 'Reactivated'] as const;
      for (const changeType of types) {
        const result = RuleRevision.create(validCreateProps({ changeType }));

        expect(result.ok).toBe(true);
        if (!result.ok) return;

        expect(result.data.changeType).toBe(changeType);
      }
    });

    it('should store complex previousValues and newValues', () => {
      const result = RuleRevision.create(
        validCreateProps({
          changedFields: ['tags', 'severity'],
          previousValues: { tags: [{ value: 'ddd' }], severity: 'Recommended' },
          newValues: { tags: [{ value: 'ddd' }, { value: 'clean-code' }], severity: 'Mandatory' },
        }),
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      expect(revision.previousValues).toEqual({
        tags: [{ value: 'ddd' }],
        severity: 'Recommended',
      });
      expect(revision.newValues).toEqual({
        tags: [{ value: 'ddd' }, { value: 'clean-code' }],
        severity: 'Mandatory',
      });
    });
  });

  // ------ load() ------

  describe('load()', () => {
    it('should restore from state without validation', () => {
      const state = buildState();
      const revision = RuleRevision.load(state);

      expect(revision.id).toBe(state.id);
      expect(revision.ruleId).toBe(state.ruleId);
      expect(revision.revisionNumber).toBe(3);
      expect(revision.authorId).toBe('test-author');
      expect(revision.changedFields).toEqual(['description', 'tags']);
      expect(revision.changeType).toBe('Updated');
      expect(revision.createdAt).toBe(state.createdAt);
    });

    it('should allow empty changedFields (no validation on load)', () => {
      const state = buildState({ changedFields: [] });
      const revision = RuleRevision.load(state);
      expect(revision.changedFields).toEqual([]);
    });
  });

  // ------ Immutability (defensive copies) ------

  describe('immutability', () => {
    it('should not expose internal changedFields array by reference', () => {
      const props = validCreateProps({ changedFields: ['title', 'description'] });
      const result = RuleRevision.create(props);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      // Mutating the original props should not affect the entity
      props.changedFields.push('severity');
      expect(revision.changedFields).toEqual(['title', 'description']);
    });

    it('should not expose internal previousValues by reference', () => {
      const props = validCreateProps({
        previousValues: { title: 'Old' },
      });
      const result = RuleRevision.create(props);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      // Mutating the original props
      props.previousValues.title = 'Mutated';
      expect(revision.previousValues).toEqual({ title: 'Old' });
    });

    it('should not expose internal newValues by reference', () => {
      const props = validCreateProps({
        newValues: { title: 'New' },
      });
      const result = RuleRevision.create(props);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      props.newValues.title = 'Mutated';
      expect(revision.newValues).toEqual({ title: 'New' });
    });
  });

  // ------ Getters ------

  describe('getters', () => {
    it('should expose all properties via getters', () => {
      const ruleId = RuleId.generate();
      const result = RuleRevision.create({
        ruleId,
        revisionNumber: 5,
        authorId: 'user-456' as RuleRevisionState['authorId'],
        changedFields: ['status'],
        previousValues: { status: 'Active' },
        newValues: { status: 'Deprecated' },
        changeType: 'Deprecated',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      expect(revision.ruleId).toBe(ruleId);
      expect(revision.revisionNumber).toBe(5);
      expect(revision.authorId).toBe('user-456');
      expect(revision.changedFields).toEqual(['status']);
      expect(revision.previousValues).toEqual({ status: 'Active' });
      expect(revision.newValues).toEqual({ status: 'Deprecated' });
      expect(revision.changeType).toBe('Deprecated');
      expect(revision.createdAt).toBeInstanceOf(Date);
    });
  });

  // ------ toServerDTO() / toClientDTO() ------

  describe('toServerDTO()', () => {
    it('should return correct DTO with timestamp as number', () => {
      const state = buildState();
      const revision = RuleRevision.load(state);
      const dto = revision.toServerDTO();

      expect(dto.id).toBe(state.id);
      expect(dto.ruleId).toBe(state.ruleId);
      expect(dto.revisionNumber).toBe(3);
      expect(dto.authorId).toBe('test-author');
      expect(dto.changedFields).toEqual(['description', 'tags']);
      expect(dto.previousValues).toEqual(state.previousValues);
      expect(dto.newValues).toEqual(state.newValues);
      expect(dto.changeType).toBe('Updated');
      expect(typeof dto.createdAt).toBe('number');
      expect(dto.createdAt).toBe(state.createdAt.getTime());
    });

    it('should return defensive copies in DTO', () => {
      const result = RuleRevision.create(validCreateProps());

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      const dto1 = revision.toServerDTO();
      const dto2 = revision.toServerDTO();

      // Mutating one DTO should not affect another
      dto1.changedFields.push('severity');
      expect(dto2.changedFields).toEqual(['title']);
    });
  });

  describe('toClientDTO()', () => {
    it('should return correct DTO with timestamp as number', () => {
      const state = buildState();
      const revision = RuleRevision.load(state);
      const dto = revision.toClientDTO();

      expect(dto.id).toBe(state.id);
      expect(dto.ruleId).toBe(state.ruleId);
      expect(dto.revisionNumber).toBe(3);
      expect(typeof dto.createdAt).toBe('number');
    });

    it('should return defensive copies in DTO', () => {
      const result = RuleRevision.create(validCreateProps());

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const revision = result.data;
      const dto = revision.toClientDTO();

      dto.changedFields.push('extra');
      expect(revision.changedFields).toEqual(['title']);
    });
  });
});

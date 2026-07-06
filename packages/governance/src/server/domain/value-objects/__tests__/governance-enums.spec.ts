import { describe, expect, it } from 'vitest';
import { ChangeType } from '../change-type';
import { Language } from '../language';
import { RuleSeverity } from '../rule-severity';
import { RuleStatus } from '../rule-status';
import { SnippetType } from '../snippet-type';

describe('governance enum-like value objects', () => {
  it('covers change type and language factories', () => {
    expect(ChangeType.getAll()).toEqual([
      ChangeType.Created,
      ChangeType.Updated,
      ChangeType.Deprecated,
      ChangeType.Reactivated,
    ]);
    expect(ChangeType.isValid('Created')).toBe(true);
    expect(ChangeType.isValid('Renamed')).toBe(false);
    expect(ChangeType.getDisplayLabel(ChangeType.Created)).toBe('新建');
    expect(ChangeType.getDisplayLabel(ChangeType.Updated)).toBe('已更新');
    expect(ChangeType.getDisplayLabel(ChangeType.Deprecated)).toBe('已废弃');
    expect(ChangeType.getDisplayLabel(ChangeType.Reactivated)).toBe('重新激活');

    const changeType = ChangeType.create('Updated');
    expect(changeType.ok).toBe(true);
    if (changeType.ok) {
      expect(changeType.data).toBe(ChangeType.Updated);
    }

    const invalidChangeType = ChangeType.create('Renamed');
    expect(invalidChangeType.ok).toBe(false);
    if (!invalidChangeType.ok) {
      expect(invalidChangeType.error.code).toBe('VALIDATION_ERROR');
    }

    expect(Language.getAll()).toEqual([
      Language.TypeScript,
      Language.JSON,
      Language.YAML,
      Language.Prisma,
    ]);
    expect(Language.isValid('TypeScript')).toBe(true);
    expect(Language.isValid('Rust')).toBe(false);

    const language = Language.create('Prisma');
    expect(language.ok).toBe(true);
    if (language.ok) {
      expect(language.data).toBe(Language.Prisma);
    }

    const invalidLanguage = Language.create('Rust');
    expect(invalidLanguage.ok).toBe(false);
    if (!invalidLanguage.ok) {
      expect(invalidLanguage.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('covers severity, status, and snippet state logic', () => {
    expect(RuleSeverity.getAll()).toEqual([
      RuleSeverity.Mandatory,
      RuleSeverity.Recommended,
    ]);
    expect(RuleSeverity.isValid('Mandatory')).toBe(true);
    expect(RuleSeverity.isValid('Optional')).toBe(false);
    expect(RuleSeverity.isMandatory(RuleSeverity.Mandatory)).toBe(true);
    expect(RuleSeverity.isRecommended(RuleSeverity.Recommended)).toBe(true);
    expect(
      RuleSeverity.isStricterThan(RuleSeverity.Mandatory, RuleSeverity.Recommended),
    ).toBe(true);
    expect(
      RuleSeverity.isStricterThan(RuleSeverity.Recommended, RuleSeverity.Mandatory),
    ).toBe(false);

    const severity = RuleSeverity.create('Recommended');
    expect(severity.ok).toBe(true);
    if (severity.ok) {
      expect(severity.data).toBe(RuleSeverity.Recommended);
    }

    const invalidSeverity = RuleSeverity.create('Optional');
    expect(invalidSeverity.ok).toBe(false);
    if (!invalidSeverity.ok) {
      expect(invalidSeverity.error.code).toBe('VALIDATION_ERROR');
    }

    expect(RuleStatus.getAll()).toEqual([
      RuleStatus.Draft,
      RuleStatus.Active,
      RuleStatus.Deprecated,
    ]);
    expect(RuleStatus.isValid('Active')).toBe(true);
    expect(RuleStatus.isValid('Archived')).toBe(false);
    expect(RuleStatus.isDraft(RuleStatus.Draft)).toBe(true);
    expect(RuleStatus.isActive(RuleStatus.Active)).toBe(true);
    expect(RuleStatus.isDeprecated(RuleStatus.Deprecated)).toBe(true);
    expect(RuleStatus.isTerminal(RuleStatus.Deprecated)).toBe(true);
    expect(RuleStatus.isTerminal(RuleStatus.Active)).toBe(false);

    const status = RuleStatus.create('Draft');
    expect(status.ok).toBe(true);
    if (status.ok) {
      expect(status.data).toBe(RuleStatus.Draft);
    }

    const invalidStatus = RuleStatus.create('Archived');
    expect(invalidStatus.ok).toBe(false);
    if (!invalidStatus.ok) {
      expect(invalidStatus.error.code).toBe('VALIDATION_ERROR');
    }

    const sameStatus = RuleStatus.canTransitionTo(RuleStatus.Active, RuleStatus.Active);
    expect(sameStatus.ok).toBe(true);

    const activate = RuleStatus.canTransitionTo(RuleStatus.Draft, RuleStatus.Active);
    expect(activate.ok).toBe(true);

    const invalidTransition = RuleStatus.canTransitionTo(
      RuleStatus.Draft,
      RuleStatus.Deprecated,
    );
    expect(invalidTransition.ok).toBe(false);
    if (!invalidTransition.ok) {
      expect(invalidTransition.error.code).toBe('INVALID_TRANSITION');
    }

    const blockedDeprecation = RuleStatus.canTransitionTo(
      RuleStatus.Active,
      RuleStatus.Deprecated,
      { severity: RuleSeverity.Mandatory },
    );
    expect(blockedDeprecation.ok).toBe(false);
    if (!blockedDeprecation.ok) {
      expect(blockedDeprecation.error.code).toBe('INVALID_TRANSITION');
    }

    const allowedDeprecation = RuleStatus.canTransitionTo(
      RuleStatus.Active,
      RuleStatus.Deprecated,
      { severity: RuleSeverity.Recommended },
    );
    expect(allowedDeprecation.ok).toBe(true);

    const reactivate = RuleStatus.canTransitionTo(
      RuleStatus.Deprecated,
      RuleStatus.Active,
    );
    expect(reactivate.ok).toBe(true);

    expect(SnippetType.getAll()).toEqual([
      SnippetType.GoodExample,
      SnippetType.BadExample,
    ]);
    expect(SnippetType.isValid('GoodExample')).toBe(true);
    expect(SnippetType.isValid('Neutral')).toBe(false);

    const snippetType = SnippetType.create('BadExample');
    expect(snippetType.ok).toBe(true);
    if (snippetType.ok) {
      expect(snippetType.data).toBe(SnippetType.BadExample);
    }

    const invalidSnippetType = SnippetType.create('Neutral');
    expect(invalidSnippetType.ok).toBe(false);
    if (!invalidSnippetType.ok) {
      expect(invalidSnippetType.error.code).toBe('VALIDATION_ERROR');
    }
  });
});

import { randomUUID } from 'node:crypto';
import { ConflictError, ValidationError } from '@dailyuse/utils';
import {
  RuleSeverityValues,
  RuleStatusValues,
  type RuleExampleType,
  type RuleSeverity,
  type RuleStatus,
} from '../rule.enums';
import { CodeSnippet, RuleTag, type RuleExampleInput } from '../value-objects';

export interface RuleExamplesInput {
  good: RuleExampleInput[];
  bad: RuleExampleInput[];
}

export interface RuleCreateParams {
  id?: string;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  tags: string[];
  examples: RuleExamplesInput;
}

export interface RuleState {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  tags: string[];
  examples: CodeSnippet[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_RULE_CODE_LENGTH = 64;
const MAX_RULE_TITLE_LENGTH = 256;
const MAX_RULE_DESCRIPTION_LENGTH = 4000;
const MAX_EXAMPLE_TITLE_LENGTH = 120;
const MAX_EXAMPLE_DESCRIPTION_LENGTH = 2000;
const MAX_EXAMPLE_LANGUAGE_LENGTH = 50;

export class Rule {
  private constructor(private readonly _props: RuleState) {}

  static create(
    params: RuleCreateParams,
    options?: {
      isCodeUnique?: (code: string) => boolean;
    },
  ): Rule {
    const errors: Record<string, string> = {};

    if (!params.code?.trim()) {
      errors.code = 'Rule code is required';
    } else if (params.code.trim().length > MAX_RULE_CODE_LENGTH) {
      errors.code = `Rule code must be ${MAX_RULE_CODE_LENGTH} characters or fewer`;
    }

    if (!params.title?.trim()) {
      errors.title = 'Rule title is required';
    } else if (params.title.trim().length > MAX_RULE_TITLE_LENGTH) {
      errors.title = `Rule title must be ${MAX_RULE_TITLE_LENGTH} characters or fewer`;
    }

    if (!params.description?.trim()) {
      errors.description = 'Rule description is required';
    } else if (params.description.trim().length > MAX_RULE_DESCRIPTION_LENGTH) {
      errors.description = `Rule description must be ${MAX_RULE_DESCRIPTION_LENGTH} characters or fewer`;
    }

    if (!RuleSeverityValues.includes(params.severity)) {
      errors.severity = 'Rule severity is invalid';
    }

    if (!RuleStatusValues.includes(params.status)) {
      errors.status = 'Rule status is invalid';
    }

    if (!params.tags || params.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    }

    if (!params.examples?.good || params.examples.good.length === 0) {
      errors.examplesGood = 'At least one good example is required';
    }

    if (!params.examples?.bad || params.examples.bad.length === 0) {
      errors.examplesBad = 'At least one bad example is required';
    }

    const normalizedTags: string[] = [];
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach((tag, index) => {
        const normalized = RuleTag.normalize(tag);
        if (!normalized) {
          errors[`tags.${index}`] = 'Tag cannot be empty';
          return;
        }
        normalizedTags.push(normalized);
      });
    }

    const examples: CodeSnippet[] = [];
    const validateExamples = (items: RuleExampleInput[], type: RuleExampleType) => {
      items.forEach((example, index) => {
        const code = example.code?.trim();
        let hasError = false;
        if (!code) {
          errors[`examples.${type}.${index}.code`] = 'Example code is required';
          hasError = true;
        }

        if (example.title && example.title.length > MAX_EXAMPLE_TITLE_LENGTH) {
          errors[`examples.${type}.${index}.title`] =
            `Example title must be ${MAX_EXAMPLE_TITLE_LENGTH} characters or fewer`;
          hasError = true;
        }

        if (example.description && example.description.length > MAX_EXAMPLE_DESCRIPTION_LENGTH) {
          errors[`examples.${type}.${index}.description`] =
            `Example description must be ${MAX_EXAMPLE_DESCRIPTION_LENGTH} characters or fewer`;
          hasError = true;
        }

        if (example.language && example.language.length > MAX_EXAMPLE_LANGUAGE_LENGTH) {
          errors[`examples.${type}.${index}.language`] =
            `Example language must be ${MAX_EXAMPLE_LANGUAGE_LENGTH} characters or fewer`;
          hasError = true;
        }

        if (!hasError) {
          examples.push(CodeSnippet.create(type, { ...example, code: code ?? '' }));
        }
      });
    };

    if (params.examples?.good) {
      validateExamples(params.examples.good, 'good');
    }

    if (params.examples?.bad) {
      validateExamples(params.examples.bad, 'bad');
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Rule validation failed', errors);
    }

    const code = params.code.trim();
    if (options?.isCodeUnique && !options.isCodeUnique(code)) {
      throw new ConflictError('Rule code must be unique', { code });
    }

    const tags = normalizedTags.map((tag) => RuleTag.create(tag).value);

    const now = new Date();
    return new Rule({
      id: params.id ?? randomUUID(),
      code,
      title: params.title.trim(),
      description: params.description.trim(),
      severity: params.severity,
      status: params.status,
      tags,
      examples,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this._props.id;
  }

  get code(): string {
    return this._props.code;
  }

  get title(): string {
    return this._props.title;
  }

  get description(): string {
    return this._props.description;
  }

  get severity(): RuleSeverity {
    return this._props.severity;
  }

  get status(): RuleStatus {
    return this._props.status;
  }

  get tags(): string[] {
    return [...this._props.tags];
  }

  get examples(): CodeSnippet[] {
    return [...this._props.examples];
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }
}

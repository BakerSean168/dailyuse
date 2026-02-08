import { ValidationError } from '@dailyuse/utils';
import type { RuleExampleType } from '../rule.enums';

export interface RuleExampleInput {
  title?: string;
  description?: string;
  language?: string;
  code: string;
}

export interface CodeSnippetProps {
  type: RuleExampleType;
  title?: string;
  description?: string;
  language?: string;
  code: string;
}

const MAX_EXAMPLE_TITLE_LENGTH = 120;
const MAX_EXAMPLE_DESCRIPTION_LENGTH = 2000;
const MAX_EXAMPLE_LANGUAGE_LENGTH = 50;

export class CodeSnippet {
  private constructor(private readonly _props: CodeSnippetProps) {}

  static create(type: RuleExampleType, input: RuleExampleInput): CodeSnippet {
    const code = input.code?.trim();
    const errors: Record<string, string> = {};

    if (!code) {
      errors.code = 'Example code is required';
    }

    if (input.title && input.title.length > MAX_EXAMPLE_TITLE_LENGTH) {
      errors.title = `Example title must be ${MAX_EXAMPLE_TITLE_LENGTH} characters or fewer`;
    }

    if (input.description && input.description.length > MAX_EXAMPLE_DESCRIPTION_LENGTH) {
      errors.description = `Example description must be ${MAX_EXAMPLE_DESCRIPTION_LENGTH} characters or fewer`;
    }

    if (input.language && input.language.length > MAX_EXAMPLE_LANGUAGE_LENGTH) {
      errors.language = `Example language must be ${MAX_EXAMPLE_LANGUAGE_LENGTH} characters or fewer`;
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Invalid example', errors);
    }

    return new CodeSnippet({
      type,
      title: input.title?.trim(),
      description: input.description?.trim(),
      language: input.language?.trim(),
      code: code ?? '',
    });
  }

  get type(): RuleExampleType {
    return this._props.type;
  }

  get title(): string | undefined {
    return this._props.title;
  }

  get description(): string | undefined {
    return this._props.description;
  }

  get language(): string | undefined {
    return this._props.language;
  }

  get code(): string {
    return this._props.code;
  }
}

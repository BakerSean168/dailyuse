import { ValidationError } from '@dailyuse/utils';

export class RuleTag {
  private constructor(private readonly _value: string) {}

  static create(raw: string): RuleTag {
    const normalized = RuleTag.normalize(raw);
    if (!normalized) {
      throw new ValidationError('Invalid tag', { tag: 'Tag cannot be empty' });
    }

    return new RuleTag(normalized);
  }

  static normalize(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return '';
    }

    return trimmed
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  get value(): string {
    return this._value;
  }
}

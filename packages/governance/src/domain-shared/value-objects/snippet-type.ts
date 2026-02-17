import type { SnippetType as ISnippetType } from '../../contracts/value-objects/snippet-type';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export type SnippetType = ISnippetType & { readonly __brand: unique symbol };

const VALUES: ISnippetType[] = ['GoodExample', 'BadExample'];

export const SnippetType = {
  GoodExample: 'GoodExample' as SnippetType,
  BadExample: 'BadExample' as SnippetType,

  create(value: string): Result<SnippetType> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid SnippetType: "${value}". Valid values: ${VALUES.join(', ')}`,
      );
    }

    return ok(value as SnippetType);
  },

  isValid(value: string): value is SnippetType {
    return VALUES.includes(value as ISnippetType);
  },

  getAll(): SnippetType[] {
    return VALUES as SnippetType[];
  },
};

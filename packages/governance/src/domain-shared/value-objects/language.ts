import type { Language as ILanguage } from '../../contracts/value-objects/language';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export type Language = ILanguage & { readonly __brand: unique symbol };

const VALUES: ILanguage[] = ['TypeScript', 'JSON', 'YAML', 'Prisma'];

export const Language = {
  TypeScript: 'TypeScript' as Language,
  JSON: 'JSON' as Language,
  YAML: 'YAML' as Language,
  Prisma: 'Prisma' as Language,

  create(value: string): Result<Language> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid Language: "${value}". Valid values: ${VALUES.join(', ')}`,
      );
    }

    return ok(value as Language);
  },

  isValid(value: string): value is Language {
    return VALUES.includes(value as ILanguage);
  },

  getAll(): Language[] {
    return VALUES as Language[];
  },
};

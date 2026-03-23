import { IdGenerator } from './id-generator';
import { isValidUUID } from '../uuid';

const GENERIC_PREFIXED_UUID_REGEX =
  /^[A-Za-z][A-Za-z0-9]*_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasPrefixedUuidShape(value: string): boolean {
  if (!GENERIC_PREFIXED_UUID_REGEX.test(value)) {
    return false;
  }

  const separatorIndex = value.indexOf('_');
  return separatorIndex > 0 && isValidUUID(value.slice(separatorIndex + 1));
}

/**
 * 这是一个高阶函数，它返回一个现成的伴生对象。
 * T: 你的 Branded Type
 */
export function createIdType<T extends string>(prefix: string) {
  const expectedPrefix = `${prefix}_`;

  return {
    // 自动获得 generate 能力
    generate(): T {
      return `${expectedPrefix}${IdGenerator.id()}` as T;
    },

    // 自动获得还原能力
    of(value: string): T {
      if (typeof value !== 'string') {
        throw new TypeError(`ID for ${prefix} must be a string, received ${typeof value}`);
      }

      const normalized = value.trim();
      if (normalized.length === 0) {
        throw new TypeError(`ID for ${prefix} cannot be empty`);
      }

      if (!hasPrefixedUuidShape(normalized)) {
        console.warn(`ID ${normalized} is not in expected "Prefix_uuid" format`);
        return normalized as T;
      }

      if (!normalized.startsWith(expectedPrefix)) {
        throw new TypeError(`ID ${normalized} does not start with expected prefix ${prefix}`);
      }
      return normalized as T;
    },

    is(value: unknown): value is T {
      return typeof value === 'string' && hasPrefixedUuidShape(value.trim());
    },

    // 自动获得比较能力
    equals(a: T, b: T): boolean {
      return a === b;
    },
  };
}

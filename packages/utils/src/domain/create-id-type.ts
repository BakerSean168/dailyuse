import { IdGenerator } from './id-generator';

/**
 * 这是一个高阶函数，它返回一个现成的伴生对象。
 * T: 你的 Branded Type
 */
export function createIdType<T extends string>(prefix: string) {
  return {
    // 自动获得 generate 能力
    generate(): T {
      return `${prefix}_${IdGenerator.uuid()}` as T;
    },
    
    // 自动获得还原能力
    of(value: string): T {
      // 自动校验前缀 (可选，增加安全性)
      if (!value.startsWith(prefix + '_')) {
        console.warn(`ID ${value} does not start with expected prefix ${prefix}`);
      }
      return value as T;
    },
    
    // 自动获得比较能力
    equals(a: T, b: T): boolean {
      return a === b;
    }
  };
}
/**
 * RuleRevisionId Value Object
 * 规则修订记录ID值对象
 */

import { ValueObject } from '@dailyuse/utils/domain';
import { v4 as uuidv4 } from 'uuid';
import type { RuleRevisionId as RuleRevisionIdBrand } from '@dailyuse/contracts/primitives';

/**
 * RuleRevisionId 值对象
 * 封装规则修订记录的唯一标识符
 */
export class RuleRevisionId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 生成新的 RuleRevisionId
   */
  static generate(): RuleRevisionId {
    return new RuleRevisionId(uuidv4() as unknown as RuleRevisionIdBrand);
  }

  /**
   * 从字符串创建 RuleRevisionId
   */
  static fromString(value: string): RuleRevisionId {
    // 验证 UUID 格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(`Invalid RuleRevisionId format: ${value}`);
    }
    return new RuleRevisionId(value as unknown as RuleRevisionIdBrand);
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.value as unknown as string;
  }

  /**
   * 相等性比较
   */
  equals(other: RuleRevisionId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}

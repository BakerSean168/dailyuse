/**
 * RuleTag - Normalized tag value object
 * 
 * Enforces lowercase-kebab-case normalization
 * Prevents tag fragmentation (" DDD " vs "ddd" vs "DDD")
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type { Result, ok, fail } from '@dailyuse/contracts/result';

export class RuleTag extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }
  
  /**
   * Creates RuleTag with automatic normalization
   * 
   * @param raw - Input tag (e.g., " My Tag ", "DDD", "value-object")
   * @returns Normalized tag (e.g., "my-tag", "ddd", "value-object")
   */
  static create(raw: string): Result<RuleTag> {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (normalized.length === 0) {
      return fail('Tag cannot be empty');
    }
    
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      return fail('Tag must contain only lowercase letters, numbers, and hyphens');
    }
    
    return ok(new RuleTag(normalized));
  }
  
  get value(): string {
    return this.props;
  }
}

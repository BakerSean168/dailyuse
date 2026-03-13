import { OAuthProvider as IOAuthProvider } from '@dailyuse/contracts/authentication';

/**
 * OAuth provider type - authentication method identifier.
 *
 * Branded type: string at runtime, with compile-time type safety.
 * Zero serialization cost, minimal memory overhead.
 */
export type OAuthProvider = IOAuthProvider & { readonly __brand: unique symbol };

/**
 * Valid values set - Single Source of Truth.
 * Derived directly from the Contract enum to avoid manual duplication.
 */
const VALUES: IOAuthProvider[] = Object.values(IOAuthProvider) as IOAuthProvider[];

/**
 * Companion object providing static methods and behavior logic.
 * Stateless - all behavior methods take an instance as the first parameter.
 */
export const OAuthProvider = {
  // ================= Constants =================

  Google: 'Google' as OAuthProvider,
  Facebook: 'Facebook' as OAuthProvider,
  Github: 'Github' as OAuthProvider,
  Apple: 'Apple' as OAuthProvider,
  Wechat: 'Wechat' as OAuthProvider,
  Weibo: 'Weibo' as OAuthProvider,

  // ================= Factory Methods =================

  /**
   * Factory method: validates and converts a string to OAuthProvider.
   * @throws When the input value is not in the valid values list.
   */
  of(value: string): OAuthProvider {
    if (!this.isValid(value)) {
      throw new Error(`Invalid credential type: ${value}`);
    }
    return value as OAuthProvider;
  },

  // ================= Type Guards =================

  /**
   * Type guard: runtime type check for OAuthProvider values.
   */
  isValid(value: string): value is OAuthProvider {
    return VALUES.includes(value as IOAuthProvider);
  },

  /**
   * Returns all available OAuth provider values.
   */
  getAll(): OAuthProvider[] {
    return VALUES as OAuthProvider[];
  },

  // ================= Behavior Methods (State Logic) =================
};

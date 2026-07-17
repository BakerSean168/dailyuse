/**
 * Authentication Provider Registry — 认证提供者注册表
 *
 * The dispatch seam of the pluggable authentication architecture.
 * 可插拔认证架构的分发中枢。
 *
 * Responsibilities:
 * - hold registered providers keyed by method id;
 * - reject duplicate registrations (fail fast at composition time);
 * - resolve the provider for a requested method at runtime.
 *
 * 职责：
 * - 按方式 id 保存已注册提供者；
 * - 拒绝重复注册（组合期快速失败）；
 * - 运行期按请求方式解析提供者。
 *
 * The registry is intentionally free of transport, persistence and framework
 * concerns so it can be assembled in any composition root (API / Electron).
 * 注册表刻意不含传输、持久化与框架关注点，可在任意组合根（API / Electron）中组装。
 */

import type {
  AuthenticationMethod,
  AuthenticationProvider,
} from './authentication-provider';
import {
  DuplicateAuthenticationProviderError,
  UnsupportedAuthenticationMethodError,
} from './authentication-provider';

export class AuthenticationProviderRegistry {
  private readonly providers = new Map<string, AuthenticationProvider>();

  /**
   * Register providers at construction time.
   * 在构造时注册提供者。
   */
  constructor(providers: readonly AuthenticationProvider[] = []) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  /**
   * Register a single provider.
   * 注册单个提供者。
   *
   * @throws DuplicateAuthenticationProviderError when the method id is taken.
   */
  register(provider: AuthenticationProvider): this {
    if (this.providers.has(provider.method)) {
      throw new DuplicateAuthenticationProviderError(provider.method);
    }
    this.providers.set(provider.method, provider);
    return this;
  }

  /**
   * Resolve the provider for a method, or throw.
   * 解析某方式的提供者，找不到则抛出。
   *
   * @throws UnsupportedAuthenticationMethodError when unregistered.
   */
  resolve(method: AuthenticationMethod): AuthenticationProvider {
    const provider = this.providers.get(method);
    if (!provider) {
      throw new UnsupportedAuthenticationMethodError(method);
    }
    return provider;
  }

  /**
   * Whether a method has a registered provider.
   * 某方式是否已注册提供者。
   */
  has(method: AuthenticationMethod): boolean {
    return this.providers.has(method);
  }

  /**
   * List all registered method ids (stable insertion order).
   * 列出所有已注册方式 id（保持插入顺序）。
   */
  methods(): AuthenticationMethod[] {
    return [...this.providers.keys()];
  }
}

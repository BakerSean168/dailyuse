/**
 * DI Container - 依赖注入容器基础设施
 * TODO: 完善 DI 容器实现
 */

/**
 * 简易依赖注入容器
 */
export class DIContainer {
  private bindings = new Map<symbol, unknown>();

  register<T>(key: symbol, value: T): void {
    this.bindings.set(key, value);
  }

  resolve<T>(key: symbol): T {
    const value = this.bindings.get(key);
    if (value === undefined) {
      throw new Error(`No binding found for key: ${key.toString()}`);
    }
    return value as T;
  }

  has(key: symbol): boolean {
    return this.bindings.has(key);
  }
}

/**
 * 模块容器基类
 */
export abstract class ModuleContainerBase {
  protected container = new DIContainer();

  protected register<T>(key: symbol, value: T): void {
    this.container.register(key, value);
  }

  protected resolve<T>(key: symbol): T {
    return this.container.resolve<T>(key);
  }

  protected has(key: symbol): boolean {
    return this.container.has(key);
  }
}

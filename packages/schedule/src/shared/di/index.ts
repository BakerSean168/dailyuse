/**
 * Shared DI Container — Simple Dependency Injection
 *
 * 轻量级依赖注入容器，用于模块内部依赖管理。
 */

export class DIContainer {
  private services = new Map<symbol, unknown>();

  register<T>(key: symbol, instance: T): void {
    this.services.set(key, instance);
  }

  resolve<T>(key: symbol): T {
    if (!this.services.has(key)) {
      throw new Error(`Service not registered: ${key.toString()}`);
    }
    return this.services.get(key) as T;
  }

  has(key: symbol): boolean {
    return this.services.has(key);
  }
}

export abstract class ModuleContainerBase {
  protected container: DIContainer;

  constructor() {
    this.container = new DIContainer();
  }
}

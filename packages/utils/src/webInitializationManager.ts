/// <reference lib="dom" />

/**
 * Web 应用专用初始化管理器
 * Web Application Initialization Manager
 *
 * 相比基础的 InitializationManager，增加了 Web 端特有功能：
 * 1. 动态模块加载（懒加载）
 * 2. 模块分组（critical / authenticated）
 * 3. 预加载策略（requestIdleCallback）
 * 4. 加载进度回调
 * 5. 错误重试机制
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from './initializationManager';

/**
 * 模块加载器类型
 * 返回包含注册函数的模块
 */
export type ModuleLoader = () => Promise<{
  registerInitializationTasks?: () => void;
  register?: () => void;
  [key: string]: unknown;
}>;

/**
 * 模块定义
 */
export interface ModuleDefinition {
  /** 模块名称（唯一标识） */
  name: string;

  /** 动态加载函数 */
  loader: ModuleLoader;

  /** 优先级（数字越大越先加载，与 InitializationTask 的 priority 相反） */
  priority: number;

  /** 是否必需（加载失败时是否抛出错误） */
  required: boolean;

  /** 最大重试次数（默认 3） */
  maxRetries?: number;

  /** 重试延迟（毫秒，默认 1000） */
  retryDelay?: number;

  /** 超时时间（毫秒，默认 10000） */
  timeout?: number;
}

/**
 * 模块加载进度回调
 */
export interface LoadingProgress {
  /** 当前加载的模块索引（从 1 开始） */
  current: number;

  /** 总模块数 */
  total: number;

  /** 当前模块名称 */
  moduleName: string;

  /** 加载进度百分比（0-100） */
  percentage: number;

  /** 模块加载状态 */
  status: 'loading' | 'success' | 'failed' | 'retrying';

  /** 错误信息（如果有） */
  error?: Error;
}

/**
 * 模块分组
 */
export enum ModuleGroup {
  /** 关键模块（登录前必须加载） */
  CRITICAL = 'critical',

  /** 认证模块（登录后加载） */
  AUTHENTICATED = 'authenticated',

  /** 可选模块（按需加载） */
  OPTIONAL = 'optional',
}

/**
 * Web 应用专用初始化管理器
 */
export class WebInitializationManager {
  private static instance: WebInitializationManager;

  /** 基础初始化管理器 */
  private baseManager: InitializationManager;

  /** 模块注册表（按组分类） */
  private moduleRegistry: Map<ModuleGroup, ModuleDefinition[]> = new Map();

  /** 已加载的模块 */
  private loadedModules: Set<string> = new Set();

  /** 正在加载的模块 */
  private loadingModules: Set<string> = new Set();

  /** 加载失败的模块 */
  private failedModules: Map<string, Error> = new Map();

  private constructor() {
    this.baseManager = InitializationManager.getInstance();

    // 初始化模块注册表
    this.moduleRegistry.set(ModuleGroup.CRITICAL, []);
    this.moduleRegistry.set(ModuleGroup.AUTHENTICATED, []);
    this.moduleRegistry.set(ModuleGroup.OPTIONAL, []);
  }

  /**
   * 获取单例实例
   */
  static getInstance(): WebInitializationManager {
    if (!WebInitializationManager.instance) {
      WebInitializationManager.instance = new WebInitializationManager();
    }
    return WebInitializationManager.instance;
  }

  /**
   * 获取基础初始化管理器
   */
  getBaseManager(): InitializationManager {
    return this.baseManager;
  }

  /**
   * 注册模块到指定组
   */
  registerModule(group: ModuleGroup, module: ModuleDefinition): void {
    const modules = this.moduleRegistry.get(group);
    if (!modules) {
      throw new Error(`Invalid module group: ${group}`);
    }

    // 检查是否已注册
    const existingModule = modules.find((m) => m.name === module.name);
    if (existingModule) {
      console.warn(
        `[WebInit] Module "${module.name}" already registered in group "${group}", skipping`,
      );
      return;
    }

    // 设置默认值
    const normalizedModule: ModuleDefinition = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...module,
    };

    modules.push(normalizedModule);
    console.log(`[WebInit] Module "${module.name}" registered to group "${group}"`);
  }

  /**
   * 批量注册模块
   */
  registerModules(group: ModuleGroup, modules: ModuleDefinition[]): void {
    modules.forEach((module) => this.registerModule(group, module));
  }

  /**
   * 加载指定组的所有模块
   */
  async loadModuleGroup(
    group: ModuleGroup,
    onProgress?: (progress: LoadingProgress) => void,
  ): Promise<void> {
    const modules = this.moduleRegistry.get(group);
    if (!modules || modules.length === 0) {
      console.log(`[WebInit] No modules in group "${group}"`);
      return;
    }

    console.log(`[WebInit] Loading module group "${group}" (${modules.length} modules)`);

    // 按优先级排序（priority 从大到小）
    const sortedModules = [...modules].sort((a, b) => b.priority - a.priority);

    await this.loadModules(sortedModules, onProgress);
  }

  /**
   * 加载模块列表
   */
  async loadModules(
    modules: ModuleDefinition[],
    onProgress?: (progress: LoadingProgress) => void,
  ): Promise<void> {
    const total = modules.length;

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const current = i + 1;
      const percentage = Math.round((current / total) * 100);

      // 跳过已加载的模块
      if (this.loadedModules.has(module.name)) {
        console.log(`[WebInit] Module "${module.name}" already loaded, skipping`);
        onProgress?.({
          current,
          total,
          moduleName: module.name,
          percentage,
          status: 'success',
        });
        continue;
      }

      // 跳过正在加载的模块
      if (this.loadingModules.has(module.name)) {
        console.log(`[WebInit] Module "${module.name}" is already loading, skipping`);
        continue;
      }

      try {
        // 报告加载开始
        onProgress?.({
          current,
          total,
          moduleName: module.name,
          percentage,
          status: 'loading',
        });

        // 加载模块（带重试）
        await this.loadModuleWithRetry(module, onProgress);

        // 报告加载成功
        onProgress?.({
          current,
          total,
          moduleName: module.name,
          percentage,
          status: 'success',
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.failedModules.set(module.name, err);

        // 报告加载失败
        onProgress?.({
          current,
          total,
          moduleName: module.name,
          percentage,
          status: 'failed',
          error: err,
        });

        console.error(`[WebInit] Module "${module.name}" failed to load:`, err);

        // 如果是必需模块，抛出错误
        if (module.required) {
          throw new Error(`Required module "${module.name}" failed to load: ${err.message}`);
        }
      }
    }

    console.log(`[WebInit] Module loading complete (${total} modules)`);
  }

  /**
   * 加载单个模块（带重试和超时）
   */
  private async loadModuleWithRetry(
    module: ModuleDefinition,
    onProgress?: (progress: LoadingProgress) => void,
  ): Promise<void> {
    const maxRetries = module.maxRetries ?? 3;
    const retryDelay = module.retryDelay ?? 1000;
    const timeout = module.timeout ?? 10000;

    this.loadingModules.add(module.name);

    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // 带超时的加载
          await this.loadModuleWithTimeout(module, timeout);

          // 标记为已加载
          this.loadedModules.add(module.name);
          console.log(`[WebInit] Module "${module.name}" loaded successfully`);
          return;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries) {
            // 报告重试
            console.warn(
              `[WebInit] Module "${module.name}" failed, retrying (${attempt}/${maxRetries})...`,
              err,
            );

            onProgress?.({
              current: 0,
              total: 0,
              moduleName: module.name,
              percentage: 0,
              status: 'retrying',
              error: err,
            });

            // 等待后重试
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            // 最后一次尝试失败
            throw err;
          }
        }
      }
    } finally {
      this.loadingModules.delete(module.name);
    }
  }

  /**
   * 带超时的模块加载
   */
  private async loadModuleWithTimeout(module: ModuleDefinition, timeoutMs: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Module "${module.name}" loading timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const loadPromise = (async () => {
      console.log(`[WebInit] 📦 Loading module "${module.name}"...`);
      const startTime = performance.now();

      // 动态加载模块
      const loadedModule = await module.loader();

      const loadTime = (performance.now() - startTime).toFixed(2);
      console.log(`[WebInit] ✅ Module "${module.name}" loaded in ${loadTime}ms`);

      // 查找注册函数（支持多种命名）
      const registerFn =
        loadedModule.registerInitializationTasks ||
        loadedModule.register ||
        Object.values(loadedModule).find(
          (v) => typeof v === 'function' && v.name.includes('register'),
        );

      if (typeof registerFn === 'function') {
        // 执行注册函数（注册初始化任务到 baseManager）
        registerFn();
        console.log(`[WebInit] 🔧 Module "${module.name}" tasks registered`);
      } else {
        console.warn(
          `[WebInit] ⚠️ Module "${module.name}" has no register function, skipping task registration`,
        );
      }
    })();

    await Promise.race([loadPromise, timeoutPromise]);
  }

  /**
   * 预加载模块组（使用 requestIdleCallback 或延迟加载）
   */
  async preloadModuleGroup(
    group: ModuleGroup,
    options: {
      /** 是否使用 requestIdleCallback（浏览器空闲时加载） */
      useIdleCallback?: boolean;
      /** 延迟时间（毫秒，如果不使用 idleCallback） */
      delay?: number;
      /** 进度回调 */
      onProgress?: (progress: LoadingProgress) => void;
    } = {},
  ): Promise<void> {
    const { useIdleCallback = true, delay = 2000, onProgress } = options;

    console.log(`[WebInit] Preloading module group "${group}"...`);

    if (useIdleCallback && 'requestIdleCallback' in window) {
      // 使用 requestIdleCallback 在空闲时加载
      return new Promise<void>((resolve, reject) => {
        window.requestIdleCallback(
          async () => {
            try {
              await this.loadModuleGroup(group, onProgress);
              console.log(`[WebInit] Module group "${group}" preloaded successfully`);
              resolve();
            } catch (error) {
              console.error(`[WebInit] Module group "${group}" preload failed:`, error);
              reject(error);
            }
          },
          { timeout: 5000 },
        ); // 最多等待 5 秒
      });
    } else {
      // 降级：延迟加载
      return new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.loadModuleGroup(group, onProgress);
            console.log(`[WebInit] Module group "${group}" preloaded successfully (delayed)`);
            resolve();
          } catch (error) {
            console.error(`[WebInit] Module group "${group}" preload failed:`, error);
            reject(error);
          }
        }, delay);
      });
    }
  }

  /**
   * 执行初始化阶段（在加载模块后）
   */
  async executePhase(phase: InitializationPhase, context?: unknown): Promise<void> {
    return this.baseManager.executePhase(phase, context);
  }

  /**
   * 清理初始化阶段
   */
  async cleanupPhase(phase: InitializationPhase, context?: unknown): Promise<void> {
    return this.baseManager.cleanupPhase(phase, context);
  }

  /**
   * 获取模块加载状态
   */
  getModuleStatus(moduleName: string): 'not-loaded' | 'loading' | 'loaded' | 'failed' {
    if (this.loadedModules.has(moduleName)) return 'loaded';
    if (this.loadingModules.has(moduleName)) return 'loading';
    if (this.failedModules.has(moduleName)) return 'failed';
    return 'not-loaded';
  }

  /**
   * 获取所有已加载的模块
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }

  /**
   * 获取所有加载失败的模块
   */
  getFailedModules(): Map<string, Error> {
    return new Map(this.failedModules);
  }

  /**
   * 检查是否所有必需模块都已加载
   */
  isAllRequiredModulesLoaded(group: ModuleGroup): boolean {
    const modules = this.moduleRegistry.get(group);
    if (!modules) return true;

    const requiredModules = modules.filter((m) => m.required);
    return requiredModules.every((m) => this.loadedModules.has(m.name));
  }

  /**
   * 重置 Web 初始化管理器
   */
  reset(
    options: {
      /** 是否清除基础管理器的任务 */
      clearBaseTasks?: boolean;
      /** 是否清除模块注册表 */
      clearModuleRegistry?: boolean;
    } = {},
  ): void {
    const { clearBaseTasks = false, clearModuleRegistry = false } = options;

    // 清除加载状态
    this.loadedModules.clear();
    this.loadingModules.clear();
    this.failedModules.clear();

    // 可选：清除模块注册表
    if (clearModuleRegistry) {
      this.moduleRegistry.clear();
      this.moduleRegistry.set(ModuleGroup.CRITICAL, []);
      this.moduleRegistry.set(ModuleGroup.AUTHENTICATED, []);
      this.moduleRegistry.set(ModuleGroup.OPTIONAL, []);
    }

    // 可选：重置基础管理器
    if (clearBaseTasks) {
      this.baseManager.reset(true);
    }

    console.log('[WebInit] Web initialization manager reset', options);
  }
}

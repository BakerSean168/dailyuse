/**
 * 加载状态管理工具
 * @module loadingState
 * @description 提供框架无关的加载状态管理功能
 */

/**
 * 加载状态管理类
 * @description 用于管理异步操作的加载状态、错误和结果
 *
 * @template T - 结果数据类型
 * @template E - 错误类型
 *
 * @example
 * ```typescript
 * const loadingState = new LoadingState<User>()
 *
 * // 执行异步操作
 * await loadingState.execute(async () => {
 *   return await fetchUser(userId)
 * })
 *
 * if (loadingState.isLoading) {
 *   console.log('加载中...')
 * } else if (loadingState.error) {
 *   console.error('错误:', loadingState.error)
 * } else if (loadingState.data) {
 *   console.log('数据:', loadingState.data)
 * }
 * ```
 */
export class LoadingState<T = any, E = Error> {
  private _loading = false;
  private _data: T | null = null;
  private _error: E | null = null;
  private _lastUpdated: number | null = null;

  // 订阅者模式，用于通知状态变化
  private listeners: Set<(state: LoadingStateSnapshot<T, E>) => void> = new Set();

  /**
   * 获取当前加载状态
   */
  get isLoading(): boolean {
    return this._loading;
  }

  /**
   * 获取数据
   */
  get data(): T | null {
    return this._data;
  }

  /**
   * 获取错误
   */
  get error(): E | null {
    return this._error;
  }

  /**
   * 获取最后更新时间（时间戳）
   */
  get lastUpdated(): number | null {
    return this._lastUpdated;
  }

  /**
   * 是否有数据
   */
  get hasData(): boolean {
    return this._data !== null;
  }

  /**
   * 是否有错误
   */
  get hasError(): boolean {
    return this._error !== null;
  }

  /**
   * 获取当前状态快照
   */
  getSnapshot(): LoadingStateSnapshot<T, E> {
    return {
      loading: this._loading,
      data: this._data,
      error: this._error,
      lastUpdated: this._lastUpdated,
      hasData: this.hasData,
      hasError: this.hasError,
    };
  }

  /**
   * 订阅状态变化
   * @param listener - 状态变化回调函数
   * @returns 取消订阅函数
   */
  subscribe(listener: (state: LoadingStateSnapshot<T, E>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有订阅者
   */
  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean) {
    if (this._loading !== loading) {
      this._loading = loading;
      this.notify();
    }
  }

  /**
   * 设置数据
   */
  setData(data: T) {
    this._data = data;
    this._error = null;
    this._lastUpdated = Date.now();
    this.notify();
  }

  /**
   * 设置错误
   */
  setError(error: E) {
    this._error = error;
    this._lastUpdated = Date.now();
    this.notify();
  }

  /**
   * 重置状态
   */
  reset() {
    this._loading = false;
    this._data = null;
    this._error = null;
    this._lastUpdated = null;
    this.notify();
  }

  /**
   * 执行异步操作并自动管理加载状态
   * @param fn - 异步函数
   * @param onSuccess - 成功回调
   * @param onError - 错误回调
   * @returns Promise<T>
   */
  async execute(
    fn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: E) => void;
      onFinally?: () => void;
    },
  ): Promise<T> {
    this.setLoading(true);
    this._error = null;

    try {
      const result = await fn();
      this.setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error as E;
      this.setError(err);
      options?.onError?.(err);
      throw error;
    } finally {
      this.setLoading(false);
      options?.onFinally?.();
    }
  }

  /**
   * 重试操作
   * @param fn - 异步函数
   * @param maxRetries - 最大重试次数
   * @param retryDelay - 重试延迟（毫秒）
   * @returns Promise<T>
   */
  async retry(fn: () => Promise<T>, maxRetries = 3, retryDelay = 1000): Promise<T> {
    let lastError: E | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(fn);
      } catch (error) {
        lastError = error as E;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  }
}

/**
 * 加载状态快照类型
 */
export interface LoadingStateSnapshot<T = any, E = Error> {
  loading: boolean;
  data: T | null;
  error: E | null;
  lastUpdated: number | null;
  hasData: boolean;
  hasError: boolean;
}

/**
 * 创建加载状态包装器
 * @description 将任意函数包装为带加载状态的函数
 *
 * @template T - 函数类型
 * @param fn - 异步函数
 * @returns 包含执行函数和状态的对象
 *
 * @example
 * ```typescript
 * const { execute, state } = createLoadingWrapper(
 *   async (userId: string) => {
 *     return await fetchUser(userId)
 *   }
 * )
 *
 * await execute('123')
 * console.log(state.data) // User 数据
 * ```
 */
export function createLoadingWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): {
  execute: (...args: Parameters<T>) => Promise<ReturnType<T>>;
  state: LoadingState<Awaited<ReturnType<T>>>;
  reset: () => void;
} {
  const state = new LoadingState<Awaited<ReturnType<T>>>();

  const execute = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return await state.execute(() => fn(...args));
  };

  const reset = () => state.reset();

  return { execute, state, reset };
}

/**
 * 组合多个加载状态
 * @description 将多个加载状态组合为一个，用于并行加载场景
 *
 * @param states - 加载状态数组
 * @returns 组合后的加载状态快照
 *
 * @example
 * ```typescript
 * const userState = new LoadingState<User>()
 * const postsState = new LoadingState<Post[]>()
 *
 * const combined = combineLoadingStates([userState, postsState])
 * console.log(combined.isLoading) // 任一状态加载中则为 true
 * console.log(combined.hasError) // 任一状态有错误则为 true
 * ```
 */
export function combineLoadingStates(states: LoadingState[]): {
  isLoading: boolean;
  hasError: boolean;
  hasData: boolean;
  errors: (Error | null)[];
  data: (any | null)[];
} {
  return {
    isLoading: states.some((s) => s.isLoading),
    hasError: states.some((s) => s.hasError),
    hasData: states.every((s) => s.hasData),
    errors: states.map((s) => s.error),
    data: states.map((s) => s.data),
  };
}

/**
 * 轮询加载
 * @description 定时执行异步操作并管理状态
 *
 * @template T - 返回类型
 * @param fn - 异步函数
 * @param interval - 轮询间隔（毫秒）
 * @returns 包含启动、停止和状态的对象
 *
 * @example
 * ```typescript
 * const { start, stop, state } = createPollingLoader(
 *   async () => {
 *     return await fetchLatestData()
 *   },
 *   5000 // 每 5 秒轮询一次
 * )
 *
 * start() // 开始轮询
 * // ... 一段时间后
 * stop()  // 停止轮询
 * ```
 */
export function createPollingLoader<T>(
  fn: () => Promise<T>,
  interval = 5000,
): {
  start: () => void;
  stop: () => void;
  state: LoadingState<T>;
  isPolling: boolean;
} {
  const state = new LoadingState<T>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let isPolling = false;

  const start = () => {
    if (isPolling) return;

    isPolling = true;
    // 立即执行一次
    state.execute(fn);
    // 设置定时器
    timer = setInterval(() => {
      state.execute(fn);
    }, interval);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    isPolling = false;
  };

  return { start, stop, state, isPolling };
}

/**
 * 缓存加载结果
 * @description 带缓存的加载状态管理，避免重复请求
 *
 * @template T - 返回类型
 * @param fn - 异步函数
 * @param cacheKey - 缓存键
 * @param ttl - 缓存有效期（毫秒），默认 5 分钟
 * @returns 包含执行函数和状态的对象
 *
 * @example
 * ```typescript
 * const { execute, state, clearCache } = createCachedLoader(
 *   async (userId: string) => fetchUser(userId),
 *   (userId) => `user-${userId}`,
 *   60000 // 缓存 1 分钟
 * )
 *
 * // 第一次调用会请求 API
 * await execute('123')
 * // 第二次调用会使用缓存
 * await execute('123')
 * ```
 */
export function createCachedLoader<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheKey: (...args: Parameters<T>) => string,
  ttl = 5 * 60 * 1000,
): {
  execute: (...args: Parameters<T>) => Promise<ReturnType<T>>;
  state: LoadingState<Awaited<ReturnType<T>>>;
  clearCache: (key?: string) => void;
  getCacheInfo: (key: string) => CacheInfo<Awaited<ReturnType<T>>> | null;
} {
  const state = new LoadingState<Awaited<ReturnType<T>>>();
  const cache = new Map<string, CacheEntry<Awaited<ReturnType<T>>>>();

  const execute = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = cacheKey(...args);
    const cached = cache.get(key);

    // 检查缓存是否有效
    if (cached && Date.now() - cached.timestamp < ttl) {
      state.setData(cached.data);
      return cached.data;
    }

    // 执行请求
    const result = await state.execute(() => fn(...args));

    // 存入缓存
    cache.set(key, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  };

  const clearCache = (key?: string) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  };

  const getCacheInfo = (key: string): CacheInfo<Awaited<ReturnType<T>>> | null => {
    const cached = cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    return {
      data: cached.data,
      age,
      isExpired: age >= ttl,
      expiresIn: Math.max(0, ttl - age),
    };
  };

  return { execute, state, clearCache, getCacheInfo };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheInfo<T> {
  data: T;
  age: number;
  isExpired: boolean;
  expiresIn: number;
}

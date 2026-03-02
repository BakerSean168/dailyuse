/// <reference lib="dom" />

/**
 * 节流工具函数
 * @module throttle
 * @description 提供节流功能，限制函数在指定时间内只执行一次
 */

/**
 * 节流函数 - 纯函数版本（框架无关）
 * @description 在指定时间间隔内只执行一次函数，常用于滚动、窗口调整等高频事件
 *
 * @template T - 函数类型
 * @param fn - 需要节流的函数
 * @param delay - 时间间隔（毫秒），默认 300ms
 * @param options - 配置选项
 * @param options.leading - 是否在首次调用时立即执行，默认 true
 * @param options.trailing - 是否在最后一次调用后执行，默认 true
 * @returns 包含节流函数和取消函数的对象
 *
 * @example
 * ```typescript
 * // 滚动事件节流
 * const { throttledFn } = createThrottle(() => {
 *   console.log('滚动位置:', window.scrollY)
 * }, 200)
 *
 * window.addEventListener('scroll', throttledFn)
 *
 * // resize 事件节流
 * const { throttledFn: handleResize } = createThrottle(() => {
 *   console.log('窗口大小:', window.innerWidth, window.innerHeight)
 * }, 300)
 *
 * window.addEventListener('resize', handleResize)
 * ```
 */
export function createThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {},
): {
  throttledFn: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const { leading = true, trailing = true } = options;

  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    lastArgs = args;

    // 首次调用且 leading 为 true
    if (!lastTime && !leading) {
      lastTime = now;
      return;
    }

    // 时间间隔已过，立即执行
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn(...args);
      lastArgs = null;
    }
    // trailing 为 true，设置定时器在延迟后执行
    else if (!timer && trailing) {
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timer = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastTime = 0;
    lastArgs = null;
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (lastArgs) {
      fn(...lastArgs);
      lastTime = Date.now();
      lastArgs = null;
    }
  };

  return { throttledFn, cancel, flush };
}

/**
 * 节流装饰器 - 用于类方法
 * @description 将类方法包装为节流版本
 *
 * @param delay - 时间间隔（毫秒）
 * @param options - 配置选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * class ScrollHandler {
 *   @throttle(200)
 *   handleScroll(event: Event) {
 *     console.log('滚动事件')
 *   }
 * }
 * ```
 */
export function throttle(delay = 300, options: { leading?: boolean; trailing?: boolean } = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const throttleMap = new WeakMap<any, ReturnType<typeof createThrottle>>();

    descriptor.value = function (...args: any[]) {
      if (!throttleMap.has(this)) {
        throttleMap.set(this, createThrottle(originalMethod.bind(this), delay, options));
      }
      const { throttledFn } = throttleMap.get(this)!;
      throttledFn(...args);
    };

    return descriptor;
  };
}

/**
 * 时间窗口节流 - 在固定时间窗口内只执行一次
 * @description 类似于节流，但使用固定的时间窗口
 *
 * @template T - 函数类型
 * @param fn - 需要节流的函数
 * @param windowMs - 时间窗口（毫秒）
 * @returns 包含节流函数的对象
 *
 * @example
 * ```typescript
 * // 限制点赞功能，1秒内只能点击一次
 * const { throttledFn: handleLike } = createWindowThrottle(
 *   async () => {
 *     await likeApi()
 *     message.success('点赞成功')
 *   },
 *   1000
 * )
 * ```
 */
export function createWindowThrottle<T extends (...args: any[]) => any>(
  fn: T,
  windowMs = 1000,
): {
  throttledFn: (...args: Parameters<T>) => boolean;
  cancel: () => void;
  getRemainingTime: () => number;
} {
  let lastExecTime = 0;

  const throttledFn = (...args: Parameters<T>): boolean => {
    const now = Date.now();
    const elapsed = now - lastExecTime;

    if (elapsed >= windowMs) {
      lastExecTime = now;
      fn(...args);
      return true;
    }
    return false;
  };

  const cancel = () => {
    lastExecTime = 0;
  };

  const getRemainingTime = (): number => {
    const elapsed = Date.now() - lastExecTime;
    return Math.max(0, windowMs - elapsed);
  };

  return { throttledFn, cancel, getRemainingTime };
}

/**
 * RAF 节流 - 使用 requestAnimationFrame 的节流
 * @description 适用于动画和滚动场景，确保在浏览器重绘前执行
 *
 * @template T - 函数类型
 * @param fn - 需要节流的函数
 * @returns 包含节流函数和取消函数的对象
 *
 * @example
 * ```typescript
 * // 滚动动画
 * const { throttledFn } = createRAFThrottle(() => {
 *   // 更新动画状态
 *   updateScrollProgress()
 * })
 *
 * window.addEventListener('scroll', throttledFn)
 * ```
 */
export function createRAFThrottle<T extends (...args: any[]) => any>(
  fn: T,
): {
  throttledFn: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttledFn = (...args: Parameters<T>) => {
    lastArgs = args;
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
      rafId = null;
    });
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
  };

  return { throttledFn, cancel };
}

/**
 * 组合防抖和节流
 * @description 先节流后防抖，既限制频率又延迟执行
 *
 * @template T - 函数类型
 * @param fn - 需要处理的函数
 * @param throttleDelay - 节流间隔（毫秒）
 * @param debounceDelay - 防抖延迟（毫秒）
 * @returns 包含组合函数的对象
 *
 * @example
 * ```typescript
 * // 搜索输入：节流限制频率，防抖等待停止输入
 * const { combinedFn } = createThrottleDebounce(
 *   (keyword: string) => searchApi(keyword),
 *   500,  // 最快 500ms 执行一次
 *   300   // 停止输入 300ms 后执行
 * )
 * ```
 */
export function createThrottleDebounce<T extends (...args: any[]) => any>(
  fn: T,
  throttleDelay = 500,
  debounceDelay = 300,
): {
  combinedFn: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let lastTime = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const combinedFn = (...args: Parameters<T>) => {
    lastArgs = args;
    const now = Date.now();
    const elapsed = now - lastTime;

    // 清除之前的防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    // 如果超过节流间隔，立即执行
    if (elapsed >= throttleDelay) {
      lastTime = now;
      fn(...args);
      lastArgs = null;
    }
    // 否则设置防抖定时器
    else {
      debounceTimer = setTimeout(() => {
        lastTime = Date.now();
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
        debounceTimer = null;
      }, debounceDelay);
    }
  };

  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    lastTime = 0;
    lastArgs = null;
  };

  return { combinedFn, cancel };
}

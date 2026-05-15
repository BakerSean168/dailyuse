/**
 * 前端工具函数
 */

export * from './apiUtils';

// 高级防抖节流功能（避免与 apiUtils 中的简单版本冲突）
export {
  createDebounce,
  createDebouncePromise,
  createBatchDebounce,
  debounce as debounceDecorator,
} from './debounce';

export {
  createThrottle,
  createWindowThrottle,
  createRAFThrottle,
  createThrottleDebounce,
  throttle as throttleDecorator,
} from './throttle';

// 加载状态管理
export * from './loadingState';

// HTML 脱敏工具
export * from './sanitizer';

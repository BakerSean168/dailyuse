/**
 * Vuetify Loading State Composables
 * @module useLoading
 * @description Vuetify-specific loading state management with global overlay support.
 *
 * Note: For framework-agnostic loading logic, see @dailyuse/ui-core.
 * For Vue composables, see @dailyuse/ui-vue-shadcn.
 * This file provides Vuetify-specific implementations with backward compatibility.
 */

import { ref, computed, type Ref } from 'vue';
import { createLoadingWrapper } from '@dailyuse/utils';

// Re-export core loading composables from ui-vue for convenience
export { useLoading as useCoreLoading } from '@dailyuse/ui-vue-shadcn';

/**
 * Loading 覆盖层选项
 */
export interface LoadingOverlayOptions {
  text?: string;
  opacity?: number;
  color?: string;
  zIndex?: number;
}

/**
 * 全局 Loading 状态
 */
interface GlobalLoadingState {
  visible: boolean;
  text: string;
  count: number;
  opacity: number;
  color: string;
  zIndex: number;
}

/**
 * Vuetify Loading Composable
 * @description 提供响应式的 Loading 状态管理
 *
 * @example
 * ```typescript
 * const { loading, withLoading } = useLoading()
 *
 * // 基础用法
 * const handleSubmit = async () => {
 *   await withLoading(async () => {
 *     await submitApi(formData)
 *     message.success('提交成功')
 *   })
 * }
 *
 * // 模板中
 * <v-btn :loading="loading" @click="handleSubmit">
 *   提交
 * </v-btn>
 * ```
 */
export function useLoading() {
  const loading = ref(false);

  /**
   * 包装异步函数，自动管理 loading 状态
   * @param fn - 异步函数
   * @returns Promise
   */
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  };

  /**
   * 手动设置 loading 状态
   */
  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  return {
    loading,
    withLoading,
    setLoading,
  };
}

/**
 * 全局 Loading 遮罩
 * @description 提供全局 Loading 遮罩，支持计数器避免闪烁
 *
 * @example
 * ```typescript
 * const globalLoading = useGlobalLoading()
 *
 * // 显示 Loading
 * globalLoading.show('加载中...')
 *
 * // 隐藏 Loading
 * globalLoading.hide()
 *
 * // 自动管理（推荐）
 * await globalLoading.withLoading(async () => {
 *   await fetchData()
 * }, '正在获取数据...')
 * ```
 */
export function useGlobalLoading() {
  // 全局单例状态
  if (!globalLoadingState.value) {
    globalLoadingState.value = {
      visible: false,
      text: '加载中...',
      count: 0,
      opacity: 0.8,
      color: 'primary',
      zIndex: 9999,
    };
  }

  const state = globalLoadingState;

  /**
   * 显示 Loading
   * @param options - 配置选项
   */
  const show = (options?: string | LoadingOverlayOptions) => {
    state.value!.count++;

    if (state.value!.count === 1) {
      if (typeof options === 'string') {
        state.value!.text = options;
      } else if (options) {
        if (options.text) state.value!.text = options.text;
        if (options.opacity !== undefined) state.value!.opacity = options.opacity;
        if (options.color) state.value!.color = options.color;
        if (options.zIndex) state.value!.zIndex = options.zIndex;
      }
      state.value!.visible = true;
    }
  };

  /**
   * 隐藏 Loading
   */
  const hide = () => {
    state.value!.count = Math.max(0, state.value!.count - 1);

    if (state.value!.count === 0) {
      state.value!.visible = false;
      // 重置为默认值
      state.value!.text = '加载中...';
      state.value!.opacity = 0.8;
    }
  };

  /**
   * 强制隐藏 Loading（清除计数器）
   */
  const forceHide = () => {
    state.value!.count = 0;
    state.value!.visible = false;
  };

  /**
   * 包装异步函数，自动显示/隐藏 Loading
   * @param fn - 异步函数
   * @param text - Loading 文本
   * @returns Promise
   */
  const withLoading = async <T>(fn: () => Promise<T>, text?: string): Promise<T> => {
    show(text);
    try {
      return await fn();
    } finally {
      hide();
    }
  };

  /**
   * 获取当前状态
   */
  const isLoading = computed(() => state.value?.visible || false);
  const loadingText = computed(() => state.value?.text || '加载中...');
  const loadingCount = computed(() => state.value?.count || 0);

  return {
    // 状态
    state,
    isLoading,
    loadingText,
    loadingCount,

    // 方法
    show,
    hide,
    forceHide,
    withLoading,
  };
}

/**
 * 全局 Loading 状态（单例）
 */
const globalLoadingState: Ref<GlobalLoadingState | null> = ref(null);

/**
 * 获取全局 Loading 实例
 */
export function getGlobalLoading() {
  return useGlobalLoading();
}

/**
 * 高级 Loading State（结合 @dailyuse/utils）
 * @description 提供更强大的状态管理功能
 *
 * @example
 * ```typescript
 * const { execute, state, loading, data, error } = useAdvancedLoading(
 *   async (id: string) => {
 *     return await fetchUser(id)
 *   }
 * )
 *
 * // 执行请求
 * await execute('123')
 *
 * // 使用状态
 * if (loading.value) {
 *   console.log('加载中...')
 * } else if (error.value) {
 *   console.error('错误:', error.value)
 * } else if (data.value) {
 *   console.log('数据:', data.value)
 * }
 * ```
 */
export function useAdvancedLoading<T extends (...args: any[]) => Promise<any>>(fn: T) {
  const { execute, state, reset } = createLoadingWrapper(fn);

  // 响应式包装
  const loading = computed(() => state.isLoading);
  const data = computed(() => state.data);
  const error = computed(() => state.error);
  const hasData = computed(() => state.hasData);
  const hasError = computed(() => state.hasError);

  return {
    execute,
    state,
    reset,
    // 响应式计算属性
    loading,
    data,
    error,
    hasData,
    hasError,
  };
}

/**
 * 按钮 Loading 状态管理
 * @description 专门用于按钮的 Loading 状态管理
 *
 * @example
 * ```typescript
 * const { loadings, createHandler } = useButtonLoading()
 *
 * const handleSave = createHandler('save', async () => {
 *   await saveApi()
 * })
 *
 * const handleDelete = createHandler('delete', async () => {
 *   await deleteApi()
 * })
 *
 * // 模板中
 * <v-btn :loading="loadings.save" @click="handleSave">保存</v-btn>
 * <v-btn :loading="loadings.delete" @click="handleDelete">删除</v-btn>
 * ```
 */
export function useButtonLoading() {
  const loadings = ref<Record<string, boolean>>({});

  /**
   * 创建按钮处理函数
   * @param key - 按钮标识
   * @param fn - 异步函数
   * @returns 处理函数
   */
  const createHandler = <T extends (...args: any[]) => Promise<any>>(
    key: string,
    fn: T,
  ): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      loadings.value[key] = true;
      try {
        return await fn(...args);
      } finally {
        loadings.value[key] = false;
      }
    };
  };

  /**
   * 手动设置 Loading 状态
   */
  const setLoading = (key: string, value: boolean) => {
    loadings.value[key] = value;
  };

  /**
   * 获取 Loading 状态
   */
  const isLoading = (key: string): boolean => {
    return loadings.value[key] || false;
  };

  /**
   * 重置所有 Loading 状态
   */
  const reset = () => {
    loadings.value = {};
  };

  return {
    loadings,
    createHandler,
    setLoading,
    isLoading,
    reset,
  };
}

/**
 * 表格 Loading 状态管理
 * @description 专门用于表格的 Loading 状态管理
 *
 * @example
 * ```typescript
 * const { loading, refreshing, loadMore, withLoading, withRefresh } = useTableLoading()
 *
 * const getList = async () => {
 *   await withLoading(async () => {
 *     const res = await fetchList()
 *     list.value = res.data
 *   })
 * }
 *
 * const handleRefresh = async () => {
 *   await withRefresh(async () => {
 *     await getList()
 *   })
 * }
 * ```
 */
export function useTableLoading() {
  const loading = ref(false);
  const refreshing = ref(false);
  const loadingMore = ref(false);

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  };

  const withRefresh = async <T>(fn: () => Promise<T>): Promise<T> => {
    refreshing.value = true;
    try {
      return await fn();
    } finally {
      refreshing.value = false;
    }
  };

  const withLoadMore = async <T>(fn: () => Promise<T>): Promise<T> => {
    loadingMore.value = true;
    try {
      return await fn();
    } finally {
      loadingMore.value = false;
    }
  };

  return {
    loading,
    refreshing,
    loadingMore,
    withLoading,
    withRefresh,
    withLoadMore,
  };
}

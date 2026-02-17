/**
 * Vuetify Message/Dialog Composables
 * @module useMessage
 * @description Vuetify-specific message, snackbar, and dialog implementations.
 *
 * Note: For framework-agnostic message logic, see @dailyuse/ui-core.
 * For Vue composables, see @dailyuse/ui-vue-shadcn.
 * This file provides Vuetify-specific implementations with backward compatibility.
 */

import { ref } from 'vue';

// Re-export core composables from ui-vue for convenience
export { useMessage as useCoreMessage } from '@dailyuse/ui-vue-shadcn';

/**
 * 消息类型
 */
export type MessageType = 'success' | 'info' | 'warning' | 'error';

/**
 * 消息选项
 */
export interface MessageOptions {
  title?: string;
  message: string;
  type?: MessageType;
  duration?: number;
  showClose?: boolean;
}

/**
 * 确认框选项
 */
export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: MessageType;
  confirmText?: string;
  cancelText?: string;
  persistent?: boolean;
  width?: string | number;
}

/**
 * Snackbar 状态
 */
interface SnackbarState {
  visible: boolean;
  message: string;
  color: string;
  timeout: number;
}

/**
 * Dialog 状态
 */
interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: MessageType;
  resolve: ((value: boolean) => void) | null;
}

/**
 * Vuetify 消息提示 Composable
 * @description 提供优雅的消息提示功能
 *
 * @example
 * ```typescript
 * const message = useMessage()
 *
 * // 基础用法
 * message.success('操作成功')
 * message.error('操作失败')
 * message.warning('请注意')
 * message.info('提示信息')
 *
 * // 确认框
 * const confirmed = await message.confirm({
 *   title: '确认删除',
 *   message: '确定要删除这条记录吗？',
 *   type: 'warning'
 * })
 *
 * if (confirmed) {
 *   await deleteRecord()
 * }
 *
 * // 删除确认（快捷方式）
 * await message.delConfirm('确定要删除吗？')
 * ```
 */
export function useMessage() {
  // Snackbar 状态
  const snackbar = ref<SnackbarState>({
    visible: false,
    message: '',
    color: 'success',
    timeout: 3000,
  });

  // Dialog 状态
  const dialog = ref<DialogState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    resolve: null,
  });

  /**
   * 显示 Snackbar
   */
  const showSnackbar = (message: string, color: string, timeout = 3000) => {
    snackbar.value = {
      visible: true,
      message,
      color,
      timeout,
    };
  };

  /**
   * 成功提示
   * @param message - 提示内容
   * @param duration - 显示时长（毫秒）
   */
  const success = (message: string, duration = 3000) => {
    showSnackbar(message, 'success', duration);
  };

  /**
   * 错误提示
   * @param message - 提示内容
   * @param duration - 显示时长（毫秒）
   */
  const error = (message: string, duration = 4000) => {
    showSnackbar(message, 'error', duration);
  };

  /**
   * 警告提示
   * @param message - 提示内容
   * @param duration - 显示时长（毫秒）
   */
  const warning = (message: string, duration = 3500) => {
    showSnackbar(message, 'warning', duration);
  };

  /**
   * 信息提示
   * @param message - 提示内容
   * @param duration - 显示时长（毫秒）
   */
  const info = (message: string, duration = 3000) => {
    showSnackbar(message, 'info', duration);
  };

  /**
   * 通用确认框
   * @param options - 确认框选项
   * @returns Promise<boolean> - 用户选择结果
   *
   * @example
   * ```typescript
   * const confirmed = await message.confirm({
   *   title: '确认操作',
   *   message: '确定要执行此操作吗？',
   *   type: 'warning',
   *   confirmText: '确定',
   *   cancelText: '取消'
   * })
   * ```
   */
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      dialog.value = {
        visible: true,
        title: options.title || '提示',
        message: options.message,
        type: options.type || 'info',
        resolve,
      };
    });
  };

  /**
   * 删除确认框（快捷方式）
   * @param message - 确认内容
   * @param title - 标题
   * @returns Promise<boolean>
   *
   * @example
   * ```typescript
   * try {
   *   await message.delConfirm('确定要删除这条记录吗？')
   *   // 用户点击确认
   *   await deleteApi(id)
   *   message.success('删除成功')
   * } catch {
   *   // 用户点击取消或关闭
   *   console.log('取消删除')
   * }
   * ```
   */
  const delConfirm = (message?: string, title?: string): Promise<boolean> => {
    return confirm({
      title: title || '确认删除',
      message: message || '确定要删除这条记录吗？删除后无法恢复。',
      type: 'warning',
      confirmText: '确定删除',
      cancelText: '取消',
    });
  };

  /**
   * 保存确认框
   * @param message - 确认内容
   * @param title - 标题
   * @returns Promise<boolean>
   */
  const saveConfirm = (message?: string, title?: string): Promise<boolean> => {
    return confirm({
      title: title || '确认保存',
      message: message || '确定要保存当前修改吗？',
      type: 'info',
      confirmText: '保存',
      cancelText: '取消',
    });
  };

  /**
   * 离开确认框（用于未保存提示）
   * @param message - 确认内容
   * @returns Promise<boolean>
   */
  const leaveConfirm = (message?: string): Promise<boolean> => {
    return confirm({
      title: '离开页面',
      message: message || '你有未保存的修改，确定要离开吗？',
      type: 'warning',
      confirmText: '离开',
      cancelText: '继续编辑',
    });
  };

  /**
   * 关闭 Snackbar
   */
  const closeSnackbar = () => {
    snackbar.value.visible = false;
  };

  /**
   * 处理 Dialog 确认
   */
  const handleDialogConfirm = () => {
    if (dialog.value.resolve) {
      dialog.value.resolve(true);
    }
    dialog.value.visible = false;
    dialog.value.resolve = null;
  };

  /**
   * 处理 Dialog 取消
   */
  const handleDialogCancel = () => {
    if (dialog.value.resolve) {
      dialog.value.resolve(false);
    }
    dialog.value.visible = false;
    dialog.value.resolve = null;
  };

  return {
    // 状态
    snackbar,
    dialog,

    // 提示方法
    success,
    error,
    warning,
    info,

    // 确认框方法
    confirm,
    delConfirm,
    saveConfirm,
    leaveConfirm,

    // 控制方法
    closeSnackbar,
    handleDialogConfirm,
    handleDialogCancel,
  };
}

/**
 * 全局消息实例（单例模式）
 */
let globalMessageInstance: ReturnType<typeof useMessage> | null = null;

/**
 * 获取全局消息实例
 * @description 提供全局单例，可在任何地方使用
 *
 * @example
 * ```typescript
 * import { getGlobalMessage } from '@dailyuse/ui'
 *
 * const message = getGlobalMessage()
 * message.success('操作成功')
 * ```
 */
export function getGlobalMessage(): ReturnType<typeof useMessage> {
  if (!globalMessageInstance) {
    globalMessageInstance = useMessage();
  }
  return globalMessageInstance;
}

/**
 * 消息提示类型定义（用于组件）
 */
export type MessageInstance = ReturnType<typeof useMessage>;

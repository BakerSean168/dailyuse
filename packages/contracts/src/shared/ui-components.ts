/**
 * UI 组件共享类型定义
 * 用于前端 UI 组件的通用接口
 */

/**
 * 右键菜单项接口
 */
export interface ContextMenuItem {
  /** 菜单项标题 */
  title?: string;

  /** 前置图标 */
  icon?: string;

  /** 图标大小 */
  iconSize?: number;

  /** 图标颜色 */
  iconColor?: string;

  /** 点击回调 */
  action?: () => void | Promise<void>;

  /** 是否为危险操作（红色显示） */
  danger?: boolean;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否为分隔线 */
  divider?: boolean;

  /** 快捷键提示 */
  shortcut?: string;

  /** 后置图标 */
  suffix?: string;

  /** 自定义类名 */
  className?: string;
}

/**
 * 简化的编辑器标签数据结构（用于 UI 组件）
 * 注意：这是用于简单 UI 展示的轻量级接口，
 * 遗留轻量 UI 标签结构；完整笔记编辑器 runtime 已退役。
 */
export interface SimpleEditorTab {
  id: string;
  title: string;
  fileType: 'markdown' | 'image' | 'video' | 'audio';
  filePath: string;
  content?: string;
  isDirty: boolean;
  isPinned?: boolean;
}

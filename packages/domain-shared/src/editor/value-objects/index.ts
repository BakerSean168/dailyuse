/**
 * Editor Module Value Objects 导出
 * 
 * 包含：
 * - 枚举类型（Enum-like）
 * - 品牌化 ID 类型
 * - Class-type 值对象
 */

// IDs
export * from './editor-workspace-id';
export * from './editor-session-id';
export * from './editor-group-id';
export * from './editor-tab-id';

// Enum-like Value Objects
export * from './project-type';
export * from './document-language';
export * from './version-change-type';
export * from './tab-type';
export * from './split-direction';
export * from './index-status';
export * from './linked-source-type';
export * from './linked-target-type';
export * from './view-mode';
export * from './sidebar-active-tab';

// Class-type Value Objects
export { WorkspaceLayout } from './workspace-layout';
export { WorkspaceSettings } from './workspace-settings';
export { SessionLayout } from './session-layout';
export { TabViewState } from './tab-view-state';
export { DocumentMetadata } from './document-metadata';

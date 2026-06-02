---
tags:
  - product
  - module-index
  - editor
description: 编辑器模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 编辑器模块文件索引

本索引用于连接编辑器模块的业务说明和真实代码。它不是代码注释替代品；做优化前仍需以当前代码、配置和测试为准。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/editor/views/EditorLinearView.vue`](../../../packages/app-vue/src/modules/editor/views/EditorLinearView.vue) | 编辑器线性视图（注册在 repository 路由 /note/:id 下） |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/editor/stores/editor-workspace-store.ts`](../../../packages/app-vue/src/modules/editor/stores/editor-workspace-store.ts) | 编辑器工作区 Pinia store |
| [`packages/app-vue/src/modules/editor/stores/editor-workspace-ui-store.ts`](../../../packages/app-vue/src/modules/editor/stores/editor-workspace-ui-store.ts) | 编辑器 UI store |
| [`packages/app-vue/src/modules/editor/composables/useEditor.ts`](../../../packages/app-vue/src/modules/editor/composables/useEditor.ts) | 核心编辑器组合函数 |
| [`packages/app-vue/src/modules/editor/composables/useAutoSave.ts`](../../../packages/app-vue/src/modules/editor/composables/useAutoSave.ts) | 自动保存组合函数 |
| [`packages/app-vue/src/modules/editor/composables/useMarkdownEditor.ts`](../../../packages/app-vue/src/modules/editor/composables/useMarkdownEditor.ts) | Markdown 编辑器集成 |
| [`packages/app-vue/src/modules/editor/composables/useEditorLinkIndex.ts`](../../../packages/app-vue/src/modules/editor/composables/useEditorLinkIndex.ts) | 链接索引组合函数 |
| [`packages/app-vue/src/modules/editor/composables/useEditorLinkSuggestion.ts`](../../../packages/app-vue/src/modules/editor/composables/useEditorLinkSuggestion.ts) | 链接建议组合函数 |
| [`packages/app-vue/src/modules/editor/composables/useResourceInsertion.ts`](../../../packages/app-vue/src/modules/editor/composables/useResourceInsertion.ts) | 资源插入组合函数 |
| [`packages/app-vue/src/modules/editor/composables/useResourceReferenceIndex.ts`](../../../packages/app-vue/src/modules/editor/composables/useResourceReferenceIndex.ts) | 资源引用索引 |
| [`packages/app-vue/src/modules/editor/composables/useEditorUnsavedChangesGuard.ts`](../../../packages/app-vue/src/modules/editor/composables/useEditorUnsavedChangesGuard.ts) | 未保存变更守卫 |
| [`packages/app-vue/src/modules/editor/composables/useEditorWorkspaceBootstrap.ts`](../../../packages/app-vue/src/modules/editor/composables/useEditorWorkspaceBootstrap.ts) | 工作区引导 |
| [`packages/app-vue/src/modules/editor/components/MarkdownEditor.vue`](../../../packages/app-vue/src/modules/editor/components/MarkdownEditor.vue) | Markdown 编辑器组件（CodeMirror） |
| [`packages/app-vue/src/modules/editor/components/ActiveDocumentPane.vue`](../../../packages/app-vue/src/modules/editor/components/ActiveDocumentPane.vue) | 活动文档面板 |
| [`packages/app-vue/src/modules/editor/components/EditorTabBar.vue`](../../../packages/app-vue/src/modules/editor/components/EditorTabBar.vue) | 标签页栏 |
| [`packages/app-vue/src/modules/editor/components/EditorToolbar.vue`](../../../packages/app-vue/src/modules/editor/components/EditorToolbar.vue) | 编辑器工具栏 |
| [`packages/app-vue/src/modules/editor/components/EditorPreview.vue`](../../../packages/app-vue/src/modules/editor/components/EditorPreview.vue) | Markdown 预览面板 |
| [`packages/app-vue/src/modules/editor/components/BacklinkPanel.vue`](../../../packages/app-vue/src/modules/editor/components/BacklinkPanel.vue) | Backlink 面板 |
| [`packages/app-vue/src/modules/editor/components/LinkGraphView.vue`](../../../packages/app-vue/src/modules/editor/components/LinkGraphView.vue) | 链接图视图 |
| [`packages/app-vue/src/modules/editor/components/LinkSuggestion.vue`](../../../packages/app-vue/src/modules/editor/components/LinkSuggestion.vue) | 链接建议弹出框 |
| [`packages/app-vue/src/modules/editor/components/ImageResourcePickerDialog.vue`](../../../packages/app-vue/src/modules/editor/components/ImageResourcePickerDialog.vue) | 图片资源选择器 |
| [`packages/app-vue/src/modules/editor/components/ReferenceRepairDialog.vue`](../../../packages/app-vue/src/modules/editor/components/ReferenceRepairDialog.vue) | 引用修复弹窗 |
| [`packages/app-vue/src/modules/editor/components/SelfContainedExportDialog.vue`](../../../packages/app-vue/src/modules/editor/components/SelfContainedExportDialog.vue) | 自包含导出弹窗 |
| [`packages/app-vue/src/modules/editor/services/editor-client-gateway.ts`](../../../packages/app-vue/src/modules/editor/services/editor-client-gateway.ts) | 编辑器客户端网关 |
| [`packages/app-vue/src/modules/editor/services/editor-workspace-orchestrator.ts`](../../../packages/app-vue/src/modules/editor/services/editor-workspace-orchestrator.ts) | 工作区编排器 |

## 编辑器包（packages/editor）

| 文件 | 说明 |
| --- | --- |
| [`packages/editor/src/api/module.ts`](../../../packages/editor/src/api/module.ts) | 编辑器模块组合根 |
| [`packages/editor/src/api/routes/workspace.routes.ts`](../../../packages/editor/src/api/routes/workspace.routes.ts) | 工作区 HTTP routes |
| [`packages/editor/src/api/routes/session.routes.ts`](../../../packages/editor/src/api/routes/session.routes.ts) | 会话 HTTP routes |
| [`packages/editor/src/api/routes/tab.routes.ts`](../../../packages/editor/src/api/routes/tab.routes.ts) | 标签页 HTTP routes |
| [`packages/editor/src/api/routes/content.routes.ts`](../../../packages/editor/src/api/routes/content.routes.ts) | 内容 HTTP routes |
| [`packages/editor/src/api/routes/search.routes.ts`](../../../packages/editor/src/api/routes/search.routes.ts) | 搜索 HTTP routes |
| [`packages/editor/src/domain-server/aggregates/editor-workspace.ts`](../../../packages/editor/src/domain-server/aggregates/editor-workspace.ts) | EditorWorkspace 聚合根 |
| [`packages/editor/src/domain-server/entities/editor-session.ts`](../../../packages/editor/src/domain-server/entities/editor-session.ts) | EditorSession 实体 |
| [`packages/editor/src/domain-server/entities/editor-tab.ts`](../../../packages/editor/src/domain-server/entities/editor-tab.ts) | EditorTab 实体 |
| [`packages/editor/src/domain-server/entities/linked-resource.ts`](../../../packages/editor/src/domain-server/entities/linked-resource.ts) | LinkedResource 实体 |
| [`packages/editor/src/domain-server/services/editor-policy.ts`](../../../packages/editor/src/domain-server/services/editor-policy.ts) | 编辑器策略服务 |
| [`packages/editor/src/domain-server/services/session-restorer.ts`](../../../packages/editor/src/domain-server/services/session-restorer.ts) | 会话恢复服务 |
| [`packages/editor/src/application-server/ports/i-repository-content-port.ts`](../../../packages/editor/src/application-server/ports/i-repository-content-port.ts) | 资源内容端口（读写） |
| [`packages/editor/src/application-server/ports/i-repository-search-port.ts`](../../../packages/editor/src/application-server/ports/i-repository-search-port.ts) | 资源搜索端口 |
| [`packages/editor/src/infrastructure-server/editor.module.ts`](../../../packages/editor/src/infrastructure-server/editor.module.ts) | 服务端编辑器模块组合根 |
| [`packages/editor/src/infrastructure-client/adapters/http/editor-http.adapter.ts`](../../../packages/editor/src/infrastructure-client/adapters/http/editor-http.adapter.ts) | 客户端 HTTP 适配器 |
| [`packages/editor/src/infrastructure-client/adapters/ipc/editor-ipc.adapter.ts`](../../../packages/editor/src/infrastructure-client/adapters/ipc/editor-ipc.adapter.ts) | 客户端 IPC 适配器 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/editor/aggregates/editor-workspace-server.ts`](../../../packages/contracts/src/modules/editor/aggregates/editor-workspace-server.ts) | EditorWorkspace 服务端 DTO |
| [`packages/contracts/src/modules/editor/entities/editor-session-server.ts`](../../../packages/contracts/src/modules/editor/entities/editor-session-server.ts) | EditorSession 服务端 DTO |
| [`packages/contracts/src/modules/editor/entities/editor-tab-server.ts`](../../../packages/contracts/src/modules/editor/entities/editor-tab-server.ts) | EditorTab 服务端 DTO |
| [`packages/contracts/src/modules/editor/api/editor-workspace.dto.ts`](../../../packages/contracts/src/modules/editor/api/editor-workspace.dto.ts) | 工作区 API DTO |
| [`packages/contracts/src/modules/editor/protocol/editor-event-map.ts`](../../../packages/contracts/src/modules/editor/protocol/editor-event-map.ts) | 编辑器事件 map |
| [`packages/contracts/src/modules/editor/protocol/editor-rpc-map.ts`](../../../packages/contracts/src/modules/editor/protocol/editor-rpc-map.ts) | 编辑器 RPC map |

## Prisma Schema

编辑器 Prisma schema 定义在主 schema 文件中，包含 4 个模型：EditorWorkspace、EditorWorkspaceSession、EditorWorkspaceSessionGroup、EditorWorkspaceSessionGroupTab。

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/editor/src/domain-server/aggregates/__tests__/editor-workspace.spec.ts`](../../../packages/editor/src/domain-server/aggregates/__tests__/editor-workspace.spec.ts) | EditorWorkspace 聚合测试 |
| [`packages/editor/src/domain-server/services/__tests__/editor-policy.spec.ts`](../../../packages/editor/src/domain-server/services/__tests__/editor-policy.spec.ts) | 编辑器策略测试 |
| [`packages/editor/src/domain-server/services/__tests__/session-restorer.spec.ts`](../../../packages/editor/src/domain-server/services/__tests__/session-restorer.spec.ts) | 会话恢复测试 |
| [`packages/editor/src/api/routes/editor.routes.spec.ts`](../../../packages/editor/src/api/routes/editor.routes.spec.ts) | 编辑器 routes 测试 |
| [`packages/app-vue/src/modules/editor/stores/editorWorkspaceStore.spec.ts`](../../../packages/app-vue/src/modules/editor/stores/editorWorkspaceStore.spec.ts) | 编辑器 store 测试 |
| [`packages/app-vue/src/modules/editor/composables/useResourceInsertion.spec.ts`](../../../packages/app-vue/src/modules/editor/composables/useResourceInsertion.spec.ts) | 资源插入测试 |
| [`packages/app-vue/src/modules/editor/utils/linkIndex.spec.ts`](../../../packages/app-vue/src/modules/editor/utils/linkIndex.spec.ts) | 链接索引测试 |

## 需要重点关注的改动风险

- 编辑状态和自动保存的一致性。
- 资源引用和链接索引失效。
- 编辑器 UI 状态与真实文档内容不一致。
- 编辑器和资源库的双向耦合。
- 大文档的编辑性能。

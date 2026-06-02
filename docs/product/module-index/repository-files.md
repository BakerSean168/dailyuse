---
tags:
  - product
  - module-index
  - repository
description: 资源库模块相关文件索引
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 资源库模块文件索引

本索引用于连接资源库模块的业务说明和真实代码。它不是代码注释替代品；做优化前仍需以当前代码、配置和测试为准。

## 前端页面与路由

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/repository/router/index.ts`](../../../packages/app-vue/src/modules/repository/router/index.ts) | Vue 资源库路由，定义工作区和笔记编辑入口 |
| [`packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`](../../../packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue) | 资源库工作区主视图（Obsidian 风格） |

## 前端状态、组合函数与组件

| 文件 | 说明 |
| --- | --- |
| [`packages/app-vue/src/modules/repository/stores/repository-store.ts`](../../../packages/app-vue/src/modules/repository/stores/repository-store.ts) | 资源库 Pinia store |
| [`packages/app-vue/src/modules/repository/composables/useRepository.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepository.ts) | 资源库编排组合函数 |
| [`packages/app-vue/src/modules/repository/composables/useRepositoryResources.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepositoryResources.ts) | 资源 CRUD 组合函数 |
| [`packages/app-vue/src/modules/repository/composables/useRepositoryTree.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepositoryTree.ts) | 文件树组合函数 |
| [`packages/app-vue/src/modules/repository/composables/useRepositorySearch.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepositorySearch.ts) | 搜索组合函数 |
| [`packages/app-vue/src/modules/repository/composables/useRepositoryUpload.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepositoryUpload.ts) | 上传组合函数 |
| [`packages/app-vue/src/modules/repository/composables/useRepositoryBookmarks.ts`](../../../packages/app-vue/src/modules/repository/composables/useRepositoryBookmarks.ts) | 书签组合函数 |
| [`packages/app-vue/src/modules/repository/services/repository-resource-gateway.ts`](../../../packages/app-vue/src/modules/repository/services/repository-resource-gateway.ts) | 资源网关服务（桥接编辑器） |
| [`packages/app-vue/src/modules/repository/components/TypedFileTree.vue`](../../../packages/app-vue/src/modules/repository/components/TypedFileTree.vue) | 类型化文件树组件 |
| [`packages/app-vue/src/modules/repository/components/SearchPanel.vue`](../../../packages/app-vue/src/modules/repository/components/SearchPanel.vue) | 搜索面板组件 |
| [`packages/app-vue/src/modules/repository/components/BookmarksPanel.vue`](../../../packages/app-vue/src/modules/repository/components/BookmarksPanel.vue) | 书签面板组件 |
| [`packages/app-vue/src/modules/repository/components/TabManager.vue`](../../../packages/app-vue/src/modules/repository/components/TabManager.vue) | 标签页管理组件 |
| [`packages/app-vue/src/modules/repository/components/BatchImportDialog.vue`](../../../packages/app-vue/src/modules/repository/components/BatchImportDialog.vue) | 批量导入弹窗 |
| [`packages/app-vue/src/modules/repository/components/AIKnowledgeGeneratorDialog.vue`](../../../packages/app-vue/src/modules/repository/components/AIKnowledgeGeneratorDialog.vue) | AI 知识生成弹窗 |

## Desktop 特定代码

| 文件 | 说明 |
| --- | --- |
| [`apps/desktop/src/main/modules/repository/desktop-repository-search.adapter.ts`](../../../apps/desktop/src/main/modules/repository/desktop-repository-search.adapter.ts) | Desktop 侧搜索适配器（内存搜索） |

## API、控制器与适配器

| 文件 | 说明 |
| --- | --- |
| [`packages/repository/src/api/routes/repository.routes.ts`](../../../packages/repository/src/api/routes/repository.routes.ts) | 资源库 HTTP routes |
| [`packages/repository/src/api/routes/resource.routes.ts`](../../../packages/repository/src/api/routes/resource.routes.ts) | 资源 HTTP routes |
| [`packages/repository/src/api/routes/folder.routes.ts`](../../../packages/repository/src/api/routes/folder.routes.ts) | 文件夹 HTTP routes |
| [`packages/repository/src/api/module.ts`](../../../packages/repository/src/api/module.ts) | 资源库 API 模块定义 |
| [`packages/repository/src/controllers/repository.controller.ts`](../../../packages/repository/src/controllers/repository.controller.ts) | 资源库控制器 |
| [`packages/repository/src/infrastructure-client/adapters/http/repository-http.adapter.ts`](../../../packages/repository/src/infrastructure-client/adapters/http/repository-http.adapter.ts) | 客户端 HTTP 适配器 |
| [`packages/repository/src/infrastructure-client/adapters/ipc/repository-ipc.adapter.ts`](../../../packages/repository/src/infrastructure-client/adapters/ipc/repository-ipc.adapter.ts) | 客户端 IPC 适配器 |

## 领域、用例与仓储

| 文件 | 说明 |
| --- | --- |
| [`packages/repository/src/domain-server/aggregates/repository.ts`](../../../packages/repository/src/domain-server/aggregates/repository.ts) | Repository 聚合根 |
| [`packages/repository/src/domain-server/entities/resource.ts`](../../../packages/repository/src/domain-server/entities/resource.ts) | Resource 实体 |
| [`packages/repository/src/domain-server/entities/folder.ts`](../../../packages/repository/src/domain-server/entities/folder.ts) | Folder 实体 |
| [`packages/repository/src/domain-server/services/folder-hierarchy-service.ts`](../../../packages/repository/src/domain-server/services/folder-hierarchy-service.ts) | 文件夹层级服务（循环检测） |
| [`packages/repository/src/domain-server/services/storage-policy.ts`](../../../packages/repository/src/domain-server/services/storage-policy.ts) | 存储策略服务 |
| [`packages/repository/src/application-server/services/repository-resolution.service.ts`](../../../packages/repository/src/application-server/services/repository-resolution.service.ts) | 资源库解析服务 |
| [`packages/repository/src/application-server/services/resource-mutation.service.ts`](../../../packages/repository/src/application-server/services/resource-mutation.service.ts) | 资源变更服务 |
| [`packages/repository/src/application-server/use-cases/commands/create-resource.use-case.ts`](../../../packages/repository/src/application-server/use-cases/commands/create-resource.use-case.ts) | 创建资源用例 |
| [`packages/repository/src/application-server/use-cases/commands/upload-resources.use-case.ts`](../../../packages/repository/src/application-server/use-cases/commands/upload-resources.use-case.ts) | 上传资源用例 |
| [`packages/repository/src/application-server/use-cases/queries/get-folder-tree.use-case.ts`](../../../packages/repository/src/application-server/use-cases/queries/get-folder-tree.use-case.ts) | 文件夹树查询 |
| [`packages/repository/src/infrastructure-server/repository.module.ts`](../../../packages/repository/src/infrastructure-server/repository.module.ts) | 服务端资源库模块组合根 |
| [`packages/repository/src/infrastructure-server/adapters/fs/fs-storage.adapter.ts`](../../../packages/repository/src/infrastructure-server/adapters/fs/fs-storage.adapter.ts) | 文件系统存储适配器 |
| [`packages/repository/src/infrastructure-server/adapters/prisma/resource-prisma.repository.ts`](../../../packages/repository/src/infrastructure-server/adapters/prisma/resource-prisma.repository.ts) | Prisma 资源仓储 |

## Contracts 与数据结构

| 文件 | 说明 |
| --- | --- |
| [`packages/contracts/src/modules/repository/aggregates/repository-server.ts`](../../../packages/contracts/src/modules/repository/aggregates/repository-server.ts) | Repository 服务端 DTO |
| [`packages/contracts/src/modules/repository/aggregates/resource-server.ts`](../../../packages/contracts/src/modules/repository/aggregates/resource-server.ts) | Resource 服务端 DTO |
| [`packages/contracts/src/modules/repository/aggregates/resource-client.ts`](../../../packages/contracts/src/modules/repository/aggregates/resource-client.ts) | Resource 客户端 DTO |
| [`packages/contracts/src/modules/repository/dtos/search-contracts.ts`](../../../packages/contracts/src/modules/repository/dtos/search-contracts.ts) | 搜索请求/响应 contracts |
| [`packages/contracts/src/modules/repository/protocol/repository-event-map.ts`](../../../packages/contracts/src/modules/repository/protocol/repository-event-map.ts) | 资源库事件 map |
| [`packages/contracts/src/modules/repository/protocol/repository-rpc-map.ts`](../../../packages/contracts/src/modules/repository/protocol/repository-rpc-map.ts) | 资源库 RPC map |
| [`packages/database/prisma/schema/repository.prisma`](../../../packages/database/prisma/schema/repository.prisma) | 资源库 Prisma schema |

## 测试入口

| 文件 | 说明 |
| --- | --- |
| [`packages/repository/src/domain-server/services/__tests__/FolderHierarchyService.test.ts`](../../../packages/repository/src/domain-server/services/__tests__/FolderHierarchyService.test.ts) | 文件夹层级服务测试 |
| [`packages/repository/src/application-server/__tests__/resource-mutations.test.ts`](../../../packages/repository/src/application-server/__tests__/resource-mutations.test.ts) | 资源变更测试 |
| [`packages/repository/src/application-server/__tests__/upload-resources.test.ts`](../../../packages/repository/src/application-server/__tests__/upload-resources.test.ts) | 上传测试 |
| [`packages/repository/src/api/routes/repository.routes.spec.ts`](../../../packages/repository/src/api/routes/repository.routes.spec.ts) | 资源库 routes 测试 |
| [`packages/app-vue/src/modules/repository/stores/repositoryStore.spec.ts`](../../../packages/app-vue/src/modules/repository/stores/repositoryStore.spec.ts) | 资源库 store 测试 |

## 需要重点关注的改动风险

- 文件系统、数据库和前端树状态的一致性。
- 资源引用失效（编辑器 wiki-link、AI 知识引用）。
- 存储配额和路径安全。
- 编辑器双向耦合。
- HTTP、IPC、Prisma、PowerSync 多运行时适配器的一致性。

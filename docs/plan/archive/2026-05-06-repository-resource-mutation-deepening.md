# Repository Resource Mutation Deepening 执行方案

> 创建时间: 2026-05-06
> 状态: 已完成，归档
> 来源: [服务端 Deepening 执行总览](./2026-05-06-server-deepening-execution-overview.md)
> 审查来源: [Codebase Architecture Deepening 审查与后续计划](./2026-05-06-codebase-architecture-deepening-audit.md)
> 归档说明：Repository mutation seam 收口、upload deepening 与类型边界修正已完成，本文仅保留为历史执行方案。

## 问题定位

`repository` 当前最明显的问题不是 use case 不存在，而是 [repository.module.ts](D:/home/projects/memoflow/packages/repository/src/infrastructure-server/repository.module.ts:411) 里的 `buildApplicationPort()` 吸住了大量真正的 workflow implementation。

当前散落在 composition root 中的核心实现包括：

- `hydrateStoredResourceContent`
- `resolveParentPath`
- `ensureResourcePathAvailable`
- `moveResourceInStorage`
- `resolveCanonicalRepository`
- `ensureCanonicalRepository`
- `emitResourceMutationEvent`
- `createResource` / `updateResource` / `moveResource` / `deleteResource` 中的 orchestration

这导致的问题是：

1. `api` 不再是薄 facade，而是带业务 implementation 的 mega helper
2. 资源 mutation 相关知识分散在 use case、composition root、event emission 三处
3. `UploadResourcesUseCase` 只能局部复用 `CreateResourceUseCase` / `DeleteResourceUseCase`，无法复用完整 mutation workflow
4. 如果以后继续加 rename、replace、resource hydration 规则，变化点会再次穿透 composition root

## 目标结构

本轮固定新增 3 个 deep module：

### 1. `RepositoryResolutionService`

建议位置：

- `packages/repository/src/application-server/services/repository-resolution.service.ts`

职责：

- 负责 canonical repository resolution
- 封装 active repository fallback
- 封装 auto-create canonical repository 语义

必须处理的流程：

- `findByIdentityIdAndStatus(identityId, Active)` 优先
- 无 active 时回退 `findByIdentityId(identityId)`
- 仍不存在时：
  - 若 `autoCreateCanonicalRepository === false`，返回 `NOT_FOUND`
  - 否则通过 `CreateRepositoryUseCase` 创建默认仓库

不负责：

- 资源 mutation
- storage read/write
- 资源 hydration

### 2. `StoredResourceHydrationService`

建议位置：

- `packages/repository/src/application-server/services/stored-resource-hydration.service.ts`

职责：

- 负责补全存储型 resource 的 `content`
- 只处理 read path
- 统一 text-like 与 binary 的 hydration 语义

必须保留的现有行为：

- `content` 已存在则直接返回
- `storagePort.read()` 无内容则直接返回原 resource
- `text/*` 与 `application/json` 转 `utf8`
- 其他类型转 `base64`

不负责：

- path 计算
- mutation event
- repository / folder resolution

### 3. `ResourceMutationService`

建议位置：

- `packages/repository/src/application-server/services/resource-mutation.service.ts`

职责：

- 集中 resource create / update / move / delete 的 workflow implementation
- 封装 path availability 检查
- 封装 storage move
- 封装 mutation event emission
- 封装 updateResource 的多阶段逻辑

必须包含的能力：

- `moveResource(...)`
- `updateResource(...)`
- `createResource(...)`
- `deleteResource(...)`
- `emitMutationEvent(...)`

可以包含的内部 helper：

- `resolveParentPath(...)`
- `ensureResourcePathAvailable(...)`
- `loadRepositoryOrFail(...)`

不负责：

- canonical repository resolution
- stored resource hydration

## 实施步骤

### Wave 1: 先建立 deep module，不改 public seam

新增：

- `RepositoryResolutionService`
- `StoredResourceHydrationService`
- `ResourceMutationService`

同时新增独立 spec：

- repository resolution spec
- resource hydration spec
- resource mutation spec

这一波先允许 `buildApplicationPort()` 仍然调用旧逻辑，但新 service 必须具备完整行为，供下一波切换。

### Wave 2: 把 `buildApplicationPort()` 改成薄委派

改造 [repository.module.ts](D:/home/projects/memoflow/packages/repository/src/infrastructure-server/repository.module.ts:411)：

- 在 composition root 中组装上述 3 个 service
- 删除旧 helper implementation
- `getCurrentRepository` / `findActiveRepository` 只委派给 `RepositoryResolutionService`
- `getResource` 只通过 `GetResourceUseCase` + `StoredResourceHydrationService`
- `createResource` / `updateResource` / `moveResource` / `deleteResource` 只委派给 `ResourceMutationService`

完成标准：

- `buildApplicationPort()` 中不再存在资源 mutation 级别的业务 helper
- `api` 剩余逻辑只允许是轻量参数适配与 Result 透传

### Wave 3: 让 `UploadResourcesUseCase` 复用深 module

改造 [upload-resources.use-case.ts](D:/home/projects/memoflow/packages/repository/src/application-server/use-cases/commands/upload-resources.use-case.ts:1)：

- 保留其“批量上传 orchestrator”定位
- 不再自己维护 folder/path/existing resource 的核心判断
- 改为复用 `ResourceMutationService` 提供的 mutation workflow

固定策略：

- `UploadResourcesUseCase` 仍负责遍历文件、累积 successes / failures
- 单文件创建/替换语义委派给 `ResourceMutationService`
- folder existence 与 resource replacement 规则由 deep module 统一执行

不在本轮做的事：

- 不改上传 route
- 不改返回结构
- 不把 upload 逻辑迁到 controller

## 需要删除或收口的旧实现

完成后应删除或清空的内容：

- `buildApplicationPort()` 内部的 `hydrateStoredResourceContent`
- `buildApplicationPort()` 内部的 `resolveParentPath`
- `buildApplicationPort()` 内部的 `ensureResourcePathAvailable`
- `buildApplicationPort()` 内部的 `moveResourceInStorage`
- `buildApplicationPort()` 内部的 `resolveCanonicalRepository`
- `buildApplicationPort()` 内部的 `ensureCanonicalRepository`
- `buildApplicationPort()` 内部的 `emitResourceMutationEvent`

如果某个 helper 仍保留在 composition root，必须有非常明确的 assembly-only 理由；默认视为未完成。

## Public Seam 不可变项

本轮默认不修改：

- `RepositoryApplicationPort` 的公开方法名
- repository routes path
- `RepositoryController` 的公开方法名
- upload response 的 envelope 与 DTO shape
- bookmark / resource / current repository 路由 contract

允许的内部变化：

- `RepositoryModuleUseCases` 增加 service 组装依赖
- module instance 内部增加 service 字段
- use case 构造依赖调整

## 测试要求

必须新增：

- `repository-resolution.service.spec.ts`
- `stored-resource-hydration.service.spec.ts`
- `resource-mutation.service.spec.ts`

必须保持通过：

- `packages/repository/src/application-server/__tests__/resource-mutations.test.ts`
- `packages/repository/src/application-server/__tests__/upload-resources.test.ts`
- `packages/repository/src/api/routes/repository.routes.spec.ts`

建议覆盖场景：

- canonical repository 解析命中 active repo
- canonical repository 解析回退到任意 repo
- canonical repository 自动创建默认仓库
- hydration 对 text 与 binary 两类资源分别正确补全
- rename 导致 path 变化时执行 storage move
- rename 到冲突 path 时返回 `CONFLICT`
- content update 正确发出 `ContentUpdated` event
- move/delete/create 各自发出正确 mutation event
- upload replace/skip 行为保持现状

## 最小验证

实施后至少运行：

- `pnpm nx run repository:typecheck`
- `pnpm nx run repository:test`
- `pnpm nx run memoflow:governance-check`

## 完成定义

只有同时满足以下条件，才算此项完成：

1. `repository.module.ts` 的 composition root 不再持有 resource mutation workflow implementation
2. canonical repository resolution 拥有独立 deep module
3. stored resource hydration 拥有独立 deep module
4. upload workflow 复用了 deep module，而不是继续在 use case 内重复核心 mutation 逻辑
5. 现有 repository route contract 保持稳定

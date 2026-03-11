---
tags:
  - architecture
  - audit
  - remediation
  - checklist
description: Repo-wide architecture audit actionable remediation checklist by module
created: 2026-03-11T00:00:00
updated: 2026-03-11T00:00:00
---

# Architecture Audit Remediation Checklist

## Objective

将本次架构审查结论落成可执行修复任务清单，按模块拆分为具体改动点、依赖关系、验收标准与建议顺序，便于直接拆票执行。

## Execution Priority

- `P0` 认证契约统一：优先消除真实 404、响应结构错位、状态字段失联。
- `P0` 目标模块契约统一：优先修复搜索参数漂移和 aggregate 调用错位。
- `P1` 仓库书签状态治理：阻止 fallback 本地状态污染持久化 Store。
- `P1` 仓库模型统一：明确单仓库/多仓库产品模型并完成边界对齐。
- `P2` 任务文件夹能力收口：隐藏伪能力或补齐完整链路。
- `P2` Mock 与契约测试补齐：避免旧接口继续在开发和测试中掩盖问题。

## Workstreams

### P0-A 认证模块：统一接口、响应和状态链路

#### A1. 统一认证接口矩阵

- **目标**：让客户端、服务端路由、contracts、mock 使用同一份认证接口清单。
- **改动点**：
  - 盘点客户端实际调用接口：`packages/authentication/src/infrastructure-client/adapters/http/auth-http.adapter.ts`
  - 对照服务端已注册路由：`packages/authentication/src/api/routes.ts`
  - 对照 Web 会话与密码相关调用：
    - `packages/app-vue/src/modules/authentication/composables/useSession.ts`
    - `packages/app-vue/src/modules/authentication/composables/usePassword.ts`
  - 对照 Mock 实现：`apps/web/src/mocks/handlers/auth.handlers.ts`
- **执行任务**：
  - 列出当前所有认证接口并标记为 `保留`、`删除`、`待实现`。
  - 优先处理以下接口是否真实存在：
    - `/auth/me`
    - `/auth/sessions`
    - `/auth/sessions/revoke`
    - `/auth/password/change`
    - `/auth/password/forgot`
    - `/auth/password/reset`
    - `/auth/login/phone`
    - `/auth/register/phone`
    - `/auth/sms/send`
  - 删除客户端对不存在接口的调用，或补齐服务端路由。
- **验收标准**：客户端不再调用未注册的认证接口；mock 与真实路由集合一致。

#### A2. 统一登录/刷新响应 DTO 与 Schema

- **目标**：消除 `AuthResponseDTO` 与响应 schema 的字段漂移。
- **改动点**：
  - `packages/contracts/src/modules/authentication/dtos/auth-response.ts`
  - `packages/contracts/src/modules/authentication/api/response-schemas.ts`
- **执行任务**：
  - 确认认证成功响应的权威字段集合。
  - 统一以下字段是否存在以及是否必填：
    - `accessToken`
    - `refreshToken`
    - `expiresAt`
    - `identity`
    - `session`
  - 删除“DTO 有但 schema 没有”或“schema 有但 DTO 没有”的字段。
- **验收标准**：登录、刷新接口在 contracts、schema、adapter、调用方中使用完全一致的返回形状。

#### A3. 为 `/me` 定义独立响应类型

- **目标**：避免将“当前用户查询”错误复用为“登录响应”。
- **改动点**：
  - `packages/contracts/src/modules/authentication/api/session.dto.ts`
  - `packages/app-vue/src/modules/authentication/composables/useSession.ts`
  - `apps/web/src/mocks/handlers/auth.handlers.ts`
- **执行任务**：
  - 新建 `CurrentUserDTO` 或等效响应类型。
  - 将 `/auth/me` 的返回契约改为独立 DTO。
  - 更新 composable 与 mock 的解构逻辑。
- **验收标准**：`/auth/me`、`/auth/login`、`/auth/refresh` 三条链路各自使用准确响应类型。

#### A4. 接通 `tokenExpiresAt` 生命周期链路

- **目标**：让认证 store 的过期状态真实可用。
- **改动点**：
  - `packages/app-vue/src/modules/authentication/stores/authenticationStore.ts`
  - `apps/web/src/platform/http.ts`
  - `packages/contracts/src/modules/authentication/dtos/auth-response.ts`
- **执行任务**：
  - 选定唯一方案：
    - 服务端返回 `expiresAt`；或
    - 前端从 JWT 解析过期时间。
  - 在登录和刷新流程中写入 `tokenExpiresAt`。
  - 校验 `isTokenExpired` 的消费点是否基于真实值。
  - 若近期不使用该字段，则删除对应状态和计算逻辑。
- **验收标准**：`tokenExpiresAt` 要么被真实维护，要么被移除，不再出现“定义存在但链路未接通”的状态。

### P0-B 目标模块：统一搜索、aggregate 与命名体系

#### B1. 统一搜索参数字段名

- **目标**：让 adapter、route schema、controller 对搜索参数使用同一命名。
- **改动点**：
  - `packages/goal/src/infrastructure-client/adapters/http/goal-http.adapter.ts`
  - `packages/goal/src/api/routes/goal.routes.ts`
  - `packages/goal/src/controllers/goal.controller.ts`
- **执行任务**：
  - 在 `query`、`keyword`、`q` 中保留一个正式字段名。
  - 同步更新 adapter 请求参数、route schema、controller 读取逻辑。
  - 若有 e2e / mock / 文档依赖，统一更新。
- **验收标准**：搜索链路从前端到后端仅存在一个参数名，且返回正确结果。

#### B2. 修复 aggregate 视图调用链

- **目标**：让 `getGoalAggregateView()` 真正命中 aggregate API，而非普通详情 API。
- **改动点**：
  - `packages/app-vue/src/modules/goal/composables/useGoal.ts`
  - `packages/goal/src/api/routes/goal.routes.ts`
  - `packages/goal/src/infrastructure-client/adapters/http/goal-http.adapter.ts`
- **执行任务**：
  - 检查 aggregate API 是否已存在并可调用。
  - 将 composable 中错误的 `service.getGoal()` 替换为真实 aggregate 调用。
  - 确保 aggregate 返回结构在类型层面独立可辨识。
- **验收标准**：aggregate 页面只消费 aggregate 数据，不再依赖普通 goal 详情作为兼容输入。

#### B3. 删除组件中的“双返回形状”兼容补丁

- **目标**：让组件重新信任应用层契约。
- **改动点**：
  - `packages/app-vue/src/modules/goal/components/dag/GoalDAGVisualization.vue`
- **执行任务**：
  - 删除 `data?.goal ? ... : data` 一类兼容分支。
  - 将组件 props 或内部数据流收敛为单一 aggregate view model。
- **验收标准**：组件只接受一种明确的 aggregate 返回结构。

#### B4. 统一 `title/name` 命名并修复克隆流程

- **目标**：消除目标模块新旧命名体系混用。
- **改动点**：
  - `packages/contracts/src/modules/goal/api/goal-crud.dto.ts`
  - `packages/contracts/src/modules/goal/aggregates/goal-client.ts`
  - `packages/goal/src/controllers/goal.controller.ts`
  - `packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`
- **执行任务**：
  - 明确主字段统一使用 `title` 或 `name`。
  - 调整 create、update、clone 的 DTO 映射。
  - 禁止 controller 跳过 schema 手写请求对象。
  - 让 clone 流程复用正式 `CreateGoalReq` 映射器。
- **验收标准**：新建、编辑、克隆目标使用同一主字段命名和同一校验入口。

### P1-A 仓库模块：书签 fallback 与持久化状态隔离

#### C1. 为书签写操作建立独立 capability 检测

- **目标**：不要用单一方法存在性代替所有写能力判断。
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - 分别为以下操作建立 capability：
    - `renameBookmark`
    - `reorderBookmarks`
    - `removeBookmark`
  - 不再使用单一 `updateBookmark` 存在性判断其他行为是否可持久化。
- **验收标准**：每种书签写操作都能独立判断是否支持服务端持久化。

#### C2. 将 fallback UI 状态与 persisted store 解耦

- **目标**：阻止临时本地状态写入持久化层。
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
- **执行任务**：
  - 拆分为两层状态：
    - `persistedBookmarks`
    - `transientBookmarkUIState`
  - fallback 仅更新临时 UI 层，不直接落盘。
  - 仅在服务端确认成功后更新 persisted 数据。
- **验收标准**：服务能力缺失或调用失败时，不会把伪成功状态持久化。

#### C3. 补齐书签失败回滚和重新同步机制

- **目标**：防止重排/删除失败后界面长时间脏化。
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - `reorderBookmarks` 失败后恢复旧顺序。
  - `removeBookmark` 失败后恢复旧数据。
  - `renameBookmark` 的本地临时成功需显式标记为未同步或等待同步。
  - 在关键页面重入或显式同步时触发 `fetchBookmarks()` 以服务端真值兜底。
- **验收标准**：所有书签失败路径可回滚；刷新后不会长期保留错误本地状态。

### P1-B 仓库模块：统一单仓库 / 多仓库模型

#### D1. 完成产品模型决策

- **目标**：明确前端是否允许用户拥有多个仓库。
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
  - `packages/repository/src/application-client/repository-client-service.ts`
  - `packages/repository/src/api/routes/repository.routes.ts`
- **执行任务**：
  - 明确产品结论：`单仓库` 或 `多仓库`。
  - 记录该决策到架构文档或 ADR。
- **验收标准**：产品和代码层面对仓库数量模型使用一致语义。

#### D2. 若为单仓库：收缩应用边界

- **目标**：避免前端通过 `repos[0]` 隐式决定业务语义。
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - 相关 repository application service / route
- **执行任务**：
  - 提供显式 `getCurrentRepository` 或等价边界。
  - 删除前端对列表首项的隐式选取。
- **验收标准**：单仓库语义在 API 与前端均显式可见。

#### D3. 若为多仓库：补齐前端仓库上下文

- **目标**：让资源、书签、标签页都绑定当前选中的仓库。
- **改动点**：
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - Store 增加 `repositories` 和 `currentRepositoryId`。
  - 所有 repository 相关查询和写操作显式依赖当前仓库上下文。
  - 增加仓库切换入口或容器级注入。
- **验收标准**：不存在默认首仓库行为；多仓库上下文是显式状态。

### P2-A 任务模块：任务文件夹能力收口

#### E1. 定位并清理前端伪能力入口

- **目标**：消除“UI 有入口、后端无能力”的任务文件夹伪链路。
- **改动点**：
  - `packages/app-vue/src/modules/task/composables/useTask.ts`
  - `packages/app-vue/src/modules/task/components/TaskTemplateForm/sections/MetadataSection.vue`
  - `packages/app-vue/src/modules/task/views/TaskManagementView.vue`
  - `packages/task/src/infrastructure-client/adapters/types.ts`
- **执行任务**：
  - 盘点 `folderId` 的输入、显示、提交、存储位置。
  - 若近期不做该能力，隐藏 UI 并停止提交 `folderId`。
  - 清理 `folders` 占位状态和相关 TODO 文案。
- **验收标准**：用户界面不再暴露不可浏览、不可验证、不可同步的文件夹字段。

#### E2. 若保留能力：补齐端到端边界

- **目标**：只有在后端能力闭环后才恢复任务文件夹功能。
- **改动点**：
  - task application client / server / route / composable / UI
- **执行任务**：
  - 新增 `TaskFolderApiClient`。
  - 增加 route、controller、use case。
  - 补齐 folder 列表、创建、编辑、删除、查询。
  - 统一 DTO 与前端表单映射。
- **验收标准**：任务文件夹具备完整前后端闭环，不再只是 DTO 占位字段。

### P2-B Mock 与契约测试：对齐开发、测试与真实接口

#### F1. 修正 Task Mock 路径和响应结构

- **目标**：让 MSW 模拟当前正式 task 接口，而不是旧路径。
- **改动点**：
  - `apps/web/src/mocks/handlers/task.handlers.ts`
  - `packages/task/src/infrastructure-client/adapters/http/task-template-http.adapter.ts`
  - `packages/task/src/infrastructure-client/adapters/http/task-instance-http.adapter.ts`
- **执行任务**：
  - 将旧路径替换为正式路径。
  - 对齐请求参数和响应数据结构。
- **验收标准**：task mock 能驱动当前正式 adapter 通过开发测试流程。

#### F2. 修正 Repository Mock 的资源列表形状

- **目标**：让 Repository mock 返回值与 adapter 预期一致。
- **改动点**：
  - `apps/web/src/mocks/handlers/repository.handlers.ts`
  - `packages/repository/src/infrastructure-client/adapters/http/repository-http.adapter.ts`
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - 统一资源列表返回结构，到底是数组还是包装对象。
  - 删除与真实接口不一致的 mock shape。
- **验收标准**：mock 与真实 adapter 的资源列表响应结构完全一致。

#### F3. 增加 adapter-route-contract 契约测试

- **目标**：以后新增接口时能自动发现契约漂移。
- **改动点**：
  - 相关模块测试目录
  - `docs/test/` 或模块内测试说明文档
- **执行任务**：
  - 为关键 adapter 增加最小契约测试，至少覆盖：
    - URL
    - 请求参数字段名
    - 响应 shape
  - 将 mock handler 与 schema 工厂复用，减少手写漂移。
- **验收标准**：当 adapter、route、mock 任一侧变化时，测试能及时失败并暴露问题。

## Suggested Delivery Order

1. 完成认证接口矩阵和响应契约统一。
2. 接通认证 `tokenExpiresAt` 或删除该状态。
3. 完成目标搜索参数和 aggregate 调用链统一。
4. 统一目标模块 `title/name` 命名并修复 clone 流程。
5. 重构仓库书签 fallback、回滚和持久化隔离。
6. 明确单仓库/多仓库模型并完成前端边界收口。
7. 收口任务文件夹伪能力。
8. 更新 MSW 并补齐契约测试。

## Ticket Template

每个执行项建议拆成独立任务卡，并至少包含以下字段：

- **标题**：模块 + 动作 + 目标
- **背景**：对应的契约漂移或架构不一致问题
- **改动范围**：列出具体文件
- **完成标准**：引用上方验收标准
- **风险点**：是否影响登录、资源写入、主导航、测试环境
- **依赖项**：是否依赖 contracts、route 或 mock 先完成

## Ready-to-Create Tickets

- `auth: unify contracts, routes, and mock handlers`
- `auth: split current-user response from login response`
- `auth: wire tokenExpiresAt through login and refresh flow`
- `goal: unify search parameter across adapter, route, and controller`
- `goal: connect aggregate view to real aggregate API`
- `goal: normalize title/name across create, update, and clone`
- `repository: isolate bookmark fallback state from persisted store`
- `repository: add rollback and resync for bookmark write failures`
- `repository: decide and implement single-vs-multi repository model`
- `task: remove or fully implement task folder capability`
- `web-mock: align MSW handlers with current adapters`
- `testing: add contract tests for adapter URL and response shape`

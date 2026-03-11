---
tags:
  - architecture
  - audit
  - remediation
  - checklist
description: Repo-wide architecture audit actionable remediation checklist by module
created: 2026-03-11T00:00:00
updated: 2026-03-11T22:45:00
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

> Status review based on current repository implementation on 2026-03-11.

### P0-A 认证模块：统一接口、响应和状态链路

#### [x] A1. 统一认证接口矩阵

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

#### [x] A2. 统一登录/刷新响应 DTO 与 Schema

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

#### [x] A3. 为 `/me` 定义独立响应类型

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

#### [x] A4. 接通 `tokenExpiresAt` 生命周期链路

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

#### [x] B1. 统一搜索参数字段名

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

#### [x] B2. 修复 aggregate 视图调用链

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

#### [x] B3. 删除组件中的“双返回形状”兼容补丁

- **目标**：让组件重新信任应用层契约。
- **改动点**：
  - `packages/app-vue/src/modules/goal/components/dag/GoalDAGVisualization.vue`
- **执行任务**：
  - 删除 `data?.goal ? ... : data` 一类兼容分支。
  - 将组件 props 或内部数据流收敛为单一 aggregate view model。
- **验收标准**：组件只接受一种明确的 aggregate 返回结构。

#### [ ] B4. 统一 `title/name` 命名并修复克隆流程

- **目标**：消除目标模块新旧命名体系混用。
- **产品结论**：对外命名统一为 `name`
- **当前状态**：
  - 输入契约已偏向 `title`：`packages/contracts/src/modules/goal/api/goal-crud.dto.ts`
  - 传输/领域输出仍以 `name` 为主：`packages/contracts/src/modules/goal/aggregates/goal-client.ts`
  - application service 已做 `title -> name` 映射：`packages/goal/src/application-server/use-cases/commands/update-goal.ts`
  - `cloneGoal()` 仍在 controller 内手写组装 `CreateGoalReq`，并从 `original.name` 取值：`packages/goal/src/controllers/goal.controller.ts`
- **歧义点**：
  - 当前“用户输入 `title` / 输出 `name`”会继续制造重复映射和 clone 特判。
  - 既然已经确定对外统一为 `name`，则 `title` 应降级为迁移期兼容字段，并尽快移除。
- **建议落点**：
  - 对外 API 请求和响应统一使用 `name`
  - `title` 仅在迁移期做兼容解析，最终从 contracts、表单和 adapter 中删除
  - clone 必须走共享 mapper，而不是在 controller 手写对象
- **推荐实施顺序**：
  1. `contracts` 先收敛正式字段名，明确 `CreateGoalReq` / `UpdateGoalReq` / clone payload 的主字段为 `name`
  2. `controller` 下沉共享 mapper，例如 `toCreateGoalReqFromCloneSource()`，禁止继续在 action 内拼对象
  3. `application-service` 和 `adapter` 统一只消费 `name`
  4. `GoalDialog.vue`、列表页、详情页、复制入口统一改为 `name`
  5. 最后删除 `title` 兼容分支和旧测试夹具
- **具体改动清单**：
  - `packages/contracts/src/modules/goal/api/goal-crud.dto.ts`
    - 将 `CreateGoalSchema` / `UpdateGoalSchema` 主字段切到 `name`
    - 如需兼容迁移，在 schema 层集中做一次 `title -> name` 归一化，避免 controller 自行判断
  - `packages/contracts/src/modules/goal/aggregates/goal-client.ts`
    - 保持 `name` 为唯一对外字段，不再新增 `title`
  - `packages/goal/src/controllers/goal.controller.ts`
    - 抽出共享 mapper
    - `cloneGoal()` 复用正式 create 请求映射，不再手写临时对象
  - `packages/goal/src/application-client/goal-client-service.ts`
    - 搜索、create、update、clone 的参数类型全部对齐 `name`
  - `packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`
    - 表单字段改名为 `name`
    - 提交 payload 不再发 `title`
- **建议新增测试**：
  - controller 层：
    - clone 生成的 payload 使用 `name`
    - 输入旧 `title` 时若启用兼容，能被统一归一到 `name`
  - adapter / composable 层：
    - create、update、clone 发出的请求体不含 `title`
  - 视图层：
    - `GoalDialog` 打开编辑态、创建态时都只读写 `name`
- **回归关注点**：
  - `goal` 详情页、卡片、图谱、timeline 是否仍从 DTO 读取 `name`
  - 任何 AI 生成 KR 或 clone 流程是否还把 `goalTitle` 当成用户主字段对外传播
- **依赖项**：
  - 无前置阻塞，可单独落地
  - 建议在新增 `auth/repository/task` contract tests 前完成，以免固化旧字段名
- **改动点**：
  - `packages/contracts/src/modules/goal/api/goal-crud.dto.ts`
  - `packages/contracts/src/modules/goal/aggregates/goal-client.ts`
  - `packages/goal/src/controllers/goal.controller.ts`
  - `packages/app-vue/src/modules/goal/components/dialogs/GoalDialog.vue`
- **执行任务**：
  - 将 create/update/clone 的正式请求字段统一为 `name`。
  - 迁移期若保留兼容，需明确兼容窗口并在 schema 中集中处理 `title -> name`。
  - 调整 create、update、clone 的 DTO 映射。
  - 禁止 controller 跳过 schema 手写请求对象。
  - 让 clone 流程复用正式 `CreateGoalReq` 映射器。
- **验收标准**：新建、编辑、克隆目标使用同一主字段命名和同一校验入口。
- **拆票建议**：
  - 先出一个“小票”只做命名决策和 mapper 下沉
  - 再出一个“小票”处理 clone / dialog / adapter / 回归测试

### P1-A 仓库模块：书签 fallback 与持久化状态隔离

#### [x] C1. 为书签写操作建立独立 capability 检测

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

#### [x] C2. 将 fallback UI 状态与 persisted store 解耦

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

#### [x] C3. 补齐书签失败回滚和重新同步机制

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

#### [x] D1. 完成产品模型决策

- **目标**：明确前端是否允许用户拥有多个仓库。
- **产品结论**：`单仓库`
- **当前状态**：
  - 后端能力和数据结构天然支持多仓库：`GET /repositories` 返回列表，store 也已有 `repositories` 与 `currentRepositoryId`
  - 前端初始化仍带“无选择时默认取首仓库”的隐式单仓库行为：`resolveCurrentRepositoryId()` in `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - 当前 UI 没有清晰的仓库切换入口，因此运行时体验更像“伪单仓库 + 多仓库数据模型”
- **歧义点**：
  - 代码层已经跨到多仓库数据模型，但产品已确认不向用户暴露多仓库语义
  - 因此接下来要做的不是“补仓库切换器”，而是把当前首仓库 fallback 收口成显式单仓库边界
- **建议决策格式**：
  - 在 ADR 中明确写下：
    - `产品模型为单仓库，列表接口仅为历史兼容层`
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
  - `packages/repository/src/application-client/repository-client-service.ts`
  - `packages/repository/src/api/routes/repository.routes.ts`
- **执行任务**：
  - 明确产品结论：`单仓库` 或 `多仓库`。
  - 记录该决策到架构文档或 ADR。
- **验收标准**：产品和代码层面对仓库数量模型使用一致语义。

#### [ ] D2. 若为单仓库：收缩应用边界

- **目标**：避免前端通过 `repos[0]` 隐式决定业务语义。
- **当前状态**：
  - 目前不存在显式 `getCurrentRepository` 边界
  - 单仓库语义仅由 `resolveCurrentRepositoryId(repositories[0])` 隐含表达
- **建议落点**：
  - API 侧新增显式当前仓库读取入口，或在应用层封装单仓库专用 `getCurrentRepository()`
  - 前端仅消费该显式边界，不再碰列表首项推断
- **推荐实现**：
  - 服务端新增单仓库读取边界，推荐优先级：
    1. `GET /repositories/current`
    2. 若暂不改路由，则在 application client 增加 `getCurrentRepository()`，内部兼容 `getRepositories()` 但对外只暴露单对象
  - Web 端 `initRepository()` 改为读取单仓库边界，不再调用 `resolveCurrentRepositoryId(repositories[0])`
  - Store 可暂时保留 `repositories` 以兼容旧代码，但新增注释标明其为过渡字段，禁止新逻辑继续依赖列表首项
- **需要同步清理**：
  - 资源加载、书签加载、上传、搜索都应从显式 `currentRepository` 出发
  - 文档和测试中删除“仓库切换”“多仓库上下文”措辞
- **推荐实施顺序**：
  1. 在 server / application client 确立单仓库读取边界
  2. Web composable 改为只初始化一个显式当前仓库对象
  3. 删除 `resolveCurrentRepositoryId(repositories[0])` 这种首项推断
  4. 对资源、书签、上传、搜索、标签页初始化做回归验证
- **具体改动清单**：
  - `packages/repository/src/api/routes/repository.routes.ts`
    - 新增 `GET /repositories/current`，返回单个 repository DTO
  - `packages/repository/src/application-client/repository-client-service.ts`
    - 新增 `getCurrentRepository(): Promise<Result<Repository>>`
    - 如底层暂未改接口，可内部兼容 `getRepositories()` 但只返回唯一仓库，并在空列表/多列表时给出清晰错误或告警
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
    - `initRepository()` 改成只加载显式当前仓库
    - 删除 `resolveCurrentRepositoryId()` 或降级为兼容迁移私有函数
    - `fetchResources()` / `fetchBookmarks()` / `uploadResources()` 等统一从当前仓库实体读取 id
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
    - 保留 `currentRepositoryId`
    - `repositories` 若保留，明确标注为兼容字段；若可清理，则逐步下线
  - `packages/app-vue/src/modules/repository/views/RepositoryWorkspaceView.vue`
    - 不新增切换器
    - 空仓库场景要有明确空状态，而不是默认沉默失败
- **建议新增测试**：
  - route/controller：
    - `/repositories/current` 在单仓库存在时返回 200
    - 无仓库时返回明确错误或空态语义
  - application client：
    - 多条结果时不再默默取首项，行为可预期
  - composable：
    - `initRepository()` 不再依赖列表顺序
    - 当前仓库缺失时 `fetchResources()` / `fetchBookmarks()` 不会打错请求
- **回归关注点**：
  - 用户首次进入 repository workspace 时的初始化路径
  - 持久化的 `currentRepositoryId` 与实际单仓库 id 不一致时的迁移逻辑
  - editor 资源插入、书签面板、批量上传是否仍能正常工作
- **依赖项**：
  - 依赖 `D1` 已完成
  - 不依赖 `D3`
- **风险提示**：
  - 如果不收口，后续书签、搜索、上传等操作虽然“看起来能用”，但语义仍依赖列表顺序
- **改动点**：
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
  - 相关 repository application service / route
- **执行任务**：
  - 提供显式 `getCurrentRepository` 或等价边界。
  - 删除前端对列表首项的隐式选取。
- **验收标准**：单仓库语义在 API 与前端均显式可见。

#### [-] D3. 若为多仓库：补齐前端仓库上下文

- **目标**：让资源、书签、标签页都绑定当前选中的仓库。
- **状态**：`不适用`
- **当前状态**：
  - store 层已有 `repositories`、`currentRepositoryId` 和仓库切换后的 scoped state 清理逻辑
  - 缺口主要在“切换入口”和“禁止默认首仓库”的最后一跳
  - `RepositoryWorkspaceView.vue` 也未展示当前仓库选择器
- **建议落点**：
  - 不新增仓库切换器
  - 后续如需恢复多仓库，需先撤销本节单仓库 ADR，再重新开启该分支
- **改动点**：
  - `packages/app-vue/src/modules/repository/stores/repositoryStore.ts`
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - 当前阶段无执行任务。
- **验收标准**：该分支不进入当前交付范围。

### P2-A 任务模块：任务文件夹能力收口

#### [x] E1. 定位并清理前端伪能力入口

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

#### [-] E2. 若保留能力：补齐端到端边界

- **目标**：只有在后端能力闭环后才恢复任务文件夹功能。
- **产品结论**：当前阶段 `task` 模块不需要 folder 能力，继续隐藏且不恢复
- **状态**：`不适用 / 延后`
- **当前状态**：
  - task template 契约、聚合、repository、查询过滤已经保留 `folderId`
  - `GET /task-templates` 也仍支持 `folderId` 过滤
  - 但缺少面向前端可用的 task folder client / route / controller / UI 管理入口，当前只剩“数据字段存在、用户无法操作”的半成品状态
- **歧义点**：
  - 这不是纯后端未做，也不是纯前端未做，而是“存储层和部分查询能力存在，但产品边界不存在”
  - 因此恢复功能时不能只把 `folderId` 输入框加回来，必须先补文件夹资源本身
- **建议拆分顺序**：
  - 当前阶段不进入实现
  - 若未来重启，再按以下顺序恢复：
    - 先补 `TaskFolderApiClient` 与 route/controller/use case
    - 再补 folder list/create/update/delete
    - 最后再恢复模板表单中的 folder 选择器
- **当前应做的收尾**：
  - 保持前端不暴露 `folderId`
  - 在后续 task 改动中禁止新增 `folder` UI 入口
  - 将 `folderId` 视为存量兼容字段，不作为当前产品能力宣传
- **改动点**：
  - task application client / server / route / composable / UI
- **执行任务**：
  - 当前阶段无执行任务。
- **验收标准**：任务文件夹能力不进入当前交付范围，且 UI 不再重新暴露该能力。

### P2-B Mock 与契约测试：对齐开发、测试与真实接口

#### [x] F1. 修正 Task Mock 路径和响应结构

- **目标**：让 MSW 模拟当前正式 task 接口，而不是旧路径。
- **改动点**：
  - `apps/web/src/mocks/handlers/task.handlers.ts`
  - `packages/task/src/infrastructure-client/adapters/http/task-template-http.adapter.ts`
  - `packages/task/src/infrastructure-client/adapters/http/task-instance-http.adapter.ts`
- **执行任务**：
  - 将旧路径替换为正式路径。
  - 对齐请求参数和响应数据结构。
- **验收标准**：task mock 能驱动当前正式 adapter 通过开发测试流程。

#### [x] F2. 修正 Repository Mock 的资源列表形状

- **目标**：让 Repository mock 返回值与 adapter 预期一致。
- **改动点**：
  - `apps/web/src/mocks/handlers/repository.handlers.ts`
  - `packages/repository/src/infrastructure-client/adapters/http/repository-http.adapter.ts`
  - `packages/app-vue/src/modules/repository/composables/useRepository.ts`
- **执行任务**：
  - 统一资源列表返回结构，到底是数组还是包装对象。
  - 删除与真实接口不一致的 mock shape。
- **验收标准**：mock 与真实 adapter 的资源列表响应结构完全一致。

#### [ ] F3. 增加 adapter-route-contract 契约测试

- **目标**：以后新增接口时能自动发现契约漂移。
- **当前状态**：
  - 已有一批“mock handler 与 adapter 路径/参数一致性”测试：
    - `apps/web/src/mocks/handlers/task.handlers.spec.ts`
    - `apps/web/src/mocks/handlers/repository.handlers.spec.ts`
  - 但目前覆盖面仍偏窄：
    - 主要覆盖 task / repository
    - 更像 adapter-mock contract，而不是 adapter-route-schema 三方 contract
    - 尚未形成共享测试基座或文档规范
- **建议最小闭环**：
  - 第一阶段先把 `auth`、`goal` 纳入与 task/repository 同级别的 contract spec
  - 第二阶段抽出共享断言 helper，统一校验：
    - URL
    - method
    - query/body 字段名
    - 响应 shape 的最小关键字段
  - 第三阶段补 route schema 级测试，确保 adapter 发出的请求能通过 route 校验
- **不建议的做法**：
  - 只补 MSW handler spec，不校验 route schema
  - 只校验 schema，不校验 adapter 实际 URL 和参数拼装
- **推荐实施顺序**：
  1. 复制现有 `task.handlers.spec.ts` / `repository.handlers.spec.ts` 模式，先补 `auth.handlers.spec.ts` 与 `goal.handlers.spec.ts`
  2. 抽出共享 helper，例如：
    - `expectAdapterRequestShape()`
    - `expectMockRoutePrefix()`
    - `expectMinimalResponseShape()`
  3. 为关键 route 新增 schema smoke tests，验证 query/body 可通过 contracts schema
  4. 在 `docs/test/` 增补约定，规定新模块接口必须带 contract spec
- **建议覆盖矩阵**：
  - `auth`
    - login / refresh / me / sessions / revoke / password flows
  - `goal`
    - list / search / aggregate / clone
  - `repository`
    - current repository or repository bootstrap path
    - resources / bookmarks / upload
  - `task`
    - template list / template detail / instance flows
- **最小测试断言模板**：
  - Adapter 层：
    - URL 正确
    - HTTP method 正确
    - query/body 字段名正确
  - Mock 层：
    - handler 路由前缀正确
    - 返回的顶层 shape 与 adapter 预期一致
  - Route/contracts 层：
    - 关键 schema 能接受 adapter 发出的参数
    - 必填字段缺失时能失败
- **具体文件建议**：
  - `apps/web/src/mocks/handlers/auth.handlers.spec.ts`
  - `apps/web/src/mocks/handlers/goal.handlers.spec.ts` 或 goal 对应 mock/spec 文件
  - `apps/web/src/mocks/handlers/_shared/contract-test-helpers.ts`（若团队接受共享 helper）
  - `docs/test/contract-tests.md` 或现有测试文档新增章节
- **完成定义**：
  - 至少 `auth`、`goal`、`repository`、`task` 四个模块具备基础 contract spec
  - 至少一类 route/schema 级测试能够阻止字段名漂移进入主分支
  - 新增接口时，开发者能按固定模板补 contract test，而不是每次重新设计
- **依赖项**：
  - 建议在 `B4`、`D2` 收敛后再补，以免把已知待迁移字段名固化进测试
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
6. 落地单仓库显式边界，删除首仓库推断语义。
7. 维持 task folder 收口，不恢复 UI 入口。
8. 在 `auth/goal/repository/task` 四个模块补齐 adapter-route-contract 测试。

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
- `goal: normalize name field across create, update, and clone`
- `repository: isolate bookmark fallback state from persisted store`
- `repository: add rollback and resync for bookmark write failures`
- `repository: expose explicit current repository for single-repository product model`
- `task: keep task folder capability hidden and out of scope`
- `web-mock: align auth and goal handlers with current adapters`
- `testing: add adapter-route-contract tests for auth goal repository task`

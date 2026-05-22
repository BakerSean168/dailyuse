---
tags:
  - plan
  - active
  - architecture
  - consistency
  - refactor
description: 剩余架构优化项的总计划，供后续 agent 按工作包拆分执行
created: 2026-05-22T00:00:00
updated: 2026-05-22T00:00:00
status: active
---

# Remaining Architecture Optimizations Workpacks

## 目标

在 `notification-runtime` 已删除的前提下，把剩余高价值架构优化收敛成一份可执行总计划，供其他 agent 按独立分支和 PR 拆分实施。

## 当前状态

- `notification-runtime` 已从主线移除，相关 UI 初始化职责已经回收到 `app-vue`
- `main` 已包含这次删除重构，不需要再把它纳入后续优化范围
- 剩余问题集中在三个方向：
  - Desktop 主进程认证模块职责塌缩
  - `goal` 客户端 seam 已集中，但 `app-vue` 仍残留误命名的 `application/` 层
  - Nx target 治理缺少基线与显式豁免机制

## 约束与架构基线

后续所有工作包必须对齐以下规则：

- `ADR-016 Apps as Containers`
  - `apps/*` 只做容器、装配、入口与框架适配
  - 业务逻辑不得继续回流到 app 内
- `ADR-018 Smart Container + Application Service Pattern`
  - 客户端 application seam 应集中在 package 中
  - app 侧只保留框架相关的 store/composable/hook/presentation 逻辑
- `ADR-024 ApplicationService Framework Decoupling`
  - application service 不直接依赖 store、DOM 或框架状态容器
  - UI 协调逻辑留在 composables/hooks
- `docs/standards/monorepo-build-standard.md`
  - 业务代码通过稳定包名导入
  - 构建治理要明确区分开发态 alias 与构建态边界

## 分支策略

- 本分支 `refactor/architecture-consistency-workpacks` 只承载 planning 文档
- 不在本分支实现业务代码、脚本或 project target 改动
- 后续每个工作包单独开分支、单独提 PR：
  - `refactor/desktop-auth-decomposition`
  - `refactor/goal-app-vue-seam-cleanup`
  - `refactor/nx-target-governance`

## 执行顺序

1. Workpack A: Desktop Auth Decomposition
2. Workpack B: Goal Seam Cleanup
3. Workpack C: Nx Target Governance

顺序理由：

- Desktop auth 是当前最深的结构性风险，先拆最值得
- Goal cleanup 直接复用已有 ADR 语言和 package seam，改动面中等
- Nx governance 应在前两项代码形态稳定后收口，避免把过渡态写死成基线

## Workpack A: Desktop Auth Decomposition

### 问题定义

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts` 约 1376 行
- 单个类同时承担：
  - session restore / initialize / auto login
  - credential login / register / offline fallback
  - remembered account 管理
  - 2FA / API key / session / device 管理
  - account projection 补齐
  - 部分窗口和网络状态协调
- 当前 `createDesktopProfileAuthService.ts` 很薄，说明复杂度已经塌缩到单一服务内部，而不是被清晰分发到深模块

### 保持不变的外部边界

- `desktop-auth-shell` 的 IPC surface 不改
- `createDesktopProfileAuthService(db)` 的入口签名不改
- `@dailyuse/contracts/authentication` 的返回结构不改
- `IpcResult<T>`、`AuthBootstrapSnapshot`、`AuthStatus` 等 contract 维持兼容

### 目标结构

把当前 god service 降为 facade，只保留装配、状态桥接与对外方法名。内部拆成以下协作者：

- `DesktopAuthLifecycleCoordinator`
  - 负责 `initialize`
  - 负责 `autoLogin`
  - 负责 `refreshToken`
  - 负责 `getStatus`
  - 负责 `buildBootstrapSnapshot`
  - 负责 `cleanup`
- `DesktopCredentialAuthCoordinator`
  - 负责 `login`
  - 负责 `register`
  - 负责 `completeRegisterSuccess`
  - 负责 `completeRemoteLoginSuccess`
  - 负责 online/offline fallback 编排
- `DesktopRememberedAccountService`
  - 负责 remembered account 的列举、定位、删除
  - 负责 remembered account 登录前的密码解密和请求准备
- `DesktopAuthSecurityAdminService`
  - 负责 2FA
  - 负责 API key
  - 负责 session list / revoke
  - 负责 device list / rename / revoke
- `DesktopAuthAccountProjectionService`
  - 负责 active local conflict 检查
  - 负责 identity email/nickname 提取
  - 负责 account projection 补齐

### 提交序列

1. 为当前大类行为补 characterization tests
2. 提取 `DesktopAuthAccountProjectionService`
3. 提取 `DesktopRememberedAccountService`
4. 提取 `DesktopCredentialAuthCoordinator`
5. 提取 `DesktopAuthLifecycleCoordinator`
6. 提取 `DesktopAuthSecurityAdminService`
7. 把 `AuthDesktopApplicationService` 收口成 facade

每一步都必须保持代码可运行，禁止先大搬家再统一修复。

### 测试与验收

新增或补强以下行为测试：

- initialize 恢复会话后 runtime state 正确
- online login 成功路径不回归
- offline fallback 仍可达成 `OFFLINE_USER`
- remembered account 登录路径保持主进程解密
- refresh/logout 状态切换正确
- 至少一条 session/device admin 行为保持不变

执行命令：

- `pnpm nx run desktop:test:main`
- `pnpm nx run desktop:typecheck`
- `pnpm nx run desktop:lint`

## Workpack B: Goal Seam Cleanup

### 问题定义

- `packages/goal/src/application-client` 已经是中心化 goal client seam
- `packages/app-vue/src/modules/goal/composables/useGoal.ts` 也已经围绕这个 seam 消费
- 但 `packages/app-vue/src/modules/goal/application/` 仍残留多类代码：
  - 可直接复用 package 的 rule/template 数据
  - 实际上只是 Vue/UI helper，却被命名成 application 层

### 当前真实调用点

当前仍直接依赖 `modules/goal/application/*` 的 caller 包括：

- `GoalDAGVisualization.vue`
- `ExportDialog.vue`
- `TemplateBrowser.vue`
- `WeightTrendChart.vue`
- `WeightComparison.vue`
- `WeightSnapshotList.vue`
- `StatusRuleEditor.vue`
- `WeightSuggestionPanel.vue`
- `TimelineControls.vue`
- `GoalTimelineView.vue`

### 目标结构

#### 作为 canonical package seam 保留在 `packages/goal`

- `BUILT_IN_RULES`
- `sortRulesByPriority`
- `BUILT_IN_TEMPLATES`
- 对应 template/rule 类型与查询 helper

#### 保留在 `app-vue`，但迁出 `application/`

- `DAGExportService`
  - 实际是 DOM/blob/export helper，应迁到 `utils`
- `GoalTimelineService`
  - 当前只承载 timeline type 与时间格式化，应迁到 `utils`
- `TemplateRecommendationService`
  - 作为 UI 过滤/helper，迁到 `utils`
  - 改为消费 `packages/goal` 导出的模板数据，而不是本地占位实现
- `WeightRecommendationService`
  - 依赖 i18n，属于前端展示建议 helper，迁到 `utils`
- `useAutoStatusRules`
  - 使用 Vue `ref`，属于 composable，迁到 `composables`
- `useWeightSnapshot`
  - 使用 Vue state，属于 composable，迁到 `composables`

### 明确不做的事

- 不把 Vue `ref`、DOM、`document`、`fetch`、i18n 直接挪进 `packages/goal`
- 不为了“清空目录”强行把纯 UI 逻辑下沉成伪业务层
- 不在这一轮重做 `useGoal` 或重构整个 goal 模块视图树

### 提交序列

1. 先把 rules/templates caller 切到 `@dailyuse/goal/application-client`
2. 让模板推荐逻辑消费中心化模板数据
3. 把 UI-only helper 从 `application/` 重分类到 `utils/` / `composables/`
4. 删除本地重复实现并更新 index/barrel exports

### 测试与验收

至少覆盖以下场景：

- 规则编辑器仍能读取并排序内置规则
- 模板浏览器仍能筛选与推荐模板
- DAG 导出仍能生成文件名和 blob
- timeline 组件仍能格式化 snapshot 时间
- weight snapshot 组件仍能消费 composable 状态

执行命令：

- `pnpm nx run goal:test`
- `pnpm nx run goal:typecheck`
- `pnpm nx run app-vue:test`
- `pnpm nx run app-vue:typecheck`
- `pnpm exec vue-tsc -p apps/web/tsconfig.json --noEmit`
- `pnpm exec vue-tsc -p apps/desktop/tsconfig.json --noEmit`

## Workpack C: Nx Target Governance

### 问题定义

当前 repo-owned `project.json` 仍存在显著 target 漂移。扫描结果显示：

- 缺 `build`：`app-react`、`mobile`、`ui-react-native` 等
- 缺 `typecheck`：`assets`、`authentication`、`database`、`http-client`、`ipc-client`、`patterns`、`ui-core`、`utils` 等
- 缺 `lint`：`assets`、`authentication`、`database`、`patterns` 等
- 缺 `test`：`@dailyuse/test-utils`、`app-react`、`dashboard`、`database`、`http-client`、`ipc-client`、`mobile`、`powersync-schema`、`ui-vue-shadcn` 等

问题不在于“必须立刻把所有项目补齐”，而在于：

- 当前没有机器可验证的 baseline
- 没有显式 exemption 清单
- 例外项目和漏配项目在治理层看起来一样

### 目标结构

在 root `daily-use` project 下增加或扩展 workspace governance audit：

- 新增独立 audit 脚本，放在 `tools/` 下
- audit 只扫描 repo-owned project：
  - 根 `project.json`
  - `apps/**/project.json`
  - `packages/**/project.json`
  - `tools/**/project.json`
- 明确忽略：
  - `node_modules/**`
  - Nx 插件包
  - 非本仓库拥有的 vendor/tooling definitions

### 基线策略

建立一份 committed baseline/exemption manifest，至少包含：

- 按项目类别定义 required targets
- 显式 exemption 列表
- 每条 exemption 必须附理由

默认规则：

- app projects：要求 `build`、`lint`、`test`、`typecheck`
- runtime/shared libraries：要求 `build`、`lint`、`typecheck`
- library `test` 默认要求存在，除非被声明为 declarative/tooling-only exemption

### 明确不做的事

- 不在这一工作包里一次性给所有项目补 targets
- 不把“缺 target”直接等同于 bug，而不区分项目类型
- 不扫描 `node_modules` 并把三方项目误计入治理

### 提交序列

1. 增加 workspace target audit 脚本
2. 将 audit 接入 root `daily-use` governance target
3. 提交 baseline/exemption manifest
4. 更新治理标准文档，说明如何新增 target 或申请豁免

### 测试与验收

至少验证：

- 未登记漂移时，audit 会失败
- 合法 exemption 已登记时，audit 会通过
- `node_modules` 项目不会进入扫描结果

执行命令：

- 新增的 workspace governance audit target
- `pnpm nx run daily-use:governance-check`

## 对其他 Agent 的执行要求

- 每个工作包单独分支、单独 PR
- 不得把 planning 文档提交和代码实现混在同一个 PR
- 重构期间优先保持外部 contract、bootstrap 入口和 app wiring 稳定
- 新增测试优先验证外部行为，不测试重构后的内部私有实现细节

## Out Of Scope

- 不继续处理已完成的 `notification-runtime` 删除工作
- 不在本轮统一重构 desktop renderer 或 web bootstrap 的其他模块
- 不在 Nx governance 工作包中顺手大规模补 target
- 不新增新的 ADR，除非实现过程中出现难以逆转且存在真实 trade-off 的决策

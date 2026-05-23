---
tags:
  - plan
  - active
  - architecture
  - consistency
  - refactor
description: 剩余架构优化项的总计划与执行状态，供后续 agent 按工作包拆分执行
created: 2026-05-22T00:00:00
updated: 2026-05-23T17:00:00
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

## 执行状态（2026-05-23）

- Workpack A 已完成实现收口，状态可视为 `ready_for_pr`
  - 已提取：
    - `DesktopAuthAccountProjectionService`
    - `DesktopRememberedAccountService`
    - `DesktopCredentialAuthCoordinator`
    - `DesktopAuthLifecycleCoordinator`
    - `DesktopAuthSecurityAdminService`
    - `authCoordinatorHelpers`（共享 helper 模块）
  - `AuthDesktopApplicationService` 已收口为 facade
  - A1 review fixes 已完成：
    - `getCurrentUser()` token-cache fallback 已修复
    - restoring-state 测试已修正为操作 `authState.runtimeState`
    - 已补 wiring 测试（走真实 `setRepositories()` / `setAccountRepository()`）
  - test split 已完成：
    - 78-test 单体 spec 已拆分为 5 个 focused spec（当前 121 tests）
  - A4 seam hardening 已完成：
    - facade 的 test-only mutable setter 已移除
    - facade spec 已收口到公共装配与公共行为
    - remembered-account `identityId` 传递约定已统一为 raw string -> service 内部包装
  - Code quality fixes 已完成：
    - `refreshToken()` authState 更新 bug 已修复
    - `registerDesktopAccount.ts` validation order 已修复（validate before onSuccess）
    - `refreshDesktopSession.ts` onSuccess try/catch 已添加
    - 3 个重复 helper 提取到 `authCoordinatorHelpers.ts`
    - `DesktopRememberedAccountService` service locator 改为 constructor injection
    - fallback DTO 与 repository id 转换已收口到 `authCoordinatorHelpers.ts`
  - 已跑通：
    - `pnpm nx run desktop:test:main`（121 tests passed）
    - `pnpm nx run desktop:typecheck`
    - `pnpm nx run desktop:lint`（通过，当前 106 warnings）
    - `pnpm nx run daily-use:governance-check`
- Workpack B 已完成实现收口，状态可视为 `ready_for_pr`
  - 已完成：
    - B1: `StatusRuleEditor.vue` 改从 `@dailyuse/goal/application-client` 导入 `sortRulesByPriority`
    - B1: `TemplateBrowser.vue` 改从 `@dailyuse/goal/application-client` 导入 `GoalTemplate` 类型
    - B1: `TemplateRecommendationService` 改为消费 package 的 `BUILT_IN_TEMPLATES`（原来用空数组）
    - B2: `DAGExportService` → `utils/dag-export.ts`
    - B2: `GoalTimelineService` → `utils/goal-timeline.ts`
    - B2: `TemplateRecommendationService` → `utils/template-recommendation.ts`
    - B2: `WeightRecommendationService` → `utils/weight-recommendation.ts`
    - B2: `useAutoStatusRules` → `composables/useAutoStatusRules.ts`
    - B2: `useWeightSnapshot` → `composables/useWeightSnapshot.ts`
    - B2: `TimelineControls.vue` 和 `GoalTimelineView.vue` 改从 `utils/goal-timeline` 导入 timeline 类型
    - B3: 删除 `application/` 目录（`rules/BuiltInRules.ts`、`templates/GoalTemplates.ts`、`services/*`、`composables/*`）
    - B4: 新增 `utils/index.ts` barrel export
    - B4: 更新 `composables/index.ts` barrel 包含新迁入的 composables
    - B5: 删除重复的 `composables/types.ts`，timeline 类型与 `formatTimelineTimestamp` 已收口到 `utils/goal-timeline.ts`
    - B5: `composables/index.ts` 改为对 `utils/goal-timeline.ts` 做薄 re-export，保持 `modules/goal` public API 稳定
  - 已跑通：
    - `pnpm nx run app-vue:typecheck`
    - `pnpm nx run app-vue:test`（46 files, 136 tests）
    - `pnpm nx run goal:test`（54 files, 297 tests）
    - `pnpm nx run goal:typecheck`
    - `pnpm exec vue-tsc -p apps/web/tsconfig.json --noEmit`
    - `pnpm exec vue-tsc -p apps/desktop/tsconfig.json --noEmit`
    - `pnpm nx run daily-use:governance-check`
  - 分支：`refactor/goal-app-vue-seam-cleanup`
- Workpack C 已完成实现收口，状态可视为 `ready_for_pr`
  - 已完成：
    - C1: 实现只读 audit 脚本 `tools/governance/target-baseline-audit.mjs`
    - C1: 扫描全部 36 个 repo-owned project，输出缺口清单
    - C1: 确认 `notification-runtime` 不再出现在治理数据中
    - C2: 提交分类 manifest `tools/governance/target-baseline-manifest.json`
    - C2: 定义 5 个类别（app、runtime-lib、ui-lib、tooling-lib、meta-project）
    - C2: 提交 required target baseline
    - C2: 提交 25 条 documented exemption（每条附理由）
    - C3: 新增 `target-baseline-check` target 到 root `daily-use` project
    - C3: 将 audit 链入 `governance-check`（与 docs-config check 并行执行）
    - C4: 新增 `docs/governance/target-baseline-governance.md` 维护文档
    - C4: 更新 `docs/governance/README.md` 添加新检查命令和文档链接
    - C5: audit 范围已收紧到 root `project.json`、`apps/**`、`packages/**`、`tools/**`
    - C5: `projectRules` 中的孤儿项目名现在会触发失败，不再被静默接受
    - C5: `exemptions` 现在必须引用真实存在的 repo-owned 项目，且 target 必须属于该类别的 required target
  - 已跑通：
    - `pnpm nx run daily-use:target-baseline-check`
    - `pnpm nx run daily-use:governance-check`
  - 分支：`refactor/nx-target-governance`

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

- 当前分支 `refactor/architecture-consistency-workpacks` 已承载 Workpack A 的进行中实现与计划文档
- Workpack A 已在当前分支完成 seam hardening，不继续在该分支叠加 Workpack B/C 的实现
- 后续每个工作包单独开分支、单独提 PR：
  - `refactor/desktop-auth-decomposition`
  - `refactor/goal-app-vue-seam-cleanup`
  - `refactor/nx-target-governance`

## 统一执行规则

所有后续 agent 都按下面规则执行，避免同一 workpack 被不同实现者理解成不同任务：

- 每个 workpack 只解决一个架构问题，不顺手做横向清理
- 每个提交都必须保持：
  - 类型检查通过
  - 目标测试通过
  - 外部 import surface 不出现无计划破坏
- 若需要新增 helper/interface，优先新增在当前 workpack 内部，不扩大成新的公共抽象
- 若某段代码同时符合“业务规则”和“UI helper”两种解释，按以下顺序判断：
  - 是否依赖 Vue/React/Pinia/DOM/i18n
  - 是否需要跨 app/web/desktop 共享
  - 是否直接表达领域规则或应用编排
- 若依赖 Vue/DOM/i18n，则默认留在 `app-vue`
- 若可跨 app 共享且不依赖框架，则默认收口到 `packages/*`
- 计划中未明确要求的 public export，不新增

## 完成定义

每个 workpack 只有同时满足以下条件，才允许标记完成：

- 目标代码已按计划收口到指定 seam
- 旧 caller 已切走，或旧实现已删除
- 计划中要求的验证命令已实际执行
- review 中没有已知 contract 回归
- 没有“暂时靠测试注入私有字段”的过渡测试残留

## 执行顺序

1. Workpack A: Desktop Auth Decomposition
2. Workpack B: Goal Seam Cleanup
3. Workpack C: Nx Target Governance

顺序理由：

- Desktop auth 是当前最深的结构性风险，先拆最值得
- Goal cleanup 直接复用已有 ADR 语言和 package seam，改动面中等
- Nx governance 应在前两项代码形态稳定后收口，避免把过渡态写死成基线

## Workpack A: Desktop Auth Decomposition

### 当前进度

- 状态：`ready_for_pr`
- 完成情况：
  - 步骤 2 至步骤 6 已落地
  - facade 已具备稳定行为和可运行验证
  - A4 seam hardening 已完成

### 当前阻塞项

- 当前没有实现阻塞项
- 后续仅保留提交流水和 review 反馈处理

### 输入 / 输出边界

#### 输入

- 现有 facade：
  - `AuthDesktopApplicationService`
- 现有 composition root：
  - `createDesktopProfileAuthService(db)`
- 新提取的协作者：
  - `DesktopAuthAccountProjectionService`
  - `DesktopRememberedAccountService`
  - `DesktopCredentialAuthCoordinator`
  - `DesktopAuthLifecycleCoordinator`
  - `DesktopAuthSecurityAdminService`

#### 输出

- `AuthDesktopApplicationService` 只保留：
  - 依赖装配
  - facade method delegation
  - shared auth state bridge
  - identity/context getter
- 所有具体业务编排留在协作者中
- 不新增新的 app-level domain object

### 协作者职责的硬边界

为避免后续 agent 再把复杂度搬回来，职责划分必须按下面硬边界执行：

- `DesktopCredentialAuthCoordinator`
  - 只处理登录、注册、guest mode、logout、远程登录成功后状态落地
  - 不处理 session list / device list / 2FA / API key
- `DesktopAuthLifecycleCoordinator`
  - 只处理 initialize、auto login、refresh、bootstrap snapshot、cleanup、status
  - 不处理 remembered account CRUD
- `DesktopRememberedAccountService`
  - 只处理 remembered-account 读写、查找、密码解密
  - 不处理 login 编排
- `DesktopAuthAccountProjectionService`
  - 只处理 projection、identity 字段提取、local conflict 判断
  - 不管理 auth mode/runtime state
- `DesktopAuthSecurityAdminService`
  - 只处理安全管理与只读用户/session/device 视图
  - 不处理 login/register/bootstrap

### 禁止事项

- 不把 `WindowManager`、`NetworkStateManager`、PowerSync repository 再重新注入回 facade 逻辑体内
- 不新增一个“super coordinator”把 5 个协作者再包成新的 god object
- 不用 `setXxxService()` 这类测试专用 setter 作为生产路径依赖
- 不把 facade 的委派逻辑做成条件分支森林；若某协作者不存在，只允许返回既有 contract 允许的 fallback，不能随意抛新类型错误

### 更细的提交计划

#### A1. Review fixes

- 修 `DesktopAuthSecurityAdminService.getCurrentUser()`：
  - 与 facade 旧行为对齐
  - 当没有 current session 但 token cache 有 identityId 时，仍返回该 identity 的 fallback 视图
- 修 restoring-state 测试：
  - 不再写旧私有字段
  - 改为写 `authState.runtimeState`
- 补 1 组真实 wiring 测试：
  - `new AuthDesktopApplicationService()`
  - `setRepositories()`
  - `setAccountRepository()`
  - 断言 coordinator/lifecycle/security admin 真实可用

#### A2. Facade slimming

- 清理 facade 中残留的非委派逻辑
- 删除仅为过渡存在、但已不再需要的私有 helper
- 保留：
  - `getCurrentIdentityId`
  - `getCurrentSessionId`
  - `getCurrentRequestContext`
  - `getRuntimeState`

#### A3. Test normalization

- 把现有大体量 spec 分成：
  - facade wiring/spec
  - credential coordinator/spec
  - lifecycle coordinator/spec
  - security admin/spec
  - remembered account/spec
- 允许保留一个 facade 总体回归 spec，但不再让它承担所有实现细节测试

#### A4. Seam hardening

- 已移除 facade 的 test-only public setter：
  - `setCredentialCoordinator`
  - `setLifecycleCoordinator`
  - `setSecurityAdminService`
- facade spec 现仅验证：
  - `setRepositories()` 后公共方法可用
  - `setAccountRepository()` 后装配仍可运行
  - `getCurrentIdentityId` / `getCurrentSessionId` / `getCurrentRequestContext`
  - `logout()` 的 facade fallback
- 已不再断言：
  - 私有 coordinator 字段
  - `authState` 共享引用地址
  - 直接注入私有 `sessionManager`
- remembered-account 的入参约定已统一：
  - `DesktopRememberedAccountService.recordLogin()` 接受 raw `string identityId`
  - 所有 caller 传 raw string
  - `IdentityId.of(...)` 仅在 `DesktopRememberedAccountService` 内部执行一次
- lint 结果记录为：
  - `desktop:lint` 通过，但仍有 existing warnings（当前 106）
  - 不再把“0 errors”表述成“优雅完成”

### Agent 验收清单

Workpack A 的执行 agent 在结束前必须逐项确认：

- `createDesktopProfileAuthService(db)` 仍是唯一主装配入口
- `DesktopProfileRuntimeManager` 不需要改调用方式
- `desktop-auth-shell` 不需要改 handler contract
- `getCurrentUser()` 不丢 token fallback
- `cleanup()` 在 prepared runtime / active runtime 路径都不会额外抛错
- facade 不再公开 test-only setter
- facade spec 不再通过私有字段断言 coordinator 形状
- remembered-account `identityId` 传递约定在所有调用点一致

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

### 下一步要求

- 先单独提交一轮“review fixes”：
  - 修复 `DesktopAuthSecurityAdminService.getCurrentUser()` 的 fallback 语义
  - 补 facade wiring 测试
  - 修正失真的 restoring-state 测试
- 只有在这轮 review fixes 合格后，才继续压缩 facade 或拆下一步小提交

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

### 输入 / 输出边界

#### 输入

- `packages/goal/src/application-client/index.ts`
- `packages/goal/src/application-client/BuiltInRules.ts`
- `packages/goal/src/application-client/GoalTemplates.ts`
- `packages/app-vue/src/modules/goal/application/*`
- 现有 `app-vue` 组件和 composables caller

#### 输出

- 所有可共享的 rules/templates 数据与 helper 只从 `@dailyuse/goal/application-client` 暴露
- `app-vue` 内只保留：
  - Vue composables
  - DOM/export helper
  - i18n 绑定 helper
  - 纯 presentation formatting/filtering helper
- `modules/goal/application/` 目录不再承载任何“看起来像业务应用层”的代码

### 分类规则

为避免执行时再次争论“该留哪里”，直接按下表判断：

- 若代码依赖 `ref` / `computed` / `watch`：
  - 归 `composables`
- 若代码依赖 `document` / `Blob` / `URL.createObjectURL` / 浏览器导出行为：
  - 归 `utils`
- 若代码依赖 i18n 文案或仅提供展示建议：
  - 归 `utils`
- 若代码只是在模板/规则数据上做纯函数查询且可跨 app 共享：
  - 迁到 `packages/goal/application-client`
- 若代码操作 store 或响应式状态：
  - 留在 `app-vue`

### 目标重分类表

- `application/services/DAGExportService.ts`
  - 目标：`utils/dag-export.ts`
  - 说明：浏览器导出 helper，不是 application service
- `application/services/GoalTimelineService.ts`
  - 目标：`utils/goal-timeline.ts`
  - 说明：timeline 类型与格式化 helper
- `application/services/TemplateRecommendationService.ts`
  - 目标：`utils/template-recommendation.ts`
  - 说明：UI 筛选逻辑，改为消费 package templates
- `application/services/WeightRecommendationService.ts`
  - 目标：`utils/weight-recommendation.ts`
  - 说明：i18n + 展示建议 helper
- `application/composables/useAutoStatusRules.ts`
  - 目标：`composables/useAutoStatusRules.ts`
  - 说明：Vue composable，不应放在 application 目录
- `application/composables/useWeightSnapshot.ts`
  - 目标：`composables/useWeightSnapshot.ts`
  - 说明：Vue composable，不应放在 application 目录
- `application/rules/BuiltInRules.ts`
  - 目标：删除本地使用，caller 改为 `@dailyuse/goal/application-client`
- `application/templates/GoalTemplates.ts`
  - 目标：删除本地使用，caller 改为 `@dailyuse/goal/application-client`

### 禁止事项

- 不把 `template recommendation` 误迁成 package application service
- 不为了复用而把 `fetch` / `Blob` / DOM API 移进 `packages/goal`
- 不在这轮把 `goalStore`、`useGoal`、router、views 大改
- 不新增第二套 rules/templates export surface

### 更细的提交计划

#### B1. Canonical import switch

- `StatusRuleEditor.vue` 改从 package import `BUILT_IN_RULES` / `sortRulesByPriority`
- `TemplateBrowser.vue` 改从 package import `GoalTemplate` / `BUILT_IN_TEMPLATES`
- 若有本地 wrapper，仅保留极薄 re-export，随后删除

#### B2. UI helper relocation

- 把 export/timeline/template/weight helper 移到 `utils/`
- 把 Vue 响应式 helper 移到 `composables/`
- 所有 caller import 路径同步更新

#### B3. Duplicate deletion

- 删除本地 `application/rules/BuiltInRules.ts`
- 删除本地 `application/templates/GoalTemplates.ts`
- 删除空的 `application/services` / `application/rules` / `application/templates` 子路径
- 若 `application/` 目录只剩纯 Vue composable，也继续迁出直至目录可删

#### B4. Barrel normalization

- 更新 `modules/goal/index.ts`
- 更新 `modules/goal/composables/index.ts`
- 若新增 `utils/index.ts`，只导出真实复用 helper，不做全量星号导出

### Agent 验收清单

- 组件不再从 `modules/goal/application/rules/*` 导入
- 组件不再从 `modules/goal/application/templates/*` 导入
- `app-vue` 中不再存在名义上的 goal application layer 残留
- package 侧 rules/templates 是唯一 canonical source
- 所有 Vue-only helper 仍留在 `app-vue`

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

### 输入 / 输出边界

#### 输入

- 根 `project.json`
- `apps/**/project.json`
- `packages/**/project.json`
- `tools/**/project.json`
- `docs/standards/monorepo-build-standard.md`

#### 输出

- 一个可执行的 target audit 脚本
- 一份 committed baseline/exemption manifest
- 一个稳定的 workspace-level governance target
- 一份更新后的文档说明如何维护基线

### manifest 形态要求

为了减少实现者自行设计格式的歧义，manifest 至少包含以下字段：

- `projectCategories`
  - category -> required targets
- `projectRules`
  - project name -> category
- `exemptions`
  - project name
  - target name
  - reason
  - optional expiry/revisit note

允许 JSON 或 YAML，但必须：

- 机器可读
- 能被脚本稳定解析
- 变更 diff 易读

### 分类规则

执行 agent 不要自行发明分类。统一按下列最小类别：

- `app`
  - 典型：`web`, `desktop`, `mobile`, `app-react`
- `runtime-lib`
  - 有运行时代码，会被应用或其他业务库消费
- `ui-lib`
  - UI 组件/展示库
- `tooling-lib`
  - 工具、脚手架、测试辅助、配置型项目
- `meta-project`
  - root/workspace 级治理项目

默认 target 基线：

- `app`
  - `build`
  - `lint`
  - `typecheck`
  - `test`
- `runtime-lib`
  - `build`
  - `lint`
  - `typecheck`
  - `test`
- `ui-lib`
  - `build`
  - `lint`
  - `typecheck`
  - `test`
- `tooling-lib`
  - 至少 `build`
  - `lint` / `typecheck` / `test` 可豁免，但必须写明理由
- `meta-project`
  - 不强制套用业务 target 基线，但必须在 manifest 中显式登记

### Audit 脚本行为要求

脚本必须输出两类结果：

- `undocumented gaps`
  - 应有 target 但缺失，且未登记 exemption
- `documented exemptions`
  - 已登记，且理由存在

脚本退出规则：

- 有 undocumented gaps -> 非零退出
- 仅有 documented exemptions -> 零退出
- manifest 缺字段或 project 未分类 -> 非零退出

### 禁止事项

- 不把 `node_modules/@nx/*/project.json` 扫进治理结果
- 不把“项目没有某 target”直接视作允许状态
- 不边写 audit 边顺手给 10+ 个项目补 target
- 不把 exemption 写成无理由白名单

### 更细的提交计划

#### C1. Snapshot the current drift

- 先实现只读 audit
- 输出当前 repo-owned 项目的缺口清单
- 与已知分析结果对齐，确认 `notification-runtime` 不再出现

#### C2. Introduce baseline manifest

- 提交分类
- 提交 required target baseline
- 提交第一版 exemption

#### C3. Wire governance target

- 把 audit 接到 root `daily-use` project
- 若复用 `governance-check`，则保留其现有职责，并把 target audit 纳入同一命令链
- 若新增 target，则命名保持直观，例如 `target-baseline-check`

#### C4. Document maintenance flow

- 文档写清：
  - 新项目如何分类
  - target 缺失如何补
  - 何时允许 exemption
  - exemption 如何回收

### Agent 验收清单

- repo-owned project 全部能被分类
- 没有未分类 project 默默跳过
- `notification-runtime` 不再出现在治理数据里
- `node_modules` 项目不在治理结果中
- 对每个 exemption 都能回答“为什么不需要这个 target”

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
- 若当前分支已同时承载计划与实现，则在最终提交中明确标注该偏差
- 重构期间优先保持外部 contract、bootstrap 入口和 app wiring 稳定
- 新增测试优先验证外部行为，不测试重构后的内部私有实现细节
- 若 review 发现 contract 回归或测试失真，先修 review 问题，再继续拆分
- 提交信息建议按 workpack 和意图拆分：
  - `test(auth): add wiring regression coverage`
  - `refactor(auth): extract lifecycle coordinator`
  - `refactor(goal): move vue-only helpers out of application layer`
  - `chore(nx): add target baseline audit`

## 交付模板

每个 workpack 的执行 agent 在最终汇报时至少应包含：

- 已完成的提交序列
- 实际运行过的验证命令
- 与计划相比的偏差
- 未完成项和原因
- 是否需要新的 follow-up 分支

## Out Of Scope

- 不继续处理已完成的 `notification-runtime` 删除工作
- 不在本轮统一重构 desktop renderer 或 web bootstrap 的其他模块
- 不在 Nx governance 工作包中顺手大规模补 target
- 不新增新的 ADR，除非实现过程中出现难以逆转且存在真实 trade-off 的决策

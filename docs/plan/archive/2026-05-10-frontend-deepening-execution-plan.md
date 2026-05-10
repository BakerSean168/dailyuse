# Frontend Deepening 执行方案

> 创建时间: 2026-05-10
> 状态: 已完成，已归档
> 来源: [Codebase Architecture Deepening 审查与后续计划](./2026-05-06-codebase-architecture-deepening-audit.md)
> 结论基线: 当前前端 deepening 未完成，只有少量前置收口，尚未进入像 server deepening 那样的实施与归档阶段
> 归档说明: React client registry、Vue desktop auth runner、editor resource session、AI chat/workflow seam 已完成落地；相关代码已分别提交到 `8b728043b` 与 `3c4e7c0`。

## Summary

本计划用于落实 `2026-05-06-codebase-architecture-deepening-audit.md` 中 Wave 2 的前端 deepening。

当前代码状态表明，前端仍然存在四类核心泄漏：

1. React 端每模块一个 `useXService`，caller 仍需理解 client composition
2. Vue 端 desktop auth recovery 只抽出了恢复判断，重试、phase、错误翻译仍散在各 composable
3. repository / editor workspace orchestration 仍跨 `composable`、`store`、`gateway` 泄漏
4. AI workspace orchestration 仍散在 React hook 和 Vue view，`AIClientService` 仍是薄 facade

本轮目标不是“再多抽一层”，而是把这些复杂度收回深 module，让 UI caller 重新只表达用户动作与界面状态。

完成标准：

- React 不再由每个 `useXService` 自己装配 client service
- Vue 不再由每个 composable 自己处理 auth recovery + retry + error translation
- repository/editor 与 AI 的复杂工作流移动到更深的 module
- 现有薄转发 seam 要么升级成真 seam，要么删除

## 当前实现判断

### 1. React client composition 仍未收口

`use-goal-service.ts`、`use-task-service.ts`、`use-repository-service.ts`、`use-schedule-service.ts`、`use-ai-service.ts`、`use-notification-service.ts` 等文件仍保持相同装配模式：

- `useAppApiClient()`
- `createXxxHttpAdapters()`
- `new XxxClientService(...)`
- `useRef` 缓存

这说明 app-level client composition / registry 还没有落地。

### 2. Desktop auth operation 只做了一半

`packages/app-vue/src/shared/utils/desktopAuthRecovery.ts` 已经收口了：

- recoverable error 判断
- Electron auth readiness 检查
- initialize + re-check

但 `useTask.ts`、`useReminder.ts`、`useRepository.ts` 仍保留：

- 本地 `maybeRecoverAuth`
- retry once 模板
- phase 转换
- `translateResultError`
- 各自收尾逻辑

这说明共享的 `desktop authenticated operation` seam 还没形成。

### 3. Repository / Editor workspace 仍跨 seam 泄漏

当前复杂度仍散落在：

- `useRepository`
- `useRepositoryResourceGateway`
- `useEditorWorkspaceActions`
- `editorWorkspaceStore`
- `useRepositoryWorkspaceScene`
- React `useRepositoryWorkspace`

其中 `repositoryResourceGateway` 仍是薄转发 seam，`editorWorkspaceStore` 仍直接编排 workspace resolve、session hydrate、tab orchestration。

### 4. AI workspace 仍未形成深 module

当前 AI workflow 仍分散在：

- React `useAIWorkspace`
- Vue `AIChatView.vue`
- `AIClientService`

`AIClientService` 仍然只是对底层 client port 的薄 facade，没有把 provider hydrate、conversation lifecycle、optimistic streaming、workflow persistence、goal draft、automation、knowledge note 这些 orchestration 收进去。

## Implementation Changes

### A. React client composition seam

新增 app-level `AppClientRegistry` module，放在 `packages/app-react/src` 的 provider / client-composition 层。

固定提供：

- `createAppClientRegistry(httpClient)`
- `AppClientRegistryProvider`
- `useAppClientRegistry()`

实现要求：

- registry 只在 provider 内按 session / httpClient 生命周期构建一次
- 全部 client service 必须通过现有 `createXxxClientService()` factory 创建
- 不再在 React hook 内直接 `new XxxClientService(...)`
- `useAccountService`、`useGoalService`、`useTaskService`、`useRepositoryService`、`useScheduleService`、`useAIService`、`useReminderService`、`useNotificationService`、`useSettingService` 先改成兼容 shim，只负责从 registry 取实例

这一阶段不改 screen / workspace hook 的外部签名，先把装配复杂度回收到 registry seam。

### B. Desktop authenticated operation seam

在 `packages/app-vue/src/shared` 下新增共享函数式 module：

- `executeDesktopAuthenticatedResult<T>(options)`

这个 seam 固定负责：

- 执行 `Result<T>` operation
- 遇到 `AUTH_REQUIRED` / `AUTH_RESTORING` 时自动恢复并重试一次
- 统一 `translateResultError`
- 支持 `onStart` / `onSuccess` / `onError` / `onFinally`
- 支持可选 toast / fallbackKey，但不内置模块专有 store 更新逻辑

迁移范围：

- `useTask`
- `useTaskGoalBindingOptions`
- `useReminder`
- `useRepository`

迁移后要求：

- 删除各文件本地 `maybeRecoverAuth`
- 删除重复的 retry 模板
- 让 composable 只保留模块特有的 store 更新、成功文案和用户动作语义

### C. Repository / Editor workspace seam

把当前跨多个 caller 泄漏的工作流收成两个深 module：

- `RepositoryWorkspace`
- `EditorResourceSession`

`RepositoryWorkspace` 负责：

- repository init
- resource / tree / bookmark / search / upload 的 workspace 语义
- 暴露“打开资源”“创建 note 并打开”“刷新 workspace”“同步 bookmarks”这类用户动作

`EditorResourceSession` 负责：

- workspace lookup id -> resolved workspace id
- session hydrate / default session creation
- open / activate / pin / close / closeOthers / closeRight / closeAll
- unsaved changes confirm
- document registry dispose / dirty sync

明确收口规则：

- `useEditorWorkspaceActions` 并入 `EditorResourceSession`
- `repositoryResourceGateway` 若迁移后只剩转发，则删除；若保留，必须升级成真正持有 workspace 语义的 seam
- `useRepository` 回到 repository 数据与命令本身，不再承担 editor-specific orchestration
- React `useRepositoryWorkspace` 改成消费 `RepositoryWorkspace`，不再自己维护整套 hydrate / mutate / select / upload 流程

### D. AI workspace seam

AI 侧拆成两层：

- `AIWorkspacePort`
- `AIWorkflowSession`

`AIWorkspacePort` 放在 `packages/ai/src/application-client`，固定暴露：

- `hydrate`
- `createConversation`
- `openConversation`
- `setDefaultProvider`
- `sendMessage`
- `abortActiveStream`

它必须持有：

- provider 选择策略
- conversation list + active conversation hydrate
- optimistic user/assistant draft lifecycle
- stream chunk append / finalize / abort / error recovery

`AIWorkflowSession` 放在前端侧，承接：

- workflow persistence
- goal clarification / draft / automation
- knowledge note create flow
- 与 repository/editor 的联动打开动作

迁移规则：

- React `useAIWorkspace` 改成 `AIWorkspacePort` 的 state adapter
- Vue `AIChatView` 只保留 UI concern：scroll、textarea、dialog、route navigation、toast 触发
- `AIChatView` 里的 workflow persistence、goal draft、automation execute、knowledge note create 全部移到 `AIWorkflowSession`
- `AIClientService` 继续保留为 facade，但不再承担“workspace 已经足够深”的角色

### E. Cleanup

完成迁移后统一清理：

- 删除前端直接 `new XxxClientService(...)` 的调用点
- 删除仅剩 pass-through 的 gateway / action seam
- 若 `useXService` 只剩 registry 读取且 caller 已全部可直接依赖 registry，可继续折叠删除；否则允许作为兼容 shim 短期保留

## 建议实施顺序

### Phase 1: React client registry

范围：

- `packages/app-react/src/hooks/use-*-service.ts`
- app-react provider 层

目标：

- 先把装配复杂度全部回收到一个 seam
- 建立前端 client composition 的统一入口

### Phase 2: Desktop authenticated operation

范围：

- `useTask`
- `useTaskGoalBindingOptions`
- `useReminder`
- `useRepository`

目标：

- 先消除最明显的重复 retry / error / phase 模板
- 为后续 workspace seam deepening 降低噪音

### Phase 3: Repository / Editor workspace

范围：

- Vue repository/editor
- React repository workspace

目标：

- 收回最容易出 UI bug 的 workspace orchestration
- 删除薄 gateway / action seam

### Phase 4: AI workspace

范围：

- `packages/ai/src/application-client`
- React `useAIWorkspace`
- Vue `AIChatView`

目标：

- 把 conversation / streaming / workflow persistence 收回深 module
- 让 view 与 hook 回到 UI adapter 角色

## Test Plan

### React registry

- 同一 provider 生命周期内，各 service 实例稳定且不重复构造
- `useXService` shim 返回 registry 中实例
- 替换 fake registry 后，screen / workspace hook 可脱离真实 HTTP adapter 测试

### Desktop auth runner

- auth error 会恢复并仅重试一次
- 非 auth error 不重试
- translated error、toast、loading/saving 收尾正确
- `Task` / `Reminder` / `Repository` 至少各有一条迁移后用例

### Repository / Editor workspace

- lookup id 能正确 resolve 成 editor workspace id
- 已打开资源不会重复开 tab
- 默认 session 缺失时自动创建
- dirty tab close 会触发 confirm，确认后 dispose document
- bookmark reorder / remove / resync 语义不回退
- create note / open resource / upload 后 workspace 状态一致

### AI workspace

- provider 默认选择优先级正确
- unauthenticated hydrate 能正确清空状态
- optimistic stream append / done / abort / error 全覆盖
- workflow persistence 可恢复 goal draft / automation / note summary
- knowledge note 创建后仍能打开 repository resource

## 验证要求

至少运行离改动最近的 target，最低要求：

- `pnpm nx run app-react:typecheck`
- Vue 侧相关模块 Vitest
- editor workspace 相关现有 spec
- AI view / workspace 相关现有 spec

如果某一阶段改动只触及单一包，则优先跑该包 target，不做无差别全仓验证。

## Assumptions

- 范围同时包含 `packages/app-react` 与 `packages/app-vue`
- 不引入新的全局状态管理框架
- 不修改后端 contracts 或 route wire format
- 现有 `application-client` factory 是前端 registry 的唯一 service 构建入口
- 允许先用兼容 shim 控制迁移风险，但最终标准是不再让 caller 理解装配细节

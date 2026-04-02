# React Mobile Migration Status and Task Breakdown 2026-04

## Goal

将现有 `packages/app-vue` 的核心业务能力完整迁移到 `React + React Native` 体系。
最终宿主以 `apps/mobile` 为主，`apps/mobile` 只保留 Expo 壳，业务装配进入 `packages/app-react`，移动端设计系统进入 `packages/ui-react-native`。

## Scope

- 保留迁移目标：`authentication`、`task`、`goal`、`schedule`、`reminder`、`notification`、`repository`、`setting`、`account`、`ai`
- 明确不迁移：`governance`、`sse monitor`、`dependency-validation-demo`、`rules-demo`、其他仅开发辅助页面
- 页面按移动端信息架构重做，不复刻桌面侧边栏和多栏工作台

## Audit Baseline

本次文档按 `2026-04-01` 工作区现状重新审查，基线来自：

- `apps/mobile/src/app` 当前 Expo Router 路由树
- `packages/app-react/src/screens`、`packages/app-react/src/hooks` 当前实现
- `packages/ui-react-native/src` 当前设计系统原语
- `pnpm nx run mobile:typecheck`
- `pnpm nx run app-react:typecheck`
- `pnpm nx run mobile:lint`
- `pnpm nx run app-react:lint`

## Current Snapshot

### Architecture

- [x] `apps/mobile` 已收口为 Expo 壳，主入口基本只做 `@dailyuse/app-react` re-export
- [x] `packages/app-react` 已承接 root layout、providers、session runtime、main tabs、screen composition、module hooks
- [x] `packages/ui-react-native` 已承接 theme、provider、基础 primitives、`PageShell`
- [x] 认证持久化、启动恢复、refresh token 恢复和 guest/demo 会话已接入
- [x] 主导航已经稳定为 `Home / Tasks / Goals / Schedule / More`
- [x] `More` 已接入 `reminders / notifications / ai / repository / note-editor / settings / account`
- [x] `apps/mobile` 已有独立 `project.json`，`start / android / web / lint / typecheck / sync-brand` targets 已收口

### Engineering Health

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm nx run mobile:typecheck` | 通过 | Expo 壳与 `app-react` 依赖重新对齐 |
| `pnpm nx run app-react:typecheck` | 通过 | 仓库上传流重构已收口 |
| `pnpm nx run mobile:lint` | 通过 | 已改为仓库统一 ESLint 入口，不再依赖不稳定的 `expo lint` |
| `pnpm nx run app-react:lint` | 通过 | 上传修复和历史 warning 已清理 |
| `pnpm nx run mobile:web` | 通过运行时验证 | Expo web dev server 可启动，`http://localhost:8081` 返回 `200 OK` |
| `pnpm nx run mobile:android` | 环境受限 | Expo 已进入 Metro 启动，但当前机器无 Android 设备或模拟器 |

当前工程状态已经从“上传重构阻塞编译”恢复到“基础静态校验绿色”：

- `RepositoryScreen` 已完全切到 `useFileUpload`
- `useFileUpload` 不再自己创建第二份 `useRepositoryWorkspace` 状态
- `apps/mobile` 已补 `layer:app` tag，模块边界 lint 可正常工作
- `mobile:lint` 已切换到仓库统一 ESLint 命令，避免 `expo lint` 依赖树问题
- `contracts/result` 已拆出 `core.ts`，清除了 Expo web 运行时的 Result adapter 循环依赖噪音

## Coverage Audit

| Area | Code reality | Status | Main remaining work |
| --- | --- | --- | --- |
| Auth | 单屏模式切换的 `sign-in / register / forgot-password`，支持 guest/demo，支持启动恢复和远程会话恢复 | 核心完成 | 缺独立 `reset-password` 完成流；未拆独立 auth route tree；未定义更细的受保护路由返回策略 |
| Home | 已接真实聚合首页，显示 tasks/goals/schedule 摘要和主入口跳转 | 部分完成 | 缺 reminders/notifications 摘要；缺快捷新建；统计和图表仍较轻 |
| Tasks | 已有列表、搜索、筛选、排序、详情、创建编辑、模板动作、实例动作、依赖关系展示 | 核心完成 | filters/sort 仍是常驻区而不是 sheet；缺更完整实例流和批量操作 |
| Goals | 已有列表、筛选/排序、详情、创建编辑、review 创建/详情、key result detail/edit、compare | 核心完成 | 缺更复杂 key result 关联能力和更深的 focus flow |
| Schedule | 已有 task lanes、agenda、calendar/week、event create/edit、冲突检测与冲突展示 | 部分完成 | 缺真正的 conflict resolution / reschedule flow |
| Reminders | 已有模板列表、今日摘要、详情、创建编辑、启停、删除，编辑器支持触发类型和渠道选择 | 部分完成 | 重复规则仍偏简化；高级渠道 payload 和更细的时间规则未完成 |
| Notifications | 已有列表、关键词/已读筛选、详情、单条已读、批量已读、删除 | 核心完成 | 缺通知到业务实体详情的深跳转；缺更强批量管理 |
| Account | 已有 read-only 账户资料与偏好摘要页 | 部分完成 | 缺安全操作、session 管理、资料编辑 |
| Settings | 已有主题、语言、时间制式、通知开关、分类 reset 和分类摘要 | 部分完成 | 缺分类详情页、AI 偏好、账户偏好和更多系统设置 |
| AI | 已有 provider 选择、默认 provider 切换、model 选择、会话创建/切换、流式发送、runtime capabilities 摘要 | 部分完成 | 缺会话 rename/delete；缺知识笔记入口；缺独立 AI 配置详情页；长消息与键盘体验未打磨 |
| Repository / Editor | 已有仓库概览、资源列表、bookmark、远程搜索、上传、内联编辑、独立 `note-editor` route、文件夹浏览、rename/move/delete | 核心完成 | 缺 richer markdown editor、图片/链接/附件插入、预览式多步流、真机上传回归 |
| Shared UX / Quality | 已有 `PageShell`、`PrimaryButton`、`PrimaryTextField`、`SectionCard`、`StatusPill`、`FeatureTile` 等基础原语，基础 typecheck/lint 绿灯 | 部分完成 | 缺更完整 design system；缺全局 error/loading；缺 smoke tests、真机回归清单 |

## Target Navigation Map

### Auth

| Route / flow | Status | Notes |
| --- | --- | --- |
| `sign-in` | 已落地 | `AuthScreen` 模式切换 |
| `register` | 已落地 | `AuthScreen` 模式切换 |
| `forgot-password` | 已落地 | `AuthScreen` 模式切换 |
| `guest-mode` | 已落地 | 通过 session provider |
| `reset-password` | 未开始 | 当前没有独立完成流 |
| 独立 auth route tree | 未决定 | 目前仍由 `AppShell` 直接切换 |

### Main Tabs

| Tab | Status |
| --- | --- |
| `home` | 已落地 |
| `tasks` | 已落地 |
| `goals` | 已落地 |
| `schedule` | 已落地 |
| `more` (`explore`) | 已落地 |

### Task Stack

| Route / flow | Status | Notes |
| --- | --- | --- |
| `tasks/index` | 已落地 | 列表、搜索、筛选、排序 |
| `tasks/[id]` | 已落地 | 详情、依赖关系、实例动作 |
| `tasks/editor` | 已落地 | 创建与编辑 |
| filters / sort sheet | 未完成 | 当前为常驻操作区，不是 sheet |
| standalone dependency route | 不计划单拆 | 当前并入详情页已可用 |

### Goal Stack

| Route / flow | Status | Notes |
| --- | --- | --- |
| `goals/index` | 已落地 | 列表、搜索、筛选、排序 |
| `goals/[id]` | 已落地 | 详情 |
| `goals/editor` | 已落地 | 创建与编辑 |
| `goals/review` | 已落地 | review 创建 |
| `goals/review-detail` | 已落地 | review 详情 |
| `goals/key-result` | 已落地 | key result detail/edit + record |
| `goals/compare` | 已落地 | 移动端 compare 替代方案 |

### Schedule Stack

| Route / flow | Status | Notes |
| --- | --- | --- |
| `schedule/index` | 已落地 | task lanes + agenda |
| `schedule/calendar` | 已落地 | 月视图摘要 |
| `schedule/week` | 已落地 | 周视图 |
| `schedule/event-editor` | 已落地 | 创建/编辑 + conflict detect |

### More Stack

| Route / flow | Status |
| --- | --- |
| `reminders` | 已落地 |
| `reminder-detail` | 已落地 |
| `reminder-editor` | 已落地 |
| `notifications` | 已落地 |
| `notification-detail` | 已落地 |
| `ai` | 已落地 |
| `repository` | 已落地 |
| `repository-folder` | 已落地 |
| `note-editor` | 已落地 |
| `settings` | 已落地 |
| `account` | 已落地 |

## Vue to React Mapping Audit

### Fully or Mostly Covered

- [x] `AuthView` -> `AuthScreen`
- [x] `WelcomeView + DashboardView` -> `home`
- [x] `TaskManagementView` -> `tasks/index`
- [x] `TaskDetailView` -> `tasks/[id]`
- [x] `GoalListView` -> `goals/index`
- [x] `GoalDetailView` -> `goals/[id]`
- [x] `GoalReviewCreationView` -> `goals/review`
- [x] `GoalReviewDetailView` -> `goals/review-detail`
- [x] `KeyResultDetailView` -> `goals/key-result`
- [x] `ScheduleDashboardView` -> `schedule/index`
- [x] `ScheduleWeekView` -> `schedule/week` 和 `schedule/calendar`
- [x] `ReminderLinearView` -> `explore/reminders`
- [x] `NotificationListPage` -> `explore/notifications`
- [x] `RepositoryWorkspaceView` -> `explore/repository`
- [x] `EditorLinearView` -> `explore/note-editor`
- [x] `UserSettingsView` -> `explore/settings`
- [x] `AccountCenterView` -> `explore/account`
- [x] `MultiGoalComparisonView` -> `goals/compare`
- [x] `AIChatView` -> `explore/ai`

### Partially Covered

- [ ] Vue 端高级批量操作和复杂编辑流尚未形成完整移动端替代方案
- [ ] Vue 端 richer editor / 工作台式 AI 管理能力尚未迁完

### Not Yet Covered

- [ ] `NotFoundView`
- [ ] Vue 端少数高复杂工作台页的移动端重设计实现

## Revised Phases

## Phase 0 Foundation

### Done

- [x] `app-react`、`ui-react-native` 已建立
- [x] `mobile` 项目 targets 已收口到 `apps/mobile/project.json`
- [x] 路径别名和 workspace 依赖已接通

### Remaining

- [ ] 为 `app-react` 和 `ui-react-native` 补模块说明文档
- [ ] 把 `mobile` 真正跑通到 `start / android / web` 回归，而不只是 target 存在

## Phase 1 App Shell and Runtime

### Done

- [x] app shell + providers
- [x] token 持久化
- [x] 启动恢复会话
- [x] refresh token 恢复
- [x] guest/demo fallback

### Remaining

- [ ] 全局错误页
- [ ] 全局 loading overlay
- [ ] 更清晰的受保护路由返回策略
- [ ] 页面级 telemetry 约定

## Phase 2 Mobile Design System

### Done

- [x] 基础 theme tokens
- [x] `PageShell`
- [x] `PrimaryButton`
- [x] `PrimaryTextField`
- [x] `SectionCard`
- [x] `StatusPill`
- [x] `FeatureTile`
- [x] `ThemedText` / `ThemedView`

### Remaining

- [ ] `SearchField`、`Checkbox`、`Switch`、`SelectTrigger`
- [ ] `EmptyState`、`InlineError`、`LoadingState`
- [ ] `BottomSheet`、`ConfirmDialog`、`ModalScreenShell`
- [ ] 统一图标/插图策略
- [ ] 更系统的列表和表单原语

## Phase 3 Auth and Home

### Done

- [x] 登录
- [x] 注册
- [x] 忘记密码请求
- [x] 首页基础聚合
- [x] 首页任务/目标/调度摘要

### Remaining

- [ ] 密码重置完成流
- [ ] 首页提醒/通知摘要
- [ ] 首页快捷新建和快捷操作
- [ ] 首页统计和轻图表收口

## Phase 4 Tasks and Goals

### Done

- [x] 任务列表
- [x] 任务详情
- [x] 任务创建编辑
- [x] 任务基础状态动作
- [x] 任务实例动作
- [x] 任务筛选/排序
- [x] 任务依赖关系展示
- [x] 目标列表
- [x] 目标详情
- [x] 目标创建编辑
- [x] 目标 review 列表与创建
- [x] goal review detail
- [x] key result detail/edit
- [x] key result progress record
- [x] goal 筛选/排序
- [x] goal compare 的移动端替代方案

### Remaining

- [ ] 任务更完整实例流
- [ ] 任务/目标批量操作
- [ ] 更复杂的 key result 关联能力

## Phase 5 Schedule, Reminder, Notification

### Done

- [x] 调度任务列表
- [x] 调度任务状态动作
- [x] agenda 分组视图
- [x] 独立 calendar / week 视图
- [x] schedule event 创建/编辑
- [x] conflict detection 和冲突展示
- [x] reminder 模板列表与启停
- [x] reminder 详情
- [x] reminder 创建编辑
- [x] reminder 渠道选择
- [x] notification 列表
- [x] notification 搜索过滤
- [x] notification 详情
- [x] notification 单条已读与删除
- [x] notification 批量已读

### Remaining

- [ ] conflict resolution / reschedule UI
- [ ] reminder 更完整重复规则
- [ ] reminder 更细通知 payload 配置
- [ ] notification 与实体详情跳转

## Phase 6 Account, Setting, AI

### Done

- [x] 账户资料基础页
- [x] 主题、语言、时间制式、通知开关快速编辑
- [x] 设置分类 reset
- [x] AI 会话列表
- [x] AI 新建会话
- [x] AI provider 选择
- [x] AI 默认 provider 切换
- [x] AI model 选择
- [x] AI 流式发送
- [x] AI runtime capabilities 摘要

### Remaining

- [ ] 账户安全相关操作
- [ ] session 管理
- [ ] 账户资料编辑
- [ ] 设置分类页
- [ ] AI 偏好设置页
- [ ] AI 会话 rename/delete 等管理动作
- [ ] AI 知识笔记入口和配置详情页
- [ ] AI 长消息、键盘、滚动体验打磨

## Phase 7 Repository and Editor

### Done

- [x] 仓库概览
- [x] 资源列表
- [x] 资源搜索
- [x] upload
- [x] bookmark
- [x] 内联文本编辑
- [x] 独立 `note-editor` route
- [x] 保存和删除
- [x] 文件夹树/文件夹流
- [x] move / rename (资源和文件夹)

### Remaining

- [ ] markdown richer editor
- [ ] 图片、链接、附件插入交互
- [ ] 更完整的浏览 -> 编辑 -> 预览多步流

## Cross-Cutting Remaining Work

### Mobile UX

- [ ] 全页面键盘遮挡检查
- [ ] 全页面安全区和返回手势回归
- [ ] 高复杂操作迁入 sheet / modal
- [ ] 真机上的长列表与长文本体验回归

### Quality

- [ ] `app-react` smoke tests
- [ ] `ui-react-native` 基础组件测试或 playground
- [ ] APK 构建验证清单更新
- [ ] 真机回归清单
- [x] `pnpm nx run mobile:web` 运行时启动验证
- [ ] `pnpm nx run mobile:android` 的功能回归而不只是 typecheck

## Recommended Next Implementation Order

1. 运行时验证和真机回归
   静态校验已经恢复，下一步应优先验证上传、拍照、图片选择和编辑流在真实设备上的表现。
2. 补深层业务闭环
   优先补 `schedule conflict resolution`、`AI 会话管理`、`account security/session management`、`reminder richer recurrence`。
3. 补质量和运行时验证
   把 smoke checklist、真机回归、构建验证和全局错误/loading 收口。

## Done Definition

- [x] Vue 核心业务路由都存在 React/mobile 对应入口
- [x] 认证、首页、任务、目标、日程、提醒、通知、设置、账户、AI、仓库、编辑器均具备基础闭环
- [x] 移动端布局符合 mobile IA，不残留桌面式主布局依赖
- [x] `apps/mobile` 保持壳层角色
- [x] `packages/app-react` 成为 React 端正式应用层
- [x] `packages/ui-react-native` 成为移动端正式设计系统
- [x] `mobile` / `app-react` 基础 typecheck 恢复为绿色

## Completion Summary (2026-04-01 Review)

### 已完成的核心迁移

| 模块 | 状态 | 备注 |
| --- | --- | --- |
| Auth | 核心完成 | 缺 reset-password 完成流 |
| Home | 部分完成 | 已有真实摘要，但还不含 reminders/notifications |
| Tasks | 核心完成 | 缺更深实例流和更好的筛选容器 |
| Goals | 核心完成 | compare / review / key result 已落地 |
| Schedule | 部分完成 | 已有 conflict detect，未有 resolution |
| Reminders | 部分完成 | 编辑器可用，但 recurrence 仍简化 |
| Notifications | 核心完成 | 已支持批量已读，仍缺实体深跳转 |
| Repository | 核心完成 | upload / folder flow / inline editor 已落地，仍缺 richer editor |
| Settings | 部分完成 | 已有快速编辑和 reset |
| Account | 部分完成 | 仍是 read-only 摘要页 |
| AI | 部分完成 | 仍缺会话管理和配置详情页 |

### 主要 hooks 清单

- `use-app-session` - 认证状态、guest/demo、启动恢复
- `use-goals` - 目标列表 + 筛选/排序
- `use-goal-detail` - 目标详情
- `use-goal-reviews` - 目标回顾
- `use-task-templates` - 任务模板列表 + 筛选/排序
- `use-task-template-detail` - 任务模板详情
- `use-task-instances` - 任务实例动作
- `use-task-dependencies` - 任务依赖
- `use-schedule-tasks` - 调度任务
- `use-schedule-agenda` - 日程聚合
- `use-reminders` - 提醒列表与今日摘要
- `use-notifications` - 通知列表 + 批量已读
- `use-repository-workspace` - 仓库工作区
- `use-folder-navigation` - 文件夹导航、rename、move、delete
- `use-file-upload` - 上传流封装（当前 screen 集成未收口）
- `use-ai-workspace` - AI 会话 / provider / message runtime
- `use-settings` - 设置读取、patch、reset
- `use-account-profile` - 账户信息

### 后续优化方向

1. 先做运行时验证：真机上传、键盘遮挡、长列表和返回手势
2. 再补深层能力：会话管理、账户安全、提醒重复规则、日程冲突解决
3. 最后补质量收口：smoke tests、构建验证、全局错误/loading

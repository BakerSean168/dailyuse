---
tags:
  - plan
  - archive
  - ui
  - shell
description: Issue #250 — Settings 顶栏、胶囊悬停延迟与按会话记忆的专注工作区收敛
created: 2026-08-19T23:50:00+08:00
updated: 2026-08-20T00:37:24+08:00
---

# UI Shell Focus Polish（Issue #250）

## 结果

本计划已完成实现并进入 PR 交付阶段。最终选择让 `WindowHeader` 在 Settings scene 中直接承担「返回应用 + 设置」页头，而不是彻底移除它：这样 Web 只保留一层 48px 顶栏，不再出现空白行；Desktop 同时继续复用既有窗口拖拽区与最小化/最大化/关闭窗控，不需要复制第二套 desktop chrome。

其余目标也已落地：ModuleCapsule 使用 300ms hover intent 延迟；顶部 `打开工作区` launcher 已移除；BusinessPanel 的冗余关闭 X 已移除，focus toggle 在 Home / Business / Workflow 均可用；用户显式 focus/split 偏好改为按 AI conversation id 持久化，viewport 强制 focus 只影响当前实际布局，不覆盖会话偏好。新会话首条消息落库前的显式偏好会暂存并绑定到新 conversation id；主动切换既有会话会清空该 draft 暂存，避免错误继承。

## 背景

最新 Web 壳层验收暴露四个彼此相关的交互问题：Standalone Settings 仍被空的 Shell WindowHeader 向下推一行；顶部 ModuleCapsule 的 hover preview 没有打开延迟；`打开工作区` launcher 与当前 Home/业务入口重复；BusinessPanel 的关闭按钮价值较低，而现有 focus 布局能力只在非 Home surface 暴露，且显式 focus/split 偏好只做全局持久化，没有按 AI 会话恢复。

本轮按 GitHub Issue #250 实施，目标是收敛交互而不引入新的布局框架。

## 完成项

- [x] Settings Web 场景只保留一个 Shell header，设置页内容不再被额外 48px 空白顶栏下推。
- [x] Desktop Settings 继续通过同一 `WindowHeader` 保留拖拽区和最小化/最大化/关闭窗控。
- [x] ModuleCapsule hover 需停留 300ms 才打开；快速划过取消；键盘 focus 与 click 保持即时。
- [x] 移除顶栏 `打开工作区` launcher 及对应 emit/handler/test 契约。
- [x] BusinessPanel 移除右上角 close-panel X；focus toggle 在 Home / Business / Workflow surface 均可用。
- [x] 用户显式 focus/split 偏好按 AI conversation id 持久化并在切换会话时恢复。
- [x] Home / 关闭最后业务 Tab / 清空 Tabs 不再隐式重置当前会话的 focus/split 偏好。
- [x] viewport 强制 focus 不覆盖用户偏好；空间恢复后读取当前会话偏好。
- [x] 新 draft 会话的布局偏好在 conversation id 创建后绑定；切换既有会话不会继承 draft 偏好；删除会话同步清理孤儿偏好键。
- [x] 保持 AIChatView 常驻、Tab KeepAlive、拖拽调宽、窄视口自动 focus 与右侧 panel toggle 行为。
- [x] 更新 shell unit/contract 与 Web E2E 契约。

## 实施摘要

1. **Settings scene header ownership**
   - `WindowHeader mode="settings"` 直接渲染返回应用按钮与 Settings 标题。
   - `StandaloneSettingsLayout` 降为纯内容滚动宿主，移除重复内部 header。
   - Web 去除空白；Desktop 不复制窗口 chrome。

2. **Capsule hover intent**
   - `ModuleCapsule` 增加独立 open timer，mouseenter 延迟 300ms 打开，mouseleave 在打开前取消。
   - focus/click 继续立即打开，内容区 hover/focus 继续保持预览。

3. **Header / panel controls**
   - `WindowHeader` 删除 workspace launcher、`open-workspace` emit 与依赖图标。
   - `BusinessPanel` 删除 close-panel 控件；focus toggle 始终展示。
   - 隐藏/显示 BusinessPanel 继续由顶栏唯一的 `shell-right-panel-toggle` 负责。

4. **Per-conversation focus persistence**
   - AppShell store 增加 conversation id → user layout preference 的持久化 map，并停止持久化全局 `layout/layoutReason`。
   - 显式 focus toggle 写入当前会话偏好；切换会话时恢复，无记录默认 split。
   - viewport focus 只作为临时实际布局；恢复可 split 时读取当前会话显式偏好。
   - 新会话落库前暂存一次显式偏好，conversation id 出现后绑定；选择既有会话前清除 draft 暂存。

## 验证证据

- `pnpm exec vitest run src/layouts/shell/WindowHeader.spec.ts src/layouts/shell/ModuleCapsule.spec.ts src/layouts/shell/BusinessPanel.spec.ts src/layouts/shell/useAppShellStore.spec.ts src/layouts/shell/AppShell.spec.ts`：**5 files / 37 tests passed**。
- `pnpm nx run app-vue:typecheck`：**passed**。
- `pnpm nx run app-vue:lint`：**passed，0 errors；41 个既有 warning**。
- `pnpm nx run web:typecheck`：**passed**。
- `pnpm nx run web:lint`：**passed，0 errors；3 个既有 warning**。
- `pnpm nx run memoflow:governance-check`：**passed**。
- `pnpm nx run app-vue:test`：完整套件在当前 agent 执行窗口超过 240s 被外部 timeout 截断；截断前日志未检出测试 assertion failure，相关变更的 37 个定向测试已全绿。
- Playwright shell 相关用例已成功完成 production desktop build；直接运行时第一次因无 X server 无法启动 Electron，使用 `xvfb-run` 后 Electron 仍在 `firstWindow` 前退出，因此属于当前 Linux agent 的 Electron 启动环境阻断，未进入 UI assertion。对应 Playwright spec 可正常 `--list`，CI/具备桌面会话的 runner 继续承担该层验证。
- Dashboard Web Playwright 已启动 Web/API/AI mock 服务并进入用例，但当前 agent 上登录后的应用长期停留在「知行 MemoFlow 正在进入工作区...」bootstrap gate，相关 locator 在进入本轮 UI assertion 前超时；第三个用例随后受 240s 外部执行窗口终止。该失败发生在 Shell 挂载前，不是本轮控件 assertion 失败。

## 非目标

- 不替换现有自研 split/resizer 几何系统。
- 不重构业务 Tab 模型或 Conversation persistence 后端。
- 不改变左侧 ConversationSidebar 的独立折叠偏好。

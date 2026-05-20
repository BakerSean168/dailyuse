---
tags:
  - plan
  - active
description: Web 与 Mobile 登录页 QQ 风格统一改造方案
created: 2026-05-17T00:00:00
updated: 2026-05-17T00:00:00
---

# Web 与 Mobile 登录页 QQ 风格统一改造方案

## 摘要

在 desktop 登录页已经完成 QQ 风格重构的前提下，将同一套“轻品牌 + 中央头像/主任务 + 底部轻量入口”的认证体验扩展到其他端，覆盖：

- Web 独立认证页：`apps/web/src/auth/WebAuthView.vue`
- 共享 Vue 认证页：`packages/app-vue/src/views/AuthView.vue`
- Mobile React Native 认证页：`packages/app-react/src/screens/auth-screen.tsx`

本轮目标是统一视觉骨架、场景切换方式和信息层级，而不是把 desktop 专属能力强行平移到其他端。`remembered accounts`、自动登录主窗、独立注册窗口、本地已登录冲突弹窗等能力保持 desktop-only；web/mobile 只对齐交互结构和视觉语言。

成功标准：

- Web 与 Mobile 登录页不再使用高密度 Tab 卡片式布局，改为 QQ 风格单主任务界面。
- 登录与注册改成显式场景切换，不再以“登录/注册平级双 Tab”为主视觉。
- 账号密码登录为主场景，品牌区弱化，中央内容区统一为头像/标题/表单/主按钮/底部次入口。
- Web 保留现有主题/语言能力，但不再占据主视觉。
- Mobile 保留现有访客模式和忘记密码能力，但融入新的场景结构，不再作为第三个并列顶部 Tab。
- 现有登录/注册 API 不变，现有 web e2e 依赖的核心 `data-testid` 保持稳定。

## 关键改动

### 1. 统一交互模型

- Web 和共享 Vue 认证页从 `Tabs(login/register)` 改为显式场景状态机：
  - `password-login`
  - `register`
  - `forgot-password` 仅在有现成能力的端启用
- Mobile `AuthScreen` 从 `sign-in/register/forgot-password` 顶部模式切换改成同样的场景状态机，但保留忘记密码作为可达场景。
- 默认入口统一为账号密码登录场景；注册和找回密码退到次级入口，不再与登录争夺同级主视觉。
- 底部辅助入口统一采用单行轻量文字链接：
  - 登录页：`注册账号`、`忘记密码`、`访客模式（若该端支持）`
  - 注册页：`返回登录`
  - 找回页：`返回登录`

### 2. Web 端改造

- `apps/web/src/auth/WebAuthView.vue` 作为 web `/auth` 专用壳层，保留语言/主题切换、独立 bootstrap 和本地存储写入逻辑，但整体布局改成与 desktop 同风格的窄列垂直骨架。
- 顶部右上角语言/主题切换保留，但体量明显减弱，不再压住主体。
- 中央主体统一为：
  - 弱品牌徽标
  - 头像/图标视觉中心
  - 当前场景标题与弱说明
  - 登录、注册或找回密码表单
  - 主按钮
  - 底部辅助入口
- Web 当前假链接式“忘记密码”不再保留为无行为锚点：
  - 本轮默认不接新后端能力。
  - 若继续沿用当前 scope，则改为明确的占位文案或弱提示，不再保留可点击但无语义的 `href="#"`。
- 保持现有 `login-submit-button`、`register-submit-button`、核心输入框 `data-testid`，避免现有 e2e 大面积失效。

### 3. 共享 Vue 认证页改造

- `packages/app-vue/src/views/AuthView.vue` 与 web 认证页同步改成 QQ 风格布局，避免非 desktop 的 Vue 宿主仍停留在旧式 Tab 认证页。
- 共享 Vue 页继续使用 `useAuth()`，不新增 desktop-only 分支。
- `enterGuestMode()` 仅在支持的宿主显示：
  - desktop 继续用独立 `DesktopAuthView`
  - 非 desktop Vue 宿主若没有 guest 能力，则隐藏该入口而不是展示不可用按钮
- Router 层默认增加显式注册场景支持，建议 `/auth/register` 与 `/auth` 并存；如果当前宿主仍只挂 `/auth`，则先用本地场景状态切换，避免强制所有宿主同时改路由。

### 4. Mobile React Native 改造

- `packages/app-react/src/screens/auth-screen.tsx` 改成与 desktop/web 同一骨架的“中心主任务”认证页：
  - 上方轻品牌和应用名
  - 中央卡片或面板
  - 显式场景切换
  - 底部轻量入口
- 当前 `ModeButton` 三段式切换条移除，改为：
  - 登录场景主显
  - 注册与找回密码通过底部文字入口切换
- Mobile 保留现有真实能力：
  - `loginByEmail`
  - `registerByEmail`
  - `forgotPassword`
  - `enterGuestMode`
- `AuthScreen` 的 `notice`、`lastError`、`sessionKind === 'authenticating'` 逻辑保留，但重新挂接到新布局，不再使用旧式“面板内顶部模式条”。
- `AppShell` 与 `AppSessionProvider` 不变；本轮不改移动端会话状态机，只改认证屏渲染和交互组织。

### 5. 视觉与文案约束

- 统一保留 desktop 已建立的深色渐变、窄列中轴和弱品牌方向，不回退到默认卡片/表单站点风格。
- Web 与 Mobile 的视觉目标是“同一家产品，不同宿主”：
  - Web 可以更精细，保留背景纹理、hover、模糊层
  - Mobile 保持更克制的阴影、间距和触控尺寸
- 不直接复刻 desktop 的窗口按钮、账号记忆下拉、主进程冲突弹窗等仅桌面存在的构件。
- 默认头像/图标视觉中心要保留，让 web/mobile 不再像普通后台系统登录表单。

## 公共接口与类型

- 本轮默认不改认证后端协议，不新增 web/mobile 专属登录 API。
- 共享 Vue 与 web 的认证页面若引入显式场景路由，路由建议如下：
  - `/auth`
  - `/auth/register`
  - `/auth/forgot-password` 仅在该宿主已有真实能力时启用
- `useWebAuth()` 如不接找回密码能力，则保持现状；若实现 web 端找回密码场景，则需要补暴露 `forgotPassword()`。
- `packages/app-react/src/providers/app-session-provider.tsx`、`useAuth()` 和 `AuthClientService` 默认不需要为了这轮 UI 改造新增新接口。

## 测试与验收

- Web：
  - `/auth` 默认进入登录场景。
  - 登录、注册提交仍走现有 API 和跳转流程。
  - 语言、主题切换仍生效。
  - 现有关键 `data-testid` 保持可用，至少覆盖登录和注册主路径。
  - 错误 banner、loading 态和 legal notice 仍正常显示。
- 共享 Vue：
  - `AuthView` 登录、注册、访客模式回归通过。
  - 非 desktop 宿主不会渲染 desktop-only 行为。
  - 若实现了场景路由，路由切换与刷新落点正确。
- Mobile：
  - `AuthScreen` 登录、注册、忘记密码、访客模式四条现有能力都能从新布局进入。
  - `sessionKind === 'authenticating'` 时按钮禁用和 loading 文案正确。
  - 登录成功后仍通过 `AppShell` 进入应用 tabs。
  - 错误态和 notice 在三类场景下显示正确。
- 回归：
  - desktop 登录页不受本轮影响。
  - web `/auth` 的独立轻量 bootstrap 不被主应用 bundle 行为破坏。
  - mobile 本地会话持久化和 sign-out 流程不变。

## 假设与默认决策

- 本轮“和桌面端一样”指的是视觉与交互结构对齐，不包括 remembered-account、自动登录主窗、独立注册窗口等 desktop-only 能力。
- Web 不默认新增 remembered account、本地密码保存或快速登录能力。
- Mobile 继续保留忘记密码与访客模式，因为这两项已存在真实能力；web 若无现成找回密码交互，本轮不强行补完后端流程。
- Vue 与 React Native 两套 UI 不做跨框架组件抽象，本轮只统一体验目标和布局语言。
- 文档落地后，实施顺序建议为：`WebAuthView` → `AuthView` → `AuthScreen`，先完成 web 视觉对齐，再收共享 Vue，最后处理 mobile 触控布局细节。

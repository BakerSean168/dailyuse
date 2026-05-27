---
tags:
  - plan
  - active
description: 桌面端 QQ 风格登录窗口与交互重构方案
created: 2026-05-17T00:00:00
updated: 2026-05-17T00:00:00
---

# Desktop QQ 风格登录改造方案

## 摘要

围绕桌面端认证入口做一次 QQ 风格重构，但本轮只沿用现有 `邮箱 + 密码` 认证链路，不扩展手机号、验证码、扫码登录能力。核心变化是把当前单窗口三 Tab 登录页改成“登录主窗 + 独立注册窗 + 快速登录态 + 已登录冲突弹窗”的桌面交互模型，并把启动阶段的自动登录改为“先进入快速登录窗口，再自动尝试登录”。

成功标准：

- 冷启动存在自动登录账号时，先展示快速登录窗，并自动发起登录。
- 注册从主登录窗移出，改为底部按钮打开独立注册窗口。
- 快速登录以“单账号主展示 + 账号切换弹层”替代当前列表式卡片。
- 若目标账号已在本地主窗口登录中，阻止重复登录并弹出“打开 xx / 返回”对话框。
- 右上角菜单保留 `网络设置 / 忘记密码 / 问题反馈`，本轮作为占位入口。

## 关键改动

### 1. 窗口与启动流程

- `WindowManager` 从双窗口模型扩展为三窗口模型：`loginWindow`、`registerWindow`、`mainWindow`。
- 新增 `createRegisterWindow()`、`focusMainWindow()`、`openOrFocusRegisterWindow()`、`closeRegisterWindow()`，注册窗尺寸比登录窗更高，复用 auth renderer 壳。
- `app-lifecycle` 不再在冷启动时直接创建主窗口；改为：
  - 检查 remembered accounts 是否存在 `autoLogin=true` 账号。
  - 无自动登录账号：创建登录窗，默认进入密码登录或快速登录态。
  - 有自动登录账号：仍创建登录窗，但以“快速登录自动尝试”模式启动。
- 自动登录实际执行从 `app-lifecycle` 挪到 auth 交互层，由 renderer 进入快速登录态后触发，失败则停留在登录窗并展示错误。
- 若主窗口已存在且用户从其他 auth 窗口尝试登录同一账号，优先激活现有主窗口，不创建新会话。

### 2. Renderer 交互重构

- `DesktopAuthView` 从 `Tabs(login/register/quick-login)` 改为显式场景状态机：
  - `password-login`
  - `quick-login`
  - `quick-login-auto-pending`
  - `local-session-conflict`
- 登录主窗布局改成 QQ 风格：
  - 顶部品牌区 + 头像区。
  - 中部根据场景切换为密码登录表单或快速登录卡片。
  - 底部显示两个次级入口：`访客模式`、`注册账号`。
  - 右上角菜单显示占位项，点击后 toast 提示“暂未开放”。
- 快速登录态只突出一个当前账号：
  - 展示头像、昵称/邮箱、自动登录勾选状态。
  - 点击昵称或下拉按钮打开 remembered accounts 切换层。
  - 切换层底部提供 `添加账号`，点击后回到 `password-login` 场景并清空密码。
  - 底部显示两个次级入口：`账密登录`、`注册账号`。
- 自动登录态进入后：
  - 主按钮变为 loading 态。
  - 禁用账号切换和输入操作。
  - 失败后停留在快速登录页，并允许切换账号或回退到账号密码登录。
- 独立注册窗复用 auth 壳，但固定进入注册场景，不显示快速登录切换；表单保持 `邮箱 / 密码 / 确认密码`。
- 已登录冲突弹窗在 renderer 内显示模态层，文案包含账号展示名；按钮为 `打开 xx` 与 `返回`。

### 3. 认证与 IPC 接口

需要新增或调整的公开接口：

- `IAuthApiClient`、`AuthClientService`、`AuthIpcAdapter` 新增桌面专用 `autoLoginDesktop()`，返回现有 `AutoLoginResult`。
- `WindowChannels` 新增：
  - `OPEN_AUTH_REGISTER`
  - `CLOSE_AUTH_REGISTER`
  - `FOCUS_MAIN_WINDOW`
- 认证失败增加结构化本地冲突错误：
  - `code: 'AUTH_ALREADY_ACTIVE_LOCALLY'`
  - `error.context = { identityId, displayName }`
- `AuthDesktopApplicationService.autoLogin()` 改为支持惰性初始化，确保从登录窗触发时不依赖冷启动前已完成主进程会话恢复。
- 登录前增加本地会话冲突检查：
  - 若当前存在 `mainWindow` 且其会话 identity 与本次目标账号一致，则返回冲突错误而非继续发起登录。
- 注册窗通过路由区分场景，建议使用 `#/auth/register`；登录主窗继续使用 `#/auth`，避免新增第二套 renderer 入口。

### 4. 文案与视觉约束

- 保留当前深色渐变视觉方向，但去掉“三 Tab 表单”信息密度，改成单主任务界面。
- 登录主窗只承载高频操作：登录、快速登录、访客模式、打开注册窗。
- 注册作为低频流程独立承载，不在主窗占据主视觉位置。
- 菜单占位项本轮不接业务能力，不落真实设置页或反馈流程。
- 访客模式保留在主界面显式展示，与注册按钮并列，不藏入菜单。

## 测试与验收

- 组件/renderer：
  - 无 remembered account 时默认进入密码登录。
  - 有 remembered accounts 时进入快速登录，默认选中最近使用账号。
  - 有 `autoLogin=true` 账号时进入 `quick-login-auto-pending` 并自动触发 `autoLoginDesktop()`。
  - 自动登录失败后恢复可交互状态，不会卡死在 loading。
  - `添加账号` 可从快速登录切回密码登录并清空选中密码。
  - 点击 `注册账号` 会触发打开独立注册窗。
  - 本地冲突错误会弹出“打开 xx / 返回”模态。
- main / window manager：
  - `OPEN_AUTH_REGISTER` 在无注册窗时创建，有注册窗时仅聚焦。
  - `FOCUS_MAIN_WINDOW` 能聚焦现有主窗口。
  - 冷启动有自动登录账号时不直接进入主窗口，而是先起登录窗。
  - 自动登录成功后仍通过现有 `TRANSITION_TO_MAIN` 进入主窗口。
- 集成场景：
  - 冷启动自动登录成功。
  - 冷启动自动登录失败并手动切换到其他账号登录。
  - 从快速登录切到“添加账号”再用新账号登录。
  - 打开注册窗并完成邮箱注册后进入主窗口。
  - 主窗口已存在时，从 auth 窗口重复登录同账号会被拦截并可直接回到主窗口。

## 假设与默认决策

- 本轮仅做 desktop 端，不改 web/mobile 认证 UI。
- 本轮不接手机号、验证码、扫码登录、网络设置、找回密码、问题反馈的真实功能。
- 注册窗继续使用邮箱注册字段，不改成 QQ 原型中的手机号注册。
- 快速登录的账号来源继续使用现有 `RememberedAccountsService`。
- “打开 xx” 的语义固定为“聚焦已存在的主窗口”，不做覆盖会话或强制换号。
- 方案文档使用中文编写，文件名按 active plan 目录规范落地。

---
tags:
  - plan
  - archive
  - desktop
  - authentication
description: 将 Desktop 本地 Profile Access、云端连接和可选 PIN 拆为独立产品边界
created: 2026-08-03T21:00:00+08:00
updated: 2026-08-03T23:15:00+08:00
---

# Desktop Cloud Connection Boundary Refactor

## 实施结果

已完成。Desktop 已拆分为本地 Profile Access、主窗口 Cloud Connection Dialog 和默认
关闭的可选 PIN；邮箱、密码、注册、找回与 GitHub 认证 UI 只属于 Web Identity
Portal。guest adoption 保持 profileId、Vault 和本地数据不变，云端退出只停止同步，不锁定
本地 Profile。

最终验证：Desktop Electron 旅程 2/2、contracts 478/478、Desktop main 定向测试
16/16、affected lint/typecheck/test、governance check 和 local Docker rebuild 全部通过；
API、Web、AI Service、PowerSync、Postgres 与 Redis 均 healthy。

## 1. 决策

Desktop 不再承载云端账号的邮箱、密码、注册、找回或改密表单。系统浏览器复用现有
MemoFlow Web Identity Portal，Desktop 只发起 Device Authorization、展示连接状态，并在
批准后把当前已解锁 Profile 连接到云端。

本地边界保持正交：

- **Profile Access**：创建、选择、打开、关闭和 PIN 解锁本地 Profile；
- **Cloud Connection**：从已打开的 Profile 发起，失败不改变本地解锁状态；
- **Local Profile Protection**：PIN 默认关闭，只能由用户在账户与隐私中主动开启；
- **Web Identity Portal**：GitHub、邮箱登录、注册、验证、找回和改密的唯一 UI。

## 2. 目标体验

1. 首次启动创建持久访客 Profile 并直接进入主界面。
2. 单 Profile 且无 PIN 时自动打开；启用 PIN 或多 Profile 时才显示 Profile Access。
3. 左下角未连接状态显示“连接 MemoFlow 账号”，在主窗口打开紧凑 Dialog。
4. Dialog 点击“在浏览器中继续”后打开 `/auth/device?user_code=...`，Desktop 原地等待。
5. 关闭 Dialog 不取消 attempt；重新打开可继续查看。取消、Profile 切换/关闭、应用退出才终止。
6. 连接成功只刷新账户与同步状态，不切路由、不改变 BrowserWindow 尺寸。
7. PIN 设置从 Profile Access 页面移到“账户与隐私”，以默认关闭的开关呈现。

## 3. 结构修改

- `CloudAuthDesktopClientPort` 不再继承 Web credential port；只暴露 session、disconnect 和
  provider-neutral cloud connection API。
- `beginGithubSignIn` / `GITHUB_DEVICE_*` 重命名为 `beginCloudConnection` /
  `CLOUD_CONNECTION_*`；Web 的 GitHub provider API 保持 provider-specific。
- main process coordinator 增加当前 active Profile attempt 查询，支持 Dialog 重挂载恢复。
- 新增 `CloudConnectionDialog.vue` 和壳层状态；侧栏不再导航到 Desktop `/auth`。
- `DesktopAuthView.vue` 收敛为 Profile Access，不注入云端认证、不渲染 credential/PIN 设置。
- `AccountProfileSection.vue` 增加 Local Profile Protection 设置。
- Desktop 独立 auth shell 只承载 Profile Access；窗口内部名称可随后收敛为 profile access。

## 4. 视觉约束

- 复用主应用现有 background/card/border/primary token，不创建 auth-only 主题。
- Dialog 最大宽度约 460px；主操作唯一，状态操作使用图标按钮和 tooltip。
- 本地 Profile 与云端之间使用一条有语义的连接状态线作为唯一标志性元素。
- 普通文本沿用 UI sans；设备码使用 monospace；不使用渐变、装饰性卡片堆叠或营销文案。
- Profile Access 使用居中的紧凑列表，只有真实需要解锁时出现。

## 5. 实施批次

1. Contracts：拆分 Web/Desktop port，重命名 attempt/channel，增加 current attempt 查询。
2. Main：provider-neutral coordinator 和 IPC，删除 Desktop credential handlers。
3. Renderer：应用级 Cloud Connection state + AppShell Dialog + 侧栏入口。
4. Profile Access：删除云端与 PIN 设置，调整独立壳层和语义。
5. PIN：账户与隐私中的开关、设置/确认/移除流程，默认关闭。
6. Cleanup：删除 Desktop credential composable 依赖、旧文案、旧 route/window 行为与测试。
7. Verification：contracts/cloud-auth/app-vue/desktop tests、Desktop E2E、截图检查、标准
   prod-like validation 和 governance check。

## 6. 完成定义

- Desktop 产品代码没有邮箱、密码、注册、找回或改密表单及对应 IPC。
- Cloud Connection 在主窗口内完成状态交互，所有真实认证发生在系统浏览器。
- Web 登录/注册/邮箱验证保留可信 `returnTo` 和 `user_code`，批准仍需显式点击。
- Dialog 重挂载可恢复当前 attempt，成功后主界面不跳转、不重建窗口。
- Profile Access 页面只含 Profile 选择、删除和必要的 PIN 解锁。
- PIN 默认关闭；设置页开启后重启需要 PIN，移除后恢复自动设备解锁。
- guest adoption、registered reauth、拒绝、过期、取消、断网和离线重开测试通过。
- Renderer、URL、日志和 registry 不出现 device code 或 bearer token。

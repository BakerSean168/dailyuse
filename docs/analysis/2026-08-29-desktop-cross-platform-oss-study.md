---
tags:
  - analysis
  - desktop
  - electron
  - cross-platform
  - linux
  - macos
  - windows
  - wslg
  - oss-study
description: MemoFlow Desktop 全平台化的现状审计、Electron 开源项目对照与 WSLg 定位结论
created: 2026-08-29T19:38:00+08:00
updated: 2026-08-29T19:38:00+08:00
---

# MemoFlow Desktop Cross-Platform — OSS Study and Current-State Audit

## 0. Executive conclusion

MemoFlow 不需要为 WSL 单独发明一套“WSL 版 Desktop Runtime”。当前仓库已经具备相当好的跨平台基础：共享业务 UI、Electron main/renderer 边界、Linux 打包目标、Windows/Linux release lane、Node/Electron 为主的 Local Vault 与 Git runtime，以及 ADR-059 已确立的平台 Capability Port 原则。

本轮调研后的推荐方向是：

1. 把 MemoFlow Desktop 正式定义为 **Windows / Linux / macOS 三平台产品**；
2. 把 WSLg 定义为 **Linux Desktop 的 host environment overlay**，而不是第四个 OS；
3. 业务层只依赖 capability，不依赖 `process.platform`、Win32、DBus、Wayland 或 WSL；
4. 优先复用 Electron 已提供的跨平台能力，只有真实行为差异才下沉到 OS adapter；
5. Thought Forest / Local Vault / Git / file watcher 在 WSLg 下全部走 Linux native path，不经过 Windows UNC bridge；
6. 只有 Windows-host-scoped 能力，例如 host idle、host foreground app、Windows login autostart，才允许通过一个很薄的 WSL host integration adapter 回到 Windows；
7. “支持某个平台”必须由 build + runtime E2E + native capability evidence 共同证明，不能仅以 electron-builder 能产出安装包作为完成标准。

这不是一次推倒式重构，而是把当前仓库已经存在的 Ports & Adapters 和 Electron runtime 边界正式收口、制度化，并补齐 Linux/macOS/WSLg 的验证与平台差异。

## 1. Scope

本分析只回答 Desktop 平台化问题：

- Windows / Linux / macOS 的共享与差异边界；
- Linux X11 / Wayland 的运行差异；
- WSLg 在整体平台模型中的位置；
- Tray、Notification、Global Shortcut、Auto Launch、Secure Storage、Update、External Editor、Idle/Activity/Foreground App 等 desktop-native capability；
- Local Vault、Thought Forest、Git 与文件监听在多平台下的运行方式；
- CI / release / compatibility matrix 应如何证明平台支持。

本分析不重新设计 Goal、Task、Routine、Schedule、Notification、AI 或 Repository 领域语义，也不改变 Web 的业务边界。

## 2. MemoFlow current-state evidence

### 2.1 设计目标从一开始就是跨平台 Electron

[ADR-004](../architecture/adr/ADR-004-electron-desktop-architecture.md) 已明确把 Electron Desktop 目标定义为 Windows、macOS、Linux，并采用共享 Domain/Application + Ports & Adapters 的策略。

这意味着新的平台化工作应被视为对既有方向的落实和收口，而不是另起炉灶。

### 2.2 Linux 不是“只有配置，没有真实产物”

当前：

- `apps/desktop/project.json` 已有 Linux `AppImage / deb / rpm` 构建目标；
- `apps/desktop/electron-builder.json5` 已有 Linux 配置；
- `.github/workflows/release-assets.yml` 使用 Windows runner 构建 Windows 资产、Ubuntu runner 构建 Linux 资产；
- `docs/plan/archive/2026-08-23-release-lifecycle-v2.md` 记录了真实 Linux AppImage 构建、runtime dependency closure 验证，以及 `v0.10.0` 同时发布 Windows/Linux Desktop assets 的事实。

因此当前问题不是“MemoFlow 有没有 Linux 版本”，而是：

> Linux build/release 已存在，但 native desktop capability parity、Wayland/WSLg 验证、macOS release lane 与统一 platform boundary 还没有形成一套正式的支持契约。

### 2.3 OS 判断泄漏范围目前较小

当前 `apps/desktop/src/main` 下显式 `process.platform` 判断主要集中在：

- `utils/app-icon.ts`；
- `lifecycle/app-lifecycle.ts`；
- `user-data-path.ts`；
- `modules/autolaunch/auto-launch-manager.ts`；
- `modules/repository/desktop-knowledge-repository-git.runtime.ts`。

这说明 Vue 业务层、Domain 和大多数 Application service 尚未被 OS 分支污染。

**结论：** 应做渐进式平台边界收口，不需要在业务层进行大规模搬迁。

### 2.4 Local Vault 本质上已经是跨平台 native filesystem runtime

`packages/repository/src/electron/local-vault-runtime.ts` 的主要依赖是：

- `node:fs`；
- `node:path`；
- Electron `dialog` / `shell`；
- `gray-matter`。

它没有依赖 Win32 文件 API。因此：

```text
Windows Desktop -> C:\Notes -> Node fs
Linux Desktop   -> /home/user/notes -> Node fs
WSLg Desktop    -> /home/user/thought-forest -> Node fs
```

应该继续复用同一 `LocalVaultRuntime`。

如果 MemoFlow 自身运行在 WSL Linux 中，把 WSL Vault 再抽成 `WslVaultAdapter` 反而是错误抽象，因为此时它只是普通 Linux filesystem。

### 2.5 Git runtime 也已经接近跨平台

当前 Desktop Git runtime 直接 `spawn('git', ...)`，显式平台差异主要是：

```text
Windows -> GIT_CONFIG_GLOBAL=NUL
Other   -> os.devNull
```

因此 WSLg 下最自然的运行方式是 Linux MemoFlow 调 Linux `git`，工作目录直接位于 Linux ext4，而不是 Windows `git.exe` 对 `\\wsl.localhost\...` 做 metadata-heavy 操作。

### 2.6 Routine capability port 已经提供了正确先例

[ADR-059](../architecture/adr/ADR-059-routine-coach-domain-runtime-and-surfaces.md) 已经规定：

```text
ActivitySensorPort
IdleSensorPort
DndSensorPort
ActiveApplicationPort
```

Domain 只消费标准化 capability，不依赖 Win32 / DBus / Wayland / macOS API。

这是整个 Desktop 平台层应复用的原则。

### 2.7 `WindowsIdleSensorAdapter` 暴露出一个命名/抽象收口机会

当前 `apps/desktop/src/main/modules/routine/windows-idle-sensor.adapter.ts` 实际调用 Electron `powerMonitor.getSystemIdleTime()`，没有直接使用 Win32 API。

因此更精确的抽象是：

```text
ElectronIdleSensorAdapter
```

在 Windows / native Linux / macOS 共用；只有当 WSLg 产品语义要求观察 **Windows host 的 idle** 而不是 Linux guest 的 idle 时，才引入：

```text
WslHostIdleSensorAdapter
```

这体现了本方案最重要的原则：

> 按 capability 的真实行为差异拆 adapter，而不是按 OS 名字机械复制实现。

## 3. Representative WSLg validation environment

当前开发者本机已具备一条很适合做首个 vertical slice 的环境：

```text
Ubuntu 24.04 on WSL2
systemd = running
WSLg Wayland/X11 integration = available
Thought Forest = ~/projects/thought-forest
Linux Git = available
Linux Obsidian = available
x-scheme-handler/obsidian = registered
```

这组条件使以下主链可以直接在 Linux native filesystem 上验证：

```text
MemoFlow Linux under WSLg
  -> Notes
  -> ~/projects/thought-forest
  -> scan/search/preview
  -> AI confirmed write
  -> file watcher
  -> Linux Git
  -> GitHub
  -> obsidian://
  -> Linux Obsidian under WSLg
```

注意：这只是可复现的开发/验收环境，不应把某个用户名或绝对路径写进产品 contract。

## 4. OSS reference study

### 4.1 VS Code — 分层 + runtime environment + service injection

参考：

- <https://github.com/microsoft/vscode/blob/main/.github/instructions/source-code-organization.instructions.md>
- <https://github.com/microsoft/vscode/wiki/Source-Code-Organization>

VS Code 的核心做法不是在业务代码中到处判断 OS，而是同时建立两条边界：

```text
Layer:
base -> platform -> editor -> workbench -> code/server

Runtime target:
common
browser
node
electron-browser / electron-sandbox
electron-utility
electron-main
```

平台 service 通过 dependency injection 提供给消费者。

**MemoFlow 借鉴：**

- 把 platform capability 放在 Desktop main runtime 边缘；
- 业务 module 不 import OS/Electron implementation；
- 明确 runtime availability，而不是靠约定猜测；
- composition root 选择 adapter。

**MemoFlow 不照搬：**

- 不复制 VS Code 的大型 DI framework；
- 不为了形式建立 `common/browser/node/electron-main` 的全仓目录镜像；
- 只在 Desktop native capability 这条边界采用“小 Port + composition root”。

### 4.2 Bitwarden — 真实 OS 差异才拆平台实现

参考：

- <https://github.com/bitwarden/clients/blob/main/apps/desktop/src/main/native-messaging.main.ts>

Bitwarden Desktop 在 browser native messaging 这种真正有 OS 差异的能力上，显式处理：

- Windows Registry；
- macOS NativeMessagingHosts 路径；
- Linux/Flatpak 路径与 sandbox 差异。

**MemoFlow 借鉴：**

- OS-specific code 允许存在，但必须被限制在真正需要它的 infrastructure edge；
- capability consumer 不应该知道注册表、`.desktop`、DBus 等细节；
- Linux sandbox/packaging 可能改变路径与权限，不能把“linux”当成单一运行环境。

### 4.3 GitHub Desktop — 平台差异压在 main-process shell 边缘

参考：

- <https://github.com/desktop/desktop/blob/development/app/src/main-process/main.ts>

GitHub Desktop 将 Windows updater/CLI、macOS lifecycle、shell integration 等差异保留在 Electron main-process 边缘，而不是让 renderer/domain 持有这些差异。

**MemoFlow 借鉴：**

- updater、protocol、shell、installer lifecycle 属于 host/runtime edge；
- renderer 通过稳定 IPC/application contract 使用能力。

**MemoFlow 不照搬：**

- GitHub Desktop 当前产品范围主要是 Windows/macOS，不适合作为 Linux parity 策略模板；
- MemoFlow 必须把 Linux/Wayland/WSLg 当正式产品环境验证。

### 4.4 Joplin — Electron 多平台真实运行，以及 Linux/Wayland 不能只靠打包证明

参考：

- <https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/bridge.ts>
- <https://github.com/laurent22/joplin/issues/15581>
- <https://github.com/laurent22/joplin/issues/13561>
- <https://github.com/laurent22/joplin/issues/4362>

Joplin Desktop 使用 Electron bridge 集中 desktop native API，同时真实支持 Linux 分发；其 issue 也持续证明 Linux 的 Wayland、Tray/AppIndicator、window state、package format 会产生环境级差异。

**MemoFlow 借鉴：**

- Linux 必须做 X11/Wayland compatibility validation；
- AppImage 能启动不代表 Tray、菜单、窗口恢复、shortcut 都正确；
- package format 与 desktop integration 是 capability matrix 的一部分。

### 4.5 Electron — 优先复用 framework native abstractions

参考：

- Global Shortcut: <https://www.electronjs.org/docs/latest/api/global-shortcut/>
- Tray: <https://www.electronjs.org/docs/latest/api/tray>
- Safe Storage: <https://www.electronjs.org/docs/latest/api/safe-storage>

Electron 已经替应用处理许多跨平台差异：

- `globalShortcut`：X11 可直接 grab，Wayland 通过 `org.freedesktop.portal.GlobalShortcuts`；
- `Tray`：Linux 默认 StatusNotifierItem，不可用时回退 GtkStatusIcon；
- `safeStorage`：Linux 可使用 Portal Secret / Secret Service，并在不可用环境退化。

**MemoFlow 借鉴：**

```text
Electron API works and semantics are sufficient
  -> reuse
Else if OS behavior differs
  -> OS adapter
Else if WSL host semantics differ
  -> WSL host integration
```

不要一开始自己实现三套 native binding。

### 4.6 WSLg — Linux GUI runtime integrated into Windows, but not a full Linux desktop

参考：

- <https://learn.microsoft.com/windows/wsl/tutorials/gui-apps>

微软明确支持 WSL2 Linux GUI app：

- Windows Start Menu；
- Windows Taskbar；
- Alt-Tab；
- Windows/Linux clipboard integration；
- X11 与 Wayland GUI。

同时明确说明 WSL GUI support **不提供完整 Linux Desktop Environment**。

因此 MemoFlow 应把 WSLg 建模为：

```text
os = linux
host = wsl
windowSystem = wayland | x11
```

而不是：

```text
platform = wsl
```

## 5. Build / Borrow / Imitate decision ledger

| Capability / concern | Decision | Reference | Reason |
| --- | --- | --- | --- |
| Platform layering | **Imitate** | VS Code | 学分层与 target environment，不复制大型 DI |
| OS-specific native edge | **Imitate** | Bitwarden | 真实差异才独立实现 |
| Main-process shell boundary | **Imitate** | GitHub Desktop | 把 shell/updater/protocol 留在 main edge |
| Linux desktop compatibility | **Imitate evidence discipline** | Joplin | 用真实环境证明，不以 build success 替代 runtime parity |
| Tray | **Borrow Electron** | Electron `Tray` | Electron 已处理主要 OS 差异 |
| Global shortcut | **Borrow Electron first** | Electron `globalShortcut` | Wayland portal 已有官方路径 |
| Notification | **Borrow Electron first** | Electron `Notification` | 先验证，再补 OS fallback |
| Secure storage | **Borrow Electron + harden** | Electron `safeStorage` | Linux/WSLg secret backend 需要 capability probe |
| Local Vault / Thought Forest | **Keep current shared runtime** | MemoFlow | Node fs 已是正确 native abstraction |
| Git | **Keep process Git** | MemoFlow | 避免 native addon ABI 与跨平台复杂度 |
| WSL filesystem bridge | **Reject as primary path** | — | App 在 WSL 内运行时属于错误抽象 |
| WSL host integration | **Build only when proven necessary** | — | 仅用于 Windows-host-scoped capability |

## 6. Target capability inventory

### 6.1 Shared/native-by-default

这些能力默认不需要 OS-specific adapter：

- Local Vault filesystem；
- Thought Forest；
- Markdown parsing；
- Git process runtime；
- file watcher；
- SQLite / local DB；
- IPC contracts；
- shared app-vue UI；
- HTTP/cloud APIs；
- AI application/domain contracts。

### 6.2 Desktop capability ports

建议平台层覆盖：

- `SecureStoragePort`；
- `NotificationPort`；
- `TrayPort`；
- `GlobalShortcutPort`；
- `AutoLaunchPort`；
- `UpdatePort`；
- `ExternalEditorPort`；
- `WindowIntegrationPort`；
- 既有 `IdleSensorPort`；
- 既有/规划中的 `ActivitySensorPort`；
- `ActiveApplicationPort`；
- `DndSensorPort`。

### 6.3 WSL host-scoped candidates

只有在真实 WSLg probe 证明 Linux guest 语义不足时，才允许引入：

- Windows login auto launch；
- Windows host idle；
- Windows foreground app；
- Windows DND；
- Windows-native toast；
- host-wide shortcut fallback；
- foreground activation fallback。

## 7. Risks discovered before implementation

### P0/P1 candidates to verify early

1. **Secure storage**：WSLg 环境可能没有 Secret Service/Portal，不能接受静默退化到弱保护作为长期 credential storage。
2. **Global shortcut**：Wayland 依赖 portal identity；当前 `desktopName`、`.desktop` identity 与 WSLg portal availability 需要真实测试。
3. **Auto launch**：普通 Linux desktop autostart 语义与 Windows login + WSL distro startup 不同。
4. **Host activity semantics**：Routine 若要观察“用户是否正在使用整台 Windows 电脑”，WSL guest 的 idle/foreground app 可能不是正确 source of truth。

### P2 candidates

- Linux Tray 行为受 StatusNotifierItem / desktop shell 差异影响；
- Wayland window restore/maximize 行为需实测；
- AppImage/deb/rpm 的 desktop/protocol registration 差异；
- updater 在不同 package target 的 UX 差异；
- WSLg notification 和 focus activation 的实际体验。

## 8. Anti-patterns explicitly rejected

### 8.1 巨型 `PlatformService`

拒绝把所有桌面能力塞入一个大接口。它会快速变成无法独立验证、无法按 capability fallback 的 God Object。

### 8.2 到处 `if (process.platform === ...)`

允许在 adapter factory / composition root / 极少数 platform implementation 内出现；禁止进入 Domain、Application、shared Vue module。

### 8.3 为 WSL 建第四套完整 Runtime

WSLg 是 Linux host environment；不能复制 Windows/Linux/macOS 三套能力再生成一套 WSL 能力树。

### 8.4 为 Thought Forest 维护 Windows 和 WSL 两份 clone

这会重新制造多副本一致性问题。主路径应是 WSL Linux MemoFlow 直接使用 Linux Thought Forest。

### 8.5 用 build success 宣称 platform support

Release artifact 必须和 runtime/native capability evidence 分开；二者都通过才进入支持矩阵。

## 9. Recommended document chain

本分析是后续文档的证据层：

1. `docs/analysis/2026-08-29-desktop-cross-platform-oss-study.md` — 调研与当前事实；
2. `docs/architecture/desktop-cross-platform-runtime.md` — North Star 架构；
3. `docs/architecture/adr/ADR-066-desktop-platform-capability-and-host-environment.md` — 正式决策；
4. `docs/plan/active/2026-08-29-desktop-cross-platform-runtime.md` — 执行唯一顺序真值。

实施时如发现调研假设与真实 probe 冲突，应更新 capability evidence 和 Active Plan；若决策本身变化，再修订 ADR。

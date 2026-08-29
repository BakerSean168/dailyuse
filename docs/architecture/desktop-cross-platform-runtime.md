---
tags:
  - architecture
  - desktop
  - electron
  - cross-platform
  - windows
  - linux
  - macos
  - wslg
description: MemoFlow Desktop 的跨平台运行时、Capability Port、OS adapter 与 WSL host overlay 目标架构
created: 2026-08-29T19:38:00+08:00
updated: 2026-08-29T19:38:00+08:00
---

# MemoFlow Desktop Cross-Platform Runtime Architecture

> 正式决策见 [ADR-066](./adr/ADR-066-desktop-platform-capability-and-host-environment.md)。
> OSS 与当前实现证据见 [2026-08-29 Desktop Cross-Platform OSS Study](../analysis/2026-08-29-desktop-cross-platform-oss-study.md)。
> 实施顺序见 [Active Plan](../plan/active/2026-08-29-desktop-cross-platform-runtime.md)。

## 1. Purpose

MemoFlow Desktop 的长期目标是：

```text
Windows
Linux
macOS
```

共享同一套产品业务、领域模型、Application service、Vue UI、IPC contracts 和大多数 Electron runtime；真正的 OS 差异通过小粒度 capability adapter 解决。

WSLg 是 Linux Desktop 的一个 host environment。MemoFlow 在 WSLg 中运行时，文件、Thought Forest、Git、watcher、SQLite、Obsidian 等都应直接使用 Linux native runtime；只有必须反映 Windows host 状态的能力才通过 WSL host integration 回到 Windows。

## 2. North Star

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Shared Product                                                       │
│ Goal / Task / Routine / Schedule / Notification / Notes / AI        │
│ shared app-vue + Domain + Application + Contracts                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ stable ports / IPC
┌───────────────────────────────▼─────────────────────────────────────┐
│ Desktop Runtime                                                      │
│ Composition Root                                                     │
│   detectDesktopEnvironment()                                         │
│   createDesktopCapabilities(environment)                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                   ┌────────────▼────────────┐
                   │ Capability Ports       │
                   │                        │
                   │ SecureStorage          │
                   │ Notification           │
                   │ Tray                   │
                   │ GlobalShortcut         │
                   │ AutoLaunch             │
                   │ Update                 │
                   │ ExternalEditor         │
                   │ WindowIntegration      │
                   │ Idle / Activity        │
                   │ ActiveApplication      │
                   │ DND                    │
                   └────────────┬────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
┌─────────▼─────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐
│ Windows adapters  │ │ Linux adapters    │ │ macOS adapters    │
│ Electron-first    │ │ Electron-first    │ │ Electron-first    │
└───────────────────┘ └─────────┬─────────┘ └───────────────────┘
                                │
                         environment overlay
                          ┌─────▼─────┐
                          │ WSL host  │
                          │ fallback  │
                          │ only when │
                          │ required  │
                          └───────────┘
```

## 3. Terminology

### 3.1 OS

```ts
export type DesktopOs = 'windows' | 'linux' | 'macos';
```

OS 表示当前 Electron/Node process 真正运行在哪个操作系统内核/userspace 上。

### 3.2 Host environment

```ts
export type DesktopHost = 'native' | 'wsl';
```

Host 说明当前 OS 是否嵌套在另一个用户桌面宿主中。

第一阶段只需要 `native | wsl`；未来如果真实需求出现 Remote Desktop、containerized desktop 等环境，再扩展，不预先设计。

### 3.3 Window/display system

```ts
export type DesktopDisplay =
  | 'win32'
  | 'cocoa'
  | 'x11'
  | 'wayland'
  | 'headless'
  | 'unknown';
```

Linux 下 X11 与 Wayland 对 shortcut、window behavior、portal 的影响很大，必须独立观测。

### 3.4 Package channel

```ts
export type DesktopPackage =
  | 'dev'
  | 'nsis'
  | 'dmg'
  | 'appimage'
  | 'deb'
  | 'rpm'
  | 'unknown';
```

Package 不属于 OS 本身，但会影响 updater、protocol registration、autostart 和 desktop entry 行为。

## 4. `DesktopEnvironment`

建议在 Desktop main process 建立单一、只读的 environment descriptor：

```ts
export interface DesktopEnvironment {
  readonly os: DesktopOs;
  readonly arch: NodeJS.Architecture;
  readonly host: DesktopHost;
  readonly display: DesktopDisplay;
  readonly package: DesktopPackage;
  readonly isPackaged: boolean;
}
```

### 4.1 Detection ownership

只能由 Desktop composition root 检测：

- `process.platform`；
- `process.arch`；
- `WSL_DISTRO_NAME` / `/proc/version` 等 WSL evidence；
- `WAYLAND_DISPLAY` / `DISPLAY`；
- `app.isPackaged`；
- package marker/build metadata。

其他业务 module 不自行重新探测。

### 4.2 Detection is description, not policy

`DesktopEnvironment` 只说明事实，不能承担 capability policy。

错误：

```ts
if (environment.os === 'linux') {
  disableNotification();
}
```

正确：

```ts
if (capabilities.notification.state === 'unavailable') {
  useInAppFallback();
}
```

## 5. Capability model

### 5.1 State

```ts
export type CapabilityState =
  | 'supported'
  | 'degraded'
  | 'unavailable'
  | 'unverified';

export interface CapabilityStatus {
  readonly state: CapabilityState;
  readonly provider: string;
  readonly reason?: string;
}
```

`unverified` 很重要：不能把“没有测试过”伪装成 `unavailable` 或 `supported`。

### 5.2 Ports

平台边界按能力拆，不建立巨型 `PlatformService`：

```text
SecureStoragePort
NotificationPort
TrayPort
GlobalShortcutPort
AutoLaunchPort
UpdatePort
ExternalEditorPort
WindowIntegrationPort
IdleSensorPort
ActivitySensorPort
ActiveApplicationPort
DndSensorPort
```

已有领域 Port（例如 `IdleSensorPort`）继续保留在其领域 package；Desktop platform 只负责提供 adapter，不复制 contract。

### 5.3 Capability provider selection

统一遵循：

```text
1. Electron cross-platform implementation
        ↓ semantics sufficient?
   YES -> use it
   NO
        ↓
2. OS-specific adapter
        ↓ semantics sufficient?
   YES -> use it
   NO and host == wsl
        ↓
3. WSL host integration fallback
        ↓
4. unavailable/degraded + product fallback
```

不要为了“平台整齐”预先实现每个 capability 的 Windows/Linux/macOS 三份 class。

## 6. Composition root

建议新增：

```text
apps/desktop/src/main/platform/
  environment/
    desktop-environment.ts
    detect-desktop-environment.ts
  capabilities/
    capability-state.ts
    ...small ports/factories...
  electron/
    ...shared Electron adapters...
  windows/
    ...only real Windows-specific adapters...
  linux/
    ...only real Linux-specific adapters...
  macos/
    ...only real macOS-specific adapters...
  wsl/
    ...host-scoped fallback adapters only...
```

`apps/desktop/src/main/main.ts` / runtime composers 只依赖一个组装结果：

```ts
interface DesktopCapabilities {
  secureStorage: SecureStoragePort;
  notification: NotificationPort;
  tray: TrayPort;
  globalShortcut: GlobalShortcutPort;
  autoLaunch: AutoLaunchPort;
  update: UpdatePort;
  externalEditor: ExternalEditorPort;
  windowIntegration: WindowIntegrationPort;
}
```

对于 reminder/routine 领域能力，factory 返回既有 domain port：

```text
IdleSensorPort
ActivitySensorPort
ActiveApplicationPort
DndSensorPort
```

## 7. Knowledge Vault is not an OS adapter

### 7.1 Canonical rule

`LocalVaultRuntime` 继续使用当前 process 的 native filesystem。

```text
Windows MemoFlow
  -> Node fs
  -> Windows filesystem

Linux MemoFlow
  -> Node fs
  -> Linux filesystem

MemoFlow Linux under WSLg
  -> Node fs
  -> WSL Linux filesystem
```

### 7.2 Thought Forest primary path

WSLg 的推荐用户路径：

```text
MemoFlow Linux
  -> /home/.../thought-forest
  -> Linux fs
  -> Linux watcher/inotify
  -> Linux git
```

禁止把主路径设计成：

```text
MemoFlow Linux
  -> Windows UNC
  -> WSL Linux filesystem
```

也不要求用户维护 Windows/WSL 两份 Thought Forest clone。

### 7.3 External editor

MemoFlow Notes 仍保持：

```text
browse/search/preview/AI -> MemoFlow
heavy editing            -> external editor (Obsidian first)
```

`ExternalEditorPort` 负责 URI/protocol/open behavior，Repository domain 不承担 OS shell 细节。

## 8. WSLg overlay

### 8.1 What remains Linux-native

WSLg 下继续使用 Linux-native：

- Vault filesystem；
- Thought Forest；
- Git；
- watcher；
- local DB；
- Markdown/index；
- Linux Obsidian；
- ordinary HTTP/network；
- shared Electron window/UI。

### 8.2 What may require host integration

只有产品语义明确要求 Windows host truth 时才 bridge：

- Windows login auto start；
- Windows host idle；
- Windows foreground application；
- Windows DND/focus assist；
- Windows-native notification fallback；
- Windows host-wide shortcut fallback；
- Windows foreground activation fallback。

### 8.3 WSL bridge constraints

如果真实 probe 最终要求 host bridge，必须满足：

1. capability-specific，不提供 arbitrary shell RPC；
2. typed request/response；
3. least privilege；
4. no secret in command line；
5. timeout + cancellation；
6. structured error；
7. no direct domain import；
8. 可禁用且有 Linux-side degraded fallback。

## 9. Capability-specific target behavior

### 9.1 Secure storage

目标：任何长期 token/credential 都不能静默落到弱加密 backend。

```text
Windows -> Electron safeStorage / DPAPI
macOS   -> Electron safeStorage / Keychain
Linux   -> Portal Secret / Secret Service / supported backend
WSLg    -> Linux backend first
           -> if unavailable, explicit degraded/unavailable
           -> host credential fallback only after threat-model review
```

需要记录：

- encryption available；
- selected backend；
- temporary unavailability；
- whether re-encryption is required。

### 9.2 Notification

优先 Electron `Notification`。失败时：

```text
native desktop notification unavailable
  -> in-app notification remains authoritative UI
  -> optional OS adapter/WSL host fallback
```

Notification Fact / Delivery Policy 的领域真值不因此改变。

### 9.3 Tray

优先 Electron `Tray`。

Linux 必须测试：

- StatusNotifierItem；
- desktop shell visibility；
- click behavior；
- context menu update；
- WSLg Windows notification area 是否真实可见。

若 WSLg 无系统托盘，不应因此阻塞主产品；capability 可以为 `unavailable`，主窗口/shortcut/notification 走其他入口。

### 9.4 Global shortcut

优先 Electron `globalShortcut`。

Wayland 必须验证：

- `desktopName` identity；
- GlobalShortcuts portal availability；
- registration result；
- restart/re-registration。

WSLg 若 portal 不工作，再评估 Windows host shortcut bridge。

### 9.5 Auto launch

普通 Linux：Linux desktop autostart。

WSLg：产品语义应是：

```text
Windows login
  -> start target WSL distro if necessary
  -> start MemoFlow Linux
```

因此 WSLg 的 auto launch 允许使用 host-specific adapter；不能假装普通 Linux XDG autostart 就等价。

### 9.6 Idle / activity / foreground app

Routine 需要明确“source of truth scope”：

```text
process/guest scope
or
whole-user-desktop/host scope
```

普通 Windows/Linux/macOS 可优先用 Electron/native adapter。

WSLg 如果产品要求 whole Windows desktop truth，则使用 WSL host adapter；否则 Linux guest data 不能冒充 host data。

### 9.7 Update

保留现有 `electron-updater` boundary。

目标支持矩阵：

- Windows NSIS；
- Linux AppImage / deb / rpm；
- macOS signed/notarized DMG/update path。

任何 package-specific差异留在 Update/Release adapter，不进入 feature module。

## 10. Initial capability matrix

这是待 Phase 0 实测的初始状态，不是最终支持承诺：

| Capability | Windows | Linux X11 | Linux Wayland | macOS | WSLg |
| --- | --- | --- | --- | --- | --- |
| Shared business UI | supported | supported-by-build | supported-by-build | unverified | supported-by-WSLg-baseline |
| Local Vault | supported | expected | expected | expected | expected/native |
| Git runtime | supported | expected | expected | expected | expected/native |
| File watcher | supported | expected | expected | expected | expected/native |
| External Obsidian | supported | expected | expected | expected | local environment ready |
| Secure storage | supported | unverified | unverified | unverified | **risk / unverified** |
| Notification | supported | unverified | unverified | unverified | unverified |
| Tray | supported | unverified | unverified | unverified | **risk / unverified** |
| Global shortcut | supported | unverified | portal-dependent | unverified | **risk / unverified** |
| Auto launch | supported | unverified | unverified | unverified | **needs host semantics** |
| Idle sensor | implemented | behavior unverified | behavior unverified | behavior unverified | host scope unresolved |
| Active app / DND | planned/partial | unverified | unverified | unverified | likely host integration |
| Auto update | supported release path | packaged | packaged | not first-class release lane | package path unverified |

“expected” 必须在计划执行后升级为 `supported` 或 `degraded`；不能长期保留模糊状态。

## 11. Protected contracts

平台化实施不得破坏：

1. `packages/app-vue` 的 Web/Desktop shared surface；
2. Electron preload/IPC channel 与 Result envelope；
3. Local Profile ownership；
4. Cloud Auth / Device Auth flow；
5. Repository `LocalVaultElectronPort` 与 GitHub knowledge repository contracts；
6. Notes `/repository` 和 `?note=` deep link；
7. Reminder/Routine occurrence、lease、retry、fencing、notification durable fact；
8. existing Windows behavior；
9. Linux release artifacts already published by release lane；
10. no secrets in CLI/log/remote URL。

## 12. Failure policy

Capability failure 不应把整个 Desktop 进程拖死。

建议统一：

```text
Required-for-security capability fails
  -> fail closed / block affected feature

Optional desktop integration fails
  -> mark degraded/unavailable
  -> preserve core product path
  -> visible diagnostic + retry
```

示例：

- secure storage 无安全 backend：阻止保存长期 secret；
- tray 不可用：App 仍正常运行；
- global shortcut 注册失败：显示 capability diagnostic；
- WSL host active-app bridge 不可用：Routine 关闭该 suppression feature，不伪造 active app。

## 13. Observability

每次 Desktop 启动应生成不含敏感信息的 capability snapshot：

```json
{
  "os": "linux",
  "host": "wsl",
  "display": "wayland",
  "package": "appimage",
  "capabilities": {
    "secureStorage": { "state": "supported", "provider": "secret-service" },
    "tray": { "state": "unavailable", "provider": "electron-tray" },
    "globalShortcut": { "state": "degraded", "provider": "electron-global-shortcut" }
  }
}
```

要求：

- 不记录用户名、绝对 Vault path、token；
- capability failure 有稳定 code；
- E2E 可以断言 snapshot；
- Settings 可在后续提供用户可读诊断页，但不是 Phase 1 前置条件。

## 14. Build and release architecture

### 14.1 Build is per OS

Desktop native artifacts 不跨 runner 复用：

```text
Windows runner -> Windows artifacts
Linux runner   -> Linux artifacts
macOS runner   -> macOS artifacts
```

继续遵守 CI/CD Platform V2 的 exact source / immutable release / lane evidence 规则。

### 14.2 Target release matrix

第一阶段目标：

```text
Windows x64
Linux x64: AppImage + deb + rpm
macOS arm64 + x64/universal decision
```

ARM Linux/Windows 只有真实用户需求后再扩，不阻塞本次平台化。

### 14.3 macOS readiness

把 macOS 升为 first-class release lane 前，必须完成：

- code signing；
- notarization；
- update signature；
- Keychain/safeStorage；
- universal vs dual-arch artifact decision；
- macOS E2E runner evidence。

## 15. Verification matrix

平台支持证据分三层：

### Layer A — shared contract

- typecheck；
- unit；
- boundary；
- app-vue shared tests；
- IPC contract tests。

### Layer B — packaged runtime

- exact package builds；
- packaged runtime dependencies；
- startup/auth/profile/local DB；
- update metadata。

### Layer C — native capability

- notification visible；
- tray visible/actionable；
- shortcut works outside app focus；
- secure storage backend acceptable；
- auto launch behavior correct；
- window/focus/resume；
- Vault watcher + Git sync；
- external editor/protocol。

WSLg compatibility suite 属于 Layer C，不能由普通 Ubuntu CI 替代。

## 16. Primary WSLg vertical slice

本方案第一个真实闭环必须是：

```text
Start MemoFlow Linux under WSLg
  -> authenticate/open local profile
  -> Notes
  -> select ~/projects/thought-forest
  -> scan
  -> search
  -> preview
  -> AI confirmed write
  -> watcher observes change
  -> Git sync
  -> open selected note in Linux Obsidian
```

验收要求：

- 不使用 `\\wsl.localhost`；
- 不创建 Windows Thought Forest clone；
- Git 运行在 Linux；
- existing Windows Notes behavior 不回归；
- capability snapshot 明确记录 WSLg 环境。

## 17. Migration rule

每次迁移一个 existing desktop feature 时：

```text
characterization test
  -> define/confirm capability port
  -> move current implementation behind adapter
  -> keep Windows behavior green
  -> add Linux/macOS implementation or explicit unverified state
  -> add WSLg probe if relevant
  -> only then remove old direct dependency
```

禁止一次性移动所有 `apps/desktop/src/main` 文件只为了“目录漂亮”。

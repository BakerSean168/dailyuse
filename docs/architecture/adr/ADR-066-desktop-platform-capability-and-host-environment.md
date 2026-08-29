---
tags:
  - adr
  - desktop
  - electron
  - cross-platform
  - windows
  - linux
  - macos
  - wslg
description: ADR-066 - Desktop 平台能力、OS adapter、host environment overlay 与 WSLg 支持边界
created: 2026-08-29T19:38:00+08:00
updated: 2026-08-29T19:38:00+08:00
---

# ADR-066: Desktop Platform Capability + Host Environment Architecture

**状态：** 已采纳
**日期：** 2026-08-29
**影响范围：** Desktop、Repository、Routine、Notification、Settings、CI/CD、Release

## 1. Context

MemoFlow Desktop 已使用 Electron，并已有 Windows/Linux 构建与发布基础；ADR-004 早期目标也明确包含 Windows、macOS、Linux。当前业务 UI 和大多数 Domain/Application logic 已经保持平台无关，显式 `process.platform` 分支主要集中在 Electron main 的图标、生命周期、路径、自启和 Git 环境等边缘。

与此同时，新的本地知识库使用场景要求 MemoFlow 可以在 WSLg 中直接使用 Linux Thought Forest，而不希望维护 Windows/WSL 两份知识仓库，也不希望 Windows Electron 通过 `\\wsl.localhost` 长期执行大量文件扫描、watcher 和 Git metadata 操作。

另外，Routine、Notification、Tray、Shortcut、Secure Storage、Auto Launch、External Editor 等能力会受到 Windows/macOS/Linux、X11/Wayland、package format 和 WSL host environment 的真实差异影响。

如果继续在 feature/runtime 中直接增加 OS 判断，会逐步形成平台分叉；如果把 WSL 当第四个 OS，又会复制整套 platform implementation，并混淆 Linux guest 能力与 Windows host 能力。

## 2. Decision

### 2.1 Supported OS model

MemoFlow Desktop 的 OS 维度统一为：

```text
windows
linux
macos
```

WSLg **不是第四个 OS**。

WSLg 建模为：

```text
os = linux
host = wsl
```

Linux display 继续独立记录：

```text
x11
wayland
headless
```

### 2.2 Desktop environment descriptor

Desktop main composition root 统一检测并持有一个只读 `DesktopEnvironment`：

```ts
interface DesktopEnvironment {
  os: 'windows' | 'linux' | 'macos';
  arch: NodeJS.Architecture;
  host: 'native' | 'wsl';
  display: 'win32' | 'cocoa' | 'x11' | 'wayland' | 'headless' | 'unknown';
  package: 'dev' | 'nsis' | 'dmg' | 'appimage' | 'deb' | 'rpm' | 'unknown';
  isPackaged: boolean;
}
```

Feature、Domain、shared Vue module 不得自行重新探测这些事实。

### 2.3 Capability-first, not OS-first

Desktop native 能力使用小粒度 Port：

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

已有领域 Port 继续由领域 package 定义；Desktop 只提供 adapter，不复制 contract。

不建立巨型 `PlatformService`。

### 2.4 Adapter selection order

每个 capability 按以下顺序选择 provider：

```text
Electron cross-platform implementation
  -> OS-specific adapter when real semantics differ
  -> WSL host integration only when host truth is required
  -> explicit degraded/unavailable fallback
```

不得因为存在三个 OS 就预先复制三份 implementation。

### 2.5 WSL host integration boundary

WSL host integration 只允许处理 **Windows-host-scoped truth**，例如：

- Windows login auto launch；
- Windows host idle；
- Windows foreground app；
- Windows DND/focus assist；
- Windows-native notification fallback；
- host-wide shortcut fallback；
- foreground activation fallback。

它不得成为 arbitrary shell bridge，也不得承载 Vault、Git、SQLite、AI、普通网络或业务 command。

### 2.6 Local Vault / Thought Forest remain native filesystem capabilities

Local Vault 不按 OS 拆 `WindowsVaultAdapter/LinuxVaultAdapter/WslVaultAdapter`。

MemoFlow 运行在哪个 OS，就使用该 OS 的 native filesystem：

```text
Windows -> Windows fs
Linux -> Linux fs
Linux under WSLg -> Linux fs
```

WSLg 的推荐 Thought Forest path 是 Linux 内的本地路径，例如：

```text
~/projects/thought-forest
```

不把 `\\wsl.localhost\...` 作为主运行路径，不要求维护第二份 Windows clone。

### 2.7 External editor is a capability, not Vault ownership

Repository/Notes 继续承担 browse/search/preview/AI context；重编辑可以委托 Obsidian。

“打开 Obsidian/外部编辑器”通过 `ExternalEditorPort` 处理 protocol/shell/platform 差异，不改变 Local Vault 的 source-of-truth 语义。

### 2.8 Capability state is explicit

每个 native capability 必须可报告：

```text
supported
 degraded
 unavailable
 unverified
```

“未验证”不能被当成“已支持”。

安全关键能力失败时必须 fail closed；可选桌面集成失败时允许 degraded，但不能拖垮核心业务。

### 2.9 Platform support requires evidence

一个平台进入正式支持矩阵必须同时具备：

1. build/release artifact evidence；
2. shared contract/E2E evidence；
3. native capability evidence。

`electron-builder` 构建成功不能单独证明平台支持。

### 2.10 First validation slice

第一个跨平台 vertical slice 固定为 WSLg Knowledge/Notes：

```text
MemoFlow Linux under WSLg
  -> Local Profile/Auth
  -> Notes
  -> Linux Thought Forest
  -> scan/search/preview
  -> AI confirmed write
  -> watcher
  -> Linux Git sync
  -> Linux Obsidian
```

该 slice 不引入 Windows Vault bridge。

## 3. Why this decision

### 3.1 保持业务单轨

当前 `packages/app-vue`、Domain/Application 与 IPC contract 已经高度共享。Capability-first 可以保护这个优势，避免形成 Windows UI / Linux UI / macOS UI 三套逻辑。

### 3.2 与现有 Ports & Adapters 一致

ADR-059 已要求 Activity/Idle/DND/ActiveApplication 通过 Port 隔离平台 API。本 ADR 将这一原则扩展到完整 Desktop native surface，而不是引入第二套架构。

### 3.3 WSLg 的语义更清晰

WSLg 本质上运行 Linux process 和 Linux filesystem，只是窗口/输入/桌面体验由 Windows host 集成。把它建模为 Linux + host overlay，既避免错误的 filesystem bridge，也允许对 host-scoped capability 做窄适配。

### 3.4 Electron 已经承担大量跨平台工作

Tray、Notification、Global Shortcut、safeStorage、Window、powerMonitor 等都有 Electron abstraction。优先复用这些能力可以减少 native addon、ABI、签名、打包和维护成本。

### 3.5 真实 Linux 环境存在 display/package 差异

Wayland portal、StatusNotifierItem、Secret Service、AppImage/deb/rpm 等会改变 capability behavior，因此单一 `linux=true` 判断不足。Environment + capability probe 比机械 OS 分支更稳定。

## 4. Rejected alternatives

### 4.1 Windows MemoFlow + WSL Vault Runtime Bridge 作为主方案

**拒绝。**

当用户本来就可以在 WSLg 内运行 Linux MemoFlow 时，再让 Windows Electron 通过 bridge 操作 WSL Vault，会额外引入：

- filesystem crossing；
- watcher 可靠性边界；
- Windows Git 对 Linux working tree；
- bridge lifecycle；
- duplicate path semantics。

它只能作为未来特殊兼容模式，不是主路径。

### 4.2 WSL 作为第四个平台

**拒绝。**

这会产生：

```text
windows/*
linux/*
macos/*
wsl/*
```

并重复大量 Linux implementation。WSL 的差异只应体现在 host-scoped capability。

### 4.3 一个巨型 `PlatformService`

**拒绝。**

不同 capability 的安全等级、fallback、测试方式和生命周期完全不同。单一大接口会扩大耦合和 mock surface。

### 4.4 全仓目录重构后再补功能

**拒绝。**

当前平台泄漏并不严重。应先通过 characterization test + adapter migration 小步收口，不为了目录整洁进行无行为收益的大搬家。

### 4.5 自己实现所有 Windows/Linux/macOS native binding

**拒绝。**

Electron 已提供成熟跨平台 abstraction。只有真实语义不满足时才下沉到 OS-specific implementation。

## 5. Consequences

### Positive

- Windows/Linux/macOS 共享同一产品逻辑；
- WSLg 能直接使用 Linux Thought Forest；
- 平台差异被限制在 Electron main/infrastructure edge；
- capability 可以独立验证、降级和替换；
- Linux Wayland/WSLg 不再被“能打包”误判为“已完全支持”；
- 为 macOS first-class release lane 建立清晰边界；
- Routine/Notification/Notes 等 feature 不需要知道 Win32/DBus/WSL。

### Cost

- 需要新增 environment detector 和 capability registry；
- 需要为已有 Tray/Shortcut/AutoLaunch/Notification 等实现增加 characterization tests；
- Linux/Wayland/WSLg/macOS 需要真实运行环境验证；
- macOS 正式发布还需要 signing/notarization；
- WSL host integration 若最终需要，会增加一个受限的 Windows interop surface。

### Risks

- 过度抽象，把每个 Electron API 都包装成无意义 Port；
- 用“平台统一”掩盖真实产品语义差异；
- capability probe 与 runtime provider 选择不一致；
- WSL host bridge 扩张成通用远程执行接口；
- Secure Storage 在 Linux/WSLg 发生不安全静默降级；
- CI 只有 headless Linux，误把 Wayland/WSLg 问题遗漏到发布后。

## 6. Guardrails

### 6.1 Allowed direct platform branches

允许 `process.platform` / environment branch 的位置：

- environment detector；
- capability factory；
- OS-specific adapter；
- packaging/release tooling。

### 6.2 Forbidden direct platform branches

禁止新增到：

- Domain；
- Application service；
- shared `packages/app-vue` feature logic；
- business DTO/schema；
- Repository/Reminder/Notification 领域规则。

### 6.3 WSL host bridge guardrails

任何 WSL host adapter 必须：

- capability-specific；
- typed；
- least privilege；
- timeout/cancel；
- no secret in argv/log；
- no arbitrary command execution；
- 可禁用；
- 有 degraded/unavailable fallback；
- 有真实 WSLg E2E。

## 7. Protected contracts

本 ADR 不改变：

- `/repository` / Notes deep link；
- `LocalVaultElectronPort` 的产品语义；
- GitHub knowledge repository 的 source-of-truth / sync contract；
- Web projection/RAG；
- Cloud Auth / Local Profile；
- IPC Result envelope；
- Routine occurrence/lease/retry/fencing；
- Notification durable fact/delivery policy；
- Windows current product flow。

如果某个 Port 为了平台化需要 schema breaking change，必须另行 ADR/migration，不能在本 ADR 下隐式破坏。

## 8. Verification required by this ADR

实施关闭前必须有：

- Windows packaged Desktop regression；
- Linux packaged Desktop E2E；
- Linux X11/Wayland capability evidence；
- WSLg compatibility evidence；
- macOS build + E2E + signing/notarization evidence，或在 plan 中明确仍为 unsupported/deferred；
- capability snapshot/test；
- no new feature-layer `process.platform` leakage；
- Notes + Thought Forest WSLg vertical slice；
- security review for secure storage and any WSL host bridge。

## 9. Related documents

- [Desktop Cross-Platform Runtime Architecture](../desktop-cross-platform-runtime.md)
- [Desktop Cross-Platform OSS Study](../../analysis/2026-08-29-desktop-cross-platform-oss-study.md)
- [Desktop Cross-Platform Active Plan](../../plan/active/2026-08-29-desktop-cross-platform-runtime.md)
- [ADR-004 Electron Desktop Architecture](./ADR-004-electron-desktop-architecture.md)
- [ADR-034 Obsidian Vault Repository](./ADR-034-obsidian-vault-repository.md)
- [ADR-041 CI/CD Platform V2](./ADR-041-ci-cd-platform-v2.md)
- [ADR-059 Routine Coach Runtime and Surfaces](./ADR-059-routine-coach-domain-runtime-and-surfaces.md)
- [ADR-063 Notification Fact / Delivery Policy](./ADR-063-notification-fact-delivery-policy-and-device-surfaces.md)

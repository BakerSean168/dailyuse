---
tags:
  - plan
  - active
  - desktop
  - electron
  - cross-platform
  - windows
  - linux
  - macos
  - wslg
  - repository
  - routine
  - notification
description: MemoFlow Desktop Windows/Linux/macOS 全平台化与 WSLg 正式支持的统一执行计划
created: 2026-08-29T19:38:00+08:00
updated: 2026-08-29T19:38:00+08:00
status: active
---

# MemoFlow Desktop Cross-Platform Runtime — Unified Implementation Plan

## 0. Executive decision

本计划是 MemoFlow Desktop 全平台化工作的**唯一执行顺序真值**。

目标不是创建 Windows/Linux/macOS/WSL 四套应用，而是：

```text
Shared Product Core
  -> Desktop Capability Ports
  -> Electron-first providers
  -> OS adapters only when necessary
  -> WSL host overlay only for host-scoped truth
```

第一条真实验证主链固定为：

```text
MemoFlow Linux under WSLg
  -> Notes
  -> Linux Thought Forest
  -> search/preview/AI confirmed write
  -> watcher
  -> Linux Git sync
  -> Linux Obsidian
```

在该主链闭合之前，不先建设大型 WSL bridge，也不把 macOS/Wayland 的所有差异一次性实现完。

决策与证据：

- [ADR-066](../../architecture/adr/ADR-066-desktop-platform-capability-and-host-environment.md)
- [Target Architecture](../../architecture/desktop-cross-platform-runtime.md)
- [OSS / Current-State Study](../../analysis/2026-08-29-desktop-cross-platform-oss-study.md)

## 1. Target outcome

完成后，用户应能：

### Windows

- 安装/升级 Windows MemoFlow；
- 使用现有 Desktop 全功能；
- native notification/tray/shortcut/autostart/secure storage 正常；
- 不因平台化产生行为回归。

### Linux

- 使用 AppImage/deb/rpm 安装；
- 在 X11/Wayland 至少一个主支持环境完整运行；
- Local Vault/Git/Notes/Routine 等 core path 与 Windows 共享业务逻辑；
- capability 差异可见、可诊断、可降级。

### WSLg

- 直接运行 Linux MemoFlow；
- 直接使用 WSL Linux filesystem 的 Thought Forest；
- 不需要 Windows Thought Forest clone；
- 不需要 `\\wsl.localhost` 作为主 Vault runtime；
- Windows-host-scoped 能力只有在真实需要时才通过窄 bridge 获取。

### macOS

- 代码架构不再把 macOS 视为“以后再说”的隐式分支；
- 形成正式 build/E2E/release readiness 路径；
- signing/notarization/updater/Keychain 的剩余 gate 有明确证据和状态。

## 2. Non-goals

本计划不做：

- 重写 shared app-vue；
- 重构 Goal/Task/AI 的业务语义；
- 用 Rust/Tauri 重写 Electron；
- 引入 libgit2/isomorphic-git 替换当前 process Git；
- 为每个 Electron API 都创建 wrapper；
- 建 arbitrary WSL remote shell；
- 为 Thought Forest 创建第二份 Windows clone；
- 第一轮同时支持所有 Linux distro/package/sandbox；
- 第一轮补 Windows/Linux ARM release。

## 3. Protected contracts

实施必须保护：

1. Desktop preload/IPC channel 与 Result envelope；
2. Local Profile / Cloud Auth / Device Auth；
3. shared `packages/app-vue` Web/Desktop behavior；
4. `/repository`、`?note=` 与 Notes workspace；
5. `LocalVaultElectronPort` 与 GitHub knowledge repository sync semantics；
6. existing Windows release/runtime；
7. Routine occurrence/lease/retry/fencing；
8. Notification durable fact/delivery policy；
9. CI/CD Platform V2 exact-source / immutable artifact rules；
10. secret 不进入 argv、log 或 remote URL。

任何 ticket 如果需要破坏上述 contract，必须停止并创建独立 migration decision。

## 4. Current baseline

### Already true

- Windows/Linux Desktop release assets 已有真实构建历史；
- Linux AppImage/deb/rpm target 已存在；
- app-vue 业务层基本无 OS 分支；
- Local Vault 基于 Node fs，可直接在 Linux/WSLg 使用；
- Git runtime 使用 process Git；
- Electron Tray/Notification/Shortcut/AutoLaunch implementation 已存在；
- ADR-059 已定义 Routine platform capability ports；
- WSLg 开发环境已有 systemd、Wayland/X11、Linux Git、Linux Obsidian 和 Thought Forest。

### Gaps

- 没有统一 `DesktopEnvironment`；
- 没有统一 capability state/probe；
- existing native capabilities 的 ownership 仍分散；
- Linux/Wayland/WSLg native capability evidence 不完整；
- `WindowsIdleSensorAdapter` 命名比实现更平台化；
- Secure Storage 在 WSLg 的安全 backend 未验证；
- WSLg auto launch/host idle/foreground app 语义未定义到实现；
- macOS 尚未进入正式 release matrix；
- CI/runtime support definition 还没有统一三层 evidence contract。

## 5. Phase overview

```text
Phase 0  Capability Audit / Characterization
   ↓
Phase 1  Platform Foundation
   ↓
Phase 2  Linux + WSLg Knowledge Vertical Slice
   ↓
Phase 3  Native Capability Parity
   ↓
Phase 4  Minimal WSL Host Integration
   ↓
Phase 5  Release / Compatibility Matrix Closure
```

Phase 4 不是必然大开发；如果 Phase 2/3 证明 Electron/Linux capability 已满足产品语义，相关 WSL bridge ticket 可以正式关闭为 `not needed`。

# Phase 0 — Baseline and capability evidence

## PLAT-0001 — Freeze current platform surface inventory

**Goal:** 得到一份可执行的 current-state inventory，明确哪些文件直接依赖 Electron/OS、哪些 capability 已有 Port、哪些是共享实现。

**Why now:** 没有 inventory 就容易为了“全平台”过度抽象。

**Scope:**

- `apps/desktop/src/main/**` 的 Electron/native dependency；
- `process.platform` / WSL/Wayland/X11 判断；
- Tray/Shortcut/AutoLaunch/Notification/Update/Window；
- Repository Local Vault/Git/watcher；
- Routine sensors；
- safeStorage/auth secret path；
- package/release config。

**Out of scope:** 改代码。

**Implementation:**

1. 生成 inventory 表：owner、current provider、runtime、platform branches、test evidence；
2. 标记 feature-layer platform leakage；
3. 标记 Electron-first 可复用项；
4. 标记真正 OS-specific/host-specific 项；
5. 冻结 baseline commit SHA。

**Tests / evidence:**

- inventory 可追溯到真实文件；
- `git grep` platform refs 与 inventory 对齐。

**Acceptance:** 没有“凭印象认为某功能 Windows-only”的条目。

## PLAT-0002 — Create capability probe harness

**Goal:** 用统一 probe 报告 native capability 状态，不靠人工猜测。

**Scope:**

- environment descriptor probe；
- safeStorage backend/availability；
- Notification support；
- Tray construction/visibility test hook；
- globalShortcut registration；
- powerMonitor idle；
- external protocol；
- auto updater availability；
- package/display/host metadata。

**Protected contracts:** probe 不改变 feature behavior，不记录敏感 path/token。

**Implementation:**

1. 定义测试期 capability probe result；
2. 先放在 Desktop main test/support，不立刻成为产品 API；
3. 为每个 capability 记录 `supported/degraded/unavailable/unverified`；
4. 允许 E2E 导出 JSON evidence。

**Tests:** Desktop main unit + IPC/boundary 如有 transport。

**Acceptance:** 同一 probe 可在 Windows、Linux CI、WSLg 本机执行。

## PLAT-0003 — Capture WSLg baseline evidence

**Goal:** 对当前 Ubuntu 24.04 WSLg 环境生成第一份真实性能/能力报告。

**Scope:**

- Wayland/X11 env；
- DBus/portal；
- safeStorage；
- Tray；
- Notification；
- globalShortcut；
- powerMonitor；
- Obsidian protocol；
- filesystem/watcher/Git。

**Implementation:**

1. 安装/构建当前 Linux Desktop runtime dependency；
2. 运行 probe；
3. 保存非敏感 evidence 到 `docs/analysis` 或 CI evidence artifact；
4. 分类 `works-as-is / needs-linux-fix / needs-wsl-host-integration`。

**Acceptance:** Phase 1/4 的实现范围由 probe 决定，不再预设。

# Phase 1 — Platform foundation

## PLAT-1001 — Introduce `DesktopEnvironment`

**Goal:** 建立单一 OS/host/display/package 描述源。

**Scope:** `apps/desktop/src/main/platform/environment/**`。

**Implementation:**

1. 定义 typed environment contract；
2. 实现 detector；
3. 在 composition root 创建一次；
4. 增加 Windows/Linux/WSL detection unit tests；
5. 禁止业务层直接重探测。

**Acceptance:** platform facts 可测试、可注入；现有 behavior 不变。

## PLAT-1002 — Introduce capability status and registry

**Goal:** 把“平台是否支持”从散落判断升级为 capability state。

**Implementation:**

1. 定义 `CapabilityState/CapabilityStatus`；
2. 创建最小 registry/factory；
3. 先接入 2–3 个最有价值 capability，不一次包完；
4. 提供无敏感信息的 startup diagnostic snapshot。

**Acceptance:** feature consumer 可以依据 capability state 降级，而不是判断 OS。

## PLAT-1003 — Migrate current Electron-first desktop features behind narrow ports

**Goal:** 保持现有实现，改变 ownership，不做行为重写。

**Initial candidates:**

- Tray；
- Global Shortcut；
- Auto Launch；
- Notification；
- External Editor。

**Implementation:** 每个 capability 先 characterization test，再把 existing class 挂到 Port/factory。

**Acceptance:** Windows behavior 逐项保持；没有一次性目录搬家噪音。

## PLAT-1004 — Generalize Electron idle adapter naming/ownership

**Goal:** 如果 `powerMonitor.getSystemIdleTime()` 在目标 native OS 语义一致，把 `WindowsIdleSensorAdapter` 收敛为 Electron/shared adapter；否则保留真实 platform split。

**Acceptance:** 命名反映实现事实；Routine 仍只消费 `IdleSensorPort`。

# Phase 2 — Linux + WSLg Knowledge vertical slice

## PLAT-2001 — Run packaged/development Linux MemoFlow under WSLg

**Goal:** Linux MemoFlow 在 WSLg 正常启动、登录/本地 Profile、渲染主工作区。

**Scope:** 启动链、native deps、window、profile、DB、安全存储阻塞项。

**Acceptance:** 不通过 Windows MemoFlow 代理。

## PLAT-2002 — Bind Thought Forest as native Linux Local Vault

**Goal:** Notes 直接选择 Linux Thought Forest。

**Primary path:**

```text
Notes -> select ~/projects/thought-forest -> scan -> preview -> search
```

**Protected contracts:** `LocalVaultElectronPort`、`/repository`、现有 Windows Vault path。

**Acceptance:**

- 无 UNC path；
- 无第二份 clone；
- scan/search/read 走 Linux fs；
- Windows characterization tests green。

## PLAT-2003 — Close confirmed write + watcher + Git sync path

**Goal:** MemoFlow/AI 写入后由 Linux watcher/Git runtime 完成原有知识仓库同步语义。

**Implementation:**

1. confirmed write；
2. watcher event；
3. batched commit；
4. fetch/rebase/push；
5. conflict pause；
6. offline pending commit；
7. remote verification。

**Acceptance:** 直接使用 Linux `git`；不引入 WSL Git bridge。

## PLAT-2004 — Close Linux Obsidian external-editor path

**Goal:** Notes 的“在 Obsidian 中打开”在 WSLg 打开 Linux Obsidian。

**Acceptance:**

- root/note deep open；
- path encode 正确；
- protocol unavailable 有 fallback/diagnostic；
- 不改变 Notes 本身 browse/search/preview ownership。

## PLAT-2005 — Add Knowledge performance baseline

**Goal:** 避免跨平台工作掩盖现有 `scan + re-read` 搜索性能债。

**Scope:** 只建立 baseline/threshold；是否做增量索引单独 ticket。

**Dataset:** 100 / 1k / 5k / 10k Markdown notes。

**Acceptance:** Windows native vs Linux native vs WSLg native 有可比较数据。

# Phase 3 — Native capability parity

## PLAT-3001 — Secure storage parity

**Goal:** Windows/Linux/macOS/WSLg 都有明确安全 backend 或 fail-closed policy。

**Security rule:** 不能静默接受弱保护 backend 保存长期 secret。

**Implementation:**

1. capability probe backend；
2. Windows regression；
3. Linux Secret Service/Portal；
4. WSLg result；
5. macOS Keychain evidence；
6. fallback decision。

**Acceptance:** 每个平台 backend 和失败语义明确。

## PLAT-3002 — Notification parity

**Goal:** Electron Notification 优先；平台不支持时有明确 degraded fallback。

**Acceptance:** Notification domain fact 不因 platform delivery 失败丢失。

## PLAT-3003 — Tray parity

**Goal:** Windows/macOS/Linux Tray 行为被真实环境验证。

**Linux matrix:** X11 + Wayland；WSLg 单独记录。

**Acceptance:** 不把 `new Tray()` 成功当作用户可见性证据。

## PLAT-3004 — Global shortcut parity

**Goal:** 外部焦点下 shortcut 可证明。

**Linux Wayland:** 验证 portal identity、registration、restart。

**Acceptance:** 注册失败返回 degraded diagnostic，不静默宣称成功。

## PLAT-3005 — Auto launch parity

**Goal:** native Windows/Linux/macOS autostart 行为清晰。

**Acceptance:** WSLg 不强行套普通 Linux autostart；host semantics 留给 Phase 4。

## PLAT-3006 — Window/focus/resume/intervention parity

**Goal:** main window、FocusWindow、InterventionWindow、resume 在各平台保持产品语义。

**Linux:** 特别验证 Wayland maximize/restore/focus。

# Phase 4 — Minimal WSL host integration

> 只有 Phase 0/3 证明确实必要的 ticket 才实施；否则关闭为 `not needed`。

## PLAT-4001 — WSL host auto launch adapter

**Goal:** 如果用户启用“Windows 登录后启动 MemoFlow”，正确启动目标 distro + Linux MemoFlow。

**Constraints:** typed fixed action；禁止 arbitrary shell。

**Acceptance:** Windows login 后可稳定启动；关闭设置后彻底移除入口。

## PLAT-4002 — WSL host idle adapter

**Goal:** 仅当 Routine 需要 whole-Windows-user idle truth 时，从 Windows host 获取 idle。

**Acceptance:** guest idle 不冒充 host idle；bridge 不暴露通用执行能力。

## PLAT-4003 — WSL host active-app / DND adapter

**Goal:** 仅在 context-aware Routine 需要时读取最小 Windows host context。

**Privacy:** 默认最小化、可关闭、只暴露产品需要的标准化状态。

## PLAT-4004 — WSL notification/shortcut/focus fallbacks

**Goal:** 只对 Phase 3 已证明 WSLg 不可用的能力补 host fallback。

**Acceptance:** 每个 fallback 独立，可禁用，不形成通用 WSL service bus。

# Phase 5 — Release and support contract

## PLAT-5001 — Promote macOS to first-class build lane

**Goal:** release matrix 从 Windows/Linux 扩展为 Windows/Linux/macOS。

**Implementation:**

- macOS runner；
- signing；
- notarization；
- updater；
- Keychain；
- artifact manifest/provenance。

**Acceptance:** macOS artifact 失败会阻止对应 release readiness，不产生半支持声明。

## PLAT-5002 — Define Desktop compatibility matrix in CI/CD Platform V2

**Goal:** build/e2e/native evidence 有统一 manifest，不复制一套 CI 平台。

**Matrix:**

```text
Windows x64
Linux X11
Linux Wayland
macOS
WSLg Ubuntu/Wayland compatibility
```

**Acceptance:** required gate 仍由稳定 Oracle 汇总；新平台是 lane/capability extension，不复制 CI/CD 栈。

## PLAT-5003 — Packaged runtime E2E per platform

**Goal:** 验证安装包/发行包，不只测试 dev Electron。

**Coverage:** startup、auth/profile、DB、Notes、native capability、update metadata。

## PLAT-5004 — Publish support policy and user diagnostics

**Goal:** 文档/UI 对“supported/degraded/unverified”不撒谎。

**Acceptance:** 用户能知道当前 package/environment 哪些 native integration 不可用以及替代路径。

# 6. Ticket dependency order

```text
PLAT-0001
  ├─ PLAT-0002
  │    └─ PLAT-0003
  └─ PLAT-1001
        └─ PLAT-1002
              ├─ PLAT-1003
              └─ PLAT-1004
                    ↓
              PLAT-2001
                    ↓
              PLAT-2002
                    ↓
              PLAT-2003
              PLAT-2004
              PLAT-2005
                    ↓
              PLAT-3001~3006
                    ↓
          only proven gaps -> PLAT-4001~4004
                    ↓
              PLAT-5001~5004
```

## 7. Suggested implementation lanes

在 Phase 1 后可并行：

### Lane A — Knowledge / WSLg vertical

`PLAT-2001~2005`

### Lane B — Desktop native capability

`PLAT-3001~3006`

### Lane C — Release / macOS readiness

先做 macOS prerequisites inventory，不提前切 required release gate。

### Integration control plane

主 worktree 只做：

- contract review；
- cross-lane integration；
- capability matrix；
- final validation；
- ADR/plan evidence 更新。

## 8. Validation commands

以仓库当前脚本为基线；实施时每个 ticket 记录实际执行结果。

### Focused Desktop

```bash
pnpm exec nx run desktop:test
pnpm exec nx run desktop:test:main
pnpm exec nx run desktop:test:ipc
pnpm exec nx run desktop:typecheck
pnpm exec nx run desktop:lint
```

### Desktop E2E

```bash
pnpm exec nx run desktop:e2e
```

### Shared UI / contracts

按 affected scope 运行对应 package test/typecheck/build；不得用 Desktop green 替代 shared contract validation。

### Governance / docs

```bash
pnpm docs:check
pnpm governance:check
```

### Release tooling

至少覆盖：

```bash
node --test tools/ci-cd-platform/__tests__/release-workflows.test.mjs
node --test tools/ci-cd-platform/__tests__/release-tooling.test.mjs
```

实际脚本如在实施期间变化，以当时 `project.json/package.json` 为准并回填计划。

## 9. Acceptance matrix

| Area | Required evidence |
| --- | --- |
| Architecture | ADR-066 + architecture doc 与实现一致 |
| Platform leakage | shared feature/domain 无新增直接 OS 分支 |
| Windows | packaged regression + native capabilities |
| Linux | packaged runtime + X11/Wayland evidence |
| WSLg | Thought Forest vertical + capability report |
| macOS | build/E2E/sign/notarize 或明确未进入 supported |
| Secure Storage | backend 可识别；弱 backend 不静默存长期 secret |
| Notes | native Vault + Git + Obsidian path |
| Routine | host/guest activity truth 不混淆 |
| Release | artifact/provenance 与 CI/CD Platform V2 对齐 |

## 10. Review protocol

每完成一个 Phase，进行一次 batch review，至少检查：

1. contract correctness；
2. Windows regression；
3. Linux/WSLg vertical completeness；
4. platform leakage；
5. capability failure/fallback；
6. security；
7. release/package behavior；
8. diff hygiene。

Finding 等级沿用：

- P0 blocker；
- P1 major；
- P2 normal；
- P3 polish。

P0/P1 必须在进入下一 Phase 前关闭或由明确 ADR 修改范围。

## 11. Stop conditions

出现以下情况应暂停扩展范围：

- platform abstraction 开始要求改 Domain schema；
- 一个 capability Port 只有一个 trivial caller/implementation 且没有测试/替换价值；
- WSL bridge 需要 arbitrary command execution；
- secure storage 只能通过弱保护继续且没有明确用户同意/安全替代；
- Linux/macOS 修复开始复制业务 UI；
- release lane 需要绕过 CI/CD Platform V2 exact-source/provenance。

## 12. First execution checkpoint

下一步实施从 **Phase 0** 开始，不直接写 WSL bridge：

```text
PLAT-0001 current platform inventory
PLAT-0002 capability probe
PLAT-0003 real WSLg baseline
```

拿到 probe 后，再决定 Phase 1/3 中哪些 adapter 真正需要 OS-specific implementation。

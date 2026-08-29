---
tags:
  - analysis
  - desktop
  - electron
  - cross-platform
  - dependency-inventory
  - platform-leakage
description: Repository-grounded inventory of every desktop/native/Electron dependency surface (Tray, Shortcut, AutoLaunch, Notification, Update, Window, Local Vault/Git/watcher, Routine sensors, safeStorage/auth, package & release config), with shared-vs-OS-specific-vs-host classification frozen at the baseline SHA
created: 2026-08-29T00:00:00Z
updated: 2026-08-29T00:00:00Z
---

# Desktop Dependency Inventory — Repository-Grounded Platform Surface Ledger

> 平台依赖清单（PLAT-0001 baseline）。每一行都必须指向本仓库中的真实文件或配置，并以
> ADR-066 模型做分类：`os` ∈ {windows, linux, macos}；WSLg 视为 `os=linux + host=wsl`
> overlay，`display` ∈ {x11, wayland, headless}。本清单只做盘点与分类，不改动任何生产代码，
> 也不开启 PLAT-0002（feature-port 实现）。

**Frozen baseline SHA**：`e33a2986c11be37eb0f5017ba17ca5d14d03dd92`
(HEAD `e33a2986c11` “docs(desktop): define cross-platform runtime architecture”；working tree clean。)

## 0. Classification legend（分类图例）

| 分类 | 英文 | 含义 | 判定标准 |
| --- | --- | --- | --- |
| **Sh** | Shared Node/Electron | 由 Electron/Node 统一提供的跨平台能力，业务层可直接依赖 | 只 import `electron`/`node:*`，无 `process.platform` 分支，无 OS 专属调用 |
| **OS** | OS-specific | 真实平台行为差异，下沉到 OS adapter / capability port | 出现 `process.platform === 'darwin' / 'win32'`，或 electron-builder per-OS target，或 OS 专属 API（tray GUID、login item、NUL 设备名） |
| **WSL** | Host-specific（WSL/host） | 由 host environment 决定，而非 `os`；WSLg 即 `host=wsl` | 依赖 `WSL_DISTRO` / display server / host 专属集成 |
| **Leak** | Feature-layer leakage | 业务/feature 层泄漏底层 OS 或 Electron 实现细节 | 在 controller / service / feature 层直接引用 `process.platform`、Electron、`shell`、路径细节 |
| **Cfg** | Package / release matrix | 包与发布矩阵，非运行时，但决定“支持哪些平台” | `package.json` / `project.json` / `electron-builder.json5` / release workflow |

## 1. Capability — platform surface matrix（平台能力面清单）

> 每个 surface 一行。`Provider` 指向真实文件；`Platform 分支` = 代码中的平台分支；
> `Boundary` = 已有的 Port/适配边界；`Evidence` = 真实测试文件；`Class` 用 §0 分类。

| ID | Capability | Owner / provider（real file） | Platform 分支 | Port 边界 | Tests / evidence（real file） | Class |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | 系统托盘 Tray + context menu | `apps/desktop/src/main/modules/tray/tray-manager.ts`（Electron `Tray`/`Menu`）；图标经 `apps/desktop/src/main/utils/app-icon.ts` | `process.platform === 'win32'` → GUID tray + `.ico`；`darwin` 18px；else 24px | `TrayManager` 仅依赖 `app-icon.ts`，不接触 domain | `apps/desktop/src/main/ipc/system-handlers.surface.spec.ts`；test stub `apps/desktop/test-support/electron.stub.ts`（`Tray`/`Menu`） | **Sh** + Windows GUID 属 **OS** |
| T2 | 全局/局部快捷键 | `apps/desktop/src/main/modules/shortcuts/shortcut-manager.ts`（Electron `globalShortcut`） | accelerator `CommandOrControl+Shift+D` 由 Electron 抽象 | 无 per-OS | 同上 surface spec；stub `globalShortcut` | **Sh**（`globalShortcut` 跨平台） |
| T3 | 开机自启 AutoLaunch | `apps/desktop/src/main/modules/autolaunch/auto-launch-manager.ts` | darwin → `app.getLoginItemSettings`/`setLoginItemSettings`；windows/linux → `auto-launch`（动态 import，导入/实例化失败优雅降级） | macOS 登录项 API vs Win/Linux registry（Windows）/Autostart（Linux） | 无直测；由 IPC 层覆盖（`system-handlers.surface.spec.ts`） | **OS**（darwin login-item vs win/linux auto-launch） |
| T4 | 原生通知 + DND + 自定义通知 | `apps/desktop/src/main/services/notification.service.ts` + `./custom-notification.manager.ts` | `Notification.isSupported()` 检测系统能力；`nativeImage` 图标 | `NotificationService` 消费 dispatch 事件 | `services/notification.service.surface.spec.ts`、`custom-notification.manager.surface.spec.ts` | **Sh**（Electron `Notification`） |
| T5 | 自动更新 | `apps/desktop/src/main/modules/auto-update/auto-update-manager.ts` | GitHub release feed（来自 electron-builder `publish`）；`!app.isPackaged` 关闭 | — | `modules/auto-update/ipc/auto-update-ipc.surface.spec.ts` | **Sh**（electron-updater） |
| T6 | 多窗口 + 窗口状态持久化 | `apps/desktop/src/main/lifecycle/window-manager.ts` + `modules/window/window-state-manager.ts` | `BrowserWindow`、`screen.getAllDisplays()`、`fs`；无平台分支 | `WindowManager` 多窗口（profile-access / main） | `lifecycle/window-manager.surface.spec.ts` | **Sh**（Electron `BrowserWindow`） |
| T7 | 桌面原生标题栏 chrome（主题） | `apps/desktop/src/main/lifecycle/desktop-chrome.ts` | `nativeTheme.shouldUseDarkColors`、`setBackgroundColor`、`titleBarStyle:'hidden'` | — | （隐式） | **Sh**（`nativeTheme` 跨平台） |
| R8 | Local Vault（扫描/读/写/选择/Obsidian 打开） | `packages/repository/src/electron/local-vault-runtime.ts` | `dialog.showOpenDialog` + `shell.openExternal` + `fs` 扫描；无 `process.platform` 分支 | `LocalVaultPlatform` port（`selectDirectory`/`openExternal`） | `packages/repository/src/electron/local-vault-runtime.spec.ts` | **Sh**（Electron `dialog`/`shell`） |
| R9 | Local Vault Git runtime | `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-git.runtime.ts` | `SAFE_GIT_CONFIG_GLOBAL = process.platform==='win32' ? 'NUL' : os.devNull`（:23）；`GIT_CONFIG_NOSYSTEM` | `GitProcessPort` | `modules/repository/desktop-knowledge-repository-git.runtime.spec.ts` | **OS**（win null 设备名） |
| R10 | Auto-sync watcher + scheduler | `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-auto-sync.scheduler.ts` | `chokidar.watch(...)`（`ignoreInitial`、`awaitWriteFinish` debounce/stability），事件 add/change/unlink；`path.sep` / `isTemporaryFile` ignore；`watchFactory` 可注入 | `watchFactory` DI + `onNetworkOnline`/`onSystemResume` 生命周期 | `modules/repository/desktop-knowledge-repository-auto-sync.scheduler.spec.ts` | **Sh**（Node fs + chokidar） |
| R11 | 远端 gateway / reconciliation / sync 服务 | `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-reconciliation.service.ts`、`desktop-knowledge-repository-sync.service.ts`、`knowledge-repository-remote.gateway.ts` | 无平台分支 | 宿主 ports 经 `apps/desktop/src/main/runtime/compose-repository.ts` 组装 | `modules/repository/desktop-knowledge-repository-reconciliation.service.spec.ts`、`desktop-knowledge-repository-sync.service.spec.ts`、`desktop-knowledge-repository-sync.acceptance.spec.ts`、`knowledge-repository-remote.gateway.spec.ts` | **Sh**（纯逻辑） |
| F12 | Routine idle sensor | `apps/desktop/src/main/modules/routine/windows-idle-sensor.adapter.ts` | Electron `powerMonitor.getSystemIdleTime()`（`globalThis.setInterval` 轮询）；`capability` 可注入（默认 `powerMonitor`） | `IdleSensorPort`（来自 `@memoflow/reminder/routine-runtime`） | `modules/routine/windows-idle-sensor.adapter.spec.ts` | **Sh**（共享 Electron `powerMonitor`）；WSLg 下 Idle 语义未验证（future host-overlay 工作） |
| F13 | Routine focus / intervention windows | `electron-focus-window.host.ts`、`electron-intervention-window.host.ts`、`focus-window.electron-module.ts`、`intervention-window.electron-module.ts`、`focus-window-taskbar.adapter.ts`（均在 `apps/desktop/src/main/modules/routine/`） | `BrowserWindow` hosts；`setProgressBar`（Window taskbar / macOS Dock / 受支持 Linux 图标上的进度展示） | `FocusTaskbarIntegrationPort`（`focus-window-controller.ts:16`） | `electron-focus-window.host.spec.ts`、`electron-intervention-window.host.spec.ts`、`focus-window.electron-module.spec.ts`、`intervention-window.electron-module.spec.ts` | **Sh**（共享 Electron `setProgressBar`）＋展示因 platform 而异 |
| F14 | Routine lifecycle resume 触发 | `apps/desktop/src/main/main.ts`（`powerMonitor.on('resume')`） | `powerMonitor` | `onSystemResume` 生命周期 port | 经 `desktop-knowledge-repository-auto-sync.scheduler.spec.ts`（注入 lifecycle） | **Sh**（`powerMonitor` 跨平台） |
| S15 | 安全存储：Profile 解锁 key | `apps/desktop/src/main/profile/profile-key-store.ts` | Electron `safeStorage` envelope：`${rootDir}/shared/secure/profile-keys/`；`safeStorage.isEncryptionAvailable()` 守卫 | — | stub `safeStorage` 位于 `electron.stub.ts`；逻辑无直测 | **Sh**（Electron `safeStorage` 抽象 OS） |
| S16 | 安全存储：Cloud 会话 token | `apps/desktop/src/main/profile/cloud-session-store.ts` | Electron `safeStorage` envelope：`${rootDir}/shared/secure/cloud-sessions/`；`isEncryptionAvailable()` 守卫 | — | 同上 | **Sh**（Electron `safeStorage`） |

## 2. `process.platform` / OS-surface reconciliation（`process.platform` 核对结果）

`grep -rn "process.platform"` 扫描 `apps/desktop/src/main`、`apps/desktop/scripts`、
`packages/repository/src`。命中全部列出并按类标注：

| 文件 | 分支表达式 | 业务相关性 | Class |
| --- | --- | --- | --- |
| `apps/desktop/src/main/user-data-path.ts` | `process.platform === 'win32'`（:54） | Windows 走 localAppData→Local；macOS/Linux 走 `userData`（user-data 目录布局） | **OS** |
| `apps/desktop/scripts/user-data-paths.mjs` | `process.platform === 'win32'` / `'darwin'` / else（:16,:20） | 解析 APPDATA / Application Support / XDG_CONFIG_HOME（unset 用户数据目录） | **OS** |
| `apps/desktop/src/main/modules/autolaunch/auto-launch-manager.ts` | `process.platform === 'darwin'`（:65,:101,:124,:152,:195） | macOS 用 `setLoginItemSettings`/`getLoginItemSettings`；win/linux 用 `auto-launch`（动态 import，导入/实例化失败优雅降级） | **OS** |
| `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-git.runtime.ts` | `process.platform === 'win32' ? 'NUL' : os.devNull`（:23） | 为 Git 提供 Git 可接受的 null 配置文件路径（Windows Git 不吞 `\\.\nul`，用 `NUL`） | **OS**（Residual 1332） |
| `apps/desktop/src/main/utils/app-icon.ts` | `process.platform === 'win32'` / `'darwin'`（:77,:84,:101,:118,:121,:129） | window/tray/guid 图标分支 | **OS** |
| `apps/desktop/src/main/lifecycle/app-lifecycle.ts` | `process.platform !== 'darwin'`（:108） | `window-all-closed`：macOS 常驻，非 macOS `app.quit()` | **OS** |
| `apps/desktop/src/main/modules/routine/windows-idle-sensor.adapter.ts` | （无 `process.platform` 分支） | 命名带 “Windows”，实现却是共享 Electron：经注入 `capability`（默认 `powerMonitor.getSystemIdleTime`）读取；未证明 WSL 下 Windows-host idle 语义 | **Sh**（共享 Electron） |

> 结论：全部 6 处 `process.platform` 命中均位于 `utils/`、`scripts/`、`lifecycle/` 与能力/适配
> 模块，**没有任何 feature/domain/controller/UI 文件**引用 `process.platform`。未发现 feature 层平台泄漏
> （`grep` 未在 feature 目录出现，只有 `lifecycle/app-lifecycle.ts` 的 `window-all-closed` 退出策略、
> `utils/`、`scripts/` 与 git/autolaunch adapter 触及）。`window-manager.ts`、
> `desktop-chrome.ts`、`notification.service.ts`、`auto-update-manager.ts`、`main.ts`（`powerMonitor`）等
> 均为纯跨平台调用。

## 3. Package / release matrix（包与发布矩阵）

| 文件 | 声明内容 | 目标平台 |
| --- | --- | --- |
| `apps/desktop/electron-builder.json5` | electron-builder 配置 | macOS：dmg+zip；Windows：nsis+zip（x64）；Linux：AppImage+deb+rpm；publish GitHub（BakerSean168/memoflow）；`npmRebuild:true`；`electronVersion 43.1.0` |
| `apps/desktop/package.json` | 依赖：`electron 43.1.0`（dev）、`electron-builder 26.15.6`（dev）、`electron-updater 6.8.9`（dev）、`auto-launch 5.0.6`（dev）、`chokidar`（dev）、`better-sqlite3 12.11.1`、`electron-log`（dev）、`gray-matter 4.0.3` | 三平台默认 |
| `package.json`（workspace root） | dev 依赖：`@playwright/test 1.61.1`（:151） | 三平台默认（Playwright E2E 由 workspace root 声明，不在 `apps/desktop/package.json`） |
| `apps/desktop/project.json` | Nx targets：`build`、`serve`、`serve-safe`、`package`（`--dir`）、`dist`（`--win`/`--linux`）、`native-rebuild`（`electron-builder install-app-deps`）、`typecheck` | Windows/Linux native rebuild |
| `.github/workflows/release-assets.yml` | release lane：matrix `windows-latest`（`--win --x64`）与 `ubuntu-latest`（`--linux AppImage deb rpm --x64`）；Windows 需要 MSBuild，Linux 需要 `rpm fakeroot`；上传 `Setup.exe/Setup.zip/*.blockmap/AppImage/deb/rpm/latest*.yml` | Windows + Linux（无 macOS runner） |
| `apps/desktop/test-support/electron.stub.ts` | stub `Tray`/`Menu`、`globalShortcut`、`safeStorage`、`Notification`、`powerMonitor`、`nativeTheme` 供测试 | — |

> 注意：CI 仅覆盖 Windows + Linux，macOS 只有 electron-builder 目标、无 runner；且 CI 未在
> WSLg host 上跑。这与 ADR-066 / active plan 的“Linux 桌面（含 WSLg）为验证主链”一致，但
> 也意味着 macOS 与 WSLg 需要在目标机器上用 `pnpm nx run desktop:serve-safe` 补充本地验证。

## 4. Host / WSL / display status（host 与显示服务器现状）

- 目前**没有**任何 WSL/host 运行时检测或 host 专属分支：全仓 `grep`（`WSL_DISTRO_NAME`、
  `WSL_INTEROP`、`WAYLAND_DISPLAY`、`XDG_SESSION_TYPE`、`/proc/version`、`is_wsl`）在
  `apps/desktop`、`packages` 中**无任何命中** → ADR-066 的 `host=wsl` 与 display=`x11`/`wayland`/
  `headless` 模型**尚未在运行时实现**。当前 runtime 完全依赖 Electron 跨平台原语（`Tray`、
  `globalShortcut`、`Notification`、`safeStorage`、`powerMonitor`、`BrowserWindow`、`dialog`、
  `shell`），这些原语在 Linux 上由 Chromium/Electron 负责 X11/Wayland 适配，因此 feature 层目前
  无需任何 host/display 开关。
- 注意区分 **OS 分支** 与 **host 集成**：Git 的 `NUL`/`os.devNull` 与 `user-data-path` 的
  localAppData 布局都是标准的 `process.platform==='win32'` **OS 分支**，不是对 Windows host 的
  集成。在 WSLg（`os=linux`）下它们自然走 Linux 路径（`/dev/null` 与 `userData`），不会进入
  Windows UNC bridge。
- WSLg 下的 idle 语义同样**未验证**：`windows-idle-sensor.adapter.ts` 走 Electron `powerMonitor`
  （见 F12），而 WSLg 主机为 Windows 时 `getSystemIdleTime` 的语义需要 future host-overlay 工作
  在目标机器上补充验证，本清单不做断言。

## 5. Findings & inventory verdicts（盘点结论，全部带代码证据）

1. **Tray**（`tray-manager.ts`）：Electron 原生 `Tray`/`Menu`；仅在 Windows 返回 `{guid}`
   （`app-icon.resolveTrayIcon`，`process.platform==='win32'`）。对外一概为 `Sh`，Windows GUID 属
   OS 级细节且已被 `app-icon.ts` 隔离。
2. **Shortcut** — `globalShortcut` + `CommandOrControl`，跨平台 `Sh`。
3. **AutoLaunch** — macOS（`app.getLoginItemSettings`/`setLoginItemSettings`）与 Win/Linux
   （`auto-launch`，动态 import，导入或实例化失败时记录警告并优雅降级返回）→ **OS**。
   `auto-launch` 已声明在 `apps/desktop/package.json` 的 `devDependencies`（`5.0.6`），非可选包。
   Boundary = macOS 登录项 API vs Win/Linux（Windows registry / Linux Autostart）。
4. **Notification** — `Notification.isSupported()` + DND + 自定义管理 → **Sh**/OS guard。
5. **Auto-update** — `electron-updater`（动态 import，`!app.isPackaged` 守卫）→ **Sh**。
6. **Window/screen** — `BrowserWindow` + `screen` 状态持久化 → **Sh**。
7. **Routine idle & focus-progress** — `powerMonitor.getSystemIdleTime()`（共享 Electron）与
   `setProgressBar()`（共享 Electron；Windows taskbar、macOS Dock、受支持 Linux 环境展示，随平台
   呈现）。`FocusTaskbarIntegrationPort` 在 `focus-window-controller.ts:16` 定义，由
   `ElectronFocusTaskbarAdapter` 实现。adapter 名为 Windows-first 属历史命名误导，实现无
   `process.platform` 分支，且 `capability` 可注入已隔离。
8. **Local Vault** — `local-vault-runtime.ts`：`dialog`/`shell`（Electron-only）；路径校验（相对、含路径）防止逃脱 → **Sh**。
9. **Git runtime** — `spawn('git')` + `SAFE_GIT_CONFIG_GLOBAL` `win32→'NUL'`（Residual 1332 的修正，
   即 Windows Git 不接收 `\\.\nul`，改用 Git 接受的 `NUL`）；这是 Git runtime 内部的一个 **OS** 细节
   （见 §2/§4），并非应用的“唯一 OS 分支”——§2 的 OS 分支表还列出 user-data、user-data-paths、
   auto-launch、app-icon、app-lifecycle 等。`GIT_CONFIG_NOSYSTEM`/global sandboxing 为共享。
10. **Auto-sync watcher** — `chokidar` + debounce/stability + ignore list（`.git`/`.memory-flow`/`.obsidian`/`.trash`/`.Trash`/`node_modules`）→ **Sh**。
11. **Secrets** — `safeStorage`（Profile key + cloud session）→ **Sh**（Electron 抽象 OS-aware 存储）。

## 6. Out of scope（本清单为 READ-ONLY，不动生产代码）

- 未改动任何 `apps/`、`packages/` 生产代码。
- PLAT-0002（feature ports 落地）未开启。
- 无任何条目被设为“仅 Windows”，均以真实分支证据标注（见 §2）。

## 7. Evidence trail（已核对的真实文件）

- `apps/desktop/src/main/modules/tray/tray-manager.ts`
- `apps/desktop/src/main/modules/shortcuts/shortcut-manager.ts`
- `apps/desktop/src/main/modules/autolaunch/auto-launch-manager.ts`
- `apps/desktop/src/main/services/notification.service.ts` + `custom-notification.manager.ts`
- `apps/desktop/src/main/modules/auto-update/auto-update-manager.ts`
- `apps/desktop/src/main/lifecycle/window-manager.ts`（+ `.surface.spec.ts`）
- `apps/desktop/src/main/lifecycle/desktop-chrome.ts`
- `apps/desktop/src/main/modules/routine/electron-focus-window.host.ts`、`electron-intervention-window.host.ts`、`focus-window.electron-module.ts`、`intervention-window.electron-module.ts`、`focus-window-taskbar.adapter.ts`、`focus-window-controller.ts`
- `apps/desktop/src/main/lifecycle/app-lifecycle.ts`
- `apps/desktop/src/main/modules/window/window-state-manager.ts`
- `apps/desktop/src/main/modules/routine/windows-idle-sensor.adapter.ts`
- `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-git.runtime.ts`
- `apps/desktop/src/main/modules/repository/desktop-knowledge-repository-auto-sync.scheduler.ts`
- `apps/desktop/src/main/profile/profile-key-store.ts`
- `apps/desktop/src/main/profile/cloud-session-store.ts`
- `packages/repository/src/electron/local-vault-runtime.ts`
- `apps/desktop/src/main/utils/app-icon.ts`
- `apps/desktop/src/main/user-data-path.ts`
- `apps/desktop/scripts/user-data-paths.mjs`
- `docs/architecture/adr/ADR-066-desktop-platform-capability-and-host-environment.md`
- 验证工具：`tools/docs/check-docs-config.mjs`（docs-check）、`tools/governance/file-naming-audit.mjs`（governance file-naming audit）；git `diff --check`（见 §8 Validation）

## 8. Validation（本次修复的验证证据）

PLAT-0001 candidate `cff44d4c729` consolidated-repair 之后，对本文档只做了内容修正，未改任何
生产代码。验证如下（均在本仓库当前工作区运行）：

- `git diff --check` → 通过（无空白错误）。
- `node tools/docs/check-docs-config.mjs`（docs-check）→ `[governance-check] passed.`
- 相关 governance audits（docs-only 可聚焦运行）：
  - `node tools/governance/file-naming-audit.mjs` → `[file-naming-audit] passed. audited 2434 file(s).`
  - `node tools/governance/desktop-runtime-locator-audit.mjs` → `passed: no new runtime locator patterns in desktop main`
  - `node tools/governance/platform-leakage-audit.mjs` → `passed: no platform leakage in shared packages`
  - `node tools/governance/vitest-no-tests-audit.mjs` → `passed (66 config files, 24 root projects)`
  - `node tools/test/test-target-governance.mjs --check` → `[test-target-governance] check passed.`
- 完整 `governance:check`（`pnpm nx run memoflow:governance-check`）**未运行**：仓库未安装
  依赖（无 `node_modules`，`nx`/`fast-glob` 等不可用），其 `test:inventory` 前置脚本即因此
  以 `ERR_MODULE_NOT_FOUND: Cannot find package 'fast-glob'` 失败。该失败系环境缺依赖所致，
  与本次仅文档改动无涉，且 baseline（candidate `cff44d4c729`）工作区同样无依赖、无法运行完整
  governance 基线；本次未引入任何测试或生产代码变更，故不存在“过期测试清单（stale test
  inventory）回归”。
</content>
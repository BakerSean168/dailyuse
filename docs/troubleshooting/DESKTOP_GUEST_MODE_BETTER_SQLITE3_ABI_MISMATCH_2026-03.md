# Desktop 访客模式 `better-sqlite3` ABI 不匹配排查笔记

## 现象

`desktop` 应用已经能启动，但进入访客模式时报错失败。日志中的关键报错有两类。

第一类是原生绑定缺失：

```text
Could not locate the bindings file. Tried:
...
better_sqlite3.node
```

第二类是更进一步的 ABI 不匹配：

```text
The module '...better_sqlite3.node' was compiled against a different Node.js version
using NODE_MODULE_VERSION 137. This version of Node.js requires NODE_MODULE_VERSION 140.
```

表面上看，都是访客模式失败；本质上是 `PowerSync -> better-sqlite3` 的 Electron 原生模块绑定状态异常。

## 影响范围

- 访客模式失败
- 本地 PowerSync 数据库无法打开
- 依赖本地 SQLite 的桌面能力无法正常工作

## 调用链定位

访客模式入口在：

- `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts:605`

关键逻辑：

- `enterGuestMode()` 会调用 `openPowerSyncLocalOnly()`
- `openPowerSyncLocalOnly()` 位于 `apps/desktop/src/main/database/powersync.ts`
- `powersync.ts` 使用 `@powersync/node`
- `@powersync/node` 在 worker 中动态加载 `better-sqlite3`

也就是说，这不是“访客账号逻辑”本身的问题，而是访客模式正好触发了本地 PowerSync 数据库初始化，从而暴露了 `better-sqlite3` 原生模块问题。

## 第一个根因：`better-sqlite3` 根本没被构建

最初的日志是：

```text
Could not locate the bindings file
```

检查后发现：

- `node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3` 存在
- 但里面没有 `build/Release/better_sqlite3.node`

继续追配置，发现根 `package.json` 里：

- `pnpm.ignoredBuiltDependencies` 包含了 `better-sqlite3`
- `pnpm.onlyBuiltDependencies` 只有 `electron` 和 `msw`

而 `better-sqlite3` 自身的安装脚本是：

```json
"install": "prebuild-install || node-gyp rebuild --release"
```

这意味着：

- 只要 pnpm 把它视为“禁止构建”的依赖
- 它的安装脚本就不会执行
- 自然也不会生成 `better_sqlite3.node`

### 处理

调整根 `package.json`：

- 从 `ignoredBuiltDependencies` 中移除 `better-sqlite3`
- 加入 `onlyBuiltDependencies`

随后执行：

```bash
pnpm install --force
```

这一步之后，`better-sqlite3` 成功生成了 `build/Release/better_sqlite3.node`。

## 第二个根因：绑定是给宿主 Node 编的，不是给 Electron 编的

生成 `.node` 文件后，访客模式仍然失败，报错升级为：

```text
The module was compiled against a different Node.js version using NODE_MODULE_VERSION 137.
This version of Node.js requires NODE_MODULE_VERSION 140.
```

这说明问题已经不是“文件不存在”，而是“文件存在但编错了目标 ABI”。

### 为什么会这样

当前环境里有两个运行时：

1. 宿主 Node.js
2. Electron 内嵌的 Node.js

这两个运行时虽然都叫 Node，但 ABI 版本不一定相同。

在这次环境里：

- 外部 Node 24 的 `NODE_MODULE_VERSION` 是 `137`
- Electron 39 运行时要求的是 `140`

而 `pnpm install --force` 生成出来的 `better_sqlite3.node`，默认是给宿主 Node 用的，因此是 `137`。

但真正加载它的是 Electron 主进程 / PowerSync worker，所以 Electron 期待的是 `140`。

结果就是：

- 文件在
- 路径也对
- 但加载时报 ABI mismatch

## 为什么常规 `electron-rebuild` 没立即解决

中间尝试过直接运行：

```bash
pnpm exec electron-rebuild -v 39.2.6 -o better-sqlite3
```

表面看是成功了，但实际产物时间戳没有变化，`.forge-meta` 也没有生成。

原因不是 `electron-rebuild` 完全不可用，而是它在 monorepo + pnpm + workspace 场景下，默认扫描路径和真正需要重建的模块物理路径并不完全一致，导致“命令成功退出”但没有实际改到目标模块目录。

此外，直接从工作区根运行时，还会被其它 workspace 包路径干扰，例如：

```text
ENOENT: no such file or directory, stat '...apps/api/node_modules/@prisma/client'
```

## 最终有效修复

最终采用的是更直接的做法：

- 使用 `@electron/rebuild` 的 JS API
- 显式指定 `projectRootPath`
- 直接对真实的 `better-sqlite3` 物理目录执行重建

核心思路不是“让 electron-rebuild 自己猜”，而是：

- 明确告诉它桌面项目根目录是什么
- 明确告诉它 monorepo 根目录是什么
- 明确告诉它真正要重建的模块目录是什么

修复后再次检查：

- `better_sqlite3.node` 时间戳更新
- `build/Release/.forge-meta` 出现
- `.forge-meta` 内容为：

```text
x64--140
```

这个值非常关键，表示当前产物已经是：

- `x64`
- Electron 39 对应 ABI `140`

也就是访客模式真正需要的版本。

## 这次事故的完整演进

可以把这次问题拆成两个阶段：

### 阶段一：绑定缺失

- 症状：`Could not locate the bindings file`
- 根因：`better-sqlite3` 被 `pnpm.ignoredBuiltDependencies` 禁掉
- 修复：修改 pnpm 配置并重新安装依赖

### 阶段二：绑定 ABI 错误

- 症状：`NODE_MODULE_VERSION 137` vs `140`
- 根因：模块是为宿主 Node 编译的，不是为 Electron 编译的
- 修复：对真实模块路径执行 Electron ABI 定向重建

## 结论

这次访客模式失败，不是认证逻辑问题，也不是 PowerSync 业务逻辑问题，而是 Electron 原生模块装配问题，具体是两层：

1. `better-sqlite3` 一开始没有被允许构建
2. 后来虽然构建出来了，但构建目标是宿主 Node ABI，而不是 Electron ABI

最终修复条件必须同时满足：

- pnpm 允许 `better-sqlite3` 执行安装脚本
- `better-sqlite3.node` 必须按 Electron 当前 ABI 重建

## 可复用排查顺序

下次遇到 Electron 原生模块问题，可以按这个顺序排查：

1. 先看报错是“文件不存在”还是“ABI 不匹配”
2. 检查模块目录下是否存在 `build/Release/*.node`
3. 检查根 `package.json` 的 `pnpm.ignoredBuiltDependencies` / `onlyBuiltDependencies`
4. 如果 `.node` 已存在，再判断它是给宿主 Node 编的，还是给 Electron 编的
5. 使用 Electron ABI 重建，而不是只做普通 `pnpm install`
6. 检查 `.forge-meta` 是否写成目标架构 + 目标 ABI

## 一句话总结

这次 `desktop` 访客模式失败的根因，是 `better-sqlite3` 先被 pnpm 禁止构建、后又被错误地编译成宿主 Node ABI，最终导致 Electron 加载本地 SQLite 原生模块时失败。

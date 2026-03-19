# Desktop `spawn UNKNOWN` 排查笔记

## 现象

在执行 `pnpm nx serve desktop` 时，Vite 构建已经完成，但桌面应用没有正常启动，终端报错：

```text
Error: spawn UNKNOWN
    at ChildProcess.spawn
    at spawn
    at startup (...vite-plugin-electron/dist/index.js:299:25)
```

同时 Nx 输出：

```text
NX Cancelled running target serve for project desktop
```

## 初步判断

从日志看，`dist-electron/index.cjs` 和 `dist-electron/main.cjs` 已成功产出，说明问题不在业务代码编译阶段，而是在 `vite-plugin-electron` 尝试拉起 Electron 进程时失败。

也就是说：

- `vite build` 成功
- Electron 主进程/预加载打包成功
- 失败发生在 `spawn(electronPath, argv)` 这一步

## 相关定位

### 1. Nx `desktop:serve` 的实际行为

`apps/desktop/project.json` 中，`serve` 目标实际执行的是：

```json
{
  "command": "vite",
  "cwd": "apps/desktop"
}
```

### 2. Vite 配置中启用了 Electron 自动启动

`apps/desktop/vite.config.ts` 使用了：

```ts
import electron from 'vite-plugin-electron/simple';
```

这意味着开发模式下，Vite 在构建完成后会自动调用 `vite-plugin-electron` 启动 Electron。

### 3. 插件内部失败点

`vite-plugin-electron` 内部会执行类似逻辑：

```js
process.electronApp = spawn(electronPath, argv, {
  stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
});
```

报错正是从这里抛出，说明问题不是前端资源构建失败，而是 Electron 可执行文件无法被 Node 正常拉起。

## 排查过程

### 第一步：确认 Electron 路径是否能解析

先验证 `require('electron')` 的返回值。

结果显示它能正确解析到：

```text
D:\home\projects\dailyuse\node_modules\.pnpm\electron@39.2.6\node_modules\electron\dist\electron.exe
```

结论：

- `electron` 包元数据存在
- Node 模块解析正常
- 路径字符串本身不是空值或 `undefined`

### 第二步：确认 Electron 二进制文件是否存在

进一步检查文件系统，确认以下文件存在：

- `node_modules/electron/dist/electron.exe`
- pnpm 实际存放路径下的 `electron.exe`

文件存在，且体积正常，说明不是“文件完全丢失”的情况。

### 第三步：直接复现 `spawn` 失败

用独立的 Node 脚本直接执行：

```js
const { spawn } = require('node:child_process');
const p = require('electron');
spawn(p, ['--version']);
```

结果仍然报：

```text
Error: spawn UNKNOWN
```

但对 `cmd.exe`、`where.exe` 之类系统程序做同样的 `spawn` 测试是成功的。

结论：

- 不是 Node 的 `spawn` 整体不可用
- 不是工作区路径导致所有子进程都失败
- 问题聚焦在 Electron 可执行文件本身或其安装状态

### 第四步：尝试直接运行 Electron 可执行文件

通过 PowerShell 直接运行 `electron.exe --version`，没有正常得到版本输出，提示应用程序无法启动。

这说明：

- 即使文件存在，也不代表当前这个可执行文件处于可正常执行状态
- 问题更像是 Electron 安装产物损坏、未完全安装，或被异常中断后处于不可执行状态

### 第五步：先尝试轻量修复

先执行了：

```bash
pnpm rebuild electron
```

`postinstall` 重新跑了，但问题依旧。

结论：

- 仅重跑当前包的安装脚本不足以修复
- 说明问题可能已经扩散到 pnpm store 缓存或当前安装产物本身

### 第六步：清理 store 并强制重装

执行：

```bash
pnpm store prune
pnpm install --force
```

重装完成后，再次验证：

- `spawn(require('electron'), ['--version'])` 成功
- 输出 `v39.2.6`
- `desktop` 可以重新运行

## 根本原因

这次事故的根因可以归纳为：

> Electron 安装产物处于异常状态，文件虽然存在，但可执行文件无法被正常启动；在清理 pnpm store 并强制重装后恢复正常。

结合你提供的背景，“昨天直接关机”很可能就是诱因。

比较合理的事故链路是：

1. 关机时正好处于依赖安装、写入缓存、或 Electron 二进制处理过程
2. `node_modules` / pnpm store 中保留了部分已写入的元数据和文件
3. `electron.exe` 路径还能解析，文件也还在
4. 但该二进制已处于损坏或不完整状态，导致 Node `spawn` 时出现 `UNKNOWN`
5. 仅 `rebuild electron` 不足以恢复，因为缓存层也可能带着坏数据
6. 清理 store 后强制重装，拿到一份完整的新安装产物，问题消失

## 为什么不是业务代码问题

有几个证据可以排除业务代码：

- 构建成功，说明 TypeScript、Vite、Rollup 配置没有在本次故障中直接失败
- 错误堆栈落在 `vite-plugin-electron` 的 `spawn` 逻辑，而不是项目源码模块
- 独立 Node 脚本直接 `spawn(require('electron'))` 也失败，证明问题在 Electron 启动层
- 重装依赖后未改任何业务代码，故障直接消失

## 最终修复方案

本次有效修复步骤：

```bash
pnpm store prune
pnpm install --force
```

如果只想先做最小修复，也可以先尝试：

```bash
pnpm rebuild electron
```

但本次案例中，这一步不够。

## 经验总结

### 1. `spawn UNKNOWN` 不一定是路径不存在

在 Windows 下，`spawn UNKNOWN` 经常意味着目标程序存在，但无法被正常执行。不能只检查“文件在不在”，还要验证“能不能真正跑起来”。

### 2. Electron 问题要分清“构建阶段”和“启动阶段`

这次构建是成功的，失败在启动阶段。排查思路应该优先落在：

- `require('electron')` 解析结果
- `electron.exe` 是否存在
- `spawn(require('electron'))` 能否独立复现
- 直接运行 `electron.exe` 是否正常

### 3. 强制关机后要优先怀疑二进制依赖和缓存

源码损坏通常会表现为：

- 语法错误
- 模块解析错误
- 构建失败

而二进制依赖损坏通常会表现为：

- 可执行文件存在但无法启动
- `spawn` 异常
- 重装依赖后恢复

这次明显更符合后者。

## 建议的标准排查顺序

下次再遇到同类问题，可以按这个顺序处理：

1. 执行 `node -e "console.log(require('electron'))"`，确认解析路径
2. 确认 `electron.exe` 是否存在
3. 用独立 Node 脚本测试 `spawn(require('electron'), ['--version'])`
4. 如果失败，先尝试 `pnpm rebuild electron`
5. 仍失败则执行 `pnpm store prune && pnpm install --force`
6. 若还是失败，再检查杀毒软件隔离、权限、Node 版本兼容性

## 本次结论一句话版

这次 `desktop` 启动失败不是代码问题，而是 Electron 安装产物损坏；高概率与异常关机有关，最终通过清理 pnpm store 并强制重装依赖修复。

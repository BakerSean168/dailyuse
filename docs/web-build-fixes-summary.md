# 解决 pnpm nx serve web 构建失败问题的总结文档

## 背景

在尝试运行 `pnpm nx serve web` 启动 `web` 应用时，遇到了一系列与构建配置、类型依赖、模块解析以及内存溢出等相关的报错。经过深入分析与排查，我们最终解决了所有问题。这篇文档详细记录了解决这些问题的根因及优雅的修复方法。

## 问题分类与修复方法

### 1. `nx` 命令未找到错误

**现象:**
运行 `pnpm nx serve web` 时报错 `Command "nx" not found`。

**根因:**
工作区的根目录未包含全局或本地可执行的 `nx` CLI，导致命令失败。

**修复:**
将 `nx` 包作为开发依赖安装到工作区根目录：
```bash
pnpm add nx -w
```

### 2. tsup 构建期间发生的 "JS Heap Out of Memory" 错误

**现象:**
当 Nx 开始并行构建底层包（例如 `account`、`authentication`、`editor` 等）时，生成类型定义 (`dts: true`) 时导致 Node.js 进程内存溢出 (`ERR_WORKER_OUT_OF_MEMORY`)。

**根因:**
TypeScript 和 tsup 在并行解析大量复杂的项目图（如 Prisma Client、大型 Monorepo 别名）时，默认的 V8 堆内存（约 2GB）不足。

**修复:**
为 Node.js 进程配置更高的旧空间内存限制（例如 8GB），或者在环境中注入配置：
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

### 3. Radix-Vue 无法解析的错误 (在 `ui-vue-shadcn` 包中)

**现象:**
执行 `ui-vue-shadcn:build` 时 Vite 提示找不到 `radix-vue`。

**根因:**
`ui-vue-shadcn` 组件库中导入了 `radix-vue` 但是该依赖并未在其 `package.json` 中被声明。

**修复:**
为该包添加缺失的依赖：
```bash
pnpm add radix-vue -F ui-vue-shadcn
```

### 4. `apps/desktop` 构建时找不到 `vite-plugin-electron` 错误

**现象:**
Nx 项目图尝试处理 `apps/desktop` 时报错 `Cannot find package 'vite-plugin-electron'`。

**根因:**
在桌面端项目的 `vite.config.ts` 中引入了 `vite-plugin-electron` 和 `vite-plugin-electron-renderer`，但是并未安装。

**修复:**
将相应的插件安装到工作区：
```bash
pnpm add -D vite-plugin-electron vite-plugin-electron-renderer -w
```

### 5. `http-client` 以及其他多个模块缺少类型依赖

**现象:**
多个底层基础设施包在生成 DTS 类型定义时报错，例如找不到 `axios`、`express` 或 `better-sqlite3`。

**根因:**
模块中的接口中使用了来自这些库的隐式类型。由于使用了独立构建 (tsup)，编译器需要这些基础库的 `@types` 定义进行 DTS 导出。

**修复:**
在工作区补充缺失的开发依赖：
```bash
pnpm add -D axios @types/axios @types/express express better-sqlite3 @types/better-sqlite3 -w
```

### 6. 模块间互相引用的配置与类型错误

**6.1. Goal 模块中的类型转换冲突**
- **现象:** `goal` 模块中，`weight-snapshot-prisma.repository.ts` 在操作 Prisma Client 时报错 `snapshotTime` 的类型不兼容（Prisma 要求 `Date`，但是 Domain 层提供的是 `number`）。
- **根因:** 实体转换逻辑由于时间类型的差别出现冲突，尝试转换 Prisma DateTime 时出错。
- **修复:** 修改 `PrismaWeightSnapshotMapper.ts` 的 `toPrisma` 方法，将 `snapshotTime` 字段用 `new Date(dto.snapshotTime)` 显式包装。

**6.2. Authentication 模块中的模块解析错误**
- **现象:** 编译 `authentication` 时报错 `Cannot find module '@dailyuse/domain-shared'`。
- **根因:** 在聚合根 `auth-identity.ts` 的导入路径被错误指向为 `'@dailyuse/domain-shared/shared'`，但在 tsconfig.base.json 的别名映射中，该标识符应该从 `'@dailyuse/domain-shared'` 直接导出。
- **修复:** 清理 `packages/authentication/src/domain-server` 目录下的相关文件，确保使用标准和统一的 `@dailyuse/domain-shared` 路径导入 `IdentityId`。

### 7. Vite 与 `@powersync/web` Web Worker 配置错误

**现象:**
执行最终的 `web:build` 时，出现 Rollup 解析器错误：
`[commonjs--resolver] Invalid value "iife" for option "worker.format" - UMD and IIFE output formats are not supported for code-splitting builds.`

**根因:**
`@powersync/web` 的底层依赖 `@journeyapps/wa-sqlite` 中使用了 Web Worker，而 Vite 的默认 Worker 配置不支持为代码分割构建生成 IIFE 格式。

**修复:**
对 `apps/web/vite.config.ts` 进行配置升级，显式指定 Worker 的构建格式为 ES 模块，加入 WASM 和顶层 await 支持，并把问题包加入预构建白名单中：
1. 安装支持插件：
   ```bash
   pnpm add -D vite-plugin-wasm vite-plugin-top-level-await --filter web
   ```
2. 修改 `vite.config.ts`：
   ```typescript
   import wasm from 'vite-plugin-wasm';
   import topLevelAwait from 'vite-plugin-top-level-await';

   export default defineConfig({
     worker: {
       format: 'es',
     },
     optimizeDeps: {
       exclude: ['@powersync/web', '@journeyapps/wa-sqlite']
     },
     plugins: [
       // ... 其他插件
       wasm(),
       topLevelAwait()
     ],
     build: {
       target: 'esnext'
     }
   })
   ```

## 总结

此问题暴露了在大型 Monorepo 开发中，配置工具（Nx, Vite, tsup）对并行内存占用、TypeScript 配置一致性以及依赖项完整性的高要求。
通过补齐依赖、配置更大的可用内存、修正代码中对时间的转换和导入路径，以及在 Vite 中专门调整对 Worker/WASM 的打包行为，我们构建成功了前端并打通了所有底层包。
# API `tsx` 启动误解析到 `.d.ts` 的根因与修复方案

## 现象

执行：

```bash
pnpm nx serve api
```

报错：

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'D:\home\projects\dailyuse\packages\authentication\dist\device-info-Cm3f7Q_Y.js'
imported from
'D:\home\projects\dailyuse\packages\authentication\dist\api\index.d.ts'
```

同时 Nx 输出：

```text
Warning: command "node ../../node_modules/tsx/dist/cli.mjs watch src/main.ts"
exited with non-zero status code
```

## 结论

这是一个配置问题，而且问题在 `apps/api` 的 `tsconfig` 路径别名设计，不在 `@dailyuse/authentication` 的 `package.json exports` 设计本身。

更准确地说：

- `api` 的开发运行时是 `tsx watch`
- `tsx` 会参考 `tsconfig` 的 `paths`
- `apps/api/tsconfig.json` 把多个运行时包直接映射到了 `dist/*.d.ts`
- 结果运行时把声明文件当成 ESM 模块去加载
- 声明文件内部又带有只对类型系统成立的 `.js` 导入引用
- Node 运行时最终尝试加载一个并不存在的哈希 JS 文件并崩溃

所以本质不是“authentication 少打了一个文件”，而是“运行时被错误地引到了类型文件”。

## 关键证据

### 1. `api` 的 `serve` 确实直接用 `tsx` 跑源码

`apps/api/project.json`:

```json
{
  "command": "node ../../node_modules/tsx/dist/cli.mjs watch src/main.ts"
}
```

这不是先构建再运行 `dist/main.js`，而是开发态直接执行源码。

### 2. `apps/api/tsconfig.json` 把多个包映射到了 `.d.ts`

当前存在这类映射：

```json
"@dailyuse/authentication": ["../../packages/authentication/dist/index.d.ts"],
"@dailyuse/authentication/api": ["../../packages/authentication/dist/api/index.d.ts"]
```

同类映射还存在于：

- `@dailyuse/governance`
- `@dailyuse/account`
- `@dailyuse/goal`
- `@dailyuse/reminder`
- `@dailyuse/setting`
- `@dailyuse/task`
- `@dailyuse/ai`

这说明问题不是单点异常，而是一类系统性风险。

### 3. `@dailyuse/authentication` 自身的包导出其实是正常的

`packages/authentication/package.json`:

```json
"./api": {
  "types": "./dist/api/index.d.ts",
  "import": "./dist/api/index.js"
}
```

这正是一个标准的 ESM 包导出：

- 类型走 `.d.ts`
- 运行时走 `.js`

如果运行时按正常包解析走 `exports`，不会去执行 `index.d.ts`。

### 4. 出问题的是 `dist/api/index.d.ts` 被拿去当运行时代码执行了

`packages/authentication/dist/api/index.d.ts` 中包含：

```ts
import '../device-info-Cm3f7Q_Y.js';
```

而 `packages/authentication/dist/` 实际存在的是：

```text
device-info-Cm3f7Q_Y.d.ts
```

不存在同名 `.js` 文件。

这在类型世界里并不奇怪。
声明文件生成器会为了 ESM 兼容保留 `.js` 风格的导入说明，但前提是这个文件只被 TypeScript 当“声明文件”读取，而不是被 Node 当“运行时代码”执行。

## 为什么这是配置问题

仓库已经有明确的 ADR：

- `docs/architecture/adr/ADR-028-workspace-package-resolution-strategy.md`

其中核心原则是：

- `tsconfig` 负责编译期源代码可见性
- `package.json exports` 负责运行时和构建时包边界
- 最终 build/runtime 应该验证真实的包输出，而不是把类型文件当入口

当前 `apps/api/tsconfig.json` 的做法绕过了这条边界：

1. 本应通过 package dependency + `exports` 解析的运行时包
2. 被强行重定向到了 `dist/*.d.ts`
3. 导致开发运行时和真实包边界脱节

这与 ADR-028 的方向相反。

## 优雅的解决方案

### 方案原则

不要把任何“可能被运行时读取到”的路径别名指向 `.d.ts`。

对于 `apps/api` 这类 Node 应用，推荐采用下面的分层规则：

- `@/*` 这类 app 内部别名继续保留
- 少数需要开发态直连源码的包，显式映射到 `src`
- 其余运行时 workspace 包，一律通过 `package.json` 依赖 + `exports` 正常解析

也就是说：

- 可以指向 `src/*.ts`
- 可以不配别名，走包解析
- 不要指向 `dist/*.d.ts`

### 推荐落地方式

修改 `apps/api/tsconfig.json`，删除所有指向 `../../packages/*/dist/*.d.ts` 的路径别名。

保留两类映射即可：

1. app 自己的内部别名

```json
"@/*": ["./src/*"]
```

2. 明确希望开发态走源码的少数包

例如当前已经在这么做的：

```json
"@dailyuse/contracts": ["../../packages/contracts/src/index.ts"],
"@dailyuse/http-client": ["../../packages/http-client/src/index.ts"],
"@dailyuse/utils": ["../../packages/utils/src/index.ts"]
```

而像下面这些 server-side 包：

- `@dailyuse/authentication`
- `@dailyuse/authentication/api`
- `@dailyuse/account`
- `@dailyuse/account/api`
- `@dailyuse/governance`
- `@dailyuse/governance/api`
- `@dailyuse/goal`
- `@dailyuse/reminder`
- `@dailyuse/setting`
- `@dailyuse/task`
- `@dailyuse/ai`

建议移除 `paths` 映射，让它们回到正常包解析。

### 为什么这个方案是优雅的

因为它同时满足四个目标：

1. 开发运行时安全

`tsx` 不会再误执行 `.d.ts`。

2. 包边界真实

`api` 会像真实消费者一样，通过 `@dailyuse/*` 包的 `exports` 使用运行时入口。

3. 与 Nx 现有编排一致

根目录 `nx.json` 已配置：

```json
"serve": {
  "dependsOn": ["^build"]
}
```

这意味着 `pnpm nx serve api` 本来就会先确保依赖包构建完成，再启动 `api`。
既然上游 `dist` 已经由 Nx 负责准备好，就没有必要在 `tsconfig paths` 里手动把导入重定向到 `.d.ts`。

4. 与 ADR-028 一致

开发态是否走源码，应该是显式选择。
构建态和运行时边界，应该由 `exports` 负责。

## 不推荐的方案

### 1. 继续把运行时别名指向 `.d.ts`

这会重复当前问题，且不是只影响 `authentication`。
任何带声明拆分产物的包都可能再次触发类似错误。

### 2. 把别名从 `.d.ts` 改成 `dist/*.js`

这看起来能跑，但不是优雅方案。

原因：

- 类型体验会退化
- IDE/source navigation 变差
- `tsconfig paths` 被滥用于运行时边界控制
- 仍然绕过了 package `exports`

### 3. 只在 `authentication` 包里“补齐缺失哈希 JS”

这属于补症状，不治根因。

即使把当前缺失文件补上，`api` 仍然在执行声明文件，这个设计本身就是错的。

## 建议的最小改动

如果只想快速解堵，最小改动是：

1. 从 `apps/api/tsconfig.json` 删除

```json
"@dailyuse/authentication": ["../../packages/authentication/dist/index.d.ts"],
"@dailyuse/authentication/api": ["../../packages/authentication/dist/api/index.d.ts"]
```

2. 重新执行

```bash
pnpm nx serve api
```

这通常就能让 `api` 回到通过 package `exports` 的正常解析路径。

## 建议的正式改动

建议一次性清理 `apps/api/tsconfig.json` 中所有 `dist/*.d.ts` 映射，而不是只修 `authentication` 两条。

推荐保留：

- `@/*`
- 少数明确要开发态走源码的包

推荐删除：

- 所有指向 `../../packages/*/dist/*.d.ts` 的运行时包映射

## 可选的进一步规范化

如果团队仍然希望保留一种“只校验已构建包 public surface”的检查模式，建议把这个意图显式化，而不是混在开发运行时配置里。

可以考虑：

- 保持 `apps/api/tsconfig.json` 只服务开发运行时
- 另建一个专门的 contract-check 配置或 target
- 让这个检查只在 CI 或显式命令中运行

但这一步是增强项，不是修复当前故障的必需项。

## 最终判断

是，问题来自配置项，而且是 `apps/api/tsconfig.json` 中将运行时包错误映射到 `.d.ts` 的配置问题。

最优修复方向不是修补 `authentication/dist`，而是恢复正确的职责边界：

- 开发态源码解析走 `src`
- 运行时包解析走 `exports`
- 不让 `.d.ts` 出现在运行时路径上

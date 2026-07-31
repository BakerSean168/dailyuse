---
tags:
  - guide
  - development
  - desktop
  - docker
  - nx
  - runtime
description: MemoFlow 本机开发模式、Docker 与宿主服务替换、Desktop 启动和统一命令规范
created: 2026-07-29T00:00:00
updated: 2026-07-29T00:00:00
---

# 本机开发模式与统一命令规范

## 1. 本文解决什么问题

MemoFlow 同时包含 Web、Desktop、API、AI Service、PowerSync、PostgreSQL 和
Redis。开发者可能需要：

- 运行完整 Docker 栈做近生产验证。
- 只修改 Desktop，并复用 Docker 后端。
- 只修改 Web 或 API，并把对应 Docker 容器临时替换为宿主热更新进程。
- 第一次启动 Desktop，确保 `better-sqlite3` 等 Electron 原生模块 ABI 正确。
- 环境已经准备好后，快速进入 Desktop 热更新内环。

过去文档和命令中同时出现过：

```text
pnpm nx serve desktop
pnpm nx dev desktop
pnpm nx run desktop:serve
pnpm nx run desktop:serve:full
```

这些命令外观接近，但实际可能命中 Nx 简写、Vite 推断 target 或项目显式
target，前置任务并不相同。本文建立唯一的日常使用心智。

## 2. 唯一命令心智

### 2.1 单项目：直接运行 Nx target

| 目的 | 规范命令 |
| --- | --- |
| 只启动 API | `pnpm nx run api:serve` |
| 只启动 Web | `pnpm nx run web:serve` |
| 只启动 AI Service | `pnpm nx run ai-service:serve` |
| 安全启动 Desktop | `pnpm nx run desktop:serve-safe` |
| 快速启动 Desktop | `pnpm nx run desktop:serve` |
| Web staging 模式 | `pnpm nx run web:serve --configuration=staging` |

开发启动不再经过根 `package.json` 的 `dev` / `dev:*` scripts 包装层。所有
单项目命令统一使用 Nx 原生显式格式：

```text
pnpm nx run <project>:<target>
```

这使终端命令、Nx task graph、CI 日志和文档使用同一个名称，不需要同时记住
“根脚本名”和“底层 target 名”两套映射。

### 2.2 多项目：使用 Nx `run-many`

同时启动宿主 API + Web：

```bash
pnpm nx run-many -t serve --projects=api,web --parallel=2
```

不提供 `dev:all` 或其他根级组合脚本。Web 与 Desktop 共享前端端口，而且
AI Service 与 API 存在明确的运行依赖；组合哪些项目应直接体现在
`--projects` 参数中。

### 2.3 不支持的开发命令形式

以下形式不再推荐：

```bash
# Nx 的 target/project 位置简写，阅读时容易反转
pnpm nx serve desktop

# 可能命中插件自动推断的 vite:dev，而非项目显式 serve target
pnpm nx dev desktop

# 项目文档不使用裸 nx 或 npx nx
nx run desktop:serve
npx nx run desktop:serve
```

### 2.4 `project:target` 如何阅读

```text
desktop:serve
│       └─ target
└───────── project
```

测试 target 自身可以带冒号，例如：

```text
desktop:test:main
│       └─────── target = test:main
└─────────────── project = desktop
```

日常启动不再暴露 `serve:full` 这类容易被误读为 configuration 的名字。
安全 Desktop target 已统一命名为 `desktop:serve-safe`。

## 3. Desktop 两种启动方式

### 3.1 安全默认

```bash
pnpm nx run desktop:serve-safe
```

依赖关系：

```text
desktop:serve-safe
  → desktop:prepare-dev
      → workspace dependency builds
      → desktop:native-rebuild
          → electron-rebuild better-sqlite3
  → Desktop Vite + Electron
```

适用：

- 第一次拉取或安装依赖后。
- Node、Electron、`better-sqlite3` 或 lockfile 发生变化后。
- 出现 `NODE_MODULE_VERSION` / ABI 不一致错误后。
- 不确定当前原生模块是否为 Electron 编译时。
- 做正式 Desktop 冒烟前。

这是文档、README 和协作沟通中的默认 Desktop 启动命令。

### 3.2 快速内环

```bash
pnpm nx run desktop:serve
```

它只启动 Vite/Electron，不执行依赖项目 build，也不重编译原生模块。

适用：

- 已成功运行过 `pnpm nx run desktop:serve-safe`。
- 此后没有执行会重装原生模块的 `pnpm install`。
- 没有切换 Node/Electron/分支依赖版本。
- 当前只修改 Vue、CSS 或普通 TypeScript 业务代码。

如果快速入口出现以下错误，应停止进程并回到安全入口：

```text
was compiled against a different Node.js version
NODE_MODULE_VERSION ...
```

不要用 `npm rebuild` 或普通 `pnpm rebuild` 代替
`desktop:native-rebuild`，因为模块需要针对 Electron ABI 而不是宿主 Node ABI
编译。

### 3.3 为什么不使用 `pnpm nx dev desktop`

Nx/Vite 插件会自动推断 `vite:dev` target。该 target 不是
`apps/desktop/project.json` 中定义的安全 Desktop 启动链：

- 不依赖 `prepare-dev`。
- 不执行 `native-rebuild`。
- 可能在 UI 出现之前就因原生模块 ABI 失败。

因此该命令不属于 MemoFlow 支持的 Desktop 开发入口。

## 4. 本机端口方案

共享默认端口和 runtime lane 契约以
[`runtime-lanes.md`](./runtime-lanes.md) 为准。

当前工作站在 gitignored `.env.local` 中启用了机器级连续端口：

| 服务 | 宿主端口 | Docker 内部端口 |
| --- | ---: | ---: |
| API | `12136` | `3000` |
| Web / Desktop Vite | `12137` | Web `80` |
| AI Service | `12138` | `8100` |
| PowerSync | `12139` | `8080` |
| PostgreSQL | `12140` | `5432` |
| Redis | `12141` | `6379` |

本机覆盖开关：

```dotenv
LOCAL_DOCKER_MACHINE_PORTS=true
LOCAL_DOCKER_SHARE_DEV_SECRETS=true
```

规则：

- `.env.local`、`.env.development.local` 均由 Git 忽略，不影响其他电脑。
- `pnpm docker:local:*` 会验证端口有效、唯一且不占用共享保留端口。
- Docker 与宿主 dev 使用同一组对外端口；替换服务前必须先停止对应容器。
- Docker 内部服务名和内部端口不变。
- Web 和 Desktop Vite 当前共享 `12137`，不能同时启动。

## 5. 开发模式

## 5.1 模式 A：完整 Docker 近生产验证

用途：

- 发布前验证。
- 验证 Dockerfile、Compose、环境注入和反向代理。
- 用稳定后端测试完整产品。

启动：

```bash
pnpm docker:local:up
```

检查：

```bash
pnpm docker:local:ps
pnpm docker:local:logs
```

访问：

```text
Web        http://localhost:12137
API        http://localhost:12136
AI         http://localhost:12138
PowerSync  http://localhost:12139
```

不要同时启动占用相同端口的宿主服务。

## 5.2 模式 B：Desktop 热更新 + Docker 后端

Desktop Vite 使用与 Docker Web 相同的 `12137`，先停止 Web 容器：

```bash
docker stop memoflow-web-1
pnpm nx run desktop:serve-safe
```

Desktop 通过以下地址使用 Docker 后端：

```text
MEMOFLOW_API_URL=http://localhost:12136/api/v1
```

环境准备完成后的后续启动可以使用：

```bash
pnpm nx run desktop:serve
```

结束后恢复 Docker Web：

```bash
docker start memoflow-web-1
```

该模式不需要启动宿主 API。

## 5.3 模式 C：Web 热更新 + Docker 后端

```bash
docker stop memoflow-web-1
pnpm nx run web:serve
```

Vite 运行在 `12137`，通过本地 proxy 访问 API `12136`。

结束后：

```bash
docker start memoflow-web-1
```

## 5.4 模式 D：API 热更新 + Docker 基础设施

停止 Docker API：

```bash
docker stop memoflow-api-1
pnpm nx run api:serve
```

宿主 API 使用：

```text
API         12136
PostgreSQL  12140
Redis       12141
PowerSync   12139
AI Service  12138
```

本机 Docker 和宿主 dev 的开发 JWT、PowerSync key 与内部服务签名保持一致，
因此宿主 API 可以复用剩余 Docker 服务。

注意：Docker Web 的 Nginx 通过 Docker 网络服务名 `api` 访问 API。停止 API
容器后，Docker Web 不能自动访问宿主 API。测试宿主 API 时应配合
`pnpm nx run web:serve` 或 Desktop，而不是继续使用 Docker Web。

结束后：

```bash
docker start memoflow-api-1
```

## 5.5 模式 E：AI Service 热更新

只停止 AI 容器后，Docker API 仍会尝试通过 Docker 服务名
`ai-service:8100` 访问它，不能自动连接宿主 `12138`。因此 AI 开发推荐同时把
API 切到宿主：

终端一：

```bash
docker stop memoflow-api-1 memoflow-ai-service-1
pnpm nx run ai-service:serve
```

终端二：

```bash
pnpm nx run api:serve
```

结束后：

```bash
docker start memoflow-ai-service-1 memoflow-api-1
```

## 5.6 模式 F：宿主 API + Web

使用 Nx 多项目命令：

```bash
docker stop memoflow-api-1 memoflow-web-1
pnpm nx run-many -t serve --projects=api,web --parallel=2
```

该命令只包含 API + Web，不包含 Desktop 和 AI Service。需要改变组合时直接
修改 `--projects`，不新增根级快捷脚本。

## 6. 单服务替换规则

进行 Docker → 宿主替换时遵循：

1. 确认准备开发的服务。
2. 停止同端口 Docker 容器。
3. 使用对应 `pnpm nx run <project>:serve` 启动宿主服务。
4. 用健康端点确认当前端口来自宿主进程。
5. 完成开发后停止宿主进程。
6. `docker start` 恢复原容器。

禁止：

- 在端口冲突后临时随机改一个未记录端口。
- 同时运行两个 API，让它们消费同一队列或执行同一 cron。
- 认为 Docker Web 能自动代理到宿主 API。
- 认为 Docker API 能自动访问宿主 AI Service。
- 使用 `docker compose down -v` 作为普通服务切换手段。

## 7. 常用命令速查

### 启动

```bash
pnpm nx run api:serve
pnpm nx run web:serve
pnpm nx run ai-service:serve
pnpm nx run desktop:serve-safe
pnpm nx run desktop:serve
pnpm nx run-many -t serve --projects=api,web --parallel=2
```

### Docker

```bash
pnpm docker:local:up
pnpm docker:local:ps
pnpm docker:local:logs
pnpm docker:local:down
```

### 直接 Nx target

```bash
pnpm nx run desktop:native-rebuild
pnpm nx run desktop:typecheck
pnpm nx run desktop:test
pnpm nx run desktop:test:main
pnpm nx run desktop:test:ipc
pnpm nx run api:test
pnpm nx run web:test
```

### 工作区批量操作

批量 target 保留 Nx 原生语法：

```bash
pnpm nx run-many -t lint,typecheck --all
pnpm nx affected -t test
```

这里没有 `project:target`，因为命令本身操作多个项目。

## 8. 排障

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| Desktop 报 `NODE_MODULE_VERSION` | 使用快速/推断入口，原生模块 ABI 未准备 | 停止 Desktop，运行 `pnpm nx run desktop:serve-safe` |
| Desktop 注册请求访问 `localhost:3000` | 没有加载本机 override，或使用旧进程 | 重启 Desktop，确认 `MEMOFLOW_API_URL` |
| `12137` 被占用 | Docker Web、Web Vite、Desktop Vite 中已有一个运行 | 停止对应进程/容器，不改临时端口 |
| API 能连数据库但 publication 创建失败 | 连接了错误 PostgreSQL、权限不足或非 logical WAL | 确认数据库是 `12140` 的 local-docker Postgres |
| Docker Web 在宿主 API 启动后仍报 502 | Nginx 仍查找 Docker 网络里的 `api` | 使用宿主 Web/Desktop，或恢复 Docker API |
| Docker API 无法访问宿主 AI | 容器内仍访问 `ai-service:8100` | 同时将 API 切到宿主 |

### 8.1 Desktop 登录与访客模式同时报错：`better-sqlite3` ABI 不匹配

#### 症状

登录、记住账号自动登录和访客模式都可能出现：

```text
The module '...better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 137. This version of Node.js requires
NODE_MODULE_VERSION 148.
```

上层 IPC 响应可能显示为：

```text
LOGIN_ERROR
GUEST_MODE_ERROR
```

这不是登录接口或访客业务逻辑本身失败。三条路径都会先打开 Profile 对应的
PowerSync SQLite 数据库；数据库初始化失败后，认证壳把底层异常包装成了认证
错误。

实际调用关系：

```text
登录 / 自动登录 / 访客激活
  → 激活 Desktop Profile
  → 打开 PowerSync 本地数据库
  → 加载 better-sqlite3 原生模块
  → ABI 不匹配
  → 包装为 LOGIN_ERROR / GUEST_MODE_ERROR
```

#### 已确认的根因

2026-07-29 在 Windows 开发环境中确认：

| 运行时 | 版本 | `NODE_MODULE_VERSION` |
| --- | --- | ---: |
| 宿主 Node | `24.12.0` | `137` |
| Electron | `43.1.0` | `148` |

当前 hoisted pnpm 工作区只有一个共享原生产物：

```text
node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

该文件不能同时服务于上述两种 ABI：

- 普通 `pnpm install`、Node rebuild 或需要 Node 版本的构建可能将它恢复为
  ABI 137。
- `desktop:native-rebuild` 会将同一个文件编译为 Electron ABI 148。
- Electron 版本可以被 Desktop 加载，但此后宿主 Node 直接加载同一个模块会
  失败；反向操作也一样。

因此这是“共享原生二进制在 Node 与 Electron 之间被覆盖”的运行时冲突，不是
SQLite 数据、账号 Token 或远程认证服务损坏。

#### 当前恢复方式

停止所有 Desktop/Electron 进程，然后使用安全入口：

```bash
pnpm nx run desktop:serve-safe
```

该命令通过 `desktop:serve-safe → desktop:prepare-dev →
desktop:native-rebuild` 针对当前 Electron 重编译 `better-sqlite3`。

也可以单独执行：

```bash
pnpm nx run desktop:native-rebuild
```

成功运行安全入口后，在没有重新安装依赖、切换 Node/Electron 或执行其他
native rebuild 的前提下，后续可以使用：

```bash
pnpm nx run desktop:serve
```

不要按错误信息直接运行 `npm rebuild` 或普通 `pnpm rebuild`。它们通常针对
宿主 Node ABI 编译，会让 Desktop 再次失效。

#### 最小验证方法

仓库当前可使用 Electron 的 Node 模式验证目标 ABI 和 SQLite 加载，不需要操作
登录页面：

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
.\node_modules\electron\dist\electron.exe -e `
  "const D=require('better-sqlite3'); const db=new D(':memory:'); console.log(process.versions.modules, db.prepare('select 1 as ok').get()); db.close()"
Remove-Item Env:ELECTRON_RUN_AS_NODE
```

预期输出包含当前 Electron ABI 和 `{ ok: 1 }`。如果仍出现
`NODE_MODULE_VERSION`，说明 Electron 原生模块准备没有成功。

#### 后续优化方案

短期应增加 `desktop:native-ensure`：

1. 启动前读取当前 Electron ABI。
2. 使用 Electron 执行最小 SQLite 探针。
3. 已兼容时跳过编译。
4. 不兼容时自动执行 `electron-rebuild`。
5. 重编译后再次验证，失败时输出目标 ABI、实际 ABI 和明确的恢复命令。
6. 使用进程锁避免多个 Desktop 启动同时重编译同一文件。

不要把 Electron rebuild 放进根 `postinstall`，否则会让需要 Node ABI 的测试、
脚本或宿主服务失效。

如果未来必须同时运行会加载 `better-sqlite3` 的宿主 Node 服务和 Desktop，
长期方案是物理隔离两份原生产物：

```text
Node runtime
└─ better_sqlite3.node（Node ABI）

Desktop runtime
└─ better_sqlite3.node（Electron ABI）
```

可以使用 Desktop 专用 runtime 目录，并通过 PowerSync 自定义 Worker 加载
Electron 专用 `nativeBinding`。该方案还需覆盖开发启动、Electron 打包、
Windows/macOS/Linux 和 x64/arm64 产物选择。

PowerSync 也提供实验性的 `node:sqlite` 实现，但当前仍标记为不稳定且未充分
测试，不能作为生产问题的直接替代方案。

#### 错误语义改进

认证壳不应把数据库启动失败统一显示为登录失败。建议后续增加：

```text
LOCAL_DATABASE_UNAVAILABLE
NATIVE_MODULE_ABI_MISMATCH
```

UI 应提示用户“本地数据库组件与当前 Electron 版本不兼容”，开发模式下可以
进一步给出 `pnpm nx run desktop:serve-safe` 恢复命令，而不是引导用户检查
账号或认证服务。

## 9. 文档维护规则

- 单项目开发启动只写 `pnpm nx run <project>:<target>`。
- 多项目开发启动只写 `pnpm nx run-many ...`。
- 不为开发服务新增根级 `dev` / `dev:*` 包装脚本。
- 不新增 `pnpm nx <target> <project>` 示例。
- 不把插件推断的 `vite:dev` 当成产品支持入口。
- 新增服务或机器级端口时，先更新 `tools/runtime/profiles.json` 或机器级
  `.env.local`，再更新本文。
- 归档计划中的历史命令不做机械重写；当前指南、README 和执行计划必须遵循
  本规范。

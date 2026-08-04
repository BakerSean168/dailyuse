# 运行测试

测试命令统一优先从 Nx target 进入。除非你正在调试某个配置文件本身，否则不要把底层 `vitest` 或 `playwright` CLI 当成主入口。

## 日常开发

```bash
pnpm nx run task:test
pnpm nx run task:test:watch
pnpm nx run task:test:coverage
pnpm nx run api:test
pnpm nx run api:test:watch
pnpm nx run web:test
pnpm nx run web:test:watch
pnpm nx run desktop:test
pnpm nx run desktop:test:watch
```

适合在改动单个模块或单个应用后快速回归。`test` / `test:watch` 是默认 TDD 入口，不应依赖真实数据库、浏览器或跨进程环境。`test:coverage` 只在需要确认领域包质量门禁时补跑，不作为默认循环命令；coverage 作用域默认只检查 `src/server/domain/aggregates/**`、`src/server/domain/entities/**`、`src/server/domain/services/**`、`src/server/domain/value-objects/**`，`packages/domain-shared` 额外检查 `src/shared/**`。

## 专项测试入口

```bash
pnpm test:integration
pnpm nx run task:test:integration
pnpm nx run task:test:bench
pnpm nx run api:test:smoke
pnpm nx run web:e2e
pnpm nx run web:e2e:ui
pnpm nx run web:e2e:sync
pnpm nx run web:e2e:desktop-screenshots
pnpm nx run desktop:test:ipc
pnpm nx run desktop:test:main
```

适用场景：

- `pnpm test:integration`：顺序执行 `task`、`goal`、`schedule`、`reminder` 的 Prisma 集成测试，共享一套本地测试库
- `task:test:integration`：数据库、Prisma、事务、仓储实现改动
- `task:test:bench`：性能回归排查或性能优化验证
- `api:test:smoke`：HTTP 路由、middleware、序列化、状态码改动
- `web:e2e`：核心浏览器主流程回归（登录、注册、任务模板、目标、提醒、通知、仪表盘、设置持久化）
- `web:e2e:sync`：同步链路、跨端回归
- `web:e2e:desktop-screenshots`：拉起 Electron desktop，批量生成论文截图
- `desktop:test:ipc`：IPC handler、preload 暴露面改动
- `desktop:test:main`：Electron main 进程逻辑改动

首次在本机运行 Web E2E 前，先安装 Playwright 浏览器二进制：

```bash
pnpm exec playwright install
```

如果浏览器二进制缺失，Playwright 会在启动测试前直接失败；这类失败属于环境前置条件问题，不应误判为业务回归。

## 提交前和回归排查

```bash
pnpm nx affected -t test
pnpm nx affected -t test:coverage
```

这两个命令分工固定：

- `pnpm nx affected -t test`：快测试，默认 TDD / PR 快反馈
- `pnpm nx affected -t test:coverage`：领域覆盖率门禁

如果改动涉及特定边界，再补跑对应专项测试：

- API 路由或控制器：`pnpm nx run api:test:smoke`
- Web adapter / mock handler / contracts：`pnpm nx run web:test`
- 数据库访问或 Prisma：`pnpm test:integration` 或 `pnpm nx run <project>:test:integration`
- 关键浏览器流程：`pnpm nx run web:e2e`
  当前默认只跑核心 Web flow oracle；更宽的浏览器场景不要默认混进这条入口
- 同步回归：`pnpm nx run web:e2e:sync`
- 论文截图采集：`pnpm nx run web:e2e:desktop-screenshots`
- Electron IPC / main：`pnpm nx run desktop:test:ipc`、`pnpm nx run desktop:test:main`

## 集成测试数据库

`task`、`goal`、`schedule`、`reminder` 的 `test:integration` target 都会通过各自的 `integration-global-setup.ts` 调用 `@memoflow/test-utils/setup/database`，在本地尝试确保测试数据库可用。

本地运行这些 integration suite 的前提不是“装了 Node 就行”，而是当前账号可以访问 Docker Engine。至少要满足：

- Docker Desktop / Docker Engine 已启动
- `docker` CLI 可用
- 当前账号有权限访问 Docker API

当前仓库默认使用根目录 [`docker-compose.yml`](../../docker-compose.yml) 的 `test` profile，而不是旧文档里提到的 `docker-compose.test.yml`。

如果自动启动失败，再手动执行：

```bash
docker compose -f docker-compose.yml --profile test up -d postgres-test
```

默认测试库连接信息由 `TEST_DATABASE_URL` 或相关 `TEST_DB_*` 环境变量决定；未覆盖时默认走本地 `127.0.0.1:5433`。

默认数据库名是 `memoflow_test`。`TEST_DATABASE_URL`、`DATABASE_URL`、`TEST_DB_NAME`、`docker-compose.yml` 的 `postgres-test` 默认值，以及 CI 中启动的测试库命名都必须保持一致。

当前集成测试共享同一个本地测试库，并且每个 suite 会在运行前清空全部表。因此：

- 使用根命令 `pnpm test:integration` 时会强制顺序执行
- 不要手工并发运行多个 `pnpm nx run <project>:test:integration`
- 如果出现外键随机失败，先检查是否有其他 integration suite 同时占用 `postgres-test`

## CI 对应

- 本地与 CI 使用同一组 Nx target。
- CI 由 `Detect CI Scope` 计算 affected 范围，并行运行 smoke、integration、IPC、main-process Boundary jobs；稳定的 `Boundary Tests` check 只负责聚合结果。
- CI 仅在 `Boundary Integration` job 中拉起测试数据库；本地则依赖 Docker 可访问并允许 `integration-global-setup.ts` 自动启动 `postgres-test`。
- Web E2E 在四个独立 runner 中分片执行，并由稳定的 `Web Flow Oracle` check 聚合结果。
- `CI=true` 只会改变 reporter、重试、bail 等运行时行为，不应引入另一套文档命令。
- 需要查具体重试、超时、webServer、worker 设置时，直接看对应配置文件。

CI 拓扑、clean-source 本地入口和带 PR/run 证据的耗时数据见 [CI 测试与反馈性能](./ci-validation.md)。

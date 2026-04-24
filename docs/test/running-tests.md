# 运行测试

测试命令统一优先从 Nx target 进入。除非你正在调试某个配置文件本身，否则不要把底层 `vitest` 或 `playwright` CLI 当成主入口。

## 日常开发

```bash
pnpm nx run task:test
pnpm nx run task:test:watch
pnpm nx run api:test
pnpm nx run api:test:watch
pnpm nx run web:test
pnpm nx run web:test:watch
pnpm nx run desktop:test
pnpm nx run desktop:test:watch
```

适合在改动单个模块或单个应用后快速回归。`test` / `test:watch` 是默认 TDD 入口，不应依赖真实数据库、浏览器或跨进程环境。

## 专项测试入口

```bash
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

- `task:test:integration`：数据库、Prisma、事务、仓储实现改动
- `task:test:bench`：性能回归排查或性能优化验证
- `api:test:smoke`：HTTP 路由、middleware、序列化、状态码改动
- `web:e2e`：浏览器主流程回归
- `web:e2e:sync`：同步链路、跨端回归
- `web:e2e:desktop-screenshots`：拉起 Electron desktop，批量生成论文截图
- `desktop:test:ipc`：IPC handler、preload 暴露面改动
- `desktop:test:main`：Electron main 进程逻辑改动

## 提交前和回归排查

```bash
pnpm nx affected -t test
```

这个命令应只承担快测试。如果改动涉及特定边界，再补跑对应专项测试：

- API 路由或控制器：`pnpm nx run api:test:smoke`
- Web adapter / mock handler / contracts：`pnpm nx run web:test`
- 数据库访问或 Prisma：`pnpm nx run task:test:integration`
- 关键浏览器流程：`pnpm nx run web:e2e`
- 同步回归：`pnpm nx run web:e2e:sync`
- 论文截图采集：`pnpm nx run web:e2e:desktop-screenshots`
- Electron IPC / main：`pnpm nx run desktop:test:ipc`、`pnpm nx run desktop:test:main`

## 集成测试数据库

`task:test:integration` 的 global setup 会通过 [`packages/task/src/__tests__/integration-global-setup.ts`](../../packages/task/src/__tests__/integration-global-setup.ts) 调用 `@dailyuse/test-utils/setup/database`，在本地尝试确保测试数据库可用。

当前仓库默认使用根目录 [`docker-compose.yml`](../../docker-compose.yml) 的 `test` profile，而不是旧文档里提到的 `docker-compose.test.yml`。

如果自动启动失败，再手动执行：

```bash
docker compose -f docker-compose.yml --profile test up -d postgres-test
```

默认测试库连接信息由 `TEST_DATABASE_URL` 或相关 `TEST_DB_*` 环境变量决定；未覆盖时默认走本地 `127.0.0.1:5433`。

## CI 对应

- 本地与 CI 使用同一组 Nx target。
- `CI=true` 只会改变 reporter、重试、bail 等运行时行为，不应引入另一套文档命令。
- 需要查具体重试、超时、webServer、worker 设置时，直接看对应配置文件。

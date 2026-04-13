# 测试文档

`docs/test` 只保留薄文档，回答下面几件事：

- 仓库里有哪些测试类型
- 每类测试从哪个 Nx target 进入
- 什么时候应该跑哪一类测试
- 相关配置、setup、helper 在哪里
- 文档和代码注释各自负责什么

详细实现、历史背景、alias 细节、fixture 设计理由，优先写回配置文件和测试辅助代码注释，不再在这里重复展开。

## 测试类型总览

| 类型 | 主要位置 | 常用入口 |
| --- | --- | --- |
| 单元测试 | `packages/*`、`apps/*` 下的 `*.test.ts` / `*.spec.ts` | `pnpm nx run <project>:test` |
| 集成测试 | `packages/task/src/**/*.integration.test.ts` | `pnpm nx run task:test:integration` |
| API 冒烟测试 | `apps/api/src/__tests__/smoke/**` | `pnpm nx run api:test:smoke` |
| Web 契约测试 | `apps/web/src/mocks/handlers/*.spec.ts` | `pnpm nx run web:test` |
| Web E2E | `apps/web/e2e/**` | `pnpm nx run web:e2e` |
| Web 同步回归 E2E | `apps/web/e2e/sync/**` | `pnpm nx run web:e2e:sync` |
| Desktop 专项测试 | `apps/desktop`、`apps/desktop/src/main/**` | `pnpm nx run desktop:test`、`pnpm nx run desktop:test:ipc`、`pnpm nx run desktop:test:main` |
| 性能 / Bench | `packages/task/**/**/*.bench.ts` | `pnpm nx run task:test:performance` |

## 文档索引

- [architecture.md](./architecture.md)：测试分层、职责边界、何时补哪类测试
- [running-tests.md](./running-tests.md)：日常开发、回归排查、CI 对应命令
- [configuration.md](./configuration.md)：测试配置、setup、helper 的入口位置
- [contract-tests.md](./contract-tests.md)：Web mock handler 契约测试约定

## 使用原则

- 运行测试时统一优先走 `pnpm nx ...`，不要把底层 `vitest` / `playwright` 命令写成主文档入口。
- 文档不再硬编码测试数量、文件数量、历史统计。
- 具体实现理由应写在对应配置文件、setup 文件、fixture、helper 注释中。
- 如果文档与代码冲突，以当前 `project.json`、测试配置文件和测试目录为准。

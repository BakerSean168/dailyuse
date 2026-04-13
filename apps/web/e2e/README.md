# Web E2E

`apps/web/e2e` 只存放 Web 端到端测试本身与少量测试辅助代码。运行入口、测试分层和全仓库测试策略统一以 [`docs/test/`](../../../docs/test/README.md) 为准，这里不再重复维护一套厚文档。

## 目录边界

- `e2e/**`：常规 Web 浏览器流程
- `e2e/sync/**`：desktop-web 同步回归
- `e2e/helpers/**`：传统 Web E2E 通用 helper
- `e2e/sync/helpers/**`：sync 专用 helper
- `e2e/config.ts`：常规 E2E 的 URL、超时、测试账号常量

## 运行入口

统一从 Nx target 进入：

```bash
pnpm nx run web:e2e
pnpm nx run web:e2e:ui
pnpm nx run web:e2e:sync
pnpm nx run web:e2e:report
```

更细的调试参数优先通过 `web:e2e` 或 `web:e2e:sync` 传递，而不是把裸 `playwright test` 写成主文档入口。

## 配置入口

- 常规 Web E2E：[`apps/web/playwright.config.ts`](../playwright.config.ts)
- 同步回归 E2E：[`apps/web/playwright.sync.config.ts`](../playwright.sync.config.ts)
- 常规 E2E 配置常量：[`apps/web/e2e/config.ts`](./config.ts)
- sync 账号与 desktop 启动 helper：[`apps/web/e2e/sync/helpers/`](./sync/helpers/)

## 维护约定

- 文档只解释目录边界和入口，不维护测试数量、覆盖率统计或历史规划。
- helper 的实现理由应写在 helper 或配置文件注释里。
- 如果某类场景已经迁到 `sync` 或被删除，应先改目录和配置，再同步这里的简述。

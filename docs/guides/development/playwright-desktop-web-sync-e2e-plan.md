---
tags:
  - guide
  - development
  - testing
  - e2e
  - playwright
  - desktop
  - web
  - sync
description: Memoflow 桌面与 Web 双端 goal 同步回归测试的未来实现方案
created: 2026-04-12T00:00:00
updated: 2026-04-12T00:00:00
---

# Playwright 桌面-Web 双端同步回归方案

> 这是一份未来实现文档，不包含当前代码改动。

## 背景

- 当前 Web 已有 `apps/web/playwright.config.ts` 和一批 `apps/web/e2e` 用例。
- Desktop 是 Electron 应用，登录后会从 `#/auth` 切到主窗口，窗口切换由 `WindowChannels.TRANSITION_TO_MAIN` 驱动。
- PowerSync 的基础链路已经恢复，下一步需要用端到端回归确认 goal 在 desktop 与 web 之间双向同步。

## 目标

- 验证 desktop 创建 goal 后，web 可以看到。
- 验证 web 编辑 goal 后，desktop 可以看到。
- 验证 web 删除 goal 后，desktop 同步消失。
- 验证 desktop 删除 goal 后，web 同步消失。
- 验证重启 desktop 后，已同步的数据仍然存在。
- 验证测试账号不存在时可以自动创建。

## 非目标

- 不重写现有 `apps/web/e2e` 浏览器测试。
- 不把同步回归塞进单元测试。
- 不把 Playwright 换成别的框架。
- 不把 UI 注册流程作为账号 bootstrap 的唯一方式。

## 账号策略

- 统一读取 `.e2e-test-credentials.json`。
- 该文件是唯一的测试账号来源，不在测试体里硬编码用户名、邮箱或密码。
- bootstrap 顺序建议如下：
  1. 读取配置。
  2. 尝试登录。
  3. 如果账号不存在或登录失败，创建账号。
  4. 重新登录并缓存 session。
- 账号创建优先复用 `tools/test/seed-test-user.ts`。
- 当前 seed 脚本只包含 `testuser`、`testuser2`、`admintest`，后续应补入 e2e 配置账号，或单独提供 `ensureE2EAccount` 逻辑。
- `pnpm test:seed` 目前只出现在文档里，根脚本还没有；未来实现时要补齐命令别名，或直接调用脚本。

## 推荐架构

- 保留现有浏览器测试配置给 Web-only 场景。
- 新增一个独立的同步回归套件，避免和现有 CRUD 用例互相干扰。
- 用 Playwright 的 Electron 能力启动真实桌面应用，而不是在浏览器里模拟 desktop。
- 测试夹具建议暴露 `webPage`、`electronApp`、`desktopWindow` 三个对象。
- 桌面端启动时应设置 `DAILYUSE_API_URL`，让 Electron 指向本地 API。
- 桌面端建议用 `VITEST=true` 或未来专用测试标志来隔离 `userData`，不要依赖 `NODE_ENV=test`，因为那会影响 `apps/desktop/vite.config.ts` 的运行模式。
- 不要把 `waitForLoadState('networkidle')` 作为核心等待策略，PowerSync 会维持长连接。

## 推荐目录

```text
apps/web/e2e/sync/
  goal-sync-regression.spec.ts
  fixtures/
    sync-fixture.ts
  helpers/
    credentials.ts
    desktop.ts
    goal.ts
```

## 场景矩阵

| 场景      | 来源    | 目标    | 预期                           |
| --------- | ------- | ------- | ------------------------------ |
| 创建 goal | Desktop | Web     | Web 列表出现同名 goal          |
| 编辑 goal | Desktop | Web     | Web 显示更新后的名称或描述     |
| 创建 goal | Web     | Desktop | Desktop 列表出现同名 goal      |
| 编辑 goal | Web     | Desktop | Desktop 显示更新后的名称或描述 |
| 删除 goal | Desktop | Web     | Web 中该 goal 消失             |
| 删除 goal | Web     | Desktop | Desktop 中该 goal 消失         |
| 重启验证  | Desktop | Desktop | 重启后 goal 仍存在             |

## 稳定性要求

- Goal 相关控件要补稳定的 `data-testid`。
- 优先给列表容器、创建按钮、表单输入框、保存按钮、编辑按钮、删除按钮加 test id。
- 现有目标卡片如果只依赖文本和 hover 菜单，回归会很脆。
- 每个测试都要使用唯一 goal 名称，建议带上时间戳和 worker 信息。
- Playwright 运行建议保持 `workers: 1`。
- 登录后 desktop 会从登录窗口切到主窗口，测试必须重新绑定活动窗口，不要假设同一个窗口一直存在。
- 跨客户端同步断言建议使用 `expect.poll` 或等价的显式轮询，而不是固定 `sleep`。
- 清理应当放在 `afterEach`，先走 UI 删除，失败时再做兜底重置。

## 断言原则

- 以 UI 为主，不以数据库状态作为主要通过标准。
- 数据库或 API 只用于 bootstrap、健康检查和清理兜底。
- 同步断言的核心是“源端操作后，目标端最终可见”，而不是“接口返回成功”。

## 清理策略

- 正常情况：通过 UI 删除测试 goal。
- 失败兜底：使用 `apps/desktop/scripts/reset-local-data.mjs` 或 `apps/desktop/scripts/reset-local-db.mjs` 清除本地脏状态。
- 本地回归不应依赖手工清理。

## 实现顺序建议

1. 补齐统一账号 bootstrap。
2. 增加目标页面和对话框的稳定 `data-testid`。
3. 新增 Electron fixture 和桌面窗口切换处理。
4. 新增双向同步回归测试。
5. 再补重启持久化回归测试。

## 待确认项

- 同步套件是挂在现有 `apps/web` Playwright 配置里，还是单独拆一个 sync config/target。
- `e2e_test_user` 是继续走注册 API，还是直接补进 seed 脚本。
- `pnpm test:seed` 是否要补成仓库内统一命令。

## 结论

- 这套回归应该由 Playwright 驱动。
- 账号策略应当是“先用配置好的账号，缺失则自动创建”。
- Web-only 测试和桌面-Web 同步回归最好分开维护，避免互相污染。

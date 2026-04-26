---
tags:
  - plan
  - configuration
  - testing
  - tdd
description: 配置与领域测试治理收敛方案
created: 2026-04-26T00:00:00
updated: 2026-04-26T00:00:00
status: active
---

# 配置与领域测试治理收敛方案

## Summary

下一阶段不再继续做协作入口治理，而是转向“配置真值 + TDD 测试系统”收敛，重点解决两类真实问题：

- 测试系统并不完全被 Nx 治理：`account`、`notification` 有测试文件但没有 `test` / `test:watch` target，默认 `pnpm nx run-many -t test --all` 不会覆盖它们。
- Vitest 配置存在漂移：根 `vitest.config.ts` 同时承担“项目注册表 + 多项目内联配置”，还包含失效的 `ui` 项；有的包依赖 root `--project`，有的包依赖本地 `--config`，口径不统一。
- 覆盖率治理几乎缺位：当前 `coverage/` 下基本没有 JS/TS 领域包产物，CI 也没有领域层 coverage 硬门禁；“TDD 默认快测试”有文档，但没有形成结构化和数字化的强约束。

这轮按“立即硬门禁 + 场景覆盖与数字覆盖并行”设计，目标是让领域包测试从“能跑”升级为“可治理、可发现缺口、可在 CI 中失败”。

## Key Changes

### 1. 更新 `docs/plan` 的当前工作项

- 将现有活跃计划 `2026-04-26-repository-governance-unification.md` 归档为上一阶段完成项。
- 新增一个新的 active plan，主题明确为“配置与领域测试治理收敛”，用于承载本轮实施、缺口清单、完成标准和后续追加项。
- 新计划正文直接记录当前已确认事实：
  - `account`、`notification` 有测试但无 Nx test target
  - `editor` 是 `layer:domain` 且包含完整 domain-server / domain-client 结构，但当前无测试
  - root `vitest.config.ts` 含失效 `ui` project
  - 当前领域包 coverage 治理未真正落地

### 2. 统一测试配置所有权

- 统一规则：凡是有快测试的项目，都必须拥有“项目本地 Vitest 配置 + `test` / `test:watch` target”，不再依赖 root `vitest.config.ts` 的内联项目定义作为主入口。
- 调整 root `vitest.config.ts` 为纯注册表：
  - 移除失效 `ui` project
  - 移除内联 package 配置块
  - 只保留显式的 per-project config path 引用
- 为当前缺失的项目补齐本地配置和 target：
  - `account`：新增 `vitest.config.ts`，新增 `test` / `test:watch`
  - `notification`：保留现有 `vitest.config.ts`，补 `test` / `test:watch`
  - `editor`：新增 `vitest.config.ts`，新增 `test` / `test:watch`
  - `domain-shared`：保留现有 `vitest.config.ts`，补 `test` / `test:watch`
- 将当前仍使用 `vitest --project <name>` 的治理域项目统一改为 `vitest run --config <path>` / `vitest --config <path>`，减少 root registry 与 project target 的双重耦合。

### 3. 扩大测试治理范围到领域层

- 扩展 `tools/test/test-target-governance.mjs` 与本地 Nx test-system 规则，不再只强约束 `api/task/web/desktop` 四个边界项目。
- 本轮纳入硬治理的项目集合固定为：
  - 所有 `layer:domain` 包：`account`、`ai`、`authentication`、`editor`、`goal`、`governance`、`notification`、`reminder`、`schedule`、`setting`、`task`
  - 额外纳入 `domain-shared`，作为核心共享领域逻辑包
- 对上述项目强制要求：
  - `test`
  - `test:watch`
  - `test:coverage`
- 对不在本轮治理范围的项目保持现状：
  - `repository`、`database`、`http-client`、`ipc-client`、`scheduler-server`、UI 包、apps
  - 这些项目继续允许现有测试结构，不纳入领域 coverage 硬门禁

### 4. 把“领域层覆盖足够”定义成结构门禁 + 数字门禁

- 结构门禁：
  - 如果项目存在 `src/domain-server/aggregates` 且其中有实现文件，则必须存在同子树下的聚合测试
  - 如果项目存在 `src/domain-server/services` 且其中有实现文件，则必须存在同子树下的领域服务测试
  - 如果项目存在 `src/domain-server/value-objects` 或 `src/domain-shared/value-objects` 且其中有实现文件，则必须存在对应值对象测试
- 结构门禁不要求文件一一对应，但要求该子系统不能是“空测试区”。
- 数字门禁：
  - 本轮对所有治理域项目统一采用 package-level coverage threshold
  - 默认阈值固定为：
    - statements: `80`
    - lines: `80`
    - functions: `80`
    - branches: `70`
- 不做项目级例外白名单；达不到阈值的项目必须补测试，而不是先豁免。

### 5. 新增 coverage target 和 CI 门禁

- 为治理域项目统一新增 `test:coverage` target，命令形态固定为现有本地 `vitest.config.ts` 加 `--coverage`。
- 统一 coverage 产物路径到 `coverage/<projectRoot>`，确保 Nx outputs 与 Vitest 实际输出对齐。
- 根脚本新增：
  - `test:coverage:domain`
  - `test:coverage:affected`
- CI 调整：
  - 保留当前 `test` job，继续承担快反馈、无 coverage 的 TDD 主路径
  - 新增 `domain-coverage` job，执行 `pnpm nx affected -t test:coverage`
  - 该 job 只作为领域覆盖率门禁，不替代 `test`
- 文档同步：
  - `docs/test/README.md`
  - `docs/test/architecture.md`
  - 必须明确区分：
    - `test` = 快反馈、默认 TDD
    - `test:coverage` = 质量门禁，不作为默认本地循环命令

### 6. 补齐当前最明显的领域测试缺口

- `account`：现有 12 个测试文件纳入正式 target 与 coverage 治理，无需改变测试策略，只补配置与 target。
- `notification`：现有 10 个测试文件纳入正式 target 与 coverage 治理，无需重写结构，只补 target。
- `editor`：当前是最大真实缺口。
  - 保持 `layer:domain` 不变，不改 tag
  - 新增最小可治理基线测试，至少覆盖：
    - 一个核心 aggregate
    - 一个核心 domain service
    - 一个核心 value object / layout object
  - 同时接入 `test` / `test:watch` / `test:coverage`
- `domain-shared`：补最小基线测试并正式接入 target，避免继续出现“有 vitest config 但未被 Nx 治理”的状态。

## Public Interfaces / Repo Contracts

- 新的治理域测试 target 契约：
  - `<domain-project>:test`
  - `<domain-project>:test:watch`
  - `<domain-project>:test:coverage`
- 新的根脚本契约：
  - `pnpm test:coverage:domain`
  - `pnpm test:coverage:affected`
- 新的测试治理定义：
  - `test` 是默认 TDD 快反馈
  - `test:coverage` 是 CI 硬门禁
- root `vitest.config.ts` 不再作为项目测试行为定义者，只作为 workspace registry

## Test Plan

- 静态治理检查：
  - `pnpm test:targets:check` 必须能发现缺失的 `test` / `test:watch` / `test:coverage`
  - 新的结构门禁脚本必须能发现 `editor` 这类“有 domain 子系统但无测试”的项目
- 快测试验证：
  - `pnpm nx run account:test`
  - `pnpm nx run notification:test`
  - `pnpm nx run editor:test`
  - `pnpm nx run domain-shared:test`
- coverage 门禁验证：
  - `pnpm nx run account:test:coverage`
  - `pnpm nx run notification:test:coverage`
  - `pnpm nx run goal:test:coverage`
  - `pnpm nx run task:test:coverage`
- CI 验证：
  - `pnpm nx affected -t test`
  - `pnpm nx affected -t test:coverage`
- root 配置回归：
  - root `vitest.config.ts` 不再包含失效 project
  - 现有用 `--config` 的项目和新补齐的项目都能单独运行，不依赖 root 内联定义

## Assumptions And Defaults

- 本轮“立即硬门禁”只覆盖领域包与 `domain-shared`，不把所有 shared/infra/app 包一次性纳入 coverage gate。
- 覆盖率阈值以 package-level 为准，不做 file-level threshold 和例外白名单。
- 结构门禁优先按目录职责检查，不要求每个实现文件都必须一一对应测试文件。
- `editor` 被视为真实领域包而不是错误标签；因此本轮补测试，不改 layer tag。
- root `vitest.config.ts` 中的失效 `ui` project 视为配置漂移，直接删除，不保留兼容层。

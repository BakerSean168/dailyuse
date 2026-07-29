---
tags:
  - plan
  - archive
  - event-bus
  - governance
  - architecture
description: 收敛事件总线死代码、修复 DomainEvent flush 一致性、加固治理自动化，来自 2026-07-10 架构审查
created: 2026-07-10T00:00:00+08:00
updated: 2026-07-10T18:00:00+08:00
---

# Event Bus & Governance Hardening

> 归档结论（2026-07-15）：事件总线、统一 flush seam、Goal↔Task 事件联动和治理脚本均已落地。ADR-009 保留分层原则，ADR-031 负责标准目录形态，两者已明确为互补关系，不再存在规则冲突。

## 背景

2026-07-10 对仓库做了一次系统性架构审查，重点覆盖三块：跨平台事件总线与 RPC、文档与自动化治理体系、Monorepo 边界与依赖拓扑。

总体结论：依赖拓扑（零循环、干净叶子层）与边界纪律（`IApiModule` facade、零 deep-import 违规）成熟度高；文档"真值顺序"设计优雅。当前最薄弱环节是**事件总线运行时机制**与**治理脚本的语义深度/自测**。

本计划把审查诊断出的问题固化为可执行改动，按收益/风险排序。

跨模块通信范式的判定规则单独固化为 [ADR-033: Cross-Module Communication Patterns](../../architecture/adr/ADR-033-cross-module-communication-patterns.md)。本计划为其配套的落地路线。

## 结论前提

- 项目处于活跃开发期，不要求向后兼容、不需要数据迁移。
- 优先根因修复，不引入临时 shim 或双轨兼容。
- 每项改动配套离改动最近的定向验证，并补跑 `memoflow:governance-check`。
- 跨模块协作规则以 ADR-033 为准（三范式：事件 / Port / 跨进程 IPC-HTTP；同进程消息式 RPC 弃用）。

## 问题清单（诊断结论）

### High

- **H1｜事件总线中未接线的 `invoke`/`handle` RPC 能力应删除。** 项目只有**一套**事件总线，`send`/`on`/`off` 是 DDD 跨模块解耦骨架，真实在用、保留并加固（见 H3/M1）。问题在同一个类 `CrossPlatformEventBus`（`packages/utils/src/domain/cross-platform-event-bus.ts:85-214`）里塞进的**同进程消息式 RPC**（`invoke`/`handle` + `requestId` + 动态监听 + `pendingRequests` + 超时）：全仓**零生产调用**，唯一引用是 `global-event-bus.ts:22` 的 docstring 示例。按 ADR-033 判定：同进程请求-响应走 Port（依赖倒置），跨进程走 `IpcClientImpl` / HTTP —— **mitt-RPC 无立足场景**。所谓"两套 RPC 并存"指的是这个被架空的 mitt-RPC vs 真在用的 `IpcClientImpl`，**不是两套事件总线**。
- **H2｜`flushDomainEvents` 在持久化成功后同步触发，抛错会破坏一致性。** 仓储 `save()` 顺序执行多条 `db.execute` 后调用 `flushDomainEvents(publisher, aggregate)`（如 `packages/reminder/src/server/infrastructure/adapters/powersync/reminder-template-powersync.repository.ts:214-215`）。`flushDomainEvents` → `publisher.send` → `mitt.emit` 为**同步**且 `send` 无 try/catch（`cross-platform-event-bus.ts:58-61`）。后果：(a) 订阅者同步抛错会冒泡使 `save()` reject，但 DB 已落库；(b) `save()` 内多写**无事务包裹**，可能半持久化；(c) 无 outbox，"提交后、派发前"崩溃会丢事件。
- **H3｜`send` 无 per-handler 错误隔离。** `mitt.emit` 顺序同步调用同一事件的多个 handler，唯一防护是各订阅方各自记得 try/catch（如 `register-account-event-listeners.ts:26-35`）。靠约定而非机制：一个 handler 抛错或阻塞会波及其余订阅者。

### Medium

- **M1｜每次 `send`/`on`/`off` 无条件 `logger.info` 并展开 payload**（`cross-platform-event-bus.ts:59/69/81`）。生产环境 logger 虽 `enabled=false`，但模板字符串与 payload 传参在进入 `log()` 前已求值，高频路径纯浪费 + 开发期噪音大。
- **M2｜`layer:service`（ai-service）无 depConstraints。** `@nx/enforce-module-boundaries` 只约束 `layer:*`，`layer:service` 在 `eslint.config.ts` 无对应条目，Nx 对无约束 source tag 默认放行。`scope:*` / `type:*` 两套 tag 不参与任何约束。
- **M3｜跨 feature 包隔离靠硬编码个案。** 所有 feature 同为 `layer:domain`，矩阵允许任意 feature 互相依赖，唯一防火墙是硬编码的 `goal ✗↔ task`。`public-surface-audit.mjs` 只拦"导入别包内部层子路径"，不拦"导入别包公开 API"。
- **M4｜无"未 flush 的 DomainEvent"治理检查。** `tools/` 下零 `pullDomainEvents`/`domainEvents` 匹配。聚合根 `addDomainEvent` 后仓储漏 `flush` 会静默丢事件，无自动化拦截。
- **M5｜13 个治理脚本零单元测试，且多为脆弱窗口式正则。** `find tools -name "*.spec.*"` 零结果；`governance-module-docs-audit.mjs:152-192`、`desktop-runtime-locator-audit.mjs:155` 属高脆弱启发式。`tools/` 因归类 `tooling-lib`（仅要求 `build`）逃过 `vitest-no-tests-audit`。
- **M6｜Goal↔Task 联动已实现但只在 desktop，且为 bespoke，需按 ADR-033 重构为可复用包内实现。** 事实核校：`apps/desktop/src/main/events/initialize-event-listeners.ts` 已订阅 `task:instance-completed` 并调用 `CreateGoalRecordUseCase`（经 `@memoflow/goal/events` 公开面）更新 KR 进度；desktop 主进程启动时 `main.ts:274` 挂载。真实缺口有三：
  1. **API 后端未挂载同款监听器** —— web 端任务完成不会自动更新 KR（grep `apps/api/src` 里 `task:instance-completed` / `CreateGoalRecordUseCase` 均为空）。
  2. **反应逻辑是 bespoke 副本，未成包** —— 应搬进 Goal 包 `application-server/event-handlers`，替换掉现有空壳桩 `registerGoalEventListeners`（`packages/goal/src/application-server/event-handlers/index.ts` 只打日志、参数 `_goalRepository` 未使用、无人调用）。
  3. **Handler 回头查 Task 的 repository**（读 `taskInstance` / `template`）—— 这是隐性耦合。按 ADR-033 范式 A，事件 payload 应**自包含**：Task 侧发布 `task:instance-completed` 时把 `goalBinding`、`allInstancesCompleted` 等判定必要字段填齐，Goal 侧不再回查 Task。

### Low

- **L1**｜`generateUUID`（`cross-platform-event-bus.ts:10-27`）`globalThis.crypto` 与 `crypto` 两分支重复，可收敛为 `globalThis.crypto?.randomUUID()`。
- **L2**｜`pendingRequests` 用 `any`（`:43`），可精确为 `ReturnType<typeof setTimeout>`（若 H1 移除 RPC 则一并消失）。
- **L3**｜矛盾的 Accepted ADR：ADR-009 描述旧 `domain-server`/`application-server` 布局，ADR-031 定义现行 `src/server/{...}`。应把 ADR-009 标注 superseded-by ADR-031。
- **L4**｜`adr/README.md` 32 行索引手工双写；`plan/archive/` ~90 文件多个 100KB+ 无子索引。

## 实施步骤

按收益/风险排序，前三项改动小、收益最高、互不冲突。

### 阶段一：事件总线收敛与一致性（H1 → H2 → H3 / M1）

1. **H1** 删除 `CrossPlatformEventBus` 中未接线的 mitt RPC：`invoke`/`handle`/`removeHandler`/`clearPendingRequests` 及 `rpcListeners`/`pendingRequests`/`handlers`/`defaultTimeout` 字段与 `TRpc` 泛型；把类收敛为单向事件总线。同步清理 `global-event-bus.ts` 的 `AppRpcRegistry` 注入与 docstring 示例。跨进程 RPC 唯一真相保留在 `IpcClientImpl`。
2. **H3 + M1** 重写 `send`：debug 门控日志（不展开 payload），改为遍历 handler 并 per-handler try/catch，实现错误隔离。顺带处理 **L1**（`generateUUID` 若 RPC 移除后仍被 send/on 路径使用则保留精简版，否则删除）、**L2**。
3. **H2(a)** 仓储 `save()` 用 `db.transaction` 包裹多条 `execute`，先 `pullDomainEvents()` 取出事件再进事务。逐个改造使用 `flushDomainEvents` 的仓储（reminder / ai / schedule / notification 等，见 `flushDomainEvents` 调用点）。
4. **H2(b)** 事件派发挪到事务提交之后，用 `publishSafely` 吞派发侧异常（与 H3 隔离双保险）。中期是否引入 transactional outbox 另立 ADR，不在本计划范围。
5. 定向验证：`utils`、各被改仓储所属 feature 的 `lint` / `typecheck` / `test`。
6. **M6（Goal↔Task 联动重构，作为 ADR-033 范式 A 的标杆用例）**
   - Task 侧：`task:instance-completed` 事件 payload 补齐 `goalBinding` 与"是否全部实例完成"标志（判定逻辑本属 Task，从 desktop handler 迁到 Task 应用层，事件发布前算好）。
   - Goal 侧：把 `packages/goal/src/application-server/event-handlers/index.ts` 从桩改为真实实现 —— 订阅 `task:instance-completed`，直接消费 payload 调 `CreateGoalRecordUseCase`，**不再回查 Task 的 repository**。
   - 宿主：`apps/api` 与 `apps/desktop` 分别在启动时调用同一份 `registerGoalEventListeners`（消除 desktop bespoke 副本，desktop 那份 `initialize-event-listeners.ts` 里的 task-goal 段删除）。
   - Web 端（走 API）由此获得同款自动更新能力。

### 阶段二：治理脚本自测与语义加固（M5 → M4 → M2）

7. **M5** 将 `tools/governance/*.mjs` 核心逻辑抽为可导出纯函数 + fixture，补 `__tests__`；把 `tools/governance` 提为带 `test` target 的 Nx 项目并纳入 `governance-check` 前置。
8. **M4** 用 `ts-morph` 新增 `unflushed-events-audit`：扫描继承 `AggregateRoot` 的类，命令方法体内有状态赋值但整类无 `addDomainEvent`、或仓储 `save` 无 `flushDomainEvents` 的疑似漏发点。同时新增 `mitt-rpc-forbidden-audit`：拦截业务代码中的 `.invoke(` / `.handle(`（放行 `packages/ipc-client` 及 `infrastructure-*` 目录），落实 ADR-033 弃用条款。
9. **M2** 在 `eslint.config.ts` 的 `depConstraints` 追加 `layer:service` 条目，闭合无约束漏洞。
10. **M3** 评估将跨 feature 边界从硬编码个案改为系统化规则（scope 级约束或 audit 扩展），本步先出结论，改动可另立计划。

### 阶段三：文档剪枝（L3 / L4）

11. **L3** ADR-009 标注 superseded-by ADR-031，更新 ADR 索引状态。
12. **L4** `plan/archive/` 建按季度子索引；评估超大历史计划压缩归档。

## 完成标准

- `CrossPlatformEventBus` 收敛为纯发布订阅总线（保留 `send`/`on`/`off`），不再包含 `invoke`/`handle`/`pendingRequests`/超时逻辑；`grep` 确认 `eventBus.invoke`/`eventBus.handle` 零引用。
- 仓储 `save()` 多写在单事务内；事件派发在提交后进行，派发失败不回滚业务；`send` 具备 per-handler 错误隔离。
- Goal↔Task 联动按 ADR-033 范式 A 重构完成：反应逻辑收敛到 Goal 包内、事件 payload 自包含、`apps/api` 与 `apps/desktop` 两宿主挂载同一实现、desktop bespoke 副本删除、web 端亦获得自动更新能力（M6）。
- `mitt-rpc-forbidden-audit` 接入 `governance-check`，全仓无业务代码调用 `eventBus.invoke` / `eventBus.handle`。
- `send`/`on`/`off` 日志受 debug 门控，不在生产热路径求值 payload。
- `tools/governance` 具备 `test` target 且核心脚本有单元测试；`unflushed-events-audit` 接入 `governance-check`。
- `eslint.config.ts` 覆盖 `layer:service`。
- ADR-009/031 冲突消解；`plan/archive` 具备子索引。
- `memoflow:governance-check` 通过。

## 备注

- 阶段一与阶段二互不依赖，可并行成独立 PR。
- 阶段一前三步（H1/H3/H2）是最小高收益集合，建议优先合入。
- 后续 AI ↔ 各模块、Setting ↔ 各模块的联动一律遵循 ADR-033：查询/命令回执类用 Port（依赖倒置 + 宿主注入，参考 `createAIApiModule` 的 `IAnalyticsReadPort` / `IKnowledgeSourcePort` / `IKnowledgeNotePersistencePort`），通知反应类用事件。跨越 web↔api 或主↔渲染进程时才走 HTTP / Electron IPC。不新增 mitt-RPC 用法。

## 实施进度

### PR-1 · 阶段一 · 事件总线收敛与 flush 一致性（2026-07-10）

分支：`refactor/event-bus-hardening-pr1`

- [x] **H1** 删除 `CrossPlatformEventBus` 的 mitt-RPC（`invoke`/`handle`/`removeHandler`/`clearPendingRequests` 及 `rpcListeners`/`pendingRequests`/`handlers`/`defaultTimeout` 字段与 `TRpc` 泛型），收敛为单向事件总线。`GlobalEventBus` 去掉 `AppRpcRegistry` 泛型，`global-event-bus.ts` docstring 的 invoke 示例改为指向 Port / IPC。`AppRpcRegistry` 类型本身保留（仍聚合各模块 `RpcMap`，供 IPC channel 使用），仅解除与事件总线的耦合。
- [x] **H3 + M1** 重写 `send`：debug 门控日志（生产不求值 payload），遍历 handler 快照逐个 try/catch，实现 per-handler 错误隔离。
- [x] **L1/L2** 随 mitt-RPC 一并移除 `generateUUID`、`pendingRequests`（`any`）等仅服务 RPC 的死代码。
- [x] **H2** 仓储事务与提交后派发：
  - AI（Prisma）`save()` 三条写入包进 `$transaction`，事件在提交后 flush。
  - Reminder（PowerSync）模板 + 历史多写包进 `writeTransaction`（`db` 类型收敛为 `IElectronDatabase`），事件提交后 flush。
  - Schedule（PowerSync）任务 + 执行记录同上。
  - AI（PowerSync）、Notification（Prisma/PowerSync）原本已是「事务内多写 + 提交后 flush」或单条写入，无需改动。
  - 派发失败不回滚业务，与 H3 的 per-handler 隔离形成双保险。

验证：

- `pnpm nx run-many -t typecheck lint test -p utils reminder schedule ai notification` 全绿。
- `pnpm nx run memoflow:governance-check --skip-nx-cache` 通过（`raw-event-bus-audit` 通过）。
- 全仓 `grep eventBus.invoke|eventBus.handle` 零命中；无下游以第二个泛型实例化事件总线。
- `desktop:typecheck` / `api:typecheck` 全图受**既有** `dashboard:build` / `app-vue:typecheck` 失败阻塞（`contracts` DTS `TS2209` 与 governance `RuleId` 品牌类型，均在干净 `main` 上复现，与本 PR 无关）；两宿主仅消费 `send`/`on`/`off`，签名未变，不受本次泛型收敛影响。

### 后续阶段完成记录（2026-07-15 核验）

- [x] **M6** `task:instance-completed` 使用自包含 Goal binding payload；Goal 侧反应逻辑由 API 与 Desktop 宿主共享。
- [x] **M4/M5** `mitt-rpc-forbidden-audit`、`unflushed-events-audit` 及其单测已接入 governance target；`governance-tools:test` 当前 18/18 通过。
- [x] **M2** `layer:service` 已纳入 Nx dependency constraints。
- [x] **L3** ADR-009/ADR-031 通过“原则 / 目录形态”职责拆分消除冲突；不采用 supersede，因为两份决策当前均有独立有效范围。
- [x] **L4** `docs/plan/archive` 已建立季度子索引。
- [x] 最终核验：生产 mitt-RPC 零使用、deep import 零违规；`pnpm governance:check`、`pnpm docs:check`、`pnpm test:targets:check` 通过。

---
tags:
  - plan
  - archive
  - prompt
  - event-bus
  - governance
description: 交给 AI 执行 2026-07-10 事件总线与治理加固计划的自包含提示词
created: 2026-07-10T18:30:00+08:00
updated: 2026-07-10T18:30:00+08:00
---

# Implementation Prompt

> 归档结论（2026-07-15）：配套实施计划已完成，本提示词仅保留为历史执行上下文。

配套 `2026-07-10-event-bus-and-governance-hardening.md` 与 `ADR-033`。整份文件从下面分隔线开始即为提示词正文，粘贴到全新 AI 会话即可开始工作。

---

任务：按现有方案实施 Event Bus & Governance Hardening（含 ADR-033）

你是资深软件架构工程师。在 /opt/memoflow（pnpm + Nx monorepo）里，按已有方案与决策文档，完整、优雅地实施跨模块通信范式重构。代码是唯一真值，方案与决策文档只是路线图。

## 强制第一步：读完这些再开始动手（不要跳过）

1. AGENT.md — 协作规范、真值顺序、变更策略、最小验证要求。每条都要遵守。
2. docs/architecture/adr/ADR-033-cross-module-communication-patterns.md — 跨模块通信三范式（事件 / Port / 跨进程 IPC-HTTP）与 mitt-RPC 弃用决策。所有实施必须与此 ADR 一致。
3. docs/plan/active/2026-07-10-event-bus-and-governance-hardening.md — 完整方案，含 H1/H2/H3/M1–M6/L1–L4 的诊断、步骤、完成标准。
4. docs/standards/README.md、docs/governance/README.md — 规则与治理约定。
5. packages/utils/src/domain/cross-platform-event-bus.ts、packages/utils/src/domain/typed-event-port.ts、packages/utils/src/domain/flush-domain-events.ts、packages/utils/src/domain/aggregate-root.ts — 事件总线现状。
6. apps/desktop/src/main/events/initialize-event-listeners.ts、packages/goal/src/application-server/event-handlers/index.ts、packages/goal/src/events/index.ts — M6 涉及的 Goal↔Task 现状。
7. packages/ai/src/api/module.ts、apps/api/src/main.ts 中 createAIApiModule(...) 部分 — Port + 宿主注入的现有范本（ADR-033 范式 B）。

## 执行顺序（严格按此，一 PR 一阶段，互不掺杂）

### PR-1｜阶段一 · 事件总线收敛与 flush 一致性（对应 plan 步骤 1–5）

- **H1** 删除 CrossPlatformEventBus 中 invoke/handle/removeHandler/clearPendingRequests 以及 rpcListeners/pendingRequests/handlers/defaultTimeout 字段与 TRpc 泛型；GlobalEventBus 移除 AppRpcRegistry 泛型；清理 docstring 里的 invoke 示例。跨进程请求-响应真相唯一保留在 packages/ipc-client。
- **H3 + M1** 重写 send：debug 门控日志（生产不求值 payload）；遍历 handler 时 per-handler try/catch，实现错误隔离，一个订阅者抛错不影响其余。
- **H2** 在使用 flushDomainEvents 的仓储（reminder / ai / schedule / notification 等，详见 plan H2 列出的调用点）里：save() 用事务包裹多条 execute；pullDomainEvents() 在事务前后位置需要设计准确；事件派发放到事务成功提交之后，派发失败不回滚业务（用一个 publishSafely 或直接依赖 H3 的隔离即可）。
- **L1/L2** 顺手：generateUUID 收敛为 globalThis.crypto?.randomUUID()；pendingRequests 若因 H1 被移除，则一并消失。

**验收：** pnpm nx affected -t lint test typecheck 全绿；pnpm nx run memoflow:governance-check 通过；全仓 grep -r "eventBus.invoke\|eventBus.handle" 零命中。

### PR-2｜阶段一 · Goal↔Task 联动重构（M6，作为 ADR-033 范式 A 标杆）

三段：

- **Task 侧**：task:instance-completed 事件 payload 扩展 goalBinding 与"是否全部实例完成"标志。判定逻辑（shouldTriggerOnAllInstancesCompleted）从 desktop handler 迁到 Task 应用层，在事件发布前算好。同步更新 @memoflow/contracts/task 事件形状。
- **Goal 侧**：把 packages/goal/src/application-server/event-handlers/index.ts 从空壳桩改为真实现——订阅 task:instance-completed，直接消费 payload，调 CreateGoalRecordUseCase，不得回查 Task 的 repository。返回可停止函数（幂等 start()/stop()，仿 register-account-event-listeners.ts）。
- **宿主**：apps/api 与 apps/desktop 分别在启动时调用同一份 registerGoalEventListeners。desktop 的 initialize-event-listeners.ts 中 task-goal 那段删除（不是注释掉）；web 端由此自动获得同款能力。

**验收：** 补 Goal handler 的单测（消费 fixture payload，断言调用了 CreateGoalRecordUseCase.execute）；补一条 desktop 或 api 的集成测试真跑事件；lint / typecheck / affected test 全绿。

### PR-3｜阶段二 · 治理脚本自测与语义加固（M5 → M4 → M2）

- **M5** 把 tools/governance/*.mjs 的核心逻辑抽为可导出纯函数 + fixtures，在同目录补 **tests**；把 tools/governance 提为带 test target 的 Nx 项目并纳入 governance-check 前置。
- **M4** 新增两个 audit：
  - unflushed-events-audit.mjs：用 ts-morph 扫描继承 AggregateRoot 的类，命令方法有状态改动但整类无 addDomainEvent、或仓储 save 无 flushDomainEvents 的疑似漏发点。
  - mitt-rpc-forbidden-audit.mjs：拦截业务代码中的 .invoke( / .handle(（放行 packages/ipc-client 与 infrastructure-* 目录），落实 ADR-033 弃用条款。
- **M2** eslint.config.ts 的 depConstraints 追加 layer:service 条目，闭合无约束漏洞。

**验收：** 新增 audit 有正反 fixture 单测；governance-check 全绿；有意注入一处 mitt-RPC 反例本地跑一遍确认能被拦到，然后回退。

### PR-4｜阶段三 · 文档剪枝（L3 / L4）

- **L3** ADR-009 标注 superseded-by ADR-031，更新 ADR 索引状态列。
- **L4** docs/plan/archive/ 建按季度子索引；不删历史文件，只加导航。

## 全过程非协商规则

- 不要引入向后兼容 shim、feature flag、双轨兼容。项目在活跃开发期。
- 不要在事件总线里再加"同进程 RPC"变体。ADR-033 已明确弃用。
- 不要跨模块 import 别包内部实现绕过 Port（若发现现有违规，先用 Port 修）。
- 不要在集成测试里 mock 数据库；单元测试可以。
- 不要用 --no-verify / --amend 跳 pre-commit 钩子或改已发布 commit。
- 不要跑 git reset --hard / git clean -f / git checkout . 等破坏性命令，除非已 stash 全部改动并向用户确认。
- 每 PR 一个分支，命名 refactor/event-bus-hardening-pr<N> 或 refactor/goal-task-linkage-pr<N>。基于 main 起分支。
- 不要主动 git push 或建 PR，除非用户明说。写完代码、跑完验证、给我一句"PR-N 完成，等你确认推送"即可。
- 每个 PR 完成后在 plan 文件对应步骤打勾（在 plan 里 append 一个短小 "## 实施进度" 段落，别改历史步骤文本）。plan 全部完成后把它挪到 docs/plan/archive/。

## 遇到冲突或分歧时

- 若 plan 或 ADR 与当前代码冲突 → 以代码为准（AGENT.md 真值顺序），修正 plan/ADR。
- 若发现方案里没覆盖的必要改动 → 先在当前 PR 描述里列出、暂不做；除非它阻塞本 PR，才在本 PR 处理并明确标注"临时纳入"。
- 若某个 use-case 的重构会牵扯 3+ 个包 → 停下来在 plan 里补一个短说明，问用户是否拆到独立 PR。
- 环境或依赖有问题跑不了验证 → 明说"哪一步跑不动、为什么"，不要伪造通过。

## 交付格式（每个 PR 完成时）

给我一段简短汇报：

1. 本 PR 分支名
2. 改动概要（2-4 行，重点讲"为什么这么改"，不是"改了什么文件"）
3. 验证命令与结果（命令 + 通过/失败）
4. 有无偏离 plan/ADR 的地方（有的话解释）
5. 下一步（下个 PR 或阻塞项）

不需要贴 diff，我会自己看代码。

---

现在，从读文档开始。读完后给我一句"文档已读完，从 PR-1 阶段一开始，估计触及以下文件…（列 5-8 个关键路径）"，然后开工。

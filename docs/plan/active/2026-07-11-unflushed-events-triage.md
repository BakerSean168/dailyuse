---
tags:
  - plan
  - active
  - governance
  - event-bus
description: PR-3 unflushed-events-audit 冻结的 baseline 逐条 triage + 审计自身盲区修复，来自 2026-07-10 事件总线加固后续
created: 2026-07-11T00:00:00+08:00
updated: 2026-07-11T00:00:00+08:00
---

# Unflushed Domain Events — Baseline Triage

## 背景

PR-3（`docs/plan/archive/2026-07-10-event-bus-and-governance-hardening.md` 阶段二 M4）新增了
`tools/governance/unflushed-events-audit.mjs`，用 ts-morph 扫描"聚合会
`addDomainEvent`、但持久化它的仓储从不冲刷事件到总线"的疑似漏发点。

首次运行 surfaced 出 7 处既有条目，当时以 **documented baseline allowlist** 冻结（不阻塞
PR-3，标注 SURFACED-not-blessed，待独立 triage）。本文件是对这 7 条的逐一核查结论，以及
审计自身一个盲区的修复计划。

## 先厘清一个概念疑问："领域事件不是应该自动发送吗？"

是的，**这正是设计意图**——但"自动"依赖仓储接对发布 seam。当前仓库的机制链是：

1. **领域方法里 `addDomainEvent`**：聚合根（`AggregateRoot`，
   `packages/utils/src/domain/aggregate-root.ts`）在业务方法内把事件推进内部
   `_domainEvents` 数组。这一步各聚合做得很到位。
2. **仓储 `save` 后冲刷**：事件**不会**自己发出去。必须由持久化该聚合的仓储，在写库成功后
   调用某个"取出并发布"的动作，把 `_domainEvents` 冲刷到 `eventBus`。
3. **总线派发给订阅者**：`eventBus.send` → mitt → 各 `on` 订阅者。

**为什么会出现"没发送"**：第 2 步不是语言层面强制的。仓库里存在**两套并行的发布 seam**，
外加一种手写变体，任何一个 adapter 只要哪套都没接，事件就在 `save` 结束后随聚合一起被丢弃
（下次 `pullDomainEvents` 或 GC 时清空），且**没有任何编译错误或运行时报错**——这正是
静默丢事件的根因，也是 H2/H3/M4 要根治的对象。

### 两套发布 seam（都合法，是历史演进产物）

| Seam | 机制 | 代表 | 数量 |
| --- | --- | --- | --- |
| **A. AggregateRepositoryBase**（自动） | 仓储 `extends AggregateRepositoryBase`，只实现 `persist()`；基类 `save()` 在 `persist()` 成功后自动 `publishAggregateEvents()` 冲刷（`packages/patterns/src/repository/aggregate-repository.base.ts:86-89`） | goal / task / authentication 的多数 prisma+powersync 仓储（18 个） | 多数 |
| **B. flushDomainEvents 帮助函数**（手动） | 仓储直接 `implements I*Repository`，在 `save()` 末尾手动 `flushDomainEvents(publisher, aggregate)`（`packages/utils/src/domain/flush-domain-events.ts`） | reminder-template / schedule-task / ai-conversation / notification（PR-1 加固过的那批） | 若干 |
| **C. 手写 pull+send 循环**（手动变体） | 仓储手动 `const events = agg.pullDomainEvents(); for (…) eventBus.send(…)`，不走 A 也不走 B | account-powersync | 1（已知） |

**根因**：seam 有 A/B/C 三种写法、且 A 是"继承即自动"而 B/C 是"记得手写才有"。新加的 adapter
（尤其是 powersync 侧后补的）很容易忘记接任何一套。**这就是"应该自动却没发"的确切答案**：
自动只对接了 seam A 的仓储成立；接 B/C 的靠人记得，漏接的就静默丢。

## 逐条 triage（7 条 → 实为 1 误报 + 6 真空档，其中 5 潜伏 + 1 待定）

核查维度：聚合是否真的 emit 事件、仓储是否以**任何** seam（A/B/C）发布、该事件全仓有无 `.on` 订阅者。

| # | 仓储 | 聚合 emit? | 发布 seam? | 订阅者 | 结论 |
| --- | --- | --- | --- | --- | --- |
| 1 | account-powersync | ✅ | **C（手写 pull+send，第 114-117 行）** | 0 | **审计误报**——实际有发，只是审计不认 seam C |
| 2 | auth-session-powersync | ✅ | ❌ 无（未 import eventBus） | 0 | 真空档 · 潜伏 |
| 3 | notification-template-powersync | ✅ | ❌ 无 | 0 | 真空档 · 潜伏 |
| 4 | notification-template-prisma | ✅ | ❌ 无 | 0 | 真空档 · 潜伏 |
| 5 | reminder-group-powersync | ✅ | ❌ 无 | 0 | 真空档 · 潜伏 |
| 6 | repository-powersync | ✅ | ❌ 无 | 0 | 真空档 · 潜伏 |
| 7 | repository-prisma | ✅ | ❌ 无 | 0 | 真空档 · 潜伏 |

### 关键结论

- **没有一条是"正在造成可观察 bug"**：这 7 类事件（`account:*`/`auth:session-*`/
  `notification:template-*`/`reminder:group-*`/`repository:*`）在全仓 **0 订阅者**。今天不发
  也没有功能失效。它们是**潜伏雷**：将来任何人写 `eventBus.on('repository:created', …)`
  会发现事件根本不来，且无报错。
- **#1 account-powersync 是审计自身的盲区**：它用 seam C 发了事件，审计只认 seam A（继承）
  和 seam B（`flushDomainEvents`/`publishDomainEvents`/`publishAggregateEvents`），漏认了
  "手写 `pullDomainEvents()` + `eventBus.send()`"。这是 **audit 的假阳性，不是代码 bug**。
- **account 后端不一致的原有判断需要更正**：先前以为 "prisma 发、powersync 不发"。实际是
  **两个后端都发**，只是走了不同 seam（prisma 走 A 的 `publishAggregateEvents`，powersync 走 C
  的手写循环）。行为一致，只是写法分裂。

## 实施步骤

### 阶段一：修审计盲区（先做，因为它改变 baseline 内容）

1. **让 `unflushed-events-audit` 识别 seam C**：在 `tools/governance/lib/unflushed-events.mjs`
   的"仓储是否发布事件"判定里，除现有的 `flushDomainEvents`/`publishDomainEvents`/
   `publishAggregateEvents`/继承 `AggregateRepositoryBase` 之外，追加识别
   **`pullDomainEvents(` 与 `eventBus.send(`/`.send(` 在同一文件同时出现** 的手写冲刷模式。
   补正反 fixture 单测。
2. 重新运行审计：#1 account-powersync 应自动移出（不再需要 allowlist 条目）。把
   `BASELINE_ALLOWLIST` 从 7 条缩到 6 条。
3. `governance-tools:test` + `daily-use:governance-check` 全绿。

### 阶段二：消化 6 条真空档（每条二选一，可独立小 PR）

对 #2–#7 六个仓储，逐个决策——**不要无脑加 flush**，先判断"这些事件到底要不要对外发"：

- **若事件有未来消费者**（如 `repository:created` 将来要触发索引/通知）：给该 adapter 接一套
  seam。**推荐统一接 seam A**（改为 `extends AggregateRepositoryBase`，与同包 prisma 侧对齐），
  消除 B/C 手写变体的分裂。接完从 allowlist 移除该条。
- **若聚合本就不该对外发事件**（这些 `addDomainEvent` 是早期占位、无人会消费）：更干净的做法是
  **把 `addDomainEvent` 从聚合领域方法里删掉**——别攒不发的事件。审计随之自然放行，allowlist
  再缩一格。

  > 判据：搜 `contracts/<module>/protocol/*-event-map.ts` 看该事件是否在 EventMap 里被"郑重
  > 声明为跨模块契约"。是 → 倾向接线（阶段二选项一）；只是聚合内部 `addDomainEvent` 而 EventMap
  > 无对应键、也无任何 `.on` → 倾向删事件（选项二）。

3. 每处理一个，`BASELINE_ALLOWLIST` 缩一条。**目标：allowlist 归零**，届时审计从"现状封顶"
   升级为"全仓强不变式：会发事件的聚合，其所有仓储必接发布 seam"。

### 阶段三：统一 seam（可选，收敛技术债）

- 评估把 seam B/C 的手写仓储逐步迁到 seam A（`AggregateRepositoryBase`），让"发布"从"记得手写"
  变成"继承即有"。这是消除本类问题**根因**的终极手段，但涉及面广（B/C 仓储数十个，powersync 侧
  还牵涉 PR-1 引入的 `writeTransaction` 事务边界），务必独立成计划、分包推进，不与阶段一/二混。
- 是否引入 transactional outbox（"提交后、派发前崩溃丢事件"的彻底解法）另立 ADR，超出本计划。

## 完成标准

- 审计识别 seam C；account-powersync 移出 baseline；`governance-tools:test` 覆盖 seam C 的正反
  fixture。
- 6 条真空档各有明确 verdict（接线 / 删事件），逐条落地后 `BASELINE_ALLOWLIST` 归零。
- `daily-use:governance-check` 全程保持绿。

## 备注

- 阶段一是纯工具修复、零业务风险，建议优先。
- 阶段二每条改动小但需要业务判断（事件要不要留），适合逐包独立 PR，配 adapter 层单测断言
  "save 后事件确实进了总线"。
- 本计划与 `2026-07-11-cross-feature-boundary-hardening.md`（M3 落地）互不依赖，可并行。

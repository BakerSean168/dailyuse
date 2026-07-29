---
tags:
  - plan
  - active
  - hygiene
  - agent-host
  - nightly
  - dual-track
description: 夜间持续执行协议——第二代 dual/hygiene + ADR-035 agent-host vertical slices（vault DoD 已 15/15 后）
created: 2026-07-25T00:00:00
updated: 2026-07-25T00:00:00
---

# 夜间 hygiene + Agent Host 持续执行协议

## 1. 文档地位

- **主产品 plan**（完成定义未宣称）：[`2026-07-17-unified-assistant-agent-host.md`](./2026-07-17-unified-assistant-agent-host.md)
- **优雅化地基**（E1–E7 已完成，已归档）：[`../archive/2026-07-26-codebase-elegance-foundation.md`](../archive/2026-07-26-codebase-elegance-foundation.md)
- **Vault / Windows / 时间体系 / Auth / SMTP 等**：见 [`README.md`](./README.md)「本轮已归档」与 `docs/plan/archive/`
- **本文件**：给远程/Windows agent 的**夜间持续优化协议**与 residual 日志（How）；GOAL_PRIORITY 以 agent-host 切片为主。

规范入口：`AGENT.md`。真值：代码/配置/测试 > 根配置 > `docs/`。

## 2. 当前基线（勿倒退）

| 项 | 状态 |
|----|------|
| `main` | 含 vault DoD 15/15 + nightly N1–N3（merge #188） |
| Vault §13.2 | **15 [x] / 0 [ ]**，PR readiness **yes**（已合，勿倒退） |
| 诚实边界 | 不宣称 Electron multi-engine 产品 E2E；不宣称 real Pi spawn；不宣称跨进程 durable LangGraph Turn Engine |
| Agent-host 完成定义 | **未宣称**（阶段 0–6 部分；Pi/CLI/完整 Host UI 仍 open） |
| 旧 do-while（helper dual 微扫） | **近饱和**；禁止为刷 residual 数字再灭已 dual-retired 的 format/pad 级 dual |
| 优雅化 | 见 elegance plan §3.1；基线 dual-surface≈237、keep-boundary≈66 |
| 交付 PR | **#189** `docs/codebase-elegance-foundation`：**先执行 dual 清理与地基，达 E2+E3 后再 merge** |

**PR 策略**：elegance 本轮 **单 PR #189** 承载阶段 A + B（dual 清理必进）+ 宜含 C1–C2/E5；多次 commit，**禁止 plan-only 提前合 main**。D/完整 E 可 follow-up。

## 3. 目标

1. 在 PR #189 内推进 elegance 达 **merge 门槛**（A + B/E2+E3，宜 C1–C2/E5）。
2. 用**第二代** dual/hygiene 消 **open_S / open_M** 并减 dual 税；L 只登记。
3. 推进 ADR-035 切片仅在 #189 范围外或 follow-up（与 elegance D 对齐）。
4. 保持门禁可绿；不假绿翻 agent-host 完成定义。
5. 每轮可提交、可复核、可停；**未达门槛不 merge #189**。

## 4. 优先级（严格）

```text
GOAL_PRIORITY =
  1) PR #189 merge 门槛：elegance A → B Registry → B dual 清理（E3）
  2) #189 宜做：C1–C2 路径地图、E5 死域 S
  3) dual registry 驱动的 open_S / open_M 清扫（禁止微 dual 刷数）
  4) 绿测 + residual + 更新 PR 描述 → 再 merge #189
  5) follow-up：agent-host AH-4+ / auth 小步 / 产品 P0 / smoke
```

Vault plan **只**在归档或修回归时改动；**不要**再无限膨胀 vault §13.2 小说。  
residual 记本文件 §9 与 elegance plan §9。

## 5. 第二代 do-while 规则

### 5.1 发现（只读）

- CodeGraph / `rg`：同名 export 双文件、兼容 re-export、`Legacy*`、死 IPC、双 HTTP 客户端、双 store 写同一领域、Chat vs Host 双编排。
- **排除**：已有 `*-dual.surface.spec.ts` 且文案为 `keep-boundary` / `dual-retired` 的已定点。

### 5.2 分级

| 级 | 含义 | 动作 |
|----|------|------|
| **S** | 无消费者兼容层 / 死代码 / 假 dual | 删除 + 必要时 surface |
| **M** | 两实现语义相同 | sole helper + 改调用方 + 删旧 + surface |
| **L** | 语义 intentional 不同 | 只补文档/锁，**不强制 merge** |
| **X** | 跨 auth/token/git push 或 agent-host 大边界 | 记 plan，本轮不硬拧 |

### 5.3 执行

- 一轮只做一个 S 或一个 M，**或**一个 agent-host vertical slice。
- 最近 target：`pnpm nx run <project>:test|lint|typecheck`；触及治理则 `memoflow:governance-check`。
- 禁止提交：密钥、`.env*.local`、Playwright report/trace/webm/png。
- 禁止 force-push。

### 5.4 停止条件（当夜）

- 连续 N 轮（建议 3）只找到 L/X → 停，改 agent-host 切片或门禁 smoke。
- diff 触及生产密钥/OAuth secret/force-push 路径 → 停，留人审。
- agent-host 完成定义**不得**因 unit 假绿全勾。

## 6. Agent-host 夜间切片队列（建议序）

| ID | 切片 | 验收线索 | 状态 |
|----|------|----------|------|
| AH-1 | `run.started` 携带 `conversationId`，固化 Conversation↔Host open-chat run 关联 | contracts + AssistantFacade + focused tests + surface | **本文件 residual N1 落地** |
| AH-2 | Host `list`/恢复：按 conversationId 枚举 open-chat / AgentRun 边界文档与 fail-closed | listAgentRuns + Host UI 只读路径 | **N2 surface 诚实边界已锁**；产品恢复 UI 仍 pending |
| AH-3 | Proposal precondition 产品规则（stale/conflict）最小闭环 | ProposalKernel + surface | **N3：stale 禁 approve；revise 清 stale** |
| AH-4 | Task 共用 Artifact 工作台一小步（非全量富编辑） | Host UI + journey | pending |
| AH-5 | Electron multi-engine 产品 E2E（或诚实 external + driver 一步） | scaffold `e2e.electron_desktop_full` | pending / 可 external |
| AH-6 | real Pi spawn：要么 fail-closed 产品路径，要么永久 research keep-boundary | scaffold `e2e.real_pi_spawn` | pending / 默认不假绿 |
| AH-7 | 阶段 8 遗留：direct/remote runtimeMode 向 capability 组装收缩（小步） | 单 capability 投影 | pending |

诚实：AH-5/AH-6 可长期 external；**不**据此勾 agent-host §20 全项。

## 7. 硬约束

- `pnpm` / `pnpm nx ...`
- 不引入临时 shim、双轨兼容；根因修复
- 不把 e2e-mock 或 SSE mock 说成 real Pi / Electron 全路径
- 不把 vault §13.2 从 15/15 改回 open
- 微 dual（formatDate/padTwoDigits 级）**默认不做**

## 8. 每轮模板

1. `git pull` 当前功能分支  
2. 按 GOAL_PRIORITY 选 1 项  
3. 实现 + 最近验证  
4. 本文件 §9 追加 residual 行；若属 agent-host，同步改 agent-host「当前进展」一句  
5. commit + push  
6. 重复直到停止条件或人工停  

## 9. Residual 日志

| ID | 日期 | tip / 说明 | 类型 | 结果 |
|----|------|------------|------|------|
| N0 | 2026-07-25 | 创建本协议；基线 vault 15/15 @ `2444ec922` | docs | 文件入库 |
| N1 | 2026-07-25 | AH-1：`AssistantEvent` `run.started.conversationId?` + facade 下发 + association surface；e2e multi-engine mock 对齐 | agent-host | focused ai 14 + contracts stage0 5 绿 |
| N1b | 2026-07-25 | dual 扫描：`formatFileSize` 等仍为 L keep-boundary（1145），**不 merge** | hygiene L | 跳过微 dual |
| N2 | 2026-07-25 | AH-2：Conversation↔Host association surface（open-chat ≠ listAgentRuns；§20 不勾） | agent-host | surface 绿 |
| E-PR189 | 2026-07-26 | elegance A+B+C：archive vault；Dual Registry；dual 237→84；AI path map；AH-2 书面不做 | elegance | merge 门槛 |
| E5b | 2026-07-26 | bootstrap LegacyAccountModule → AccountApiModule + surface（#189 后真 E5 S） | elegance | 死域 S |
| N3 | 2026-07-25 | AH-3：ProposalKernel stale 禁 approve；revise 清 stale→draft；STALE_REVISION 仍在 | agent-host | kernel tests |

## 10. 完成 / 归档

- 本文件**不**替代 agent-host 完成定义。
- Vault PR 合并后：vault plan + Windows handoff 迁 `docs/plan/archive`；本文件与 agent-host 保持 active。
- 当 agent-host §20 可诚实宣称时，再归档 agent-host 与（可选）本协议。

## 11. 给 agent 的开跑提示词（可整段）

```text
你是本仓库协作 agent。读 AGENT.md 与 docs/plan/active/2026-07-25-nightly-hygiene-and-agent-host.md。
Vault §13.2 已 15/15 PR readiness yes（tip ≥ 2444ec922）；不要倒退 DoD。
主推：agent-host vertical slices（见该 plan §6）与第二代 dual hygiene（§5，禁止微 dual 刷数）。
优先级：agent-host > auth 小步 > S/M dual > 产品 P0 > smoke。
每轮一项、最近验证、写 residual N#、commit push。不假绿勾 agent-host 完成定义。
不提交密钥与 Playwright report。PR 在本协议有意义交付之后再合。
开跑：从 §6 队列表第一个 pending 项开始。
```

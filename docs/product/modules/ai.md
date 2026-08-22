---
tags:
  - product
  - module
  - ai
description: AI 模块当前功能、产品边界与 Mastra-native 运行架构
created: 2026-06-02T00:00:00
updated: 2026-08-22T12:50:00+08:00
---

# AI 模块说明

## 1. 功能定位

AI 模块提供统一对话、Goal/Task/Knowledge 结构化工作流、Provider/BYOK 选择、知识检索与评估能力。它负责 AI 推理和 durable workflow 编排，但**不拥有 Goal、Task、Repository 等业务事实**；真实写入必须通过对应业务 application port。

## 2. 当前产品能力

- **AI Chat**：Mastra Assistant 流式响应、取消、history/restart recovery、conversation usage/cost。
- **Goal Create**：clarify → draft/review → revise/reject/approve → `ApplyGoalPlanService` → Goal/Task/Reminder application ports。
- **Task Create**：durable `task.create` workflow，经用户确认后通过 Task application port 创建真实任务模板。
- **Knowledge Capture**：durable `knowledge.capture` workflow，生成结构化知识草稿并经产品确认边界写入 Repository/Vault/GitHub 路径。
- **Knowledge Query / Analytics**：只读能力由 host-owned read ports 提供，模型不能绕过 product boundary 直读数据库。
- **Provider / Model**：ProviderConfig 加密保存 BYOK credential，Mastra model resolver 在 server-side 解析 provider/model。
- **Usage / Cost / Trace**：按 conversation/run 持久查询 token、估算成本、requestId/traceId、provider/model。
- **Evaluation**：TypeScript eval runner 比较 configuration bundle，当前离线 replay 覆盖 open chat、goal planning、knowledge answer，并提供 quality/cost/latency release gate。

## 3. 唯一运行时

当前核心运行时只有：

```text
TypeScript packages/ai
  └─ MastraAIRuntime
      ├─ Assistant runtime
      ├─ goal.create workflow
      ├─ task.create workflow
      └─ knowledge.capture workflow
```

以下旧架构均已退役，不是兼容 fallback：

- Python `apps/ai-service` / FastAPI / LangGraph；
- `AIService*Adapter` + HMAC runtime bridge；
- Agent Host / `AssistantFacade` / `ProposalKernel` / `CapabilityResolver` / `TurnEngine`；
- AgentRun / AgentAction DAG 与 LangGraph checkpoint persistence；
- direct-provider / remote-ai-service 双 runtime。

ADR-035 仅保留为历史决策记录；当前目标态由 ADR-050/051/052 取代。

## 4. 产品工作区

AI 工作区保持“左对话、右业务工作台”：

- 左侧聊天只消费 Assistant runtime event/history；
- 右侧 Goal/Task/Knowledge 面板只投影 `AIWorkflowRunView`；
- UI 不拥有 workflow engine，不持久化第二套状态机；
- workflow restore 通过 `get/list` 从 Mastra durable snapshot 重建；
- usage badge 读取 durable conversation/run 累计 token/cost；
- 完成后的 deep link 只使用 domain mutation 返回的真实 entity id。

## 5. 写入与审批边界

AI 的默认路径是“建议/草稿 → 用户确认 → 业务写入”：

1. Planner 生成 typed decision/draft；
2. 如信息不足，workflow suspend 并请求 clarification；
3. 用户可 revise / reject / approve；
4. approve/confirm 后调用 product-owned mutation port；
5. domain application service 执行业务 invariant、幂等和持久化；
6. workflow 记录结果并生成 `AIWorkflowRunView`。

Mastra tool/workflow **不得直接 import Prisma/PowerSync repository 做业务 mutation**。

## 6. Identity / Credential / Error 边界

- HTTP/IPC command body 不接受客户端 `identityId`；Host 从认证上下文注入。
- Provider API key 不进入 RequestContext、runtime event、execution log、eval report 或 UI。
- raw provider exception 不跨 transport；使用稳定公开 error code/category。
- `requestId` / `traceId` 在 HTTP entry 一次生成并透传到 Mastra execution log。
- usage query 始终以 authenticated identity 作为数据库谓词，不能先查全量再在内存过滤。

## 7. Persistence ownership

| 数据 | Authority |
| --- | --- |
| Assistant thread/history | Mastra storage |
| Workflow execution/snapshot | Mastra storage |
| Goal/Task/Reminder | MemoFlow domain stores |
| Knowledge notes/resources | Repository/Vault/GitHub product stores |
| Provider config / encrypted credential | MemoFlow AI provider persistence |
| Usage/cost/trace | `ai_generation_tasks` execution log |
| Eval latest | `reports/apps/ai/evals` |

旧 `AiMessage` transcript 仅允许一次性 bootstrap 到 Mastra thread；新 Assistant turn 不双写旧 message store。

## 8. Web / Desktop parity

- Web：HTTP/SSE clients；API composition 使用 PostgreSQL-backed Mastra storage。
- Desktop：typed IPC clients；profile-local runtime 使用 LibSQL Mastra storage。
- 两端共享 Assistant/Workflow/Usage contracts，不暴露 Mastra private snapshot/type。

## 9. 当前持续优化项

- 扩充 live eval executor 与更大风险分层数据集；
- 完善 Provider pricing catalog/真实账单对账；
- 继续 harden knowledge indexing、webhook/幂等/删除后向量清理；
- 在不破坏 product mutation boundary 的前提下增加更多 durable workflow；
- 对长 conversation/run 的 usage/cost 提供更细粒度产品视图。

## 10. 相关资料

- [AI 运行路径地图](../../architecture/ai-runtime-path-map.md)
- [ADR-050: Mastra Native AI Runtime](../../architecture/adr/ADR-050-mastra-native-ai-runtime.md)
- [ADR-051: AI Primitive Taxonomy](../../architecture/adr/ADR-051-ai-primitive-taxonomy.md)
- [ADR-052: Goal Create Reference Workflow](../../architecture/adr/ADR-052-goal-create-reference-workflow.md)
- [AI 模块文件索引](../module-index/ai-files.md)

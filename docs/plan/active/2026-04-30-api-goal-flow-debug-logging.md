# API Goal Flow 调试日志增强

## Summary

为 `api` 侧 `goal-flow` 增加结构化调试日志，覆盖 `GoalGenerationApplicationService`、`ai-service` 内部 HTTP adapter 和真实执行器，确保可以从 API 日志中判断请求是否进入、是否发给 `ai-service`、返回了哪个 state、以及执行阶段具体失败在哪个 action。

## Implementation

- 在 `GoalGenerationApplicationService` 中记录：
  - `generateGoal` 请求入口摘要
  - provider 解析结果
  - `draft` / `prepare` / `execute` 分支开始与完成
  - `clarification` / `draft` / `confirm` / `result` 状态摘要
  - knowledge source / analytics context 加载结果
  - execute 阶段 action 数量、成功/失败汇总
- 在 `AIServiceInternalClient` 中记录：
  - 向 `ai-service` 发起请求的 path、requestId、identityId、body 摘要
  - HTTP 成功状态码
  - 非 2xx、timeout、abort、transport error
- 在 `AIServiceGoalPlanningAdapter` 和 `AIServiceGoalAutomationAdapter` 中记录：
  - 发起内部工作流调用前的输入摘要
  - 收到 payload 后的 state / action / usage 摘要
- 在 `BackendAutomationToolExecutorAdapter` 中记录：
  - 每个 action 开始执行
  - 每个 action 成功/失败
  - 全部 action 执行完成后的汇总

## Test Plan

- 运行 `packages/ai` 现有 `GoalGenerationApplicationService` 单测，确保新增日志不改变行为。

## Assumptions

- 本次只补 API 侧调试日志，不改变业务流程或响应契约。

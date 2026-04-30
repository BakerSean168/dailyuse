# AI Service 文件日志与 Goal Workflow 调试增强

## Summary

给 `apps/ai-service` 增加和 `api` 一样的本地文件日志持久化能力，并为 `goal` / `goal-automation` 工作流补齐阶段化、结构化调试日志，确保本地可以直接判断请求是否进入服务、卡在哪一层、provider 返回了什么、tool loop 是否执行。

## Implementation

- 新增 `ai-service` 日志初始化模块：
  - 使用控制台 + 按天滚动文件日志
  - 默认落盘到 `apps/ai-service/logs/`
  - 支持 `LOG_DIR` 和 `LOG_LEVEL`
  - 同步接管 `uvicorn` 相关 logger，避免只在终端输出
- 更新 `Settings`：
  - 新增 `log_dir` 配置
  - 保持现有 `log_level` 语义不变
- 在 `create_app()` 启动时初始化日志，而不是继续使用 `logging.basicConfig`
- 给 `goal` 工作流增加详细日志：
  - `/internal/workflows/goal` 和 `/goal-automation` 路由入参与结果摘要
  - orchestrator 分发开始/结束
  - handler 收到请求与传给 service 的核心参数
  - `plan_with_clarification`、`clarify`、`plan`、`plan_automation` 的阶段开始/结束
  - provider completion 的 `finish_reason`、content 长度、tool call 名称、usage
  - tool loop 每一轮、执行的只读工具、返回结果摘要
  - `search_notes` / `fetch_stats` 的输入和结果数量
  - structured output 解析失败时的内容预览和失败阶段
- 为日志补一组通用 helper：
  - 文本预览截断
  - provider config 摘要
  - completion/tool call/usage 摘要
  - 统一 metadata JSON 串格式，便于 grep
- 让 `request_id` 向下透传到 goal service 与 tool loop，保证单次工作流能串起整条日志链。

## Test Plan

- 新增日志初始化单测：
  - 默认日志目录解析正确
  - 指定 `log_dir` 时会创建文件 handler
- 更新 handler 单测：
  - 断言 `request_id` 会透传给 `plan_with_clarification` / `plan_automation`
- 运行与 goal workflow 相关的 Python 单测，确保新增日志不改变现有行为。

## Assumptions

- 本次只增强 `ai-service` 的文件日志与 `ai-goal-flow` 诊断能力，不修改 `api`、桌面端或前端日志策略。
- goal workflow 调试日志以“能定位故障”为优先，不追求完全 JSON logging 体系替换。

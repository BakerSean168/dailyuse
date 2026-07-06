# Code Quality & Consistency Audit

- 初始审查日期：2026-07-05
- 修复回写日期：2026-07-06
- 当前状态：前一轮审计中的 Q-001 ~ Q-006 已全部收敛到当前代码；本文件不再保留过时的“待修复建议”，只记录修复后的结论
- 修复策略：根因修复、删除旧兼容路径、不保留 legacy shim 或双轨实现
- 审查范围：`apps/web`、`packages/authentication`、`packages/task`、`packages/schedule`、`packages/app-vue`、相关治理脚本

## 1. Executive Summary

2026-07-05 的只读审查识别了 6 个主要问题：`task` 生命周期一致性、认证 mock 漂移、`schedule` 双轨运行时、`schedule` runtime 缺少 direct tests、AI composable 类型退化，以及 `task` 关键 use case 注释乱码。

截至 2026-07-06，这 6 个问题都已经按根因收敛，而不是通过兼容层、fallback 语义或保留旧实现来“包住问题”。最大的结构变化是：

- `packages/task` 统一到显式写事务 seam，模板状态与实例写入共用同一事务边界，提交后再发布事件。
- `packages/schedule` 只保留当前 live runtime；历史 executor / bootstrap 链路与对应测试已物理删除。
- `apps/web` 的 forgot/reset mock 已对齐服务端真实能力。
- `packages/app-vue` 的 AI composable 已恢复端到端强类型。

当前结论：这份审计中提出的问题已经不再是当前代码库的活跃 finding。

## 2. Resolved Findings

| ID | 初始问题 | 当前状态 | 根因修复结果 |
| --- | --- | --- | --- |
| `Q-001` | `task` 模板状态先落库，再处理实例副作用，且部分失败会被吞掉 | 已修复 | 引入统一 `TaskWriteTransactionRunner` seam；`create / activate / pause / generate / delete` 全部收敛到单一写事务边界；Prisma 与 PowerSync 都在提交后 flush 缓冲事件 |
| `Q-002` | forgot/reset 的前端 mock 固定返回 `503`，与服务端真实能力漂移 | 已修复 | `apps/web` mock 改为返回已实现语义；相关 Web 与 Authentication 测试均通过 |
| `Q-003` | `schedule` 同时保留 live runtime 与 legacy executor / bootstrap 双轨概念 | 已修复 | 旧执行链已从 `packages/schedule/src` 物理删除；barrel 与治理 allowlist 已同步清理；当前只保留 `api/runtime.ts` 这一条运行时主链 |
| `Q-004` | live runtime 缺少 direct tests | 已修复 | `packages/schedule/src/api/runtime.spec.ts` 已直接覆盖队列加载、事件同步、执行失败与 stop/unsubscribe 语义 |
| `Q-005` | `useAI()` 把强类型 providers/capabilities 降级为 `unknown` | 已修复 | `useAI()` 直接保留 `AIClientPort` 返回类型；`app-vue:typecheck` 已通过 |
| `Q-006` | `task` 关键 use case 注释乱码，影响维护与 focused repair | 已修复 | `activate / pause / delete` 关键文件注释已恢复为可读英文说明 |

## 3. Code-Level Repair Notes

### Q-001：`task` 生命周期一致性

当前实现已经采用显式事务 seam，而不是继续容忍 partial-success：

- 应用层统一通过 `packages/task/src/application-server/use-cases/commands/task-write-support.ts` 定义写事务 seam。
- `PrismaTaskWriteTransactionRunner` 与 `PowerSyncTaskWriteTransactionRunner` 都会在事务内写模板/实例，在事务外统一 flush 缓冲领域事件。
- `DeleteTaskTemplateUseCase` 也已纳入同一事务语义，不再保留删除路径的特殊分支。
- `task:test` 与 `task:test:integration` 已验证通过。

### Q-002：认证 mock 契约

当前 forgot/reset 的本地 mock 与服务端一致：

- `apps/web/src/mocks/handlers/auth.handlers.ts` 对 forgot/reset 返回成功语义，而不是历史 `503`。
- `apps/web/src/mocks/handlers/auth.handlers.spec.ts` 与 `packages/authentication/src/api/routes.spec.ts` 已对齐当前能力。

### Q-003 / Q-004：`schedule` 单一运行时模型

本轮不再只做“legacy 隔离”，而是直接删除旧代码：

- 已删除历史执行链文件：
  - `packages/schedule/src/application-server/services/schedule-execution-service.ts`
  - `packages/schedule/src/application-server/use-cases/execute-due-schedule-tasks.use-case.ts`
  - `packages/schedule/src/application-server/use-cases/execute-schedule-task-by-id.use-case.ts`
  - `packages/schedule/src/application-server/use-cases/schedule-task-executor-adapter.ts`
  - `packages/schedule/src/infrastructure-server/scheduler-bootstrap.ts`
  - 对应 legacy barrel 与旧测试文件
- 已清理 `packages/schedule` barrel 中“while retiring old path”注释，避免代码继续暗示双轨并存。
- 已移除 `tools/governance/singleton-audit.mjs` 中针对 `scheduler-bootstrap.ts` 的 allowlist。
- live runtime 由 `packages/schedule/src/api/runtime.ts` 与 `packages/schedule/src/api/runtime.spec.ts` 单独承担并验证。

### Q-005：AI composable 强类型恢复

当前 `useAI()` 不再制造额外的类型断层：

- `providers` 保持为 `AIProviderConfigClientDTO[]`
- `capabilities` 保持为 `AICapabilities | null`
- 消费侧不再需要为了绕过 `unknown` 做重复强转

### Q-006：关键 use case 可读性

`packages/task` 关键命令用例的乱码注释已经清理，当前注释表达的是实际业务流与事务语义，不再误导维护者。

## 4. Compatibility Cleanup

本轮除了修复审计 finding，也顺手删除了确认为仓库内无生产引用的兼容入口，避免“主链路修干净了，但历史 API 还挂着”：

- `ScheduleTask.fromDTO()` 已删除
- `ScheduleExecution.fromDTO()` 已删除
- `packages/schedule/src/domain-server/calculators/recurrence.ts` 中未对外导出的旧别名 `RecurrenceRule = CronRecurrenceRule` 已删除

这些删除符合仓库当前规则：项目处于活跃开发期，不要求向后兼容，优先做结构性收敛。

## 5. Validation

本轮已执行并通过：

- `node .\node_modules\nx\bin\nx.js run task:test`
- `node .\node_modules\nx\bin\nx.js run task:test:integration`
- `node .\node_modules\nx\bin\nx.js run schedule:test`
- `node .\node_modules\nx\bin\nx.js run web:test`
- `node .\node_modules\nx\bin\nx.js run authentication:test`
- `node .\node_modules\nx\bin\nx.js run app-vue:typecheck`
- `node .\node_modules\nx\bin\nx.js run daily-use:governance-check`

说明：部分测试会主动覆盖错误路径，因此输出中仍会出现预期的 `ERROR` 日志；这些不是失败信号。

## 6. Current Conclusion

这份审计在 2026-07-05 提出的 6 个问题，到了 2026-07-06 已经全部完成根因修复。当前代码库在这些点上不再需要额外 repair pass；后续若再出现类似问题，应以“单一真值源、单一运行时模型、显式事务 seam、删除旧兼容代码”为默认处理方式。
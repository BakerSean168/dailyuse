---
tags:
  - plan
  - configuration
  - testing
  - tdd
description: 配置与领域测试治理收敛方案
created: 2026-04-26T00:00:00
updated: 2026-04-27T00:00:00
status: active
---

# 配置与领域测试治理收敛方案

## 当前真值

本轮已将领域测试基建收敛到“实现即治理”的状态：

- root `vitest.config.ts` 继续只承担 workspace registry，包级行为由各自 `vitest.config.ts` 决定。
- `vitest.shared.ts` 的 governed coverage 已改为按真实运行时实现文件自动收集，不再写死 `schedule` 或 `domain-shared` 的私有路径例外。
- `packages/domain-shared/vitest.config.ts` 通过 `governedCoverage.extraRoots` 显式声明 `src/shared`，共享配置不再感知具体包名。
- `schedule` 已移除旧的 `domain-server/value-objects` 包装层和废弃聚合导出，统一使用 `domain-shared/value-objects` 作为值对象真值入口。
- `ai` 的聚合测试已去掉 `eventType || eventName` 绕过和 `setTimeout` 时间戳 hack，统一使用 `eventType` 与 fake timers。

## 已完成收敛

### 1. Governed Coverage 规则

- 收敛目录固定为：
  - `src/domain-server/aggregates`
  - `src/domain-server/entities`
  - `src/domain-server/services`
  - `src/domain-server/value-objects`
  - `src/domain-shared/value-objects`
- 只纳入真实运行时实现文件：
  - 排除 `index.ts`、类型声明、测试文件、配置文件
  - 纯 re-export 文件不会再被错误纳入 coverage
- package 局部例外改为显式参数：
  - `governedCoverage: { extraRoots: [...] }`

### 2. Schedule 领域模型对齐

- 删除的旧包装层：
  - `src/domain-server/aggregates/schedule.ts`
  - `src/domain-server/value-objects/{ExecutionInfo,RetryPolicy,ScheduleConfig,ScheduleErrors,ScheduleTaskMetadata,TaskMetadata}.ts`
- 保留的服务端值对象职责：
  - `src/domain-server/value-objects/errors.ts`
- 共享值对象统一从：
  - `@dailyuse/schedule/domain-shared`
  - `../../domain-shared/value-objects`
- 对应测试已迁移并补齐：
  - `calendar-entry`
  - `schedule-task`
  - `schedule-config`
  - `execution-info`
  - `retry-policy`
  - `schedule-task-metadata`
  - 共享枚举/结果值对象
  - `schedule-execution`
  - `errors`

### 3. Reminder 领域测试基建补齐

- 新增实体测试：
  - `reminder-history`
  - `reminder-response`
- 新增服务测试：
  - `ReminderTemplateControlService`
  - `ReminderTemplateBusinessService`
  - `ReminderGroupBusinessService`
  - `ReminderTriggerService`
  - `ReminderSchedulerService`
- 新增共享值对象测试：
  - branded enum helpers
  - notification / trigger / active-time / active-hours / stats / metrics / frequency adjustment
- 同步修复根因缺陷：
  - `ReminderTriggerService` 不再重复 `createHistory()` 后再次 `addHistory()`，避免历史记录双写。

## 验证结果

以下目标在 2026-04-27 已验证通过：

- `pnpm nx run ai:test`
- `pnpm nx run schedule:test:coverage`
- `pnpm nx run reminder:test:coverage`

当前 coverage 门禁结果：

- `schedule`
  - statements: `89.9`
  - branches: `80.05`
  - functions: `89.56`
  - lines: `90.64`
- `reminder`
  - statements: `87.19`
  - branches: `75.85`
  - functions: `88.46`
  - lines: `87.6`

## 后续约束

- 新领域实现必须先补测试，再纳入 governed coverage。
- 共享配置不允许重新引入包名特判或具体文件白名单。
- 如果后续某包 coverage 失守，优先补测试，不新增豁免。

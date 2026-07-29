归档时间：`2026-05-11`

归档结论：本计划对应的 contracts governance 收口工作已完成，active 文件转入 archive。

# Contracts 包治理与业务模块标准化优化

> 创建时间: 2026-05-02
> 归档时间: 2026-05-11
> 状态: 已完成

## 一、完成摘要

本计划的目标是把 `packages/contracts` 的领域事件共享面收敛到统一规则：

- contracts 只定义 payload-only 事件接口
- 事件 key 统一采用 kebab 风格
- 删除旧的 full-envelope contracts 接口和遗留导出面
- 将 `schedule` 删除事件纳入 typed contracts
- 将标准文档同步到当前实现

截至归档时，上述目标均已落地。

## 二、已完成内容

### 1. governance 参考实现与标准文档基线

- `packages/governance/src/contracts/` 的教学式注释已补齐
- `docs/standards/contract-module-development-spec.md` 已统一为 `domain:kebab-action-past-tense`
- `docs/standards/domain-event-spec.md` 已升级到当前 payload-only 口径

### 2. 旧 contracts 面已清理

- `editor` 不再在 aggregate DTO 文件中定义 full-envelope 领域事件接口
- `setting` 的共享事件 payload 已去掉 `aggregateId`、`timestamp` 等信封字段
- `goal` 的遗留 `events/domain-events.ts` 已删除

### 3. domain event key 已统一

- `schedule` 已迁移到 `schedule:task-created`、`schedule:task-paused`、`schedule:task-deleted` 等新 key
- `reminder` 已迁移到 `reminder:template-created`、`reminder:group-deleted`、`reminder:response-recorded` 等新 key
- `task` 已迁移到 `task:instance-completed`、`task:template-paused`、`task:template-resumed` 等新 key

### 4. schedule 删除事件已 typed 化

- 已新增 `ScheduleTaskDeletedEvent`
- 已接入 `packages/contracts/src/modules/schedule/domain/events/`
- 已接入 `packages/contracts/src/modules/schedule/protocol/schedule-event-map.ts`
- 运行时删除路径已统一使用 `schedule:task-deleted`

## 三、最终决策

`task` 的实例生成事件最终采用：

- `task:instance-generated`

不采用：

- `task:instances-generated`

原因：当前 contracts、domain-server、runtime、订阅方与测试已经全部围绕 `task:instance-generated` 对齐，继续回切为复数命名没有额外收益，只会引入二次扰动。

## 四、验证结果

归档前已验证通过：

- `pnpm nx run contracts:typecheck`
- `pnpm nx run editor:typecheck`
- `pnpm nx run setting:typecheck`
- `pnpm nx run goal:typecheck`
- `pnpm nx run schedule:typecheck`
- `pnpm nx run task:typecheck`
- `pnpm nx run reminder:typecheck`
- `pnpm nx run memoflow:governance-check`

## 五、后续边界

本计划已关闭。以下内容不再继续回写本文件：

- `ai` streaming channel 的命名与治理
- `repository:resource:mutated` 的后续架构迁移
- branded ID、PersistenceDTO、日期类型的全量标准化

如需继续推进，另开新计划。

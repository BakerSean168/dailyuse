# Contracts 包治理与业务模块标准化优化

> 创建时间: 2026-05-02
> 状态: 规划中

## 一、背景与目标

governance 包（`packages/governance/src/contracts/`）是项目的 DDD 规范参考实现。业务模块（`packages/contracts/src/modules/` 下 12 个模块）存在大量不一致。

**目标**：
1. 完善 governance 注释作为标准参考
2. 审计所有业务模块偏差
3. 逐模块修复，达到统一标准状态

---

## 二、Governance 现状评估

### 2.1 已有的良好基础

- `README.md` 413 行详细架构文档
- 每个文件都有多行 header 注释和 JSDoc
- aggregate root 有 36 行 JSDoc（DDD 模式、状态机、不可变性）
- entity 有 37 行 JSDoc（不可变原则）
- 双语注释（中英文）
- 域事件文件有触发时机和订阅方说明

### 2.2 需要补充的内容

| 文件 | 补充内容 |
|---|---|
| `aggregates/rule-server.ts` | DTO 三层模式说明（Transfer/Persistence/Domain）、TransferDate 原理、branded ID 原理 |
| `value-objects/rule-status.ts` | const object 优于 TS enum 的说明、引用标准文档 |
| `domain/events/rule-created.event.ts` | 明确 payload-only 接口、说明 addDomainEvent 自动包裹机制 |
| `protocol/governance-event-map.ts` | 醒目展示规范格式 `{module}:{kebab-entity}-{kebab-action-past-tense}` |
| `primitives/ids.ts` | branded type 模式原理、与 shared primitives 的关系 |
| `index.ts` | 规范导出顺序说明注释块 |

### 2.3 标准文档修正

`docs/standards/contract-module-development-spec.md` 第 49 行：
- 当前: `Event key 使用 'domain:PascalCaseEvent'`
- 修正: `Event key 使用 'domain:kebab-action-past-tense'`（与 governance 实际实现一致）

---

## 三、12 个业务模块全面审计

### 3.1 事件命名不一致（6 种子模式）

| 模式 | 示例 | 使用模块 | 状态 |
|---|---|---|---|
| `module:verb-past-tense` | `governance:rule-created`, `auth:identity-created` | governance, authentication | ✅ 正确 |
| `module:verb`（无过去式） | `account:create`, `goal:create`, `task:create`, `notification:send` | account, goal, task, notification | ❌ 需修复 |
| `module:PascalCaseClassName` | `editor:EditorWorkspaceUpdatedEvent`, `repository:RepositoryStatisticsUpdatedEvent` | editor, repository | ❌ 需修复 |
| `module:PascalCaseVerb` | `setting:UserSettingCreated`, `setting:UserSettingPatched` | setting | ❌ 需修复 |
| `module.sub_entity.action` | `ai.conversation.created`, `ai.message.added` | ai | ❌ 需修复 |
| `module:entity:action` | `schedule:task:created`, `reminder:template:created` | schedule, reminder, task(子事件) | ⚠️ 可接受 |

### 3.2 Branded ID 使用情况

`packages/contracts/src/primitives/ids.ts` 已定义所有模块的 branded types，但大多数模块未使用：

| 模块 | 状态 |
|---|---|
| account | 部分使用（`IdentityId` 但 `accountId` 仍为 string） |
| goal | 部分使用 |
| task, schedule, notification, editor, repository, reminder, ai | 全部使用 `id: string` |

### 3.3 日期类型不一致

| 模块 | 问题 |
|---|---|
| schedule | ServerDTO 用 `number`，PersistenceDTO 用 `Date`，未用 branded types |
| notification | PersistenceDTO 用 `Date` 而非 `PersistenceDate` |
| account, goal | ✅ 正确使用 `TransferDate`/`PersistenceDate` |

### 3.4 事件结构不一致

| 结构 | 模块 |
|---|---|
| **payload-only**（正确） | account, goal, task, ai, notification, governance |
| **full envelope**（含 type/aggregateId/timestamp） | editor, repository, schedule |

标准：应使用 payload-only，addDomainEvent 工具自动包裹信封字段。

### 3.5 事件定义位置

| 模块 | 位置 | 状态 |
|---|---|---|
| goal, task, account, authentication, editor, notification | `domain/events/` 独立文件 | ✅ |
| schedule | 内联在 `aggregates/schedule-task-server.ts` | ❌ 需提取 |
| reminder | 分散在 `domain/events/` 和 `protocol/reminder-analytics-events.ts` | ⚠️ |

### 3.6 模块目录结构完整性

| 模块 | 缺失目录 |
|---|---|
| dashboard | 仅有 `api/`，缺 aggregates/entities/VOs/domain/protocol |
| ai | 缺 `domain/events/` 独立事件文件 |
| 其他 | 结构基本完整 |

### 3.7 index.ts 导出顺序

当前各模块顺序完全不一致。governance 参考顺序：
`Aggregates → Entities → Value Objects → Domain Events → Protocol → Configs → API → Primitives`

---

## 四、逐模块修复计划

### 4.1 Phase 1: Governance 标准增强（先执行，确认后继续）

在 governance contracts 的 6 个文件中添加教学式注释 + 统一注释风格。同时修正 `contract-module-development-spec.md` 中的矛盾。

**确认点**: 用户确认 governance 注释质量后再进入 Phase 3。

### 4.2 Phase 3: 逐模块优化

#### Wave 1: 低风险（仅命名修复）

**setting 模块**
- `protocol/setting-event-map.ts`: 4 个 PascalCase key → kebab-case
- `index.ts`: 统一导出顺序
- domain-server: 更新 addDomainEvent 调用

**authentication 模块**
- `protocol/auth-event-map.ts`: `auth:login` → `auth:logged-in`, `auth:logout` → `auth:logged-out`
- `index.ts`: 添加分段注释，统一顺序

**reminder 模块**
- `protocol/reminder-event-map.ts`: 修复事件类型映射
- `index.ts`: 添加 `domain/events` 导出

#### Wave 2: 中风险（命名 + ID + 日期修复）

**account 模块**
- 事件 key 加过去式后缀
- 事件字段改用 branded ID
- domain-server: 更新 addDomainEvent

**editor 模块**
- 事件 key 改 kebab-case
- 去除 envelope 字段（payload-only）
- domain-server: 更新 addDomainEvent

**repository 模块**
- 事件 key 改 kebab-case
- 去除 envelope 字段
- domain-server: 更新 addDomainEvent

**notification 模块**
- 事件 key 加过去式
- 补充缺失导出
- domain-server: 更新 addDomainEvent

**ai 模块**
- 点分隔 → 冒号+kebab（`ai.conversation.created` → `ai:conversation-created`）
- domain-server: 更新 addDomainEvent

#### Wave 3: 高风险（结构变更）

**goal 模块**
- 21 个事件 key 统一过去式
- `events/` 顶层 → `domain/events/`
- `id: string` → branded `GoalId`
- domain-server: 更新所有 addDomainEvent

**task 模块**
- 4 个事件 key 加过去式
- `id: string` → branded types
- domain-server: 更新 addDomainEvent

**schedule 模块**（最高风险）
- 创建 `domain/events/`，从 aggregate 文件提取 8 个事件接口
- envelope → payload-only
- `number`/`Date` → `TransferDate`/`PersistenceDate`
- `string` → branded types
- 更新 event-map 导入路径
- domain-server: 更新所有引用

**dashboard 模块** — 跳过（仅存根）

---

## 五、执行规则

1. **Phase 1 完成后先确认** — 用户确认 governance 注释质量
2. **一个模块一个 commit** — 原子性，可回滚
3. **先 contracts，后 domain-server** — 先改类型层，再改消费方
4. **每个模块改完后编译检查**

## 六、验证方式

- 每个模块修改后: `pnpm nx run <package>:typecheck`
- 全部完成后: `pnpm nx run contracts:typecheck`
- 文档合规: `pnpm nx run daily-use:governance-check`
- 检查所有 addDomainEvent 调用使用新事件 key

---

## 七、关键文件索引

| 文件 | 用途 |
|---|---|
| `packages/governance/src/contracts/protocol/governance-event-map.ts` | 事件命名规范参考 |
| `packages/contracts/src/primitives/ids.ts` | 集中 branded ID 定义 |
| `docs/standards/contract-module-development-spec.md` | 需修正第 49 行矛盾 |
| `packages/contracts/src/modules/schedule/aggregates/schedule-task-server.ts` | 最高风险文件（内联事件、错误日期类型） |
| `packages/contracts/src/modules/ai/protocol/ai-event-map.ts` | 最多命名违规（点分隔） |

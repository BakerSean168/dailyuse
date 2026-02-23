# Setting 模块模型架构分析（2026-02-23）

## 1. 分析目标与范围

本文聚焦 `packages/setting` 的**当前模型架构**，目标是为“深度优化”提供基线：

- 明确当前主模型（正在被调用）与遗留模型（历史/未完成）
- 识别领域模型一致性问题（类型、验证、默认值、事件、持久化映射）
- 给出可执行的分阶段优化路线（先收敛，再增强）

分析覆盖层：

- `domain-server`（聚合、实体、仓储接口、领域服务）
- `application-server`（用例编排）
- `infrastructure-server`（Prisma/SQLite 适配与 mapper）
- `@dailyuse/contracts/setting`（偏好类型、默认值、注册表、事件协议）

---

## 2. 当前架构总览（现状）

### 2.1 运行中的主链路（Active）

当前 API/用例主链路已经围绕 `UserSetting` 新模型运行：

1. API 模块组装 `SettingModule`（Prisma）
2. UseCase 调用 `IUserSettingRepository`
3. 仓储使用 `UserSettingPrismaRepository`
4. 通过 `PrismaUserSettingMapper` 完成 Domain ↔ Persistence 映射

关键文件：

- `packages/setting/src/domain-server/aggregates/user-setting.ts`
- `packages/setting/src/application-server/use-cases/queries/get-user-setting.ts`
- `packages/setting/src/application-server/use-cases/commands/update-user-setting.ts`
- `packages/setting/src/infrastructure-server/adapters/prisma/user-setting-prisma.repository.ts`
- `packages/setting/src/infrastructure-server/mappers/prisma-user-setting-mapper.ts`

### 2.2 模型形态（UserSetting）

`UserSetting` 采用“按分类 typed preferences”设计，核心分类：

- appearance / locale / workflow / privacy / notification
- editor / shortcuts / experimental / ui

并提供两套操作模式：

- 分类级更新：`updateAppearance/updateLocale/...`
- key 级更新：`set('appearance.theme', value)`

### 2.3 遗留/并存模型（Legacy）

仓库中仍存在旧模型及其接口/适配器：

- 聚合：`Setting`, `AppConfig`
- 实体：`SettingItem`, `SettingGroup`, `SettingHistory`
- 服务：`SettingDomainService`
- 仓储接口：`ISettingRepository`, `IAppConfigRepository`
- 适配器：`setting-prisma.repository.ts`, `setting-sqlite.repository.ts`, `app-config-prisma.repository.ts`

这些代码**大多未接入当前导出主入口或未实现（throw Not implemented）**，形成“代码层双轨”。

### 2.4 当前 Aggregates / Entities 详细清单

本节按“正在使用（Active）/遗留（Legacy）”给出模型定义快照，重点关注**状态结构**与**领域行为**。

#### 2.4.1 Aggregates

##### A) `UserSetting`（Active，当前主聚合）

- 文件：`packages/setting/src/domain-server/aggregates/user-setting.ts`
- 基类：`AggregateRoot<ISettingId>`
- 状态定义（`UserSettingState`）：
	- 标识与元数据：`id`, `identityId`, `version`, `createdAt`, `updatedAt`, `deletedAt`
	- 业务分类：
		- `appearance: AppearancePreferences`
		- `locale: LocalePreferences`
		- `workflow: WorkflowPreferences`
		- `privacy: PrivacyPreferences`
		- `notification: NotificationPreferences`
		- `editor: EditorPreferences`
		- `shortcuts: ShortcutPreferences`
		- `experimental: ExperimentalPreferences`
		- `ui: UIStatePreferences`
- 核心行为：
	- 分类更新：`updateAppearance/updateLocale/updateWorkflow/updatePrivacy/updateNotification/updateEditor/updateShortcuts/updateExperimental/updateUI`
	- key 更新：`get(key)`, `set(key, value)`
	- 重置：`resetKey`, `resetCategory`, `resetAll`
	- 导入导出：`toPreferences`, `importPreferences`
	- 生命周期：`delete`, `restore`
	- DTO：`toServerDTO`, `toClientDTO`
	- 工厂：`create`, `load`

##### B) `Setting`（Legacy，旧聚合）

- 文件：`packages/setting/src/domain-server/aggregates/setting.ts`
- 基类：`AggregateRoot<SettingId>`
- 状态定义（`SettingState`）：
	- 主体字段：`key`, `name`, `description`, `valueType`, `value`, `defaultValue`
	- 作用域与归属：`scope`, `accountId`, `deviceId`, `groupId`
	- 配置对象：`validation`, `ui`, `syncConfig`
	- 标记位：`isEncrypted`, `isReadOnly`, `isSystemSetting`
	- 历史：`history: SettingHistory[]`
	- 元数据：`createdAt`, `updatedAt`, `deletedAt`
- 核心行为：`setValue`, `resetToDefault`, `delete`, `restore`, `toServerDTO`, `toClientDTO`, `create`, `load`
- 现状：未在当前主链路中使用，关联仓储与服务多为遗留/未完成实现。

##### C) `AppConfig`（Legacy/半使用，仅 SQLite 侧有实现）

- 文件：`packages/setting/src/domain-server/aggregates/app-config.ts`
- 基类：`AggregateRoot<IAppConfigId>`
- 状态定义（`AppConfigState`）：
	- 版本：`version`
	- 模块化配置：`app`, `features`, `limits`, `api`, `security`, `notifications`
	- 元数据：`createdAt`, `updatedAt`
- 核心行为：
	- 功能开关：`enableFeature`, `disableFeature`, `isFeatureEnabled`
	- 限额检查：`checkLimit`
	- 配置更新：`updateAppInfo/updateLimits/updateApiConfig/updateSecurityConfig`
	- DTO 与工厂：`toServerDTO`, `create`, `load`
- 现状：`IAppConfigRepository` 为 `any` 风格接口，Prisma 实现未完成，SQLite 实现可用但与模块主链路脱节。

#### 2.4.2 Entities

##### A) `SettingHistory`（Legacy 体系内实体）

- 文件：`packages/setting/src/domain-server/entities/setting-history.ts`
- 基类：`Entity<SettingHistoryId>`
- 状态定义（`SettingHistoryState`）：
	- `settingEntryId`, `settingKey`, `oldValue`, `newValue`
	- `operatorId`, `operatorType`（`USER | SYSTEM | API`）
	- `createdAt`
- 行为：`toServerDTO`, `toClientDTO`（包含 `timeAgo`, `changeText`）, `create`, `load`

##### B) `SettingItem`（Legacy 体系内实体）

- 文件：`packages/setting/src/domain-server/entities/setting-item.ts`
- 基类：`Entity<SettingEntryId>`
- 状态定义（`SettingItemState`）：
	- 归属与标识：`id`, `groupId`, `key`
	- 展示与值：`name`, `description`, `value`, `defaultValue`, `valueType`, `ui`
	- 排序与权限：`sortOrder`, `isReadOnly`, `isVisible`
	- 时间：`createdAt`, `updatedAt`
- 行为：`setValue`, `resetToDefault`, `isDefault`, `toServerDTO`, `toClientDTO`, `create`, `load`

##### C) `SettingGroup`（Legacy 体系内实体）

- 文件：`packages/setting/src/domain-server/entities/setting-group.ts`
- 基类：`Entity<SettingGroupId>`
- 状态定义（`SettingGroupState`）：
	- 树结构：`name`, `parentGroupId`, `path`, `level`, `sortOrder`
	- UI/系统属性：`description`, `icon`, `isSystemGroup`, `isCollapsed`
	- 成员：`settings: SettingItem[]`
	- 时间与删除：`createdAt`, `updatedAt`, `deletedAt`
- 行为：`addSetting`, `removeSetting`, `getSetting`, `toggleCollapse`, `delete`, `restore`, `toServerDTO`, `toClientDTO`, `create`, `load`

#### 2.4.3 结论（模型层）

- **当前真正的业务聚合只有 `UserSetting` 在生产链路中工作。**
- `Setting/AppConfig + SettingItem/SettingGroup/SettingHistory` 构成遗留模型簇，建议在收敛阶段明确“保留/下线”策略并做边界隔离。

---

## 3. 模型一致性评估（重点问题）

## P0（必须优先收敛）

### 3.1 配置注册表与 UserSetting 分类模型存在结构错位

`UserSetting` 使用的分类（locale/workflow/privacy/experimental/ui 等）与 `SETTING_REGISTRY` 实际条目来源（appearance/editor/task/goal/repository/notification/system/device）并不对齐。

直接影响：

- 很多分类更新在 `validateCategoryPartial()` 中无法命中 registry，等价于“无验证直通”
- `resetCategory()` 内 `mapCategoryToRegistryCategory(category).toUpperCase()` 与 registry category 值（如 `Appearance`）不一致，导致 `changedKeys` 计算空转

### 3.2 默认值双源且不一致

默认值来源同时存在于：

- `preferences/defaults.ts`（聚合初始化）
- `configs/*-settings.const.ts`（registry `defaultValue`）

已发现显式不一致示例：

- `appearance.accentColor`: `#3B82F6` vs `#0066ff`
- `appearance.fontFamily`: `null` vs 非空字符串
- `notification` 维度：聚合含 `inApp`，registry 含 `muteAll`

结果是：初始化值、校验语义、前后端期望可能分叉。

### 3.3 事件语义不完整/不一致

- `UserSetting.create()` 直接发 `setting:UserSettingUpdated`（`changedKeys: []`），语义上更像“created”
- `updateShortcuts/updateExperimental/updateUI` 未统一发布更新事件
- `resetCategory()` 计算了 `changedKeys` 但未使用

会影响审计、同步、订阅方的一致行为。

## P1（高优先级技术债）

### 3.4 持久化映射类型存在“弱一致”

`PrismaUserSettingMapper` 中 `appearanceFontSize` 写入为字符串，读取再 `parseInt` 回 number。该做法增加序列化噪音并放大数据异常面。

### 3.5 “主入口声明”与“仓库实态”不完全一致

`domain-server/index.ts` 声明聚焦 `UserSetting`，但目录内保留大量旧模型与旧仓储接口；并且部分注释出现乱码，增加认知负担与维护风险。

### 3.6 SQLite 轨道与当前模型脱节

- `SettingModule` 构造参数支持 `sqlite`，但 `SettingRepositoryFactory` 实际仅支持 `prisma`
- SQLite 相关仓储多数未实现，且 schema 与 `AppConfig` 代码预期字段并不一致

## P2（可随重构顺手治理）

### 3.7 兼容层边界不清晰

`entries` 通用更新仍保留在新模型中，且 `setting.old.ts` 文件同目录共存，容易让后续开发误判“主模型”。

---

## 4. 根因分析

当前问题并非单点 bug，而是“模型迁移未完成”的典型症状：

1. **模型战略已切换**：从通用 Key-Value 迁移到 typed category model
2. **契约侧未同步收敛**：registry 与 defaults 来源并行演进
3. **基础设施未清场**：旧接口/旧适配器保留且部分未实现
4. **事件语义未补齐**：只完成了最小可用链路，未完成一致性治理

---

## 5. 优化建议（分阶段）

## Phase A：模型收敛（建议先做，1~2 个迭代）

### A1. 选定单一源事实（Single Source of Truth）

建议以 `SETTING_REGISTRY` 作为唯一配置元数据源（key/type/default/schema/scope/syncable），并由其派生：

- 默认值对象（生成 `createDefaultPreferences()`）
- 分类 keys 列表（供 reset/event/changeSet）
- API 层可选更新 schema（避免手写重复）

### A2. 建立分类映射规范

统一三套命名并显式映射：

- domain category（appearance/locale/...）
- registry category（Appearance/Task/...）
- persistence column group（appearanceXxx/workflowXxx/...）

禁止隐式 `toUpperCase()` 之类推断。

### A3. 明确遗留模型处置策略

对 `Setting/AppConfig` 路线二选一：

- 若弃用：迁移到 `legacy/` 或删除，保留迁移文档
- 若保留：独立 package 或子模块，并补全实现与导出边界

## Phase B：一致性增强（1 个迭代）

### B1. 校验闭环

- `update*`、`set()`、`importPreferences()` 统一走 registry 校验
- 对“registry 中不存在的 key/field”改为显式失败（而不是静默跳过）

### B2. 事件语义标准化

新增/收敛事件：

- `setting:UserSettingCreated`
- `setting:UserSettingUpdated`（必须包含非空 changedKeys）
- `setting:UserSettingReset`（包含 category 与 changedKeys 可选扩展）

### B3. mapper 类型收紧

- 去除可避免的字符串数值中转
- 建立 mapper round-trip 测试（domain -> persistence -> domain）

## Phase C：平台能力补齐（按优先级排期）

### C1. SQLite 路径决策

- 真支持：补齐仓储与 schema 并纳入测试矩阵
- 不支持：从工厂/模块 API 中移除 `sqlite` 分支，避免假能力

### C2. 技术债清理

- 修复乱码注释
- 删除未引用旧代码
- 在 README/模块文档中声明“当前权威模型 = UserSetting”

---

## 6. 建议目标架构（优化后）

- Domain：仅保留 `UserSetting` 一个用户偏好聚合（短期）
- Contracts：registry + preferences 由同一元模型驱动，杜绝双源
- Application：所有用例仅依赖 `IUserSettingRepository`
- Infrastructure：Prisma 为主；SQLite 要么补全要么移除
- Events：创建/更新/重置语义明确，支持同步与审计

---

## 7. 可执行的下一步（建议）

1. 先做“现状收敛 PR”：标注/迁移 legacy 文件，清理误导导出
2. 再做“注册表对齐 PR”：统一 category、defaults、validation
3. 最后做“事件与 mapper 加固 PR”：补事件语义与 round-trip 测试

---

## 8. 附：本次分析重点查看文件

- `packages/setting/src/domain-server/aggregates/user-setting.ts`
- `packages/setting/src/domain-server/aggregates/setting.ts`
- `packages/setting/src/domain-server/aggregates/app-config.ts`
- `packages/setting/src/domain-server/services/SettingDomainService.ts`
- `packages/setting/src/application-server/use-cases/queries/get-user-setting.ts`
- `packages/setting/src/application-server/use-cases/commands/update-user-setting.ts`
- `packages/setting/src/infrastructure-server/adapters/prisma/user-setting-prisma.repository.ts`
- `packages/setting/src/infrastructure-server/mappers/prisma-user-setting-mapper.ts`
- `packages/contracts/src/modules/setting/preferences/defaults.ts`
- `packages/contracts/src/modules/setting/configs/setting-registry.ts`
- `packages/contracts/src/modules/setting/configs/appearance-settings.const.ts`
- `packages/contracts/src/modules/setting/configs/notification-settings.const.ts`

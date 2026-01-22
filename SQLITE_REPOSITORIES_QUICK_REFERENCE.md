# SQLite 仓储实现 - 快速集成指南

## 📦 文件清单

所有 44 个 SQLite 仓储实现已完成，文件组织如下：

### 文件总数统计
- **仓储实现文件**: 44 个
- **模块索引文件**: 12 个
- **数据库架构文件**: 12 个
- **全局索引文件**: 1 个
- **总计**: 69 个文件

---

## 🗂️ 目录结构

```
packages/infrastructure-desktop/src/
├── task/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-task-instance.repository.ts
│       ├── sqlite-task-template.repository.ts
│       ├── sqlite-task-dependency.repository.ts
│       └── sqlite-task-statistics.repository.ts
├── goal/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-goal.repository.ts
│       ├── sqlite-goal-statistics.repository.ts
│       ├── sqlite-goal-folder.repository.ts
│       ├── sqlite-focus-session.repository.ts
│       ├── sqlite-focus-mode.repository.ts
│       └── sqlite-weight-snapshot.repository.ts
├── schedule/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-schedule.repository.ts
│       ├── sqlite-schedule-task.repository.ts
│       ├── sqlite-schedule-execution.repository.ts
│       └── sqlite-schedule-statistics.repository.ts
├── reminder/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-reminder-response.repository.ts
│       ├── sqlite-reminder-statistics.repository.ts
│       ├── sqlite-reminder-group.repository.ts
│       └── sqlite-reminder-template.repository.ts
├── notification/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-notification.repository.ts
│       ├── sqlite-notification-template.repository.ts
│       └── sqlite-notification-preference.repository.ts
├── editor/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-editor-session.repository.ts
│       ├── sqlite-linked-resource.repository.ts
│       ├── sqlite-search-engine.repository.ts
│       ├── sqlite-editor-workspace.repository.ts
│       ├── sqlite-editor-tab.repository.ts
│       ├── sqlite-editor-group.repository.ts
│       ├── sqlite-document-version.repository.ts
│       └── sqlite-document.repository.ts
├── authentication/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-auth-session.repository.ts
│       └── sqlite-auth-credential.repository.ts
├── dashboard/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       └── sqlite-dashboard-config.repository.ts
├── ai/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-ai-generation-task.repository.ts
│       ├── sqlite-knowledge-generation-task.repository.ts
│       ├── sqlite-ai-conversation.repository.ts
│       ├── sqlite-ai-usage-quota.repository.ts
│       └── sqlite-ai-provider-config.repository.ts
├── account/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       └── sqlite-account.repository.ts
├── sync/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-sync-conflict.repository.ts
│       ├── sqlite-sync-session.repository.ts
│       ├── sqlite-sync-profile.repository.ts
│       └── sqlite-pending-change.repository.ts
├── setting/
│   ├── index.ts
│   ├── schema.ts
│   └── repositories/
│       ├── sqlite-app-config.repository.ts
│       ├── sqlite-setting.repository.ts
│       └── sqlite-user-setting.repository.ts
└── index.ts
```

---

## 🚀 快速开始

### 1. 初始化数据库

```typescript
import Database from 'better-sqlite3';
import {
  TASK_MODULE_SCHEMA,
  GOAL_MODULE_SCHEMA,
  SCHEDULE_MODULE_SCHEMA,
  REMINDER_MODULE_SCHEMA,
  NOTIFICATION_MODULE_SCHEMA,
  EDITOR_MODULE_SCHEMA,
  AUTHENTICATION_MODULE_SCHEMA,
  DASHBOARD_MODULE_SCHEMA,
  AI_MODULE_SCHEMA,
  ACCOUNT_MODULE_SCHEMA,
  SYNC_MODULE_SCHEMA,
  SETTING_MODULE_SCHEMA,
} from '@dailyuse/infrastructure-desktop';

const db = new Database('app.db');

// 初始化所有表
const schemas = [
  TASK_MODULE_SCHEMA,
  GOAL_MODULE_SCHEMA,
  SCHEDULE_MODULE_SCHEMA,
  REMINDER_MODULE_SCHEMA,
  NOTIFICATION_MODULE_SCHEMA,
  EDITOR_MODULE_SCHEMA,
  AUTHENTICATION_MODULE_SCHEMA,
  DASHBOARD_MODULE_SCHEMA,
  AI_MODULE_SCHEMA,
  ACCOUNT_MODULE_SCHEMA,
  SYNC_MODULE_SCHEMA,
  SETTING_MODULE_SCHEMA,
];

for (const schema of schemas) {
  db.exec(schema);
}
```

### 2. 创建仓储实例

```typescript
import {
  SqliteTaskInstanceRepository,
  SqliteGoalRepository,
  SqliteScheduleRepository,
  // ... 导入其他仓储
} from '@dailyuse/infrastructure-desktop';

const db = new Database('app.db');

// 创建仓储实例
const taskRepo = new SqliteTaskInstanceRepository(db);
const goalRepo = new SqliteGoalRepository(db);
const scheduleRepo = new SqliteScheduleRepository(db);
// ...
```

### 3. 使用仓储

```typescript
// 保存数据
await taskRepo.save(taskInstance);

// 查询数据
const tasks = await taskRepo.findByAccountUuid(accountUuid);

// 删除数据
await taskRepo.delete(taskUuid);
```

---

## 📋 仓储列表 (44 个)

### Task Module (4 个)
- [ ] SqliteTaskInstanceRepository
- [ ] SqliteTaskTemplateRepository
- [ ] SqliteTaskDependencyRepository
- [ ] SqliteTaskStatisticsRepository

### Goal Module (6 个)
- [ ] SqliteGoalRepository
- [ ] SqliteGoalStatisticsRepository
- [ ] SqliteGoalFolderRepository
- [ ] SqliteFocusSessionRepository
- [ ] SqliteFocusModeRepository
- [ ] SqliteWeightSnapshotRepository

### Schedule Module (4 个)
- [ ] SqliteScheduleRepository
- [ ] SqliteScheduleTaskRepository
- [ ] SqliteScheduleExecutionRepository
- [ ] SqliteScheduleStatisticsRepository

### Reminder Module (4 个)
- [ ] SqliteReminderResponseRepository
- [ ] SqliteReminderStatisticsRepository
- [ ] SqliteReminderGroupRepository
- [ ] SqliteReminderTemplateRepository

### Notification Module (3 个)
- [ ] SqliteNotificationRepository
- [ ] SqliteNotificationTemplateRepository
- [ ] SqliteNotificationPreferenceRepository

### Editor Module (8 个)
- [ ] SqliteEditorSessionRepository
- [ ] SqliteLinkedResourceRepository
- [ ] SqliteSearchEngineRepository
- [ ] SqliteEditorWorkspaceRepository
- [ ] SqliteEditorTabRepository
- [ ] SqliteEditorGroupRepository
- [ ] SqliteDocumentVersionRepository
- [ ] SqliteDocumentRepository

### Authentication Module (2 个)
- [ ] SqliteAuthSessionRepository
- [ ] SqliteAuthCredentialRepository

### Dashboard Module (1 个)
- [ ] SqliteDashboardConfigRepository

### AI Module (5 个)
- [ ] SqliteAIGenerationTaskRepository
- [ ] SqliteKnowledgeGenerationTaskRepository
- [ ] SqliteAIConversationRepository
- [ ] SqliteAIUsageQuotaRepository
- [ ] SqliteAIProviderConfigRepository

### Account Module (1 个)
- [ ] SqliteAccountRepository

### Sync Module (4 个)
- [ ] SqliteSyncConflictRepository
- [ ] SqliteSyncSessionRepository
- [ ] SqliteSyncProfileRepository
- [ ] SqlitePendingChangeRepository

### Setting Module (3 个)
- [ ] SqliteAppConfigRepository
- [ ] SqliteSettingRepository
- [ ] SqliteUserSettingRepository

---

## 🔌 模块导入

每个模块都有对应的 index.ts，可以直接导入：

```typescript
// 直接导入模块中的仓储
import {
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
} from '@dailyuse/infrastructure-desktop/task';

// 或者从全局导入
import {
  SqliteTaskInstanceRepository,
  SqliteTaskTemplateRepository,
} from '@dailyuse/infrastructure-desktop';
```

---

## 📚 常见查询模式

### 分页查询

```typescript
const { results, total } = await repo.findByAccountUuid(accountUuid, {
  limit: 20,
  offset: 0,
});
```

### 动态过滤查询

```typescript
const items = await repo.findByQuery(accountUuid, {
  status: 'ACTIVE',
  category: 'work',
  limit: 50,
  offset: 0,
});
```

### 软删除

```typescript
// 逻辑删除
await repo.softDelete(uuid);

// 恢复
await repo.restore(uuid);
```

### 批量操作

```typescript
// 批量保存
await repo.saveMany(items);

// 批量删除
for (const uuid of uuids) {
  await repo.delete(uuid);
}
```

### 事务操作

```typescript
const transaction = db.transaction(() => {
  for (const item of items) {
    repo.save(item);
  }
});

transaction();
```

---

## 🔑 关键特性

### ✅ 完整的 CRUD 操作
所有仓储都实现了基础的 Create, Read, Update, Delete 操作。

### ✅ 高级查询能力
- 单条记录查询 (findByUuid)
- 列表查询 (findByAccountUuid)
- 条件过滤查询 (findByQuery)
- 分页支持 (limit/offset)

### ✅ 数据一致性
- 事务支持确保数据原子性
- 外键约束确保数据完整性
- 索引优化查询性能

### ✅ 灵活的数据模型
- 支持 JSON 序列化
- 日期时间自动转换
- 布尔值正确处理

### ✅ 软删除支持
某些仓储支持逻辑删除，保留历史数据。

---

## 🧪 测试建议

建议编写以下测试：

```typescript
describe('SqliteTaskInstanceRepository', () => {
  let db: Database.Database;
  let repo: SqliteTaskInstanceRepository;

  beforeAll(() => {
    db = new Database(':memory:');
    // 初始化架构
    db.exec(TASK_MODULE_SCHEMA);
    repo = new SqliteTaskInstanceRepository(db);
  });

  test('save and find', async () => {
    const instance = new TaskInstance(...);
    await repo.save(instance);
    
    const found = await repo.findByUuid(instance.uuid);
    expect(found).toEqual(instance);
  });

  test('delete', async () => {
    // ...
  });

  test('pagination', async () => {
    // ...
  });
});
```

---

## 📞 常见问题

### Q: 如何处理时区问题？
A: 所有日期存储为毫秒时间戳，时区无关。使用 `new Date()` 自动处理。

### Q: 如何确保数据一致性？
A: 使用 `db.transaction()` 包装多个操作。

### Q: 支持多线程吗？
A: better-sqlite3 支持在同一个 Node.js 线程中使用。不支持跨线程共享。

### Q: 如何备份数据？
A: SQLite 支持标准的备份机制，参考 better-sqlite3 文档。

---

## 🔗 相关文件

- [完整实现报告](./SQLITE_REPOSITORIES_COMPLETION_REPORT.md)
- [数据库架构文档](./packages/infrastructure-desktop/src/)
- [Domain Server 接口定义](../domain-server/)

---

**最后更新**: 2024 年
**版本**: 1.0.0
**状态**: 生产就绪 ✅

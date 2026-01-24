# 命名规范指南

> **最后更新**: 2026-01-24  
> **规范版本**: 1.0 ✅  
> **状态**: 全仓库实施中

## 核心原则

### 1. 统一使用 `name` 而非混用 `title`

#### 原因

- **一致性优先** - 减少认知负荷，开发者不需要判断"这个字段用 title 还是 name"
- **通用性** - `name` 适合所有对象标识（Task、TaskTemplate、Goal、ReminderGroup 等）
- **维护成本低** - 避免混用导致的重构成本
- **工具支持** - 自动生成 CRUD 等工具方法时更容易处理

#### 为什么不用 `title`？

- `title` 往往有歧义（标题、显示标题、标签标题等）
- 某些业务中 `title` 与 `name` 混淆，需要分离，增加复杂度
- 国际化时 `name` 更自然（用户名、任务名），`title` 容易与界面标题混淆

### 2. 字段映射规范

| 属性用途 | 字段名 | 适用场景 | 类型 | 可空 |
|---------|--------|--------|------|------|
| 对象唯一标识/名称 | `name` | Task、Template、Goal、Group、Account等所有实体 | `string` | ❌ 必需 |
| 展示用名称（如需分离） | `displayName` | 仅当需要与标识分离时使用（如多语言场景） | `string` | ✅ 可选 |
| 详细描述文本 | `description` | 所有需要描述的实体 | `string \| null` | ✅ 可选 |
| 用户界面标题 | （无统一字段） | 在 Client DTO 中处理 | 应用层生成 | - |

### 3. 具体规范

#### ✅ 推荐做法

```typescript
// Task (任务)
interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 任务名
  description?: string;             // ✅ 任务描述
  // ...
}

// TaskTemplate (任务模板)
interface TaskTemplatePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 模板名
  description?: string;             // ✅ 模板描述
  // ...
}

// ReminderGroup (提醒分组)
interface ReminderGroupPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 分组名
  // ...
}

// Goal (目标)
interface GoalPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 目标名
  description?: string;             // ✅ 目标描述
  // ...
}
```

#### ❌ 避免的做法

```typescript
// 不要混用 title 和 name
interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;
  title: string;                   // ❌ 避免
  name: string;                    // ❌ 避免混用
  description?: string;
}

// 不要用 title 代替 name
interface Template {
  uuid: string;
  title: string;                   // ❌ 避免 - 应该用 name
}
```

## 数据库列名规范

数据库中对应的列名使用蛇形命名：

```sql
-- ✅ 推荐
CREATE TABLE tasks (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,              -- 对应 name 字段
  description TEXT,                -- 对应 description 字段
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- ❌ 避免
CREATE TABLE tasks (
  title TEXT NOT NULL,             -- 避免使用 title
);
```

## 应用到不同层次

### 1. Contracts (DTO 接口定义)

**原则**: 所有 PersistenceDTO、ServerDTO、ClientDTO 中统一使用 `name`

```typescript
// packages/contracts/src/modules/task/aggregates/TaskServer.ts
export interface TaskServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 统一为 name
  description?: string;
  // ...
}

export interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;                    // ✅ 统一为 name
  description?: string;
  // ...
}
```

### 2. Domain Server (实体类)

**原则**: 所有实体类属性使用 `name` 而非 `title`

```typescript
// packages/domain-server/src/task/aggregates/Task.ts
export class Task extends AggregateRoot {
  private _name: string;           // ✅ 统一为 _name
  private _description?: string;

  get name(): string {
    return this._name;
  }

  // toPersistenceDTO() 中使用 name
  public toPersistenceDTO(): TaskPersistenceDTO {
    return {
      name: this._name,            // ✅ 统一为 name
      description: this._description,
      // ...
    };
  }
}
```

### 3. Infrastructure (仓库实现)

**原则**: 行对象映射时统一从 `name` 列读取

```typescript
// packages/infrastructure-server/src/task/adapters/sqlite/task-sqlite.repository.ts

private rowToTask(row: any): Task {
  // 从蛇形列名读取
  return Task.fromPersistenceDTO({
    uuid: row.uuid,
    accountUuid: row.account_uuid,
    name: row.name,                // ✅ 从数据库 name 列读取
    description: row.description,
    // ...
  });
}

async save(task: Task): Promise<void> {
  const dto = task.toPersistenceDTO();
  const stmt = this.db.prepare(`
    INSERT INTO tasks (
      uuid, account_uuid, name, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    dto.uuid,
    dto.accountUuid,
    dto.name,                       // ✅ 统一使用 name
    dto.description,
    dto.createdAt,
    dto.updatedAt,
  );
}
```

## 迁移指南

### 受影响的模块

- [ ] `contracts` - 更新所有 DTO 接口
- [ ] `domain-server` - 更新所有实体类
- [ ] `infrastructure-server` - 更新所有仓库实现
- [ ] `application-server` - 更新所有应用服务

### 迁移步骤

1. **更新 DTO 接口** - 将 `title` 改为 `name`
2. **更新实体类** - 将 `_title` 改为 `_name`，更新 getter/setter
3. **更新仓库映射** - 行对象访问和 SQL 语句中使用 `name`
4. **更新服务层** - 调用处理统一使用 `name` 属性
5. **测试验证** - 构建并运行测试确保一致

### 搜索关键字

```bash
# 找出所有 title 使用
grep -r "\.title" packages/contracts
grep -r "\.title" packages/domain-server
grep -r "_title" packages/domain-server
grep -r "title:" packages/infrastructure-server
```

## 相关规范

### 数据映射层规范

参考 [ARCHITECTURE.md](./ARCHITECTURE.md) 中的"数据映射架构"章节：

```
数据库层（蛇形命名）name, description, created_at
    ↓
行对象属性（蛇形）row.name, row.description
    ↓
DTO 对象（驼峰）name, description
    ↓
实体类（驼峰）_name, _description
```

## 常见问题

### Q: 为什么不保持 `title` 如果代码中都这样用？

A: 统一比一致性历史更重要。虽然有迁移成本，但长期维护成本更低。`name` 更通用，支持所有实体类型。

### Q: `displayName` 什么时候用？

A: 仅在需要区分"内部标识"和"显示文本"时使用。大多数情况下 `name` 足够，不需要额外的 `displayName`。

### Q: 如果有多语言需求？

A: 在 Client DTO 或 UI 层处理。数据库和领域模型统一使用 `name`，翻译在应用层完成。

## 国际化 (I18N) 最佳实践 ⭐

### ❌ 错误做法：后端硬编码翻译

```typescript
// ❌ 不好 - 后端返回中文文本
export interface TaskTemplateClientDTO {
  uuid: string;
  name: string;
  taskType: TaskType;
  taskTypeText: string;         // ❌ 硬编码中文
  importance: ImportanceLevel;
  importanceText: string;       // ❌ 硬编码中文
  status: TaskTemplateStatus;
  statusText: string;           // ❌ 硬编码中文
}

// 后端代码
private getTaskTypeText(): string {
  const map: Record<TaskType, string> = {
    ONE_TIME: '单次任务',        // ❌ 硬编码
    RECURRING: '重复任务',       // ❌ 硬编码
  };
  return map[this._taskType];
}

public toClientDTO(): TaskTemplateClientDTO {
  return {
    uuid: this._uuid,
    name: this._name,
    taskType: this._taskType,
    taskTypeText: this.getTaskTypeText(),  // ❌ 在后端处理翻译
    // ...
  };
}
```

**为什么是错的：**
- 🔴 其他语言用户无法使用
- 🔴 打破后端/前端职责分离
- 🔴 多客户端（Web/App）难以适配
- 🔴 不支持运行时语言切换
- 🔴 成倍增加后端维护成本

---

### ✅ 正确做法：前端负责翻译

#### 1. 后端只返回枚举值

```typescript
// ✅ 推荐 - 后端只提供枚举值
export interface TaskTemplateClientDTO {
  uuid: string;
  name: string;
  description: string | null;
  taskType: TaskType;              // ✅ 仅返回枚举 'ONE_TIME' | 'RECURRING'
  importance: ImportanceLevel;      // ✅ 仅返回枚举 'vital' | 'important' 等
  status: TaskTemplateStatus;       // ✅ 仅返回枚举 'ACTIVE' | 'PAUSED' 等
  // ❌ 移除：
  // taskTypeText: string;
  // importanceText: string;
  // statusText: string;
}
```

#### 2. 前端维护国际化资源

```typescript
// frontend/i18n/task.ts
export const taskI18n = {
  'en-US': {
    taskType: {
      'ONE_TIME': 'One-time Task',
      'RECURRING': 'Recurring Task',
    },
    importance: {
      'vital': 'Vital',
      'important': 'Important',
      'moderate': 'Moderate',
      'minor': 'Minor',
      'trivial': 'Trivial',
    },
    status: {
      'ACTIVE': 'Active',
      'PAUSED': 'Paused',
      'ARCHIVED': 'Archived',
      'DELETED': 'Deleted',
    },
  },
  'zh-CN': {
    taskType: {
      'ONE_TIME': '单次任务',
      'RECURRING': '重复任务',
    },
    importance: {
      'vital': '极其重要',
      'important': '非常重要',
      'moderate': '中等重要',
      'minor': '不太重要',
      'trivial': '无关紧要',
    },
    status: {
      'ACTIVE': '活跃',
      'PAUSED': '暂停',
      'ARCHIVED': '归档',
      'DELETED': '已删除',
    },
  },
};

// 前端使用
function displayTaskType(task: TaskTemplateClientDTO, language: string): string {
  return taskI18n[language]?.taskType?.[task.taskType] ?? task.taskType;
}

// 或使用自定义Hook
const TaskTypeDisplay = ({ task, language }: Props) => {
  const text = taskI18n[language]?.taskType?.[task.taskType] ?? task.taskType;
  return <span>{text}</span>;
};
```

---

### 清理清单

从所有 `ClientDTO` 中移除的字段（已移除翻译到前端）：

- ❌ `taskTypeText` / `taskTypeDisplay`
- ❌ `importanceText` / `importanceDisplay`
- ❌ `statusText` / `statusDisplay`
- ❌ `timeDisplayText`
- ❌ `recurrenceText`
- ❌ `reminderText`
- ❌ `goalLinkText`

保留的字段：

- ✅ 原始枚举值字段：`taskType`, `importance`, `status`, `recurrence` 等
- ✅ 不依赖语言的数据：`createdAt`, `updatedAt`, `completedCount`, `uuid` 等
- ✅ 用户内容：`name`, `description`

---

### 优势总结

| 方面 | 旧方法（后端翻译）| 新方法（前端翻译）|
|------|-----------------|-----------------|
| 多语言支持 | 需要修改后端 | 前端配置文件 |
| 运行时切换 | ❌ 需要重新请求 | ✅ 客户端动态切换 |
| 多客户端 | 需要后端维护多套API | ✅ 共享一套API |
| 职责分离 | ❌ 后端混合业务逻辑 | ✅ 后端纯数据，前端纯展示 |
| 维护成本 | 📈 高（O(n*m)） | 📈 低（O(n+m)） |
| 性能 | 📊 更多序列化开销 | 📊 更少网络传输 |

## 执行清单

- [x] 制定命名规范文档（统一使用 `name` 而非 `title`）
- [x] 制定国际化最佳实践规范
- [x] 在 contracts 中更新 DTO 定义（TaskTemplate、Goal、Schedule 等）
- [x] 在 domain-server 中更新实体类（TaskTemplate、Goal、Schedule、EditorTab）
- [x] 从 ClientDTO 中移除硬编码的文本字段（taskTypeText、importanceText、statusText 等）
- [x] 从 toClientDTO() 方法中移除文本生成逻辑
- [ ] 在 infrastructure-server 中更新仓库映射
- [ ] 更新其他聚合根（Task、Reminder 等）的 ClientDTO
- [ ] 在前端创建国际化资源文件
- [ ] 运行测试和构建验证
- [ ] 代码审查和合并

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.1 | 2026-01-24 | 添加国际化最佳实践规范，完成 TaskTemplate 等核心实体的清理 |
| 1.0 | 2026-01-24 | 初版 - 统一使用 `name` 而非 `title` |

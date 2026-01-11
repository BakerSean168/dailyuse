# Task List 数据流分析文档

## 问题现象

```
Error: no such table: task_templates
Error: no such table: schedule_tasks (推测)
Error: no such table: reminder_templates (推测)
```

## 完整数据流路径

### 1. 前端发起请求 (Renderer Process)

#### 入口组件
**文件**: `apps/desktop/src/renderer/modules/task/presentation/views/TaskTemplateView.tsx`
```typescript
// useEffect 中调用
await taskTemplate.fetchTemplates();
```

#### Hooks 层
**文件**: `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts`
```typescript
const fetchTemplates = async () => {
  const templates = await taskApplicationService.listTemplates();
  // templates 应该是 TaskTemplate[] 实体数组
};
```

#### Application Service (Renderer)
**文件**: `apps/desktop/src/renderer/modules/task/application/services/TaskApplicationService.ts`
```typescript
async listTemplates(): Promise<TaskTemplate[]> {
  const response = await listTaskTemplates();
  // listTaskTemplates 来自 @dailyuse/application-client
  return response.templates.map(dto => TaskTemplate.fromClientDTO(dto));
}
```

### 2. Application Client Layer (Use Case)

**文件**: `packages/application-client/src/task/services/list-task-templates.ts`
```typescript
export class ListTaskTemplates {
  constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  async execute(input: ListTaskTemplatesInput = {}): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    const response = await this.apiClient.getTaskTemplates(input);
    // apiClient 是 infrastructure-client 的 adapter
    return response.templates.map(dto => TaskTemplate.fromClientDTO(dto));
  }
}

export const listTaskTemplates = (input: ListTaskTemplatesInput = {}) =>
  ListTaskTemplates.getInstance().execute(input);
```

### 3. Infrastructure Client Layer (Adapter)

**文件**: `packages/infrastructure-client/src/task/adapters/ipc/task-template-ipc.adapter.ts`
```typescript
export class TaskTemplateIpcAdapter implements ITaskTemplateApiClient {
  async getTaskTemplates(params?: {...}): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    return this.electronApi.invoke('task-template:list', params);
    // 通过 IPC 调用 main process
  }
}
```

**IPC 通道**: `task-template:list`

### 4. Main Process IPC Handler

**文件**: `apps/desktop/src/main/modules/task/ipc/task-template.ipc-handlers.ts`
```typescript
export class TaskTemplateIPCHandler extends BaseIPCHandler {
  private taskService: TaskDesktopApplicationService;

  registerHandlers() {
    ipcMain.handle('task-template:list', async (_, params) => {
      return this.handleRequest(
        'task-template:list',
        () => this.taskService.listTemplates(params),
        { accountUuid: params?.accountUuid },
      );
    });
  }
}
```

### 5. Desktop Application Service (Main Process)

**文件**: `apps/desktop/src/main/modules/task/application/TaskDesktopApplicationService.ts`
```typescript
async listTemplates(params: ListTaskTemplatesInput): Promise<{
  templates: TaskTemplateClientDTO[];
  total: number;
}> {
  return listTemplatesUseCase(params);
  // listTemplatesUseCase 来自 @dailyuse/application-server
}
```

### 6. Application Server Layer (Server Use Case)

**文件**: `packages/application-server/src/task/services/list-task-templates.ts`
```typescript
export class ListTaskTemplates {
  constructor(private readonly repository: ITaskTemplateRepository) {}

  async execute(input: ListTaskTemplatesInput): Promise<{
    templates: TaskTemplateClientDTO[];
    total: number;
  }> {
    // 调用 repository 查询数据库
    const templates = await this.repository.findByAccount(
      input.accountUuid,
      input.filters
    );
    
    return {
      templates: templates.map(entity => entity.toClientDTO()),
      total: templates.length,
    };
  }
}
```

### 7. Infrastructure Server Layer (Repository)

**文件**: `packages/infrastructure-server/src/task/repositories/sqlite/sqlite-task-template.repository.ts`
```typescript
export class SqliteTaskTemplateRepository implements ITaskTemplateRepository {
  async findByAccount(accountUuid: string, filters?: any): Promise<TaskTemplate[]> {
    // 问题在这里！
    const stmt = this.db.prepare(`
      SELECT * FROM task_templates 
      WHERE account_uuid = ?
    `);
    
    const rows = stmt.all(accountUuid);
    return rows.map(row => this.toDomain(row));
  }
}
```

## 问题根因分析 ✅ 已确认

### 核心问题：数据库表未创建 ⭐⭐⭐

**确认事实**：
1. ✅ `apps/desktop/src/main/database/index.ts` 中的 `initializeTables()` 函数
2. ✅ 只创建了 Goal 相关的表：
   - `goals`
   - `goal_folders`
   - `key_results`
   - `goal_reviews`
   - `goal_records`
   - `goal_statistics`
3. ❌ **缺少以下表的创建语句**：
   - `task_templates` (Task 模块)
   - `task_instances` (Task 模块)
   - `schedule_tasks` (Schedule 模块)
   - `reminder_templates` (Reminder 模块)
   - `reminder_groups` (Reminder 模块)

**错误链**：
```
Repository 尝试查询 task_templates 
  ↓
SQLite: no such table
  ↓
抛出 SqliteError
  ↓
IPC handler 捕获并记录错误
  ↓
Renderer 收到错误，无法显示数据
```

### 根本原因

Desktop 应用的数据库初始化**不完整**：
- 只实现了 Goal 模块的表创建
- Task、Schedule、Reminder 模块的表定义缺失
- 开发时可能只测试了 Goal 功能
- 其他模块的数据库 schema 未补充

## 数据结构对比

### 期望的数据流

```
DB (SQLite) 
  ↓ [Repository: TaskTemplateEntity]
Application Server (Use Case)
  ↓ [TaskTemplateClientDTO]
Main Process (Desktop Application Service)
  ↓ [IPC: task-template:list]
Infrastructure Client (IPC Adapter)
  ↓ [TaskTemplateClientDTO]
Application Client (Use Case)
  ↓ [TaskTemplate Entity (domain-client)]
Renderer (UI Component)
  ↓ [Display]
```

### 实际情况

```
DB (SQLite) ❌ 表不存在
  ↓ 
SqliteTaskTemplateRepository.findByAccount()
  ↓ [抛出错误]
Error: no such table: task_templates
```

## 相关文件清单

### Database & Migration
1. `apps/desktop/prisma/schema.prisma` - Prisma schema 定义
2. `apps/desktop/prisma/migrations/` - Migration 文件
3. `apps/desktop/src/main/database/` - 数据库初始化代码

### Repository Layer
1. `packages/infrastructure-server/src/task/repositories/sqlite/sqlite-task-template.repository.ts`
2. `packages/infrastructure-server/src/schedule/repositories/sqlite/sqlite-schedule-task.repository.ts`
3. `packages/infrastructure-server/src/reminder/repositories/sqlite/sqlite-reminder-template.repository.ts`

### Application Server
1. `packages/application-server/src/task/services/list-task-templates.ts`
2. `packages/application-server/src/schedule/services/list-schedule-tasks.ts`
3. `packages/application-server/src/reminder/services/list-reminder-templates.ts`

### Desktop Main Process
1. `apps/desktop/src/main/modules/task/application/TaskDesktopApplicationService.ts`
2. `apps/desktop/src/main/modules/task/ipc/task-template.ipc-handlers.ts`
3. `apps/desktop/src/main/main.ts` - 初始化入口

### Infrastructure Client
1. `packages/infrastructure-client/src/task/adapters/ipc/task-template-ipc.adapter.ts`

### Application Client
1. `packages/application-client/src/task/services/list-task-templates.ts`

### Renderer
1. `apps/desktop/src/renderer/modules/task/application/services/TaskApplicationService.ts`
2. `apps/desktop/src/renderer/modules/task/presentation/hooks/useTaskTemplate.ts`
3. `apps/desktop/src/renderer/modules/task/presentation/views/TaskTemplateView.tsx`

## 深度问题分析

### 问题1: Desktop 应用是否应该直接访问数据库？

**当前架构**：
- Desktop Main Process → Application Server → Repository → SQLite

**Web 架构**：
- Web Frontend → API (HTTP) → Application Server → Repository → PostgreSQL

**问题所在**：
- Desktop 应用直接使用了 `@dailyuse/application-server`
- Application Server 中的 Repository 实现期望的是服务端数据库（PostgreSQL）
- Desktop 应该有独立的 SQLite Repository，而不是复用服务端的

### 问题2: Repository 注入问题

**Application Server Use Case**:
```typescript
export class ListTaskTemplates {
  constructor(private readonly repository: ITaskTemplateRepository) {}
}
```

**问题**：
- Desktop Main Process 调用 `listTemplatesUseCase` 时
- 使用的 Repository 实例是什么？
- 是否正确注入了 SQLite Repository？
- 还是错误地使用了 PostgreSQL Repository？

### 问题3: 数据库初始化时序

**Main Process 启动流程**：
```typescript
// apps/desktop/src/main/main.ts
1. app.on('ready')
2. 初始化数据库
3. 注册 IPC handlers
4. 创建窗口
```

**可能的问题**：
- IPC handler 注册时，数据库可能尚未初始化
- Repository 依赖的数据库连接可能未就绪
- Migration 可能未执行

## 解决方案 ✅ 明确路径

### 立即修复方案：在 initializeTables() 中添加缺失的表

**文件**: `apps/desktop/src/main/database/index.ts`

需要添加以下表的 CREATE TABLE 语句：

#### 1. Task Templates 表
```sql
CREATE TABLE IF NOT EXISTS task_templates (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  folder_uuid TEXT,
  goal_uuid TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  importance TEXT DEFAULT 'MEDIUM',
  urgency TEXT DEFAULT 'MEDIUM',
  category TEXT,
  tags TEXT,
  schedule TEXT,  -- JSON: {type, value, cronExpression}
  duration INTEGER,
  estimated_workload INTEGER,
  actual_workload INTEGER,
  parent_template_uuid TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (goal_uuid) REFERENCES goals(uuid),
  FOREIGN KEY (parent_template_uuid) REFERENCES task_templates(uuid)
);
```

#### 2. Task Instances 表
```sql
CREATE TABLE IF NOT EXISTS task_instances (
  uuid TEXT PRIMARY KEY,
  template_uuid TEXT NOT NULL,
  account_uuid TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  due_at INTEGER,
  completed_at INTEGER,
  status TEXT DEFAULT 'PENDING',
  actual_duration INTEGER,
  notes TEXT,
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (template_uuid) REFERENCES task_templates(uuid)
);
```

#### 3. Schedule Tasks 表
```sql
CREATE TABLE IF NOT EXISTS schedule_tasks (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  source_module TEXT NOT NULL,  -- 'TASK', 'GOAL', 'REMINDER', etc.
  source_entity_uuid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,  -- JSON: {type, cronExpression, timezone}
  status TEXT DEFAULT 'ACTIVE',
  last_executed_at INTEGER,
  next_execution_at INTEGER,
  execution_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
```

#### 4. Reminder Templates 表
```sql
CREATE TABLE IF NOT EXISTS reminder_templates (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  group_uuid TEXT,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL,  -- 'TRIGGER', 'SCHEDULED'
  trigger_config TEXT,  -- JSON: {sourceModule, event, conditions}
  schedule_config TEXT,  -- JSON: {cronExpression, timezone}
  notification_config TEXT NOT NULL,  -- JSON: {channels, title, body}
  status TEXT DEFAULT 'ACTIVE',
  effective_enabled INTEGER DEFAULT 1,  -- boolean
  priority INTEGER DEFAULT 5,
  tags TEXT,  -- JSON array
  next_trigger_at INTEGER,
  last_triggered_at INTEGER,
  trigger_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  FOREIGN KEY (group_uuid) REFERENCES reminder_groups(uuid)
);
```

#### 5. Reminder Groups 表
```sql
CREATE TABLE IF NOT EXISTS reminder_groups (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  status TEXT DEFAULT 'ACTIVE',
  control_mode TEXT DEFAULT 'INDIVIDUAL',  -- 'INDIVIDUAL', 'GROUP_CONTROL'
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
```

#### 6. 添加索引优化查询性能
```sql
-- Task Templates 索引
CREATE INDEX IF NOT EXISTS idx_task_templates_account ON task_templates(account_uuid);
CREATE INDEX IF NOT EXISTS idx_task_templates_goal ON task_templates(goal_uuid);
CREATE INDEX IF NOT EXISTS idx_task_templates_status ON task_templates(status);

-- Task Instances 索引
CREATE INDEX IF NOT EXISTS idx_task_instances_template ON task_instances(template_uuid);
CREATE INDEX IF NOT EXISTS idx_task_instances_scheduled ON task_instances(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);

-- Schedule Tasks 索引
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_account ON schedule_tasks(account_uuid);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_source ON schedule_tasks(source_module, source_entity_uuid);
CREATE INDEX IF NOT EXISTS idx_schedule_tasks_next_execution ON schedule_tasks(next_execution_at);

-- Reminder Templates 索引
CREATE INDEX IF NOT EXISTS idx_reminder_templates_account ON reminder_templates(account_uuid);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_group ON reminder_templates(group_uuid);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_next_trigger ON reminder_templates(next_trigger_at);

-- Reminder Groups 索引
CREATE INDEX IF NOT EXISTS idx_reminder_groups_account ON reminder_groups(account_uuid);
```

## 下一步行动 ✅ 明确步骤

### 第1步：修改数据库初始化代码（立即执行）

编辑 `apps/desktop/src/main/database/index.ts` 的 `initializeTables()` 函数，在 Goal 表之后添加所有缺失表的创建语句。

### 第2步：删除旧数据库文件（清理环境）

```bash
# 找到数据库文件位置
# Windows: C:\Users\{Username}\AppData\Roaming\dailyuse\data\dailyuse.sqlite
# macOS: ~/Library/Application Support/dailyuse/data/dailyuse.sqlite

# 删除旧数据库以触发重新初始化
rm {userData}/data/dailyuse.sqlite*
```

### 第3步：重启应用测试

```bash
pnpm nx serve desktop
```

新数据库将包含所有必需的表。

### 第4步：验证表创建

使用 SQLite 工具验证：
```bash
sqlite3 {userData}/data/dailyuse.sqlite

.tables
# 应该看到所有表：
# goals, goal_folders, key_results, goal_reviews, goal_records,
# task_templates, task_instances,
# schedule_tasks,
# reminder_templates, reminder_groups
```

### 第5步：测试完整功能

1. 打开 Task 列表页面 → 应该不再报错
2. 打开 Schedule 列表 → 应该不再报错  
3. 打开 Reminder 列表 → 应该不再报错
4. 创建测试数据验证 CRUD 操作

## 技术债务记录

1. Desktop 应用架构需要重构，不应直接依赖 `application-server`
2. 缺少数据库健康检查和初始化验证
3. Repository 注入机制不清晰
4. 错误处理和日志需要改进，应该在数据库层就捕获并记录详细信息

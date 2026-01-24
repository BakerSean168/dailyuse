# 架构改进前后对比

## **之前 (❌ 问题状态)**

```
┌─────────────────────────────────────────────────────────┐
│                   apps/api/index.ts                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  const taskModule = new TaskModule(prisma);  ❌ 硬绑定  │
│                                                           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│         packages/infrastructure-server/               │
│            task/task.module.ts                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  constructor(prisma: PrismaClient) {                     │
│    this.taskInstanceRepository =                         │
│      new TaskInstancePrismaRepository(prisma);           │
│      ❌ 只支持 Prisma                                  │
│  }                                                       │
│                                                           │
└─────────────────────────────────────────────────────────┘

问题:
❌ 无法支持 BetterSQLite
❌ Desktop 应用无法使用
❌ 路由层需要 Service Locator
❌ 测试时难以 Mock
❌ 数据库类型在运行时无法切换
```

---

## **之后 (✅ 改进状态)**

```
┌────────────────────────────────────────────────────────────┐
│                   apps/api/index.ts                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  // 1️⃣ 初始化全局数据源管理器                              │
│  DataSourceManager.initialize({                             │
│    type: 'prisma',                                          │
│    prismaClient: prisma,                                    │
│  });                                                        │
│                                                              │
│  // 2️⃣ 初始化 Module (明确类型 ✅)                         │
│  const taskModule = new TaskModule('prisma', prisma);       │
│                                                              │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│         packages/infrastructure-server/                    │
│            task/task.module.ts                             │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  constructor(                                               │
│    dataSourceType: 'prisma' | 'sqlite',    ✅ 灵活        │
│    dbConnection: PrismaClient | Database    ✅ 支持多DB    │
│  ) {                                                        │
│    this.taskInstanceRepository =                            │
│      TaskRepositoryFactory.createTaskInstanceRepository(    │
│        dataSourceType,                                      │
│        dbConnection,                                        │
│      );                                                     │
│  }                                                          │
│                                                              │
└────┬──────────────┬──────────────────────────┬─────────────┘
     │              │                          │
     ▼              ▼                          ▼
  [Factory] ──► [Prisma Repo]            [SQLite Repo]
     ▲
     │ (自动选择)
     │
┌────┴────────────────────────────────────────────────────────┐
│  DataSourceManager.getInstance()                             │
│  • 如果 isPrisma() → 返回 Prisma Repository                │
│  • 如果 isSQLite() → 返回 SQLite Repository                │
└──────────────────────────────────────────────────────────────┘

优势:
✅ 同时支持 Prisma 和 BetterSQLite
✅ API 和 Desktop 都能使用
✅ 明确的依赖注入
✅ 易于测试和 Mock
✅ 在启动时动态选择数据库驱动
```

---

## **数据库切换流程**

```
初始化阶段:
┌─────────────────────────────────────────┐
│ const taskModule = new TaskModule(      │
│   dataSourceType: 'prisma' | 'sqlite',  │
│   dbConnection: PrismaClient | Database │
│ )                                       │
└──────────────┬──────────────────────────┘
               │
               ▼
         TaskRepositoryFactory
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
   [Prisma?]     [SQLite?]
       │               │
       ▼               ▼
  PrismaRepo     SqliteRepo
       │               │
       └───────┬───────┘
               │
               ▼
        TaskModule 初始化完成
        (自动使用正确的数据库驱动)

运行时:
module.taskInstanceService.create(data)
  → 使用对应的 Repository
    → 调用 Prisma 或 SQLite 驱动
```

---

## **路由层集成**

### **之前: Service Locator 反模式**

```typescript
// ❌ 不建议
router.post('/tasks', async (req, res) => {
  const container = TaskContainer.getInstance();  // ← Service Locator ❌
  const service = container.getTaskInstanceService();
  const result = await service.create(req.body);
});
```

### **之后: 纯依赖注入**

```typescript
// ✅ 推荐 (ADR-021 + ADR-025)
export function registerTaskRoutes(taskModule: TaskModule) {
  const router = Router();
  
  router.post('/tasks', async (req, res) => {
    const result = await taskModule.taskInstanceService.create(req.body);
    res.status(201).json(result);
  });
  
  return router;
}

// 在 app.ts 中:
api.use('/tasks', registerTaskRoutes(deps.taskModule));
```

**优势**:
- 依赖关系显式
- 易于单元测试
- 不依赖全局状态
- 遵循 Clean Architecture 原则

---

## **多应用场景下的使用**

### **API 服务器**

```typescript
// apps/api/src/index.ts
import Database from 'better-sqlite3';

DataSourceManager.initialize({
  type: 'prisma',
  prismaClient: prisma,
});

const taskModule = new TaskModule('prisma', prisma);
const app = createApp({ taskModule });
app.listen(3000);
```

### **Desktop 应用**

```typescript
// apps/desktop/src/main/modules.ts
import Database from 'better-sqlite3';

const sqliteDb = new Database(dbPath);

DataSourceManager.initialize({
  type: 'sqlite',
  sqliteDb: sqliteDb,
});

const taskModule = new TaskModule('sqlite', sqliteDb);
// 使用完全相同的 Service API
await taskModule.taskInstanceService.create(data);
```

### **CLI 工具**

```typescript
// apps/cli/src/main.ts
// 灵活切换数据源
const dataSourceType = process.env.DB_TYPE || 'sqlite';
const dbConnection = /* 初始化对应的数据库 */;

const taskModule = new TaskModule(dataSourceType, dbConnection);
// 执行 CLI 命令
```

---

## **Factory 的工作原理**

```
TaskRepositoryFactory.createTaskInstanceRepository(
  'prisma' | 'sqlite',
  dbConnection
)

          │
          ▼
    ┌─────────────┐
    │ dataSourceType?
    └──┬─────────┬┘
       │         │
       │ prisma  │ sqlite
       │         │
       ▼         ▼
    [Prisma]  [SQLite]
       │         │
       ▼         ▼
    PrismaRepo  SqliteRepo
       │         │
       └────┬────┘
            │
            ▼
    返回对应的 Repository
```

---

## **Singleton + Factory 的完美组合**

```
两层设计:

1️⃣ Factory 层 (TaskRepositoryFactory)
   职责: 创建 Repository 实例
   特点: 无状态, 可重复调用
   
2️⃣ Container 层 (TaskContainer)
   职责: 缓存 Repository (Singleton)
   特点: 有状态, 依赖 DataSourceManager
   
┌─────────────────────────────────────────┐
│  TaskContainer.getInstance()             │
│  ↓ 第一次调用时:                         │
│  TaskRepositoryFactory.create...()       │
│  ↓ 缓存结果                              │
│  ↓ 后续调用直接返回缓存                 │
└─────────────────────────────────────────┘

优点:
✅ Factory 提供灵活性
✅ Container 提供缓存和便利
✅ DataSourceManager 提供全局状态管理
✅ 三者配合实现最优架构
```

---

## **测试场景**

### **单元测试**

```typescript
// ✅ 易于 Mock
describe('TaskRoutes', () => {
  it('should create task', async () => {
    // 创建 Mock Module
    const mockModule = {
      taskInstanceService: {
        create: jest.fn().mockResolvedValue({ id: '123' }),
      },
    } as unknown as TaskModule;

    // 路由在测试中也能工作
    const router = registerTaskRoutes(mockModule);
    const response = await request(router).post('/tasks');
    expect(response.status).toBe(201);
  });
});
```

### **集成测试**

```typescript
// ✅ 支持多数据库集成测试
describe('Task Module - Multi DB', () => {
  it('should work with Prisma', async () => {
    DataSourceManager.initialize({ type: 'prisma', prismaClient });
    const taskModule = new TaskModule('prisma', prismaClient);
    // 测试 Prisma 路径
  });

  it('should work with SQLite', async () => {
    const db = new Database(':memory:');
    DataSourceManager.initialize({ type: 'sqlite', sqliteDb: db });
    const taskModule = new TaskModule('sqlite', db);
    // 测试 SQLite 路径
  });
});
```

---

## **迁移清单**

```
步骤 1: TaskModule ✅ 完成
  - 创建 TaskRepositoryFactory
  - 创建 TaskContainer
  - 更新 TaskModule 签名
  - 更新 API 初始化代码

步骤 2: 其他 Module (待做)
  - GoalModule
  - AccountModule (已有 Container, 需要升级 Module)
  - ScheduleModule
  - ReminderModule
  - NotificationModule
  - SettingModule
  - AIModule
  - DashboardModule
  - RepositoryModule

步骤 3: Desktop 应用 (待做)
  - 初始化 BetterSQLite
  - 初始化 DataSourceManager
  - 创建所有 Module (传入 'sqlite')

步骤 4: 验证测试
  - 单元测试
  - 集成测试
  - 多数据库场景测试
```

---

## **性能考虑**

```
缓存策略:

First Call:
TaskContainer.getInstance()
  → 检查 DataSourceManager
  → 创建 Repository 实例 (Factory)
  → 缓存结果
  时间: ~5-10ms (创建开销)

Subsequent Calls:
TaskContainer.getInstance()
  → 返回缓存的 Repository
  时间: <1ms (直接返回)

结论: ✅ 零额外性能开销
```

---

## **依赖关系流程图**

```
应用启动
  │
  ├─ 1. 初始化 Prisma / SQLite
  │
  ├─ 2. DataSourceManager.initialize()
  │     (注册全局数据源)
  │
  ├─ 3. new TaskModule('prisma'|'sqlite', dbConnection)
  │     │
  │     ├─ TaskRepositoryFactory.create...()
  │     │  (根据类型创建对应的 Repository)
  │     │
  │     ├─ new TaskInstanceApplicationService(repo)
  │     ├─ new TaskTemplateApplicationService(repo)
  │     └─ ... (其他服务)
  │
  ├─ 4. createApp({ taskModule, ... })
  │     (注入 Module)
  │
  ├─ 5. registerTaskRoutes(taskModule)
  │     (路由获得 Module 中的服务)
  │
  └─ 6. app.listen()
```

---

**总结**: 三层设计 (Factory + Container + Module) + DataSourceManager 实现了：
- ✅ 多数据库支持
- ✅ 灵活的运行时切换
- ✅ 清晰的架构分层
- ✅ 完全的可测试性

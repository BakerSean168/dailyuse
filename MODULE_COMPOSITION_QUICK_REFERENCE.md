# Module Composition Pattern - 快速参考

## **快速对比**

| 方面 | Before | After |
|------|--------|-------|
| **数据库支持** | Prisma only | Prisma + SQLite |
| **应用场景** | API 仅 | API + Desktop + CLI |
| **Module 签名** | `new Module(prisma)` | `new Module('db-type', dbConnection)` |
| **Repository 选择** | 硬编码 | 动态工厂 |
| **API 初始化** | 简单 | 需要初始化 DataSourceManager |
| **路由层改动** | 部分需要改 | 完全不需要改 |

---

## **三行代码快速上手**

### **API 应用**
```typescript
DataSourceManager.initialize({ type: 'prisma', prismaClient: prisma });
const taskModule = new TaskModule('prisma', prisma);
const app = createApp({ taskModule, /* ... */ });
```

### **Desktop 应用**
```typescript
DataSourceManager.initialize({ type: 'sqlite', sqliteDb });
const taskModule = new TaskModule('sqlite', sqliteDb);
// 使用完全相同的 Service API
```

### **路由层**
```typescript
export function registerTaskRoutes(taskModule: TaskModule) {
  router.post('/tasks', async (req, res) => {
    await taskModule.taskInstanceService.create(req.body);
  });
}
```

---

## **核心组件速查表**

```
┌─────────────────────────────────────────────────────────┐
│  应用启动                                              │
├─────────────────────────────────────────────────────────┤
│  1. DataSourceManager.initialize()                      │
│     ↓ 配置全局数据源                                   │
│  2. new TaskModule('prisma'|'sqlite', dbConnection)    │
│     ↓ Factory 自动创建正确的 Repository               │
│  3. createApp({ taskModule })                           │
│     ↓ 依赖注入到应用                                   │
│  4. registerTaskRoutes(taskModule)                      │
│     ↓ 路由获得 Service                                 │
│  App Ready ✅                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  三个关键类的职责                                      │
├─────────────────────────────────────────────────────────┤
│  TaskRepositoryFactory:                                 │
│    根据类型创建 Repository                             │
│    static method, 无状态                               │
│                                                         │
│  TaskContainer:                                         │
│    缓存 Repository (Singleton)                         │
│    支持测试时 Mock                                     │
│                                                         │
│  TaskModule:                                            │
│    组装 Service 和 Repository                          │
│    提供给路由层和应用层使用                            │
└─────────────────────────────────────────────────────────┘
```

---

## **常见场景处理**

### **场景 1: 添加新的 Module**

```typescript
// 1️⃣ 创建 Factory
export class GoalRepositoryFactory {
  static createGoalRepository(dataSourceType, dbConnection) {
    if (dataSourceType === 'prisma') 
      return new GoalPrismaRepository(dbConnection);
    if (dataSourceType === 'sqlite')
      return new GoalSqliteRepository(dbConnection);
  }
}

// 2️⃣ 创建 Container
export class GoalContainer {
  static getInstance() { /* ... */ }
  getGoalRepository() { 
    // 使用 DataSourceManager 自动选择
  }
}

// 3️⃣ 更新 Module
export class GoalModule {
  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection) {
    this.goalRepository = GoalRepositoryFactory.create(dataSourceType, dbConnection);
    this.goalService = new GoalService(this.goalRepository);
  }
}
```

### **场景 2: 单元测试**

```typescript
describe('TaskRoutes', () => {
  it('should create task', async () => {
    // Mock Module
    const mockModule = {
      taskInstanceService: {
        create: jest.fn().mockResolvedValue({ id: '123' })
      }
    };
    
    const router = registerTaskRoutes(mockModule);
    const res = await request(router).post('/tasks');
    expect(res.status).toBe(201);
  });
});
```

### **场景 3: 多数据库集成测试**

```typescript
describe('TaskModule - Multi DB', () => {
  it('Prisma path', async () => {
    DataSourceManager.initialize({ type: 'prisma', prismaClient });
    const module = new TaskModule('prisma', prismaClient);
    // 测试 Prisma 路径
  });

  it('SQLite path', async () => {
    const db = new Database(':memory:');
    DataSourceManager.initialize({ type: 'sqlite', sqliteDb: db });
    const module = new TaskModule('sqlite', db);
    // 测试 SQLite 路径
  });
});
```

---

## **文件位置速查**

```
核心文件:
  packages/infrastructure-server/src/
  ├── task/
  │   ├── task.module.ts                    ← 主要 Module
  │   ├── di/
  │   │   ├── task-container.ts             ← Container
  │   │   ├── task-repository.factory.ts    ← Factory
  │   │   └── index.ts
  │   ├── adapters/
  │   │   ├── prisma/                       ← Prisma 实现
  │   │   └── sqlite/                       ← SQLite 实现
  │
  └── shared/
      └── config/
          └── data-source-manager.ts        ← 全局数据源管理

应用集成:
  apps/api/src/
  ├── index.ts                              ← 初始化
  └── app.ts                                ← 依赖注入

文档:
  ├── IMPLEMENTATION_GUIDE_MODULE_COMPOSITION.md
  ├── ARCHITECTURE_COMPARISON_BEFORE_AFTER.md
  └── TASK_MODULE_MULTIDB_REFACTOR_SUMMARY.md
```

---

## **关键 API 参考**

### **DataSourceManager**
```typescript
// 初始化
DataSourceManager.initialize({
  type: 'prisma' | 'sqlite',
  prismaClient?: PrismaClient,
  sqliteDb?: Database
});

// 获取实例
const dsManager = DataSourceManager.getInstance();

// 查询状态
dsManager.isPrisma()   // true | false
dsManager.isSQLite()   // true | false
dsManager.getType()    // 'prisma' | 'sqlite'
```

### **TaskRepositoryFactory**
```typescript
// 创建单个 Repository
TaskRepositoryFactory.createTaskInstanceRepository('prisma', prismaClient)
TaskRepositoryFactory.createTaskDependencyRepository('sqlite', sqliteDb)

// 创建所有 Repository
const repos = TaskRepositoryFactory.createAllRepositories('prisma', prismaClient)
// repos.taskInstanceRepository
// repos.taskDependencyRepository
// repos.taskStatisticsRepository
```

### **TaskContainer**
```typescript
// 获取单例
const container = TaskContainer.getInstance();

// 获取 Repository（自动根据 DataSourceManager 选择）
container.getTaskInstanceRepository()
container.getTaskDependencyRepository()
container.getTaskStatisticsRepository()

// 测试时注入
container.setTaskInstanceRepository(mockRepo)
container.reset()
```

### **TaskModule**
```typescript
const module = new TaskModule('prisma', prismaClient);
// or
const module = new TaskModule('sqlite', sqliteDb);

// 公开的属性
module.taskInstanceService         // IApplicationService
module.taskTemplateService
module.taskDependencyService
module.taskStatisticsService
module.taskInstanceRepository      // IRepository
module.taskDependencyRepository
module.taskStatisticsRepository
```

---

## **故障排查**

### **错误: DataSourceManager not initialized**

**原因**: 忘记在应用启动时初始化  
**解决**:
```typescript
DataSourceManager.initialize({ type: 'prisma', prismaClient: prisma });
```

### **错误: Cannot read property 'xxx' of undefined**

**原因**: Module 没有被正确注入到路由  
**解决**:
```typescript
// ❌ 错误
const router = registerTaskRoutes();  // 缺少参数

// ✅ 正确
const router = registerTaskRoutes(taskModule);
```

### **错误: SQLite Repository not found**

**原因**: SQLite Repository 实现缺失  
**解决**: 确保所有 SQLite Repository 都已实现，或参考 Prisma 版本创建

---

## **性能注意事项**

```
初始化阶段 (一次):
  DataSourceManager.initialize()     ~1ms
  new TaskModule()                   ~5-10ms
  Compile Services                   ~10-20ms
  ─────────────────────────────
  总计                               ~20-30ms (可接受)

运行时 (每次请求):
  taskModule.taskInstanceService.create()  ~0.1-1ms
  (无额外开销，Factory 已缓存)
  ─────────────────────────────
  总计                               0ms (额外)
```

---

## **迁移路线图**

```
当前完成:
  ✅ Task Module (这次改造)
  ✅ DataSourceManager (已有)
  
待迁移 (参考 Task 模板):
  ⏳ Goal Module
  ⏳ Account Module
  ⏳ Schedule Module
  ⏳ Reminder Module
  ⏳ Notification Module
  ⏳ Setting Module
  ⏳ AI Module
  ⏳ Dashboard Module
  ⏳ Repository Module

预计时间: 
  每个 Module ~30 分钟
  全部完成 ~5-6 小时
```

---

## **相关 ADR**

- ADR-021: API 路由文件组织策略
- ADR-023: Server-Side Layer Decoupling
- ADR-025: Module Composition Pattern

---

## **更多帮助**

详细文档:
- [IMPLEMENTATION_GUIDE_MODULE_COMPOSITION.md](./IMPLEMENTATION_GUIDE_MODULE_COMPOSITION.md)
- [ARCHITECTURE_COMPARISON_BEFORE_AFTER.md](./ARCHITECTURE_COMPARISON_BEFORE_AFTER.md)
- [TASK_MODULE_MULTIDB_REFACTOR_SUMMARY.md](./TASK_MODULE_MULTIDB_REFACTOR_SUMMARY.md)

代码示例位置:
- `packages/infrastructure-server/src/task/di/` - Factory & Container 实现
- `packages/infrastructure-server/src/task/task.module.ts` - Module 实现
- `apps/api/src/index.ts` - API 初始化示例

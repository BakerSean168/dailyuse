## 📋 Module Composition Pattern - 具体实现指南

### **架构改进总结**

本改进遵循 **ADR-023 (Pure DI)** 和 **ADR-025 (Module Composition Pattern)** 的要求，完成了以下目标：

```
✅ 移除硬依赖 (Prisma Only) → 支持多数据库 (Prisma + SQLite)
✅ 支持 API (Server) + Desktop (SQLite) 
✅ Factory Pattern 屏蔽数据库实现细节
✅ DataSourceManager 全局管理数据源
✅ 路由层无需感知数据库类型
```

---

## **1️⃣ 核心组件说明**

### **A. TaskRepositoryFactory**

**位置**: `packages/infrastructure-server/src/task/di/task-repository.factory.ts`

**职责**: 根据数据库类型创建对应的 Repository 实例

```typescript
// 创建单个 Repository
const instanceRepo = TaskRepositoryFactory.createTaskInstanceRepository('prisma', prismaClient);

// 创建所有 Repository（便利方法）
const repos = TaskRepositoryFactory.createAllRepositories('sqlite', sqliteDb);
```

**支持的类型**:
- `'prisma'` → 使用 `TaskInstancePrismaRepository`
- `'sqlite'` → 使用 `SqliteTaskInstanceRepository`

---

### **B. TaskContainer** 

**位置**: `packages/infrastructure-server/src/task/di/task-container.ts`

**职责**: Singleton 管理器，自动切换数据库驱动

```typescript
// 获取 Singleton
const container = TaskContainer.getInstance();

// 自动根据 DataSourceManager 选择正确的 Repository
const taskRepo = container.getTaskInstanceRepository();

// 支持测试: 手动设置 Mock Repository
container.setTaskInstanceRepository(mockRepo);
container.reset(); // 重置容器
```

**工作流程**:
```
TaskContainer.getInstance()
  → 检查 DataSourceManager.getInstance()
    → 如果是 Prisma: 使用 TaskRepositoryFactory.createForPrisma()
    → 如果是 SQLite: 使用 TaskRepositoryFactory.createForSQLite()
```

---

### **C. TaskModule** 

**位置**: `packages/infrastructure-server/src/task/task.module.ts`

**职责**: Composition Root - 组装所有 Task 相关的 Service

```typescript
// API 使用
const taskModule = new TaskModule('prisma', prismaClient);

// Desktop 使用
const taskModule = new TaskModule('sqlite', sqliteDb);

// 使用 Module 中的服务
const result = await taskModule.taskInstanceService.create(data);
```

**Module 公开的属性**:
```typescript
taskModule.taskInstanceService       // TaskInstanceApplicationService
taskModule.taskTemplateService       // TaskTemplateApplicationService
taskModule.taskDependencyService     // TaskDependencyApplicationService
taskModule.taskStatisticsService     // TaskStatisticsApplicationService
taskModule.taskInstanceRepository    // ITaskInstanceRepository
taskModule.taskDependencyRepository  // ITaskDependencyRepository
taskModule.taskStatisticsRepository  // ITaskStatisticsRepository
```

---

## **2️⃣ API 初始化 (apps/api/src/index.ts)**

### **Composition Root 模式**

```typescript
import { DataSourceManager, TaskModule } from '@dailyuse/infrastructure-server';

(async () => {
  // 1️⃣ 初始化数据源管理器（IMPORTANT！）
  DataSourceManager.initialize({
    type: 'prisma',
    prismaClient: prisma,
  });

  // 2️⃣ 初始化 Module 时传入数据库类型和连接
  const taskModule = new TaskModule('prisma', prisma);
  
  // 3️⃣ 依赖注入到应用
  const app = createApp({
    taskModule,
    // ... 其他 Module
  });

  app.listen(port);
})();
```

### **关键点**:
- **必须先初始化 DataSourceManager**，否则 TaskContainer 会抛出错误
- TaskModule 接收 `dataSourceType` 和 `dbConnection` 两个参数
- 不再需要写 `new TaskModule(prisma)` 这样的简陋代码

---

## **3️⃣ 路由层使用 (apps/api/src/modules/task/interface/**routes.ts)**

### **ADR-021 标准化的路由文件结构**

```typescript
import { Router } from 'express';
import type { TaskModule } from '@dailyuse/infrastructure-server';

/**
 * Task CRUD Routes
 * 处理任务的基本 CRUD 操作
 */
export function registerTaskCrudRoutes(taskModule: TaskModule) {
  const router = Router();

  // ✅ 直接使用 Module 提供的服务 - 无需调用 Container.getInstance()
  router.post('/', async (req, res) => {
    try {
      const result = await taskModule.taskInstanceService.create(req.body);
      res.status(201).json({ data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const result = await taskModule.taskInstanceService.getById(req.params.id);
      res.json({ data: result });
    } catch (error) {
      res.status(404).json({ error: 'Not found' });
    }
  });

  return router;
}

/**
 * Task Status Routes
 * 处理任务状态变更
 */
export function registerTaskStatusRoutes(taskModule: TaskModule) {
  const router = Router();

  router.patch('/:id/complete', async (req, res) => {
    try {
      const result = await taskModule.taskInstanceService.complete(req.params.id);
      res.json({ data: result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
```

### **在 app.ts 中整合**

```typescript
import { registerTaskCrudRoutes, registerTaskStatusRoutes } from './modules/task/interface';

export const createApp = (deps: AppDependencies) => {
  const app = express();
  const api = Router();

  // 注入 taskModule
  api.use('/tasks', authMiddleware, registerTaskCrudRoutes(deps.taskModule));
  api.use('/tasks', authMiddleware, registerTaskStatusRoutes(deps.taskModule));

  app.use('/api', api);
  return app;
};
```

### **路由层的优势**:
- ✅ 无需 Singleton 或 Service Locator 反模式
- ✅ 依赖关系显式明确
- ✅ 易于单元测试 (注入 mock Module)
- ✅ 不关心数据库类型

---

## **4️⃣ Desktop 应用初始化 (apps/desktop/src/main/)**

### **使用 BetterSQLite3**

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { DataSourceManager, TaskModule } from '@dailyuse/infrastructure-server';

const initializeDesktopModules = () => {
  // 1️⃣ 初始化 BetterSQLite 数据库
  const dbPath = path.join(app.getPath('userData'), 'dailyuse.db');
  const sqliteDb = new Database(dbPath);

  // 2️⃣ 初始化数据源管理器（针对 SQLite）
  DataSourceManager.initialize({
    type: 'sqlite',
    sqliteDb: sqliteDb,
  });

  // 3️⃣ 初始化 Module - 注意: 传入 'sqlite'
  const taskModule = new TaskModule('sqlite', sqliteDb);
  
  // 4️⃣ 使用相同的服务接口
  const result = await taskModule.taskInstanceService.create(data);

  return {
    taskModule,
    sqliteDb,
  };
};
```

### **关键点**:
- 使用完全相同的 `TaskModule` 类
- 仅改变参数: `new TaskModule('sqlite', sqliteDb)`
- 无需修改业务逻辑 - 自动使用 SQLite 仓储

---

## **5️⃣ 其他 Module 的迁移**

### **模板 - 如何升级现有 Module**

以下是升级 `GoalModule` 的示例：

```typescript
// 1️⃣ 创建 Factory
// packages/infrastructure-server/src/goal/di/goal-repository.factory.ts
export class GoalRepositoryFactory {
  static createGoalRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | Database,
  ): IGoalRepository {
    if (dataSourceType === 'prisma') {
      return new GoalPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new GoalSqliteRepository(dbConnection as Database);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }
}

// 2️⃣ 创建 Container
// packages/infrastructure-server/src/goal/di/goal-container.ts
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository?: IGoalRepository;

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      const dsManager = DataSourceManager.getInstance();
      if (dsManager.isPrisma()) {
        this.goalRepository = GoalRepositoryFactory.createGoalRepository(
          'prisma',
          prisma,
        );
      } else if (dsManager.isSQLite()) {
        this.goalRepository = GoalRepositoryFactory.createGoalRepository(
          'sqlite',
          dsManager.getSQLiteDb(),
        );
      }
    }
    return this.goalRepository;
  }
}

// 3️⃣ 升级 Module
// packages/infrastructure-server/src/goal/goal.module.ts
export class GoalModule {
  public readonly goalRepository: IGoalRepository;
  public readonly archiveGoal: ArchiveGoal;
  public readonly goalApplicationService: GoalApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | Database) {
    this.goalRepository = GoalRepositoryFactory.createGoalRepository(
      dataSourceType,
      dbConnection,
    );
    
    this.archiveGoal = new ArchiveGoal(this.goalRepository);
    this.goalApplicationService = new GoalApplicationService(this.goalRepository);
  }
}

// 4️⃣ API 初始化
const goalModule = new GoalModule('prisma', prisma);

// 5️⃣ Desktop 初始化
const goalModule = new GoalModule('sqlite', sqliteDb);
```

---

## **6️⃣ 关键优势总结**

### **vs 当前的 Service Locator 模式**

| 指标 | 当前 | 改进后 |
|------|------|--------|
| **数据库支持** | ❌ 仅 Prisma | ✅ Prisma + SQLite |
| **单元测试** | ❌ 难以 Mock（全局状态） | ✅ 轻松注入 Mock |
| **多应用支持** | ❌ 只能 API | ✅ API + Desktop + CLI |
| **显式依赖** | ❌ 隐藏在 Container | ✅ 构造函数参数明确 |
| **灵活性** | ❌ 受限 | ✅ 高度可配置 |

---

## **7️⃣ 迁移清单**

```
✅ Task Module - 已完成
⏳ Goal Module - 待迁移（参考 Task 的模式）
⏳ Account Module - 待迁移
⏳ Schedule Module - 待迁移
⏳ Reminder Module - 待迁移
⏳ Notification Module - 待迁移
⏳ Setting Module - 待迁移
⏳ AI Module - 待迁移
```

---

## **8️⃣ 常见问题**

### **Q: 为什么需要 DataSourceManager?**

A: 因为 `TaskContainer` 是 Singleton，它需要知道全局使用的是哪种数据源。
所以在应用启动时必须调用 `DataSourceManager.initialize()`。

### **Q: 能否跳过 DataSourceManager 直接使用?**

A: 不建议。如果只想使用 Factory 而不用 Container，可以：
```typescript
const repo = TaskRepositoryFactory.createTaskInstanceRepository('prisma', prisma);
// 但这样就无法用 Container 的缓存和 Singleton 特性
```

### **Q: Task Module 的 as any 强制转换怎么处理?**

A: 这是因为 Service 接口与 Repository 接口不完全匹配的遗留问题。
建议后续修复 Application Service 的接口定义。

### **Q: Desktop 应用需要迁移吗?**

A: 是的！一旦你开始在 Desktop 中使用 Task Module，就需要按上面的步骤初始化。

---

## **9️⃣ 下一步**

1. **验证 Task Module** 的改动是否编译通过
2. **逐个迁移其他 Module** 到新模式
3. **更新 Desktop 应用** 初始化代码
4. **修复类型转换** (移除 `as any`)
5. **补充单元测试** 验证多数据库切换的正确性

# Infrastructure-Server 包架构标准

基于 **ADR-023: Server-Side Clean Architecture** 和 **ADR-025: Module Composition Pattern**

## 整体架构

`packages/infrastructure-server` 是应用的技术驱动层，负责：
- 数据持久化实现（Repository 模式）
- 外部服务集成（邮件、存储、调度等）
- 依赖注入容器（Module Composition Root）

**关键设计原则：**
- ✅ 支持多数据源（Prisma 用于 API，SQLite 用于 Desktop）
- ✅ Pure Dependency Injection（无 Service Locator 反模式）
- ✅ 一个 Module 类支持两种数据库
- ✅ Factory 模式在构造时选择正确的适配器

---

## 标准的模块文件结构

每个业务模块（account, task, goal 等）必须遵循此结构：

```
[module-name]/
│
├─ adapters/                                  # 数据库适配器层（多实现）
│  ├─ prisma/                                 # Prisma ORM 实现
│  │  ├─ [entity]-prisma.repository.ts        # 单个仓储实现
│  │  ├─ [entity2]-prisma.repository.ts
│  │  └─ index.ts                             # 导出此目录所有类
│  │
│  ├─ sqlite/                                 # SQLite 适配器实现
│  │  ├─ [entity]-sqlite.repository.ts
│  │  ├─ [entity2]-sqlite.repository.ts
│  │  └─ index.ts
│  │
│  ├─ memory/                                 # 内存实现（可选，用于测试）
│  │  ├─ [entity]-memory.repository.ts
│  │  └─ index.ts
│  │
│  └─ index.ts                                # 汇总所有适配器导出
│
├─ di/                                        # 依赖注入层
│  ├─ [module]-repository.factory.ts          # Factory 模式：选择正确的适配器
│  └─ index.ts
│
├─ ports/                                     # 端口（接口定义）
│  ├─ [entity]-repository.port.ts             # 仓储接口定义
│  ├─ [entity2]-repository.port.ts
│  └─ index.ts
│
├─ external/                                  # 外部集成（可选，如需要）
│  ├─ datasources/                            # 外部库集成（Bree, Redis 等）
│  │  ├─ cron-job-manager.ts
│  │  └─ index.ts
│  │
│  ├─ mappers/                                # 领域对象到 DTO 的映射
│  │  ├─ [entity]-mapper.ts
│  │  └─ index.ts
│  │
│  └─ index.ts
│
├─ [module].module.ts                         # ⭐ Module 类：DI 容器 & Composition Root
│  
├─ index.ts                                   # ⭐ 导出 Module + Factories + Adapters
│
└─ README.md                                  # 模块文档（可选但推荐）
```

### 各目录详解

#### 1. `adapters/` - 数据库适配器

**作用：** 实现 Repository Port，为不同数据源提供具体实现

**规范：**
```typescript
// adapters/prisma/task-instance-prisma.repository.ts
import type { PrismaClient } from '@prisma/client';
import { TaskInstancePrismaRepository } from '@dailyuse/domain-server/task';

export class TaskInstancePrismaRepository implements ITaskInstanceRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string) { /* ... */ }
  async create(data) { /* ... */ }
  // ...
}
```

**必须：**
- 每个适配器实现相同的 Port（接口）
- Constructor 接收数据库连接对象
- 无静态方法（无 getInstance）

**Prisma 版本：** 接收 `PrismaClient`
**SQLite 版本：** 接收 `Database.Database`（better-sqlite3）
**Memory 版本：** 不接收数据库，纯内存存储

---

#### 2. `di/` - 依赖注入

**作用：** 通过 Factory 在运行时选择正确的 Repository 实现

**规范：**
```typescript
// di/task-repository.factory.ts
import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';
import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';

import { TaskInstancePrismaRepository } from '../adapters/prisma';
import { TaskInstanceSqliteRepository } from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

export class TaskRepositoryFactory {
  static createTaskInstanceRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskInstanceRepository {
    if (dataSourceType === 'prisma') {
      return new TaskInstancePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new TaskInstanceSqliteRepository(dbConnection as BetterSQLiteDB);
    } else {
      throw new Error(`Unknown data source type: ${dataSourceType}`);
    }
  }

  static createTaskDependencyRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskDependencyRepository {
    // 同样的逻辑
  }

  static createTaskStatisticsRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskStatisticsRepository {
    // 同样的逻辑
  }
}
```

**必须：**
- 每个 Factory 方法对应一个 Repository 类型
- 支持 'prisma' 和 'sqlite' 两种类型
- 抛出有意义的错误信息

---

#### 3. `ports/` - 接口定义

**作用：** 定义 Repository 合约，使 Domain 层无依赖

**规范：**
```typescript
// ports/task-instance-repository.port.ts
export interface ITaskInstanceRepository {
  findById(id: string): Promise<TaskInstance | null>;
  create(data: CreateTaskInstanceDTO): Promise<TaskInstance>;
  update(id: string, data: UpdateTaskInstanceDTO): Promise<TaskInstance>;
  delete(id: string): Promise<void>;
  findAll(): Promise<TaskInstance[]>;
  // ... 其他方法
}
```

**必须：**
- 使用 `I` 前缀表示接口
- 方法签名与所有 Adapter 保持一致
- 无具体实现逻辑

---

#### 4. `external/` - 外部集成（可选）

**作用：** 集成第三方库（如 Bree 调度器、Redis 缓存等）

**规范：**
```typescript
// external/datasources/cron-job-manager.ts
import { BreeExecutionEngine } from 'bree';

export class CronJobManager {
  private bree: BreeExecutionEngine;

  constructor(jobsDir: string) {
    this.bree = new BreeExecutionEngine({
      root: jobsDir,
      // ...
    });
  }

  async start() { /* ... */ }
  async stop() { /* ... */ }
}
```

**何时使用：**
- 模块需要外部服务（邮件、调度、缓存）
- 映射数据库对象到 API DTO

---

#### 5. `[module].module.ts` - Module 类

**作用：** DI 容器，负责：
1. 选择正确的 Repository 实现
2. 实例化 Application Services
3. 组合依赖关系

**规范：**
```typescript
// task.module.ts
import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { TaskRepositoryFactory } from './di/task-repository.factory';
import {
  TaskInstanceApplicationService,
  TaskTemplateApplicationService,
  TaskDependencyApplicationService,
  TaskStatisticsApplicationService,
} from '@dailyuse/application-server/task';

type BetterSQLiteDB = Database.Database;

/**
 * Task Module
 * 
 * DI Container for Task domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 * 
 * Usage:
 * ```typescript
 * // API (Prisma)
 * const taskModule = new TaskModule('prisma', prismaClient);
 * 
 * // Desktop (SQLite)
 * const taskModule = new TaskModule('sqlite', sqliteDb);
 * 
 * // Use services
 * await taskModule.taskInstanceService.createTask(taskData);
 * ```
 */
export class TaskModule {
  // ============ Repositories (Public for testing) ============
  public readonly taskInstanceRepository: ITaskInstanceRepository;
  public readonly taskDependencyRepository: ITaskDependencyRepository;
  public readonly taskStatisticsRepository: ITaskStatisticsRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly taskInstanceService: TaskInstanceApplicationService;
  public readonly taskTemplateService: TaskTemplateApplicationService;
  public readonly taskDependencyService: TaskDependencyApplicationService;
  public readonly taskStatisticsService: TaskStatisticsApplicationService;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // ============ Step 1: Initialize Repositories using Factory ============
    this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskDependencyRepository = TaskRepositoryFactory.createTaskDependencyRepository(
      dataSourceType,
      dbConnection,
    );
    this.taskStatisticsRepository = TaskRepositoryFactory.createTaskStatisticsRepository(
      dataSourceType,
      dbConnection,
    );

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    // 注意：这里不 import infrastructure-server（防止循环依赖）
    // 所有依赖都通过 constructor 注入
    this.taskInstanceService = new TaskInstanceApplicationService(
      this.taskInstanceRepository,
      this.taskDependencyRepository, // 可能需要其他 repo
    );

    this.taskTemplateService = new TaskTemplateApplicationService(
      this.taskInstanceRepository,
    );

    this.taskDependencyService = new TaskDependencyApplicationService(
      this.taskDependencyRepository,
    );

    this.taskStatisticsService = new TaskStatisticsApplicationService(
      this.taskStatisticsRepository,
    );
  }
}
```

**关键要点：**
- ✅ Constructor 接收 `(dataSourceType, dbConnection)` 两个参数
- ✅ 用 Factory 创建 Repository（不直接 new PrismaRepository）
- ✅ Repositories 都是 public（便于测试和类型检查）
- ✅ Services 也是 public（路由层需要访问）
- ✅ 无静态方法（无 getInstance）
- ❌ 不 import @dailyuse/infrastructure-server（防止循环依赖）

---

#### 6. `index.ts` - 统一导出

**规范：**
```typescript
// task/index.ts
/**
 * Task Module - Infrastructure Server
 *
 * Repository implementations and DI Module for Task domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */

// ============ DI Module ============
export { TaskModule } from './task.module';

// ============ Repository Factory ============
export { TaskRepositoryFactory } from './di/task-repository.factory';

// ============ Adapters - Prisma ============
export { TaskInstancePrismaRepository } from './adapters/prisma/task-instance-prisma.repository';
export { TaskDependencyPrismaRepository } from './adapters/prisma/task-dependency-prisma.repository';
export { TaskStatisticsPrismaRepository } from './adapters/prisma/task-statistics-prisma.repository';

// ============ Adapters - SQLite ============
export { TaskInstanceSqliteRepository } from './adapters/sqlite/task-instance-sqlite.repository';
export { TaskDependencySqliteRepository } from './adapters/sqlite/task-dependency-sqlite.repository';
export { TaskStatisticsSqliteRepository } from './adapters/sqlite/task-statistics-sqlite.repository';

// ============ Ports (Interfaces) ============
export type { ITaskInstanceRepository } from './ports/task-instance-repository.port';
export type { ITaskDependencyRepository } from './ports/task-dependency-repository.port';
export type { ITaskStatisticsRepository } from './ports/task-statistics-repository.port';

// ============ Optional: External Integrations ============
// export { CronJobManager } from './external/datasources/cron-job-manager';
```

---

## 应用层集成方式

### API 应用（使用 Prisma）

```typescript
// apps/api/src/main.ts
import { PrismaClient } from '@prisma/client';
import {
  TaskModule,
  GoalModule,
  AccountModule,
  // ... 其他模块
} from '@dailyuse/infrastructure-server';

const prisma = new PrismaClient();

// ============ Initialize Modules with Prisma ============
const taskModule = new TaskModule('prisma', prisma);
const goalModule = new GoalModule('prisma', prisma);
const accountModule = new AccountModule('prisma', prisma);
// ...

// ============ Pass Modules to App (Composition Root) ============
const app = createApp({
  taskModule,
  goalModule,
  accountModule,
  // ...
});

app.listen(3000);
```

### Desktop 应用（使用 SQLite）

```typescript
// apps/desktop/src/main.ts
import Database from 'better-sqlite3';
import {
  TaskModule,
  GoalModule,
  AccountModule,
  // ... 其他模块
} from '@dailyuse/infrastructure-server';

const sqliteDb = new Database('app.db');

// ============ Initialize Modules with SQLite ============
const taskModule = new TaskModule('sqlite', sqliteDb);
const goalModule = new GoalModule('sqlite', sqliteDb);
const accountModule = new AccountModule('sqlite', sqliteDb);
// ...

// ============ Use Services ============
const newTask = await taskModule.taskInstanceService.createTask({
  title: 'Learn Rust',
  description: 'Study systems programming',
});
```

---

## 路由层如何使用 Module

```typescript
// apps/api/src/modules/task/interface/task.routes.ts
import type { Router } from 'express';
import { TaskModule } from '@dailyuse/infrastructure-server';

export function registerTaskRoutes(taskModule: TaskModule): Router {
  const router = Router();

  // ✅ 直接使用 Module 提供的 Service（无 Controller）
  router.post('/tasks', authMiddleware, async (req, res) => {
    try {
      const task = await taskModule.taskInstanceService.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/tasks/:id', authMiddleware, async (req, res) => {
    try {
      const task = await taskModule.taskInstanceService.findTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
```

---

## 模块清单

| 模块 | 状态 | 优先级 | 备注 |
|------|------|--------|------|
| account | ✅ 已优化 | - | 完整支持 Prisma + SQLite |
| task | ✅ 已优化 | - | 完整支持 Prisma + SQLite |
| goal | ⚠️ 待优化 | 高 | 只有 Prisma，缺少 SQLite |
| repository | ⚠️ 待优化 | 高 | 缺少完整的 Service 实现 |
| dashboard | ⚠️ 待优化 | 高 | 只有 Prisma，缺少 SQLite |
| schedule | ✅ 已优化 | - | 完整支持 Prisma + SQLite |
| reminder | ⚠️ 待优化 | 中 | - |
| notification | ⚠️ 待优化 | 中 | - |
| setting | ⚠️ 待优化 | 中 | - |
| editor | ⚠️ 待优化 | 中 | - |
| ai | ⚠️ 待优化 | 低 | - |
| authentication | ⚠️ 待优化 | 中 | - |
| sync | ⚠️ 待优化 | 中 | - |

---

## 常见错误 ❌

### 1. 在 Module 中直接 new Adapter（硬编码）
```typescript
// ❌ 错误：硬编码 Prisma，Desktop 无法用 SQLite
export class GoalModule {
  constructor(prisma: PrismaClient) {
    this.goalRepository = new GoalPrismaRepository(prisma);  // ❌ 不支持 SQLite
  }
}

// ✅ 正确：通过 Factory 选择
export class GoalModule {
  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection) {
    this.goalRepository = GoalRepositoryFactory.create(dataSourceType, dbConnection);
  }
}
```

### 2. Module 导入 @dailyuse/infrastructure-server
```typescript
// ❌ 错误：造成循环依赖
import { SomeContainer } from '@dailyuse/infrastructure-server';

export class GoalModule {
  // ...
}

// ✅ 正确：只导入 Application Services（来自 application-server）
import { GoalApplicationService } from '@dailyuse/application-server';
```

### 3. Repository 有静态方法
```typescript
// ❌ 错误：无法切换实现
export class GoalRepository {
  static getInstance() { /* ... */ }
}

// ✅ 正确：通过构造器注入
export class GoalRepository {
  constructor(prisma: PrismaClient) { /* ... */ }
}
```

### 4. Module 中有 private Repository
```typescript
// ❌ 错误：测试无法访问
export class GoalModule {
  private goalRepository;  // ❌ 私有
}

// ✅ 正确：public 便于测试
export class GoalModule {
  public readonly goalRepository;  // ✅ 公开，只读
}
```

---

## 验证清单

在优化每个模块时，确保：

- [ ] 模块名称统一：`[module].module.ts`（不是 `.container.ts`）
- [ ] Module 的构造器：`constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection)`
- [ ] 有完整的 Factory 类，支持所有 Repository 类型
- [ ] 所有 Adapter（Prisma + SQLite）都实现相同的 Port
- [ ] 所有 Repositories 都是 `public readonly`
- [ ] 所有 Services 都是 `public readonly`
- [ ] Module 不导入 `@dailyuse/infrastructure-server`
- [ ] `index.ts` 导出 Module + Factory + 所有 Adapters
- [ ] `adapters/` 中每个数据源都有 `index.ts`
- [ ] `di/` 中只有 Factory（删除旧的 Container）
- [ ] 没有静态方法（如 `getInstance()`）

---

## 相关文档

- [ADR-023: Server-Side Clean Architecture Refactor](./adr/ADR-023-ServerSide-Clean-Architecture-Refactor.md)
- [ADR-025: Module Composition Pattern](./adr/ADR-025-Module-Composition-Pattern.md)


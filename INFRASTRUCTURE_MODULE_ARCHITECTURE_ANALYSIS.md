# Infrastructure-Server 模块架构分析与统一方案

## 当前状态分析

### 1. 各模块的文件结构对比

| 模块 | 结构类型 | 特点 | 问题 |
|------|--------|------|------|
| **account** | 标准型 | `account.module.ts` + `adapters/` (prisma/sqlite/memory) + `di/` (container, factory) | ✓ 最规范 |
| **task** | 工厂型 | `task.module.ts` + `adapters/` (prisma/sqlite) + `di/factory` | 缺少 Container，需要 Factory |
| **goal** | 混合型 | `goal.module.ts` + `goal.container.ts` + `adapters/` (prisma/memory) + `di/factory` | 同时有 Container 和 Module |
| **repository** | 不完整 | `repository.module.ts` + `adapters/` (prisma/sqlite/memory) + `di/v2` | Module 缺少服务实现 |
| **dashboard** | 简化型 | `dashboard.module.ts` + `adapters/` (prisma) | 只有 Prisma，缺少 SQLite |
| **schedule** | 标准型 | `schedule.module.ts` + `adapters/` (prisma/sqlite) + `di/` + `datasources/` | ✓ 完整 |

### 2. 模块导出方式的差异

```typescript
// Account 风格 - 导出 Module + 各 Adapter
export { AccountModule } from './account.module';
export { AccountPrismaRepository } from './adapters/prisma/...';
export { SqliteAccountRepository } from './adapters/sqlite/...';
export { AccountMemoryRepository } from './adapters/memory/...';

// Task 风格 - 只导出 Module
export { TaskModule } from './task.module';
// 只导出 Prisma，SQLite 在注释中

// Goal 风格 - 导出 Container + Module
export { GoalContainer } from './goal.container';
export { GoalModule } from './goal.module';

// Schedule 风格 - 导出 Module + 所有 Adapter + 外部集成
export { ScheduleModule } from './schedule.module';
export { SchedulePrismaRepository } from './adapters/prisma/...';
export { SqliteScheduleRepository } from './adapters/sqlite/...';
export { CronJobManager } from './datasources';
export { SchedulerBootstrap } from './scheduler-bootstrap';
```

### 3. Module 类的设计差异

#### Account Module（Prisma 固定）
```typescript
export class AccountModule {
  // 只支持 Prisma
  constructor(prisma: PrismaClient) {
    // 直接使用 Prisma 适配器
    const accountRepository = new AccountPrismaRepository(prisma);
  }
}
```

#### Task Module（双数据库支持）
```typescript
export class TaskModule {
  // 支持 Prisma | SQLite
  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // 通过 Factory 选择适配器
    this.taskInstanceRepository = TaskRepositoryFactory.createTaskInstanceRepository(
      dataSourceType,
      dbConnection,
    );
  }
}
```

#### Goal Module（单数据库，缺少工厂）
```typescript
export class GoalModule {
  // 只支持 Prisma，缺少 SQLite 和 Memory 支持
  constructor(prisma: PrismaClient) {
    this.goalRepository = new GoalPrismaRepository(prisma);
  }
}
```

#### Schedule Module（双数据库但结构不规范）
```typescript
export class ScheduleModule {
  // 只在构造器中使用 Prisma
  constructor(prisma: PrismaClient) {
    // SQLite 适配器存在但不被使用
  }
}
```

## 核心问题

### 问题 1: Module vs Container 混乱
- **account**: 有 Container + Module（两个重复概念）
- **goal**: 同时有 Container 和 Module
- **其他**: 只有 Module，没有 Container

**该是 Module 还是 Container？**

根据 ADR-025，应该是 **Module**（较新的设计）。Container 是旧的模式。

### 问题 2: DI/Factory 模式混乱
- **account**: 有 `AccountRepositoryFactory`（用于多数据库）
- **task**: 有 `TaskRepositoryFactory`（核心使用的）
- **goal**: 有 `GoalRepositoryFactory`（但 Module 中没用）
- **schedule**: 没有 Factory

应该统一使用 **Factory 模式** 来支持多数据库。

### 问题 3: 多数据库支持不一致
- **task**: ✓ 完整支持（Prisma | SQLite）
- **goal**: ✗ 只支持 Prisma（缺少 SQLite）
- **account**: ✗ 只支持 Prisma
- **schedule**: ✗ 虽然有 SQLite 适配器但 Module 不用
- **dashboard**: ✗ 只支持 Prisma（缺少 SQLite）
- **repository**: ✗ 不完整

### 问题 4: 目录结构差异
```
account/
  ├─ adapters/
  │  ├─ prisma/
  │  ├─ sqlite/
  │  └─ memory/
  ├─ di/
  │  ├─ account-container.ts
  │  ├─ account-repository.factory.ts
  │  └─ index.ts
  ├─ ports/
  ├─ account.module.ts
  └─ index.ts

task/
  ├─ adapters/
  │  ├─ prisma/
  │  └─ sqlite/
  ├─ di/
  │  ├─ task-container.ts
  │  ├─ task-repository.factory.ts
  │  └─ index.ts
  ├─ task.module.ts
  └─ index.ts

goal/
  ├─ adapters/
  │  ├─ prisma/
  │  └─ memory/  # 有 Memory，但 Module 不支持
  ├─ cron/
  ├─ di/
  ├─ mappers/
  ├─ ports/
  ├─ goal.container.ts  # ⚠️ 旧模式
  ├─ goal.module.ts
  └─ index.ts

schedule/
  ├─ adapters/
  │  ├─ prisma/
  │  └─ sqlite/
  ├─ cron/
  ├─ datasources/  # 特殊：外部集成（Bree, CronJobManager）
  ├─ di/
  ├─ mappers/
  ├─ monitoring/
  ├─ schedule.module.ts
  ├─ scheduler-bootstrap.ts  # 特殊：启动初始化
  └─ index.ts
```

### 问题 5: 内部模块结构差异
- **schedule**: 有 `datasources/` 和 `monitoring/` 用于外部集成
- **goal**: 有 `cron/` 和 `mappers/`
- 其他模块: 结构比较简单

## 统一架构方案

### 建议的标准模块结构

```
[module-name]/
├─ adapters/                    # 数据库适配器
│  ├─ prisma/                   # Prisma 实现
│  │  ├─ [entity]-prisma.repository.ts
│  │  └─ index.ts
│  ├─ sqlite/                   # SQLite 实现
│  │  ├─ [entity]-sqlite.repository.ts
│  │  └─ index.ts
│  ├─ memory/                   # 内存实现（可选，用于测试）
│  │  ├─ [entity]-memory.repository.ts
│  │  └─ index.ts
│  └─ index.ts                  # 导出所有适配器
│
├─ di/                          # 依赖注入
│  ├─ [module]-repository.factory.ts  # Factory 模式
│  └─ index.ts
│
├─ ports/                       # 接口定义
│  ├─ [entity]-repository.port.ts
│  └─ index.ts
│
├─ external/                    # 外部集成（可选）
│  ├─ datasources/              # 外部库集成（如 Bree）
│  ├─ mappers/                  # 领域对象映射器
│  └─ index.ts
│
├─ [module].module.ts           # Module 类（DI 容器，无 Container 重复）
│  
├─ index.ts                     # 导出 Module 和所有适配器
└─ README.md                    # 模块文档
```

### 标准的 Module 实现模式

```typescript
// [module].module.ts
import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { [Entity]RepositoryFactory } from './di/[module]-repository.factory';
import {
  [EntityApplicationService],
  [Entity2ApplicationService],
} from '@dailyuse/application-server';

type BetterSQLiteDB = Database.Database;

/**
 * [Module] Module
 * 
 * DI Container 和 Composition Root for [Domain] domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 * 
 * Usage:
 * const module = new [Module]Module('prisma', prismaClient);
 * await module.[entityService].someMethod(data);
 */
export class [Module]Module {
  // Repositories (Public for testing/inspection)
  public readonly [entity]Repository: I[Entity]Repository;
  
  // Application Services (Public - injected into routes)
  public readonly [entity]Service: [EntityApplicationService];
  public readonly [entity2]Service: [Entity2ApplicationService];

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // 1. Initialize Repositories using Factory
    this.[entity]Repository = [Entity]RepositoryFactory.create(dataSourceType, dbConnection);
    
    // 2. Initialize Application Services (Pure Dependency Injection)
    this.[entity]Service = new [EntityApplicationService](this.[entity]Repository);
    this.[entity2]Service = new [Entity2ApplicationService](this.[entity]Repository);
  }
}
```

### 标准的 Factory 实现模式

```typescript
// di/[module]-repository.factory.ts
import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { [Entity]PrismaRepository } from '../adapters/prisma';
import { [Entity]SqliteRepository } from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

export class [Entity]RepositoryFactory {
  static create(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): I[Entity]Repository {
    if (dataSourceType === 'prisma') {
      return new [Entity]PrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new [Entity]SqliteRepository(dbConnection as BetterSQLiteDB);
    } else {
      throw new Error(`Unknown data source type: ${dataSourceType}`);
    }
  }
}
```

### 标准的 index.ts 导出模式

```typescript
// index.ts
/**
 * [Module] Module - Infrastructure Server
 *
 * Repository implementations and DI Module for [Domain] module.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 */

// DI Module
export { [Module]Module } from './[module].module';

// Repository Factory
export { [Entity]RepositoryFactory, [Entity2]RepositoryFactory } from './di/[module]-repository.factory';

// Adapters - Prisma
export { [Entity]PrismaRepository } from './adapters/prisma';

// Adapters - SQLite
export { [Entity]SqliteRepository } from './adapters/sqlite';

// Ports (Interfaces)
export { type I[Entity]Repository } from './ports/[entity]-repository.port';

// Optional: External integrations
export { SomeExternalService } from './external/datasources';
```

## 重构优先级

### 第一阶段（高优先级）- 统一核心模式

1. **account** → 添加 SQLite 支持 + Factory
2. **goal** → 删除 Container，改用 Module + 添加 SQLite 支持
3. **dashboard** → 添加 SQLite 支持 + Factory
4. **repository** → 完整实现 Module（添加缺失的服务）

### 第二阶段（中优先级）- 规范化结构

5. **task** → 已经是标准，保持
6. **schedule** → 整理结构，Module 支持双数据库
7. 所有模块 → 统一导出模式

### 第三阶段（低优先级）- 完善外部集成

8. 为需要的模块添加 `external/datasources` 和 `external/mappers`
9. 更新所有模块的 README 文档

## 同时支持 API (Prisma) 和 Desktop (SQLite) 的关键

### 方案：条件编译 Module

```typescript
// apps/api/src/app.ts
import { TaskModule, GoalModule, ... } from '@dailyuse/infrastructure-server';

const prisma = new PrismaClient();

// API 使用 Prisma 版本
const taskModule = new TaskModule('prisma', prisma);
const goalModule = new GoalModule('prisma', prisma);
```

```typescript
// apps/desktop/src/main.ts
import { TaskModule, GoalModule, ... } from '@dailyuse/infrastructure-server';
import Database from 'better-sqlite3';

const sqliteDb = new Database('app.db');

// Desktop 使用 SQLite 版本
const taskModule = new TaskModule('sqlite', sqliteDb);
const goalModule = new GoalModule('sqlite', sqliteDb);
```

**关键要点：**
- Module 类是多态的，同一个类支持两种数据库
- Factory 在构造时选择正确的适配器
- 应用层（API/Desktop）决定用哪个数据库，Module 无感知

## 验证清单

- [ ] 所有 Module 都支持 `constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection)`
- [ ] 所有模块都有 Factory 来创建 Repository
- [ ] 所有模块都导出 Module + Factory + 两种 Adapter
- [ ] 所有模块的 `di/` 目录都只有 Factory（删除旧的 Container）
- [ ] 所有模块都有清晰的 `index.ts` 导出
- [ ] 没有模块的 Module 类直接 new PrismaRepository（都通过 Factory）
- [ ] 所有适配器都有 index.ts 归纳导出

## 文件数量估计

重构涉及文件：
- 6 个模块的 Module 类修改
- 6 个模块的 Factory 创建/修改
- 6 个模块的 index.ts 修改
- 新增 SQLite 适配器（4-6 个模块）
- 新增/更新 `external/` 子目录（可选）

总计：30-50 个文件修改

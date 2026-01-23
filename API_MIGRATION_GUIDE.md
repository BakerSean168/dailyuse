# API 应用迁移指南

## 概述

由于 Infrastructure 层已经重构，API 应用现在需要使用新的初始化系统来初始化数据源和仓储。

## 变更概览

| 项目 | 变更 |
|-----|------|
| Prisma 依赖 | ❌ 从 `apps/api/package.json` 删除 |
| Prisma 配置 | 📦 从 `apps/api/prisma/` → `packages/infrastructure-server/prisma/` |
| 仓储创建 | 🔄 不再 `new PrismaGoalRepository(prisma)` → 使用 `GoalContainer.getInstance().getGoalRepository()` |
| 初始化 | 📍 需要调用 `initializePrismaDataSource()` 在应用启动时 |

## 具体步骤

### 步骤 1：更新应用启动文件

当前 `apps/api/src/index.ts` 需要在开始处添加初始化：

```typescript
// apps/api/src/index.ts (在文件最开始)

// 导入新的初始化函数
import { 
  initializePrismaDataSource,
  getDataSourceManager 
} from '@dailyuse/infrastructure-server/bootstrap';

// 在主函数最开始调用
async function main() {
  try {
    // 1️⃣ 初始化基础设施层数据源（必须在其他操作之前）
    console.log('Initializing infrastructure layer...');
    await initializePrismaDataSource();
    console.log('Infrastructure layer initialized');

    // 2️⃣ 其余启动逻辑...
    // ... 现有代码 ...
  } catch (error) {
    // ...
  }
}
```

### 步骤 2：使用新的仓储容器

#### 旧方式（不推荐）
```typescript
// ❌ 旧方式（仍可用，但不推荐）
import { prisma } from './shared/infrastructure/config/prisma';
import { PrismaGoalRepository } from '@dailyuse/infrastructure-server';

const goalRepo = new PrismaGoalRepository(prisma);
```

#### 新方式（推荐）
```typescript
// ✅ 新方式（推荐使用）
import { GoalContainer } from '@dailyuse/infrastructure-server';

// 获取容器单例
const goalContainer = GoalContainer.getInstance();

// 获取仓储实例（自动选择 Prisma 或 SQLite）
const goalRepo = goalContainer.getGoalRepository();
const goalFolderRepo = goalContainer.getGoalFolderRepository();
const focusSessionRepo = goalContainer.getFocusSessionRepository();
// ... 其他仓储
```

### 步骤 3：模块初始化更新

目前在 `apps/api/src/index.ts` 中有这样的代码：

```typescript
// ❌ 旧方式（直接传递 prisma）
const goalModule = new GoalModule(prisma);
const accountModule = new AccountModule(prisma);
const taskModule = new TaskModule(prisma);
// ...
```

暂时可以保持不变（仍然有效），但长期应该迁移到使用容器：

```typescript
// ✅ 新方式（优化版本，可选）
import { GoalContainer, TaskContainer, ScheduleContainer } from '@dailyuse/infrastructure-server';

const goalContainer = GoalContainer.getInstance();
const taskContainer = TaskContainer.getInstance();
const scheduleContainer = ScheduleContainer.getInstance();

// 如果 Module 类支持从容器获取，可以这样做：
const goalModule = new GoalModule(
  goalContainer.getGoalRepository(),
  goalContainer.getGoalFolderRepository(),
  // ... 其他仓储
);
```

### 步骤 4：数据库脚本更新

数据库相关的脚本现在应该指向 infrastructure-server：

```json
{
  "scripts": {
    "prisma": "pnpm --filter=@dailyuse/infrastructure-server prisma",
    "prisma:migrate": "pnpm --filter=@dailyuse/infrastructure-server prisma:migrate",
    "prisma:studio": "pnpm --filter=@dailyuse/infrastructure-server prisma:studio",
    "db:push": "pnpm --filter=@dailyuse/infrastructure-server db:push",
    "db:seed": "pnpm --filter=@dailyuse/infrastructure-server db:seed"
  }
}
```

✅ **这已经在 `apps/api/package.json` 中配置好了**

## 可选的长期改进

### 使用依赖注入容器

如果计划进一步改进，可以考虑：

```typescript
// containers.ts - 集中管理所有容器
export const appContainers = {
  goal: GoalContainer.getInstance(),
  task: TaskContainer.getInstance(),
  schedule: ScheduleContainer.getInstance(),
  account: AccountContainer.getInstance(),
  // ...
};

// 在应用中使用
export function useGoalRepository() {
  return appContainers.goal.getGoalRepository();
}

// 然后在代码中
const goalRepo = useGoalRepository();
```

### 环境变量驱动的数据源选择

```typescript
// apps/api/src/env.ts
export const DATA_SOURCE = process.env.DATA_SOURCE || 'prisma';

// apps/api/src/index.ts
import { DATA_SOURCE } from './env';
import { initializeWithConfig } from '@dailyuse/infrastructure-server/bootstrap';

async function initializeInfrastructure() {
  if (DATA_SOURCE === 'prisma') {
    await initializePrismaDataSource();
  } else if (DATA_SOURCE === 'sqlite') {
    // 可选：支持混合模式
    const Database = require('better-sqlite3');
    const db = new Database('./app.db');
    await initializeSQLiteDataSource(db);
  }
}
```

## ✅ 检查清单

在完成迁移前，确保：

- [ ] `apps/api/package.json` 中删除了 `@prisma/client` 和 `prisma` 依赖
- [ ] `apps/api/prisma/` 目录已删除
- [ ] `apps/api/src/index.ts` 在启动时调用 `initializePrismaDataSource()`
- [ ] 所有新代码使用 `*Container.getInstance().get*Repository()` 而不是直接 `new`
- [ ] `pnpm install` 成功运行（删除了不需要的依赖）
- [ ] `pnpm nx build api` 编译成功
- [ ] `pnpm nx serve api` 能够启动

## 可能的问题和解决方案

### 问题 1：找不到 DataSourceManager
```
Error: Cannot find module '@dailyuse/infrastructure-server/bootstrap'
```
**解决**：确保 `pnpm install` 已运行，并且 `infrastructure-server` 的 `package.json` 导出了 `bootstrap`。

### 问题 2：容器返回 undefined
```
Error: getGoalRepository() returned undefined
```
**解决**：确保在使用容器前已调用 `initializePrismaDataSource()`。

### 问题 3：Prisma 连接错误
```
Error: Can't reach database server at localhost:5432
```
**解决**：
1. 检查 `.env` 文件中的 `DATABASE_URL`
2. 确保 PostgreSQL 服务正在运行
3. 运行 `pnpm nx --filter=@dailyuse/infrastructure-server prisma:push` 同步模式

## 后续优化

一旦基础迁移完成，可以考虑：

1. **为所有模块补充 DI 容器** - 已提供模板，按模块复制即可
2. **迁移到专业 DI 框架** - 如 tsyringe 或 inversify
3. **添加配置管理** - 支持环境变量驱动的数据源选择
4. **性能优化** - 连接池、缓存策略等

## 需要帮助？

如有问题，参考：
- [INFRASTRUCTURE_REFACTOR_COMPLETE.md](./INFRASTRUCTURE_REFACTOR_COMPLETE.md) - 完整重构文档
- `packages/infrastructure-server/src/bootstrap.ts` - 初始化接口
- `packages/infrastructure-server/src/shared/config/data-source-manager.ts` - 数据源管理
- `packages/infrastructure-server/src/{module}/di/` - DI 容器示例

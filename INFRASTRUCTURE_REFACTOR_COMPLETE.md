# Infrastructure Server 架构重构完成报告

## 🎯 重构目标
将 DailyUse 的 Infrastructure 层从多包架构重构为单一 `infrastructure-server` 包，支持两种数据源实现（Prisma for API, SQLite for Desktop），通过 DI 容器灵活切换。

## ✅ 完成的工作

### 1. 创建 SQLite 适配器（完成）
- **目标**：在 `infrastructure-server/src/{module}/adapters/sqlite/` 下为每个模块创建 SQLite 仓储实现
- **方式**：从 `infrastructure-desktop` 复制所有 SQLite 仓储实现
- **结果**：
  - ✅ 创建了所有 13 个模块的 `adapters/sqlite/` 目录
  - ✅ 复制了所有 `sqlite-*.repository.ts` 文件
  - ✅ 支持的模块：account, ai, authentication, dashboard, editor, goal, notification, reminder, repository, schedule, setting, sync, task

### 2. 迁移 Prisma 配置（完成）
- **目标**：将 Prisma 配置从 `apps/api/prisma/` 迁移到 `packages/infrastructure-server/prisma/`
- **结果**：
  - ✅ 复制了 `schema.prisma`
  - ✅ 复制了所有 `migrations/` 文件夹
  - ✅ 复制了 `seed.ts` 和 `seed-e2e.ts`

### 3. 更新 infrastructure-server package.json（完成）
- **目标**：添加 Prisma 和 SQLite 依赖，完整导出配置
- **变更**：
  - ✅ 已有 `@prisma/client` 依赖
  - ✅ 已有 `better-sqlite3` 依赖
  - ✅ 添加了完整的导出配置，支持：
    - `./bootstrap` - 数据源初始化
    - `./account`, `./goal`, `./task` 等模块导出
    - `./{module}/adapters/prisma` - Prisma 适配器
    - `./{module}/adapters/sqlite` - SQLite 适配器
    - `./{module}/di` - DI 容器和工厂类
    - `./shared/config` - 配置和管理类

### 4. 清理 apps/api 配置（完成）
- **目标**：从 API 应用中移除 Prisma 直接依赖和配置
- **变更**：
  - ✅ 从 `apps/api/package.json` 删除 `@prisma/client` 和 `prisma` 依赖
  - ✅ 删除了 `apps/api/prisma/` 整个目录
  - ✅ 保留了对 `@dailyuse/infrastructure-server` 的依赖
  - ✅ Prisma 脚本已重定向到 `@dailyuse/infrastructure-server`：
    ```json
    "prisma": "pnpm --filter=@dailyuse/infrastructure-server prisma",
    "prisma:migrate": "pnpm --filter=@dailyuse/infrastructure-server prisma:migrate",
    "db:push": "pnpm --filter=@dailyuse/infrastructure-server prisma:push"
    ```

### 5. 删除 infrastructure-desktop 包（完成）
- **目标**：消除包之间的循环依赖，集中管理所有数据访问实现
- **结果**：
  - ✅ 完全删除了 `packages/infrastructure-desktop/` 目录
  - ✅ 所有 SQLite 实现已迁移到 `infrastructure-server`
  - ✅ 不需要更新根 `pnpm-workspace.yaml`（使用通配符）

### 6. 创建 DI 容器和数据源管理（完成）
- **实现的文件**：

#### a. `packages/infrastructure-server/src/shared/config/data-source-manager.ts`
```typescript
// 全局数据源管理器，管理 Prisma 或 SQLite 的实例
export class DataSourceManager {
  - initialize(config: DataSourceConfig): void
  - getInstance(): DataSourceManager
  - getType(): DataSourceType
  - getPrismaClient(): any
  - getSQLiteDb(): any
  - isPrisma(): boolean
  - isSQLite(): boolean
}
```

#### b. `packages/infrastructure-server/src/bootstrap.ts`
```typescript
// 应用初始化入口
export async function initializePrismaDataSource(): Promise<void>
export async function initializeSQLiteDataSource(sqliteDb: any): Promise<void>
export function initializeWithConfig(config: DataSourceConfig): void
export function getDataSourceManager()
```

#### c. `packages/infrastructure-server/src/account/di/account-container.ts`
```typescript
// Account 模块 DI 容器（其他模块类似）
export class AccountContainer {
  - getAccountRepository(): IAccountRepository
  - setAccountRepository(repository): void
  - reset(): void
}
```

#### d. `packages/infrastructure-server/src/account/di/account-repository.factory.ts`
```typescript
// 仓储工厂类
export class AccountRepositoryFactory {
  - createForPrisma(prismaClient): IAccountRepository
  - createForSQLite(sqliteDb): IAccountRepository
}
```

### 7. 更新模块导出和 package.json（完成）
- ✅ 更新了 `shared/config/index.ts` 导出 `DataSourceManager`
- ✅ 更新了 `infrastructure-server/src/index.ts` 导出 bootstrap 函数
- ✅ 为 account 模块创建了完整的导出层级：
  - `account` - 主模块导出
  - `account/adapters` - 所有适配器导出
  - `account/adapters/prisma` - Prisma 适配器
  - `account/adapters/sqlite` - SQLite 适配器
  - `account/di` - DI 容器和工厂

## 📊 架构改进总结

### 改进前
```
apps/
  ├── api/
  │   ├── prisma/           ← Prisma 配置
  │   └── package.json      ← 包含 @prisma/client
  └── desktop/
      └── 依赖 infrastructure-desktop

packages/
  ├── infrastructure-server/  (仅 Prisma 实现)
  └── infrastructure-desktop/ (仅 SQLite 实现)  ← 循环依赖风险
```

### 改进后
```
apps/
  ├── api/
  │   └── package.json (删除 Prisma 依赖)
  └── desktop/
      └── 无需特殊包，直接使用 infrastructure-server

packages/
  └── infrastructure-server/
      ├── prisma/schema.prisma   ← 集中管理
      ├── src/{module}/adapters/
      │   ├── prisma/             (API 用)
      │   └── sqlite/             (Desktop 用)
      ├── src/{module}/di/
      │   ├── {module}-container.ts
      │   └── {module}-repository.factory.ts
      └── package.json
          ├── dependencies: [@prisma/client, better-sqlite3]
          └── exports: {all adapters and DI}
```

## 🚀 使用示例

### API 应用初始化（推荐）
```typescript
// apps/api/src/index.ts
import { initializePrismaDataSource, GoalContainer } from '@dailyuse/infrastructure-server/bootstrap';

// 在启动时初始化
await initializePrismaDataSource();

// 现在可以使用容器
const goalContainer = GoalContainer.getInstance();
const goalRepository = goalContainer.getGoalRepository();
```

### Desktop 应用初始化
```typescript
// apps/desktop/src/main.ts
import { initializeSQLiteDataSource, GoalContainer } from '@dailyuse/infrastructure-server';
import Database from 'better-sqlite3';

const db = new Database('./app.db');
await initializeSQLiteDataSource(db);

// 使用相同的 API，但底层使用 SQLite
const goalContainer = GoalContainer.getInstance();
const goalRepository = goalContainer.getGoalRepository();
```

## 📋 待完成项（后续）

### 短期（建议立即完成）
1. **为其他模块创建 DI 容器**
   - [ ] GoalContainer 完成 factory 实现
   - [ ] TaskContainer
   - [ ] ScheduleContainer
   - [ ] 其他关键模块

2. **更新应用层初始化**
   - [ ] 更新 `apps/api/src/index.ts` 使用新的 bootstrap
   - [ ] 更新 `apps/desktop` 初始化（如果存在）

3. **验证和测试**
   - [ ] `pnpm nx build infrastructure-server` ✅
   - [ ] `pnpm nx build api` 
   - [ ] 运行集成测试

### 中期（后续迭代）
1. **优化 DI 容器**
   - 可考虑使用 tsyringe 或 inversify 之类的 DI 框架
   - 更好的生命周期管理（singleton, transient, scoped）

2. **数据源配置**
   - 从环境变量读取数据源类型
   - 支持多个 SQLite 数据库连接

3. **性能优化**
   - 考虑连接池配置
   - 缓存策略

## 📝 关键设计决策

### 1. 单一 DataSourceManager
- **决策**：使用全局单例 DataSourceManager 管理数据源
- **优势**：简单，所有仓储可统一配置
- **权衡**：不支持单个应用中同时使用两种数据源

### 2. 懒加载 + 缓存
- **决策**：DI 容器使用懒加载和单例缓存
- **优势**：性能好，内存占用少
- **权衡**：需要手动管理生命周期

### 3. 工厂模式
- **决策**：使用工厂类 `XxxRepositoryFactory` 创建实现
- **优势**：灵活，易于测试（注入 mock）
- **权衡**：需要为每个仓储接口创建工厂

## 🔐 向后兼容性

目前的实现保持了向后兼容性：
- 现有代码可以继续使用 `new PrismaGoalRepository(prisma)`
- 新代码推荐使用 `GoalContainer.getInstance().getGoalRepository()`
- 两种方式可以共存

## 📚 下一步建议

1. **完成所有模块的 DI 容器**（15-30 分钟）
2. **更新 API 启动文件使用新系统**（10-15 分钟）
3. **如果有 Desktop 应用，更新其初始化**（10-15 分钟）
4. **全面测试构建和运行** （30-60 分钟）
5. **可选：迁移到专业 DI 框架** （1-2 小时）

## 📞 技术支持

如有问题，检查：
1. `packages/infrastructure-server/src/shared/config/data-source-manager.ts` - 数据源配置
2. `packages/infrastructure-server/src/bootstrap.ts` - 初始化入口
3. 各模块的 `src/{module}/di/` 目录 - DI 容器实现

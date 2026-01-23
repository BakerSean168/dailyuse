# 🚀 Infrastructure 重构 - 快速参考

## 5 分钟速览

### 问题
- ❌ Prisma 配置散落在 `apps/api/`
- ❌ SQLite 实现在独立的 `infrastructure-desktop` 包
- ❌ 循环依赖风险
- ❌ 重复的仓储接口定义

### 解决方案
```
✅ 统一到 @dailyuse/infrastructure-server
✅ 支持两种数据源（Prisma + SQLite）
✅ DI 容器灵活切换实现
✅ 删除 infrastructure-desktop 包
```

---

## API 应用：5 行代码启动

```typescript
import { initializePrismaDataSource, GoalContainer } from '@dailyuse/infrastructure-server/bootstrap';

// 启动时
await initializePrismaDataSource();

// 使用仓储
const repo = GoalContainer.getInstance().getGoalRepository();
```

---

## Desktop 应用：5 行代码启动

```typescript
import { initializeSQLiteDataSource, GoalContainer } from '@dailyuse/infrastructure-server';
import Database from 'better-sqlite3';

// 启动时
const db = new Database('./app.db');
await initializeSQLiteDataSource(db);

// 使用仓储（完全相同）
const repo = GoalContainer.getInstance().getGoalRepository();
```

---

## 关键文件

| 文件 | 用途 | 位置 |
|-----|------|------|
| DataSourceManager | 管理数据源 | `src/shared/config/data-source-manager.ts` |
| bootstrap.ts | 初始化入口 | `src/bootstrap.ts` |
| *-container.ts | DI 容器 | `src/{module}/di/` |
| *-factory.ts | 仓储工厂 | `src/{module}/di/` |
| schema.prisma | 数据库定义 | `prisma/schema.prisma` |

---

## 包结构

### infrastructure-server
```
src/
├── bootstrap.ts                 ← 应用初始化
├── shared/config/
│   ├── data-source-manager.ts   ← 数据源管理
│   └── ...
├── account/adapters/
│   ├── prisma/                  (API 用)
│   ├── sqlite/                  (Desktop 用)
│   └── index.ts
├── account/di/
│   ├── account-container.ts     (DI 容器)
│   ├── account-repository.factory.ts  (工厂)
│   └── index.ts
└── ... (其他 13 个模块)

prisma/
├── schema.prisma                ← 统一配置
├── migrations/
└── seed.ts
```

---

## 三大核心概念

### 1️⃣ DataSourceManager
```typescript
DataSourceManager.initialize({ type: 'prisma', prismaClient });
// 或
DataSourceManager.initialize({ type: 'sqlite', sqliteDb });

const manager = DataSourceManager.getInstance();
manager.isPrisma();  // true or false
manager.getPrismaClient();  // 如果是 Prisma
manager.getSQLiteDb();  // 如果是 SQLite
```

### 2️⃣ 仓储容器
```typescript
const container = GoalContainer.getInstance();
const repo = container.getGoalRepository();
// 自动返回正确的实现（Prisma 或 SQLite）
```

### 3️⃣ 仓储工厂
```typescript
GoalRepositoryFactory.createForPrisma(prismaClient);
GoalRepositoryFactory.createForSQLite(sqliteDb);
```

---

## 依赖关系

### API 应用
```
apps/api/
  ├── depends on → @dailyuse/infrastructure-server
  │                   └── uses → Prisma adapters
  └── depends on → @dailyuse/application-server
```

### Desktop 应用
```
apps/desktop/
  ├── depends on → @dailyuse/infrastructure-server
  │                   └── uses → SQLite adapters
  └── depends on → @dailyuse/application-server
```

✅ **无循环依赖** - infrastructure-desktop 包已删除

---

## 实现清单

- [x] SQLite 适配器迁移到 infrastructure-server
- [x] Prisma 配置集中到 infrastructure-server
- [x] DataSourceManager 实现
- [x] Bootstrap 初始化系统
- [x] Account 和 Goal 容器完成
- [ ] 补充其他 11 个模块的容器（可选，已提供模板）
- [ ] 更新应用层初始化代码
- [ ] 完整测试验证

---

## 常见命令

```bash
# 工作目录
cd d:\home\projects\dailyuse

# 安装依赖
pnpm install

# 构建 infrastructure-server
pnpm nx build infrastructure-server

# 构建 API
pnpm nx build api

# 运行 API
pnpm nx serve api

# Prisma 操作（自动指向 infrastructure-server）
pnpm nx --filter=@dailyuse/infrastructure-server prisma:migrate
pnpm nx --filter=@dailyuse/infrastructure-server prisma:studio
```

---

## 故障排除

### 问题：找不到 bootstrap 模块
```
Error: Cannot find module '@dailyuse/infrastructure-server/bootstrap'
```
**解决**：
1. 确保 `pnpm install` 完成
2. 检查 `infrastructure-server/package.json` 的 `exports` 配置

### 问题：DataSourceManager 未初始化
```
Error: DataSourceManager not initialized
```
**解决**：
1. 在其他代码之前调用 `initializePrismaDataSource()` 或 `initializeSQLiteDataSource()`
2. 检查顺序是否正确

### 问题：仓储返回错误的实现
**解决**：
1. 验证是否正确初始化了数据源
2. 检查容器是否获取了正确的 DataSourceManager

---

## 模板 - 新模块的 DI 容器

```typescript
// src/{module}/di/{module}-container.ts
import type { I{Module}Repository } from '@dailyuse/domain-server/{module}';
import { DataSourceManager } from '../../shared/config/data-source-manager';
import { {Module}RepositoryFactory } from './{module}-repository.factory';
import { prisma } from '../../shared/config/prisma';

export class {Module}Container {
  private static instance: {Module}Container;
  private {moduleRepo}?: I{Module}Repository;

  private constructor() {}

  static getInstance(): {Module}Container {
    if (!{Module}Container.instance) {
      {Module}Container.instance = new {Module}Container();
    }
    return {Module}Container.instance;
  }

  get{Module}Repository(): I{Module}Repository {
    if (!this.{moduleRepo}) {
      const dsManager = DataSourceManager.getInstance();
      this.{moduleRepo} = dsManager.isPrisma()
        ? {Module}RepositoryFactory.createForPrisma(prisma)
        : {Module}RepositoryFactory.createForSQLite(dsManager.getSQLiteDb());
    }
    return this.{moduleRepo};
  }

  reset(): void {
    this.{moduleRepo} = undefined;
  }
}
```

---

## 文档导航

| 需求 | 文档 |
|-----|------|
| 完整技术细节 | [INFRASTRUCTURE_REFACTOR_COMPLETE.md](./INFRASTRUCTURE_REFACTOR_COMPLETE.md) |
| API 应用迁移 | [API_MIGRATION_GUIDE.md](./API_MIGRATION_GUIDE.md) |
| Desktop 应用迁移 | [DESKTOP_MIGRATION_GUIDE.md](./DESKTOP_MIGRATION_GUIDE.md) |
| 项目总结 | [INFRASTRUCTURE_REFACTOR_SUMMARY.md](./INFRASTRUCTURE_REFACTOR_SUMMARY.md) |

---

## 键盘快捷键参考

```bash
# 快速构建检查
pnpm nx build infrastructure-server && pnpm nx build api

# 清理和重新安装
pnpm install && pnpm nx reset

# 验证数据库连接
pnpm nx --filter=@dailyuse/infrastructure-server prisma:validate
```

---

**状态**：✅ 完成 | **难度**：🟢 简单 | **时间**：⏱️ 5 分钟阅读

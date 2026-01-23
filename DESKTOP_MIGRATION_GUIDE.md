# Desktop 应用迁移指南

## 概述

经过 Infrastructure 层重构，Desktop 应用现在可以直接使用 `@dailyuse/infrastructure-server` 包中的 SQLite 适配器，无需独立的 `infrastructure-desktop` 包。

## 架构变更

### 之前
```
apps/desktop/
  ├── 依赖 → @dailyuse/infrastructure-desktop (SQLite 仓储)
  └── 依赖 → @dailyuse/infrastructure-server (Prisma 仓储)

packages/
  ├── infrastructure-server/ (Prisma)
  └── infrastructure-desktop/ (SQLite) ← 可能存在循环依赖
```

### 之后
```
apps/desktop/
  └── 依赖 → @dailyuse/infrastructure-server (同时包含 Prisma 和 SQLite)

packages/
  └── infrastructure-server/ (Prisma + SQLite)
```

## 实现步骤

### 步骤 1：更新 Desktop 应用的依赖

#### package.json

```json
{
  "dependencies": {
    "@dailyuse/infrastructure-server": "workspace:*",
    "@dailyuse/application-server": "workspace:*",
    "@dailyuse/contracts": "workspace:*",
    "@dailyuse/domain-server": "workspace:*",
    "@dailyuse/utils": "workspace:*",
    "better-sqlite3": "^11.8.0",
    "electron": "latest",
    // ... 其他依赖
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    // ... 其他 dev 依赖
  }
}
```

⚠️ **删除** `@dailyuse/infrastructure-desktop` 依赖（如果存在）

### 步骤 2：初始化应用

#### 主进程入口 (Electron Main)

```typescript
// apps/desktop/src/main.ts (或类似的主进程文件)

import {
  initializeSQLiteDataSource,
  getDataSourceManager,
  GoalContainer,
  TaskContainer,
  AccountContainer,
  // ... 其他容器
} from '@dailyuse/infrastructure-server';
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// 获取应用数据目录
const APP_DATA_DIR = app.getPath('userData');
const DB_PATH = path.join(APP_DATA_DIR, 'dailyuse.db');

async function initializeApp() {
  try {
    // 1️⃣ 初始化 SQLite 数据库
    console.log('Initializing SQLite database...');
    const db = new Database(DB_PATH);
    
    // 2️⃣ 初始化 Infrastructure 层（使用 SQLite）
    await initializeSQLiteDataSource(db);
    console.log('Infrastructure layer initialized with SQLite');
    
    // 3️⃣ 应用启动逻辑...
    // ... 现有代码 ...
    
  } catch (error) {
    console.error('Initialization failed:', error);
    app.quit();
  }
}

app.on('ready', initializeApp);
```

### 步骤 3：使用仓储容器

#### 之前（不推荐）
```typescript
// ❌ 旧方式（从 infrastructure-desktop）
import { SqliteGoalRepository } from '@dailyuse/infrastructure-desktop';
import { sqliteDb } from './db-connection';

const goalRepo = new SqliteGoalRepository(sqliteDb);
```

#### 之后（推荐）
```typescript
// ✅ 新方式（使用容器）
import { GoalContainer } from '@dailyuse/infrastructure-server';

// 自动使用已初始化的 SQLite 数据源
const goalContainer = GoalContainer.getInstance();
const goalRepo = goalContainer.getGoalRepository();
const goalFolderRepo = goalContainer.getGoalFolderRepository();
```

### 步骤 4：渲染进程通信

如果使用 Electron IPC 在主进程和渲染进程之间通信：

```typescript
// apps/desktop/src/main.ts

import { ipcMain } from 'electron';

// 注册 IPC 处理器
ipcMain.handle('goal:list', async () => {
  const goalContainer = GoalContainer.getInstance();
  const goalRepo = goalContainer.getGoalRepository();
  return await goalRepo.findAll();
});

ipcMain.handle('goal:create', async (_, goalData) => {
  const goalContainer = GoalContainer.getInstance();
  const goalRepo = goalContainer.getGoalRepository();
  return await goalRepo.save(goalData);
});

// ... 其他 IPC 处理器
```

```typescript
// apps/desktop/src/preload.ts (预加载脚本)

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  goal: {
    list: () => ipcRenderer.invoke('goal:list'),
    create: (data: any) => ipcRenderer.invoke('goal:create', data),
    // ...
  },
  // ... 其他 API
});
```

```typescript
// apps/desktop/src/renderer/components/GoalList.tsx (渲染进程)

export function GoalList() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    window.api.goal.list().then(setGoals);
  }, []);

  // ...
}
```

## 可选的高级设置

### 自动迁移（从旧版本）

```typescript
// apps/desktop/src/db-migration.ts

import Database from 'better-sqlite3';
import { execSync } from 'child_process';

export async function migrateDatabase(dbPath: string) {
  const db = new Database(dbPath);
  
  // 运行 Prisma 迁移（基于 schema）
  // 注意：SQLite 不需要 Prisma，但模式定义相同
  
  // 执行初始化脚本
  const schema = db.prepare(`
    CREATE TABLE IF NOT EXISTS goal (
      id TEXT PRIMARY KEY,
      uuid TEXT UNIQUE NOT NULL,
      accountId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- ... 其他表的定义 ...
  `);
  
  schema.run();
  console.log('Database schema initialized');
}
```

### 数据库备份

```typescript
// apps/desktop/src/backup.ts

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function backupDatabase(srcPath: string, backupDir: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `dailyuse-${timestamp}.db`);
  
  fs.copyFileSync(srcPath, backupPath);
  console.log(`Database backed up to ${backupPath}`);
  
  return backupPath;
}
```

## 测试

### 单元测试

```typescript
// apps/desktop/src/__tests__/goal.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeSQLiteDataSource, GoalContainer } from '@dailyuse/infrastructure-server';
import Database from 'better-sqlite3';

describe('Goal Repository (SQLite)', () => {
  let db: Database.Database;
  let goalContainer: GoalContainer;

  beforeEach(() => {
    // 创建内存数据库用于测试
    db = new Database(':memory:');
    initializeSQLiteDataSource(db);
    goalContainer = GoalContainer.getInstance();
  });

  afterEach(() => {
    db.close();
    goalContainer.reset();
  });

  it('should create and retrieve goal', async () => {
    const goalRepo = goalContainer.getGoalRepository();
    
    const goal = {
      uuid: 'test-goal-1',
      accountId: 'test-account',
      title: 'Test Goal',
      status: 'ACTIVE'
    };
    
    await goalRepo.save(goal);
    const retrieved = await goalRepo.findByUuid(goal.uuid);
    
    expect(retrieved).toBeDefined();
    expect(retrieved.title).toBe('Test Goal');
  });
});
```

## ✅ 迁移检查清单

- [ ] 从 `package.json` 删除 `@dailyuse/infrastructure-desktop` 依赖
- [ ] 从 `package.json` 添加 `better-sqlite3` 依赖
- [ ] 更新主进程入口，调用 `initializeSQLiteDataSource(db)`
- [ ] 所有仓储使用通过容器获取，如 `GoalContainer.getInstance().getGoalRepository()`
- [ ] 数据库初始化脚本已正确配置
- [ ] 运行 `pnpm install` 成功
- [ ] `pnpm nx build desktop` 编译成功（如适用）
- [ ] 应用启动时 SQLite 数据库正确初始化
- [ ] 数据操作（CRUD）正常工作

## 常见问题

### Q: 能否同时使用 Prisma 和 SQLite？
**A**: 不建议。当前设计假设每个应用使用单一数据源。如果需要混合使用，需要自定义 DataSourceManager。

### Q: 旧的数据格式如何迁移？
**A**: SQLite 模式与 Prisma schema 一致。可以通过脚本读取旧数据库并导入新数据库，或使用 SQLite 工具进行迁移。

### Q: 性能如何？
**A**: SQLite 对于本地应用已足够好。对于大量数据，可以考虑：
- 添加索引
- 使用连接池
- 实现缓存层

### Q: 如何处理离线同步？
**A**: 使用 `@dailyuse/sync` 包中的同步逻辑，加上 `SyncRepository` 跟踪待同步的更改。

## 后续优化

1. **数据库迁移工具** - 从旧版本迁移数据
2. **备份和恢复** - 自动备份和恢复机制
3. **离线优先同步** - 改进离线数据同步
4. **加密存储** - 对敏感数据进行加密存储
5. **性能监控** - 添加数据库查询性能监控

## 参考

- [INFRASTRUCTURE_REFACTOR_COMPLETE.md](./INFRASTRUCTURE_REFACTOR_COMPLETE.md) - 完整重构文档
- `packages/infrastructure-server/src/bootstrap.ts` - 初始化 API
- `packages/infrastructure-server/src/{module}/adapters/sqlite/` - SQLite 实现
- [API 迁移指南](./API_MIGRATION_GUIDE.md) - API 应用迁移说明

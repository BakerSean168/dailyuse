# NX Monorepo 多数据库适配层架构指南

## 概述

这个文档详细说明了如何在 NX monorepo 中实现支持多数据库的基础设施层架构。该架构允许：

- **API 项目**使用 **Prisma**（PostgreSQL）
- **Desktop 项目**使用 **SQLite**
- **测试环境**使用 **内存数据库**
- 灵活扩展其他数据库（MySQL、MongoDB 等）

## 架构设计原则

### 1. **依赖倒置原则（DIP）**

所有仓储都基于接口定义，不依赖具体实现。

```
领域层（Domain Layer）
    ↓
仓储接口（Repository Interfaces）- 在 domain-server 中定义
    ↓
基础设施层（Infrastructure Layer）
    ├─ API 项目（Prisma 实现）
    └─ Desktop 项目（SQLite 实现）
```

### 2. **工厂模式**

使用 `DatabaseProviderFactory` 在运行时动态创建和初始化数据库提供者。

```
┌─────────────────────────────┐
│  DatabaseProviderFactory    │
│  - 注册提供者                  │
│  - 初始化容器                  │
│  - 管理生命周期                │
└─────────────────────────────┘
        │
        ├─→ Prisma Provider
        ├─→ SQLite Provider
        ├─→ Memory Provider
        └─→ Custom Providers
```

### 3. **策略模式**

每个数据库提供者实现 `IProviderInitializer` 接口，提供统一的初始化契约。

```typescript
interface IProviderInitializer {
  initialize(context: IProviderInitContext): Promise<void>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

## 目录结构

### infrastructure-server 包

```
packages/infrastructure-server/src/repository/
├── database-provider-factory.ts    ← 工厂类（核心）
├── di/
│   └── repository-container-v2.ts  ← 改进的容器
├── providers/
│   ├── prisma-provider.ts          ← Prisma 提供者实现
│   ├── sqlite-provider.ts          ← SQLite 提供者实现（可选）
│   └── memory-provider.ts          ← 测试用内存提供者
├── initialization/
│   ├── initialize-api.ts           ← API 初始化脚本
│   └── initialize-test.ts          ← 测试初始化脚本
├── adapters/
│   ├── prisma/                     ← Prisma 适配器
│   └── memory/                     ← 内存适配器
└── index.ts                        ← 导出所有公共 API
```

### infrastructure-desktop 包（新增）

```
packages/infrastructure-desktop/src/repository/
├── database.ts                     ← SQLite 数据库管理器
├── di/
│   └── desktop-repository-container.ts ← Desktop 容器
├── providers/
│   └── sqlite-provider.ts          ← SQLite 提供者实现
├── repositories/                   ← SQLite 仓储实现
│   ├── sqlite-repository.repository.ts
│   ├── sqlite-resource.repository.ts
│   ├── sqlite-folder.repository.ts
│   └── sqlite-repository-statistics.repository.ts
├── migrations/
│   └── init.sql                    ← 数据库初始化脚本
├── initialization/
│   └── initialize-desktop.ts       ← Desktop 初始化脚本
└── index.ts                        ← 导出所有公共 API
```

### domain-server 包（保持不变）

```
packages/domain-server/src/repository/
├── repositories/                   ← 仓储接口
│   ├── IRepositoryRepository.ts
│   ├── IResourceRepository.ts
│   ├── IFolderRepository.ts
│   └── IRepositoryStatisticsRepository.ts
├── aggregates/                     ← 聚合根
├── entities/                       ← 实体
├── value-objects/                  ← 值对象
└── services/                       ← 领域服务
```

## 初始化流程

### API 应用启动

```typescript
// 1. 导入初始化函数
import { initializeApiRepositories } from '@dailyuse/infrastructure-server/repository';

// 2. 在应用启动时调用
async function main() {
  const provider = await initializeApiRepositories();
  // 应用现在可以使用 Prisma 仓储
}

// 3. 优雅关闭
await cleanupApiRepositories(provider);
```

### Desktop 应用启动

```typescript
// 1. 导入初始化函数
import {
  initializeDesktopRepositories,
  DesktopRepositoryContainer,
} from '@dailyuse/infrastructure-desktop/repository';

// 2. 在应用启动时调用
async function main() {
  const { provider, desktopContainer } = await initializeDesktopRepositories(
    './app/database.db'
  );
  // 应用现在可以使用 SQLite 仓储
}

// 3. 优雅关闭
await cleanupDesktopRepositories(provider, desktopContainer);
```

## 使用示例

### 基本使用

```typescript
import { RepositoryContainer } from '@dailyuse/infrastructure-server/repository';

// 获取容器（自动初始化后）
const container = RepositoryContainer.getInstance();

// 获取仓储
const repositoryRepo = container.getRepositoryRepository();
const resourceRepo = container.getResourceRepository();

// 使用仓储（无论底层是 Prisma 还是 SQLite）
const repositories = await repositoryRepo.findByAccountUuid('account-123');
```

### 单元测试

```typescript
import {
  DatabaseProviderFactory,
  DatabaseProvider,
  RepositoryContainer,
} from '@dailyuse/infrastructure-server/repository';

beforeEach(async () => {
  // 使用内存提供者
  const factory = DatabaseProviderFactory.getInstance();
  const container = RepositoryContainer.getInstance();
  container.reset();

  await factory.initializeProvider(
    { provider: DatabaseProvider.MEMORY },
    container
  );
});

afterEach(async () => {
  RepositoryContainer.getInstance().reset();
});

it('should work with any provider', async () => {
  const container = RepositoryContainer.getInstance();
  const repo = container.getRepositoryRepository();
  // 测试逻辑...
});
```

## 扩展指南

### 添加新数据库提供者（如 MongoDB）

**步骤 1：实现提供者初始化器**

```typescript
import type { IProviderInitializer, IProviderInitContext } from '@dailyuse/infrastructure-server/repository';

export class MongoDbProviderInitializer implements IProviderInitializer {
  async initialize(context: IProviderInitContext): Promise<void> {
    const { config, container } = context;
    
    // 创建 MongoDB 仓储实现
    const mongoDb = new MongoClient(...);
    const repositoryRepo = new MongoDbRepositoryRepository(mongoDb);
    
    // 注册
    container.registerRepositoryRepository(repositoryRepo);
    // ... 其他仓储
  }

  async cleanup(): Promise<void> {
    // 清理资源
  }

  async healthCheck(): Promise<boolean> {
    // 检查连接
    return true;
  }
}
```

**步骤 2：注册提供者**

```typescript
import { DatabaseProviderFactory } from '@dailyuse/infrastructure-server/repository';

DatabaseProviderFactory.registerProvider('mongodb', MongoDbProviderInitializer);
```

**步骤 3：使用**

```typescript
const factory = DatabaseProviderFactory.getInstance();
const provider = await factory.initializeProvider(
  { provider: 'mongodb', mongoUri: '...' },
  container
);
```

## 关键设计决策

### 1. 为什么分离 API 和 Desktop 基础设施包？

- **职责分离**：每个包只包含与其环境相关的代码
- **依赖管理**：Desktop 不需要依赖 Prisma，API 不需要 better-sqlite3
- **灵活部署**：可以独立打包和部署
- **清晰的边界**：明确哪个包用于哪个应用

### 2. 为什么使用工厂模式？

- **运行时灵活性**：可以在启动时选择数据库
- **易于测试**：可以为不同测试场景注入不同提供者
- **可扩展性**：新提供者只需实现接口，无需修改现有代码
- **依赖反转**：应用代码不依赖具体提供者

### 3. 为什么 RepositoryContainer 是单例？

- **全局访问**：应用任何地方都能访问仓储
- **唯一状态**：确保只有一套仓储实现在使用
- **易于测试**：可以重置状态

### 4. 为什么使用接口而不是抽象类？

- **多重继承**：TypeScript 接口支持多重继承
- **轻量级**：接口只定义契约，不包含实现
- **灵活性**：易于组合和扩展

## 常见问题

### Q1: 如何在 API 和 Desktop 之间共享业务逻辑？

A: 将业务逻辑放在 `application-server` 或 `domain-server`，而不是基础设施层。仓储接口保证了兼容性。

```typescript
// domain-server 中的业务逻辑
export class RepositoryService {
  constructor(private repositoryRepo: IRepositoryRepository) {}
  
  // 这个方法在 API 和 Desktop 中都能使用
  async createRepository(params: CreateRepositoryInput): Promise<void> {
    const repository = Repository.create(params);
    await this.repositoryRepo.save(repository);
  }
}
```

### Q2: 如何处理数据库迁移？

A: 
- **Prisma**：使用 `prisma migrate`
- **SQLite**：在 `SqliteDatabase.initialize()` 中运行 SQL 脚本
- **自定义**：在提供者初始化器中执行迁移

### Q3: 如何在不同环境中切换数据库？

A: 使用环境变量或配置文件：

```typescript
const provider = process.env.DB_PROVIDER || 'prisma';
const config = { provider };

const factory = DatabaseProviderFactory.getInstance();
await factory.initializeProvider(config, container);
```

### Q4: 性能考量？

- **内存提供者**：最快，仅用于测试
- **SQLite**：轻量级本地存储，适合 Desktop
- **Prisma**：企业级 ORM，适合服务器
- **选择标准**：根据应用场景和性能要求选择

## 最佳实践

1. **始终通过容器访问仓储**，不要直接创建实例
2. **在应用启动时初始化提供者**，不要延迟初始化
3. **在应用关闭时清理资源**，确保数据不丢失
4. **为每个新仓储实现所有接口方法**
5. **编写测试时使用内存提供者**
6. **定期检查健康状态**

## 总结

这个架构提供了：

✅ **灵活性**：支持多个数据库
✅ **可维护性**：清晰的职责分离
✅ **可测试性**：易于注入测试提供者
✅ **可扩展性**：支持自定义提供者
✅ **类型安全**：完整的 TypeScript 支持

无论你的应用在 API、Desktop 还是其他环境运行，都可以使用相同的业务逻辑和仓储接口。

---
tags:
  - adr
  - architecture
  - decision
  - electron
  - desktop
  - local-first
  - package-extraction
description: ADR-004 - Electron 桌面应用架构与包提取策略
created: 2025-12-03
updated: 2025-12-03
---

# ADR-004: Electron 桌面应用架构与包提取策略

**状态**: ✅ 已采纳  
**日期**: 2025-12-03  
**决策者**: @BakerSean168  

## 背景

DailyUse 目前是一个 Web 应用，后端运行在远程服务器上。为了提供更好的用户体验，我们计划扩展到 Electron 桌面应用，实现：

1. **离线优先 (Local-First)** - 无网络时仍可完整使用
2. **本地数据存储** - 数据存储在用户本地，隐私性更好
3. **本地计算** - 业务逻辑在本地执行，响应更快
4. **跨平台** - 支持 Windows、macOS、Linux

### 核心挑战

1. 如何最大程度复用现有代码？
2. 如何在 Web 和 Desktop 之间共享业务逻辑？
3. 如何设计灵活的基础设施层以支持不同运行环境？
4. 如何处理 UI 框架变更（Vue → React + shadcn）？
5. 如何实现数据同步？

### 可选方案

1. **方案 A**: 简单复用 - 直接将 Web 代码打包到 Electron，使用远程 API
2. **方案 B**: 完全重写 - 为 Desktop 单独开发全新代码
3. **方案 C**: 分层提取 - 提取核心包，Desktop 主进程运行服务端逻辑，渲染进程使用新 UI

## 决策

选择 **方案 C: 分层提取 + Local-First 架构**

## 理由

### 为什么选择方案 C？

✅ **最大化代码复用**
- Domain 层 100% 复用
- Application 层 100% 复用
- Infrastructure 层通过 Ports & Adapters 模式适配

✅ **真正的离线优先**
- 主进程运行完整业务逻辑
- 本地 SQLite 存储
- 无需依赖远程服务器

✅ **架构一致性**
- Web 和 Desktop 共享相同的 DDD 架构
- 业务逻辑变更只需修改一处
- 统一的测试策略

✅ **UI 现代化机会**
- React + shadcn 提供更灵活的组件系统
- Tailwind CSS 完整支持
- 活跃的社区和 blocks 生态

### 为什么不选其他方案？

❌ **方案 A (简单复用)**
- 仍依赖网络，无法真正离线
- 没有发挥 Electron 的本地能力
- 性能与 Web 版无差异

❌ **方案 B (完全重写)**
- 重复工作量巨大
- 维护两套业务逻辑
- 容易产生不一致

## 实施

### 命名规范重构

#### 现有代码 → 新结构映射

| 现有位置 | 新位置 | 说明 |
|----------|--------|------|
| `apps/web/src/modules/goal/application/GoalApplicationService.ts` | `packages/app-client/src/goal/use-cases/` | 拆分为多个 Use Case |
| `apps/api/src/modules/goal/application/GoalApplicationService.ts` | `packages/app-server/src/goal/use-cases/` | 拆分为多个 Use Case |
| `apps/web/src/modules/goal/infrastructure/api/GoalApiClient.ts` | `packages/infra/src/adapters/http/goal.http.ts` | HTTP 适配器 |
| `apps/api/src/modules/goal/infrastructure/repositories/GoalRepository.ts` | `packages/infra/src/adapters/prisma/goal.prisma.ts` | Prisma 适配器 |

#### Application Service → Use Case 拆分示例

```typescript
// 之前: GoalApplicationService.ts (一个大类包含所有方法)
class GoalApplicationService {
  createGoal(dto) { ... }
  updateGoal(uuid, dto) { ... }
  deleteGoal(uuid) { ... }
  listGoals(params) { ... }
  getGoal(uuid) { ... }
  calculateProgress(uuid) { ... }
}

// 之后: 每个操作一个独立的 Use Case 类
packages/app-server/src/goal/
├── use-cases/
│   ├── create-goal.ts      → class CreateGoal { execute(dto) }
│   ├── update-goal.ts      → class UpdateGoal { execute(uuid, dto) }
│   ├── delete-goal.ts      → class DeleteGoal { execute(uuid) }
│   ├── list-goals.ts       → class ListGoals { execute(params) }
│   ├── get-goal.ts         → class GetGoal { execute(uuid) }
│   ├── calculate-progress.ts → class CalculateProgress { execute(uuid) }
│   └── index.ts            → export all
├── event-handlers/
│   ├── on-key-result-updated.ts
│   └── index.ts
├── mappers/
│   └── goal-mapper.ts
└── index.ts
```

### 包结构设计

#### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 包名 | kebab-case | `app-client`, `infra` |
| 文件夹 | kebab-case | `goal/`, `use-cases/` |
| 文件名 | kebab-case | `create-goal.ts`, `repository.ts` |
| 类/接口 | PascalCase | `CreateGoal`, `IRepository` |
| 函数/变量 | camelCase | `createGoal`, `goalRepository` |

#### 包结构

```
packages/
├── contracts/              ← 已存在 ✅ API 契约/DTO
├── utils/                  ← 已存在 ✅ 通用工具
│
├── domain-client/          ← 已存在 ✅ 客户端领域
├── domain-server/          ← 已存在 ✅ 服务端领域
│
├── app-client/             ← 🆕 提取 (原 application-client)
│   ├── src/
│   │   ├── goal/
│   │   │   ├── use-cases/          ← Use Case 拆分
│   │   │   │   ├── list-goals.ts
│   │   │   │   ├── get-goal.ts
│   │   │   │   ├── create-goal.ts
│   │   │   │   ├── update-goal.ts
│   │   │   │   ├── delete-goal.ts
│   │   │   │   └── index.ts
│   │   │   ├── event-handlers/     ← 事件处理器
│   │   │   │   ├── on-goal-completed.ts
│   │   │   │   └── index.ts
│   │   │   ├── mappers/            ← DTO 映射
│   │   │   │   └── goal-mapper.ts
│   │   │   └── index.ts
│   │   ├── task/
│   │   │   ├── use-cases/
│   │   │   ├── event-handlers/
│   │   │   └── ...
│   │   ├── document/
│   │   │   └── ...
│   │   └── index.ts
│   └── package.json
│
├── app-server/             ← 🆕 提取 (原 application-server)
│   ├── src/
│   │   ├── goal/
│   │   │   ├── use-cases/
│   │   │   │   ├── list-goals.ts
│   │   │   │   ├── get-goal.ts
│   │   │   │   ├── create-goal.ts
│   │   │   │   ├── update-goal.ts
│   │   │   │   ├── delete-goal.ts
│   │   │   │   ├── calculate-progress.ts
│   │   │   │   └── index.ts
│   │   │   ├── event-handlers/
│   │   │   │   ├── on-key-result-updated.ts
│   │   │   │   └── index.ts
│   │   │   ├── mappers/
│   │   │   │   └── goal-mapper.ts
│   │   │   └── index.ts
│   │   ├── task/
│   │   │   └── ...
│   │   └── index.ts
│   └── package.json
│
├── infra/                  ← 🆕 Ports & Adapters (原 infrastructure)
│   ├── src/
│   │   ├── ports/              ← 接口定义
│   │   │   ├── repositories/
│   │   │   │   ├── goal.repository.ts      ← IGoalRepository
│   │   │   │   ├── task.repository.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── ai.service.ts           ← IAIService
│   │   │   │   ├── sync.service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── adapters/           ← 多环境实现
│   │   │   ├── http/           ← Web 客户端用
│   │   │   │   ├── goal.http.ts
│   │   │   │   ├── task.http.ts
│   │   │   │   └── index.ts
│   │   │   ├── prisma/         ← API + Desktop 共用 (PostgreSQL/SQLite)
│   │   │   │   ├── goal.prisma.ts
│   │   │   │   ├── task.prisma.ts
│   │   │   │   ├── client.ts   ← PrismaClient 工厂
│   │   │   │   └── index.ts
│   │   │   ├── memory/         ← 测试用
│   │   │   │   ├── goal.memory.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   └── package.json
│
├── ui/                     ← 扩展 ✅
│   ├── src/
│   │   ├── tokens/
│   │   │   ├── v1/             ← 当前 Vuetify 风格提取
│   │   │   │   ├── colors.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   ├── typography.ts
│   │   │   │   └── shadows.ts
│   │   │   ├── v2/             ← 未来 shadcn 风格
│   │   │   │   └── ...
│   │   │   └── index.ts        ← 版本切换导出
│   │   │
│   │   └── primitives/         ← 框架无关类型定义
│   │       ├── button.types.ts
│   │       ├── input.types.ts
│   │       └── ...
│   └── package.json
│
└── sync/                   ← 🆕 数据同步核心逻辑
    ├── src/
    │   ├── strategies/
    │   │   ├── realtime.ts     ← 实时同步
    │   │   ├── manual.ts       ← 手动同步
    │   │   └── disabled.ts     ← 关闭同步
    │   ├── conflict-resolver.ts
    │   ├── sync-engine.ts
    │   └── index.ts
    └── package.json
```

#### Use Case 模式说明

每个 Use Case 是一个独立的类，负责单一的业务操作：

```typescript
// packages/app-server/src/goal/use-cases/create-goal.ts
import { Goal } from '@dailyuse/domain-server';
import { IGoalRepository } from '@dailyuse/infra/ports';
import { CreateGoalDTO, GoalDTO } from '@dailyuse/contracts';
import { GoalMapper } from '../mappers/goal-mapper';

export class CreateGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(dto: CreateGoalDTO): Promise<GoalDTO> {
    // 1. 创建领域对象
    const goal = Goal.create({
      title: dto.title,
      deadline: new Date(dto.deadline),
      description: dto.description,
    });

    // 2. 持久化
    await this.goalRepository.save(goal);

    // 3. 返回 DTO
    return GoalMapper.toDTO(goal);
  }
}

// packages/app-server/src/goal/use-cases/index.ts
export * from './create-goal';
export * from './update-goal';
export * from './delete-goal';
export * from './get-goal';
export * from './list-goals';
export * from './calculate-progress';
```

### Desktop 应用架构

```
apps/desktop/
├── main/                       ← Electron 主进程
│   ├── src/
│   │   ├── index.ts            ← 主进程入口
│   │   ├── ipc/                ← IPC 处理器
│   │   │   ├── goal.ipc.ts
│   │   │   ├── task.ipc.ts
│   │   │   └── index.ts
│   │   ├── services/           ← 本地服务
│   │   │   ├── database.ts     ← SQLite 初始化
│   │   │   ├── sync.ts         ← 同步服务
│   │   │   └── ai-proxy.ts     ← AI 服务代理
│   │   └── bootstrap.ts        ← 依赖注入配置
│   │
│   └── 复用:
│       ├── @dailyuse/domain-server
│       ├── @dailyuse/app-server
│       └── @dailyuse/infra (sqlite adapter)
│
├── renderer/                   ← Electron 渲染进程
│   ├── src/
│   │   ├── main.tsx            ← React 入口
│   │   ├── app.tsx
│   │   ├── presentation/       ← React + shadcn 组件
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── layouts/
│   │   ├── hooks/              ← React hooks (类似 composables)
│   │   │   ├── use-goal.ts
│   │   │   ├── use-task.ts
│   │   │   └── index.ts
│   │   └── ipc/                ← IPC 客户端
│   │       └── ipc-client.ts
│   │
│   └── 复用:
│       ├── @dailyuse/domain-client
│       ├── @dailyuse/contracts
│       └── @dailyuse/ui (tokens/v1)
│
├── electron-builder.json5
├── package.json
└── project.json
```

### 进程间通信 (IPC)

```typescript
// apps/desktop/main/src/ipc/goal.ipc.ts
import { ipcMain } from 'electron';
import { ListGoals, CreateGoal, UpdateGoal, DeleteGoal } from '@dailyuse/app-server/goal';

export function registerGoalIpcHandlers(useCases: {
  listGoals: ListGoals;
  createGoal: CreateGoal;
  updateGoal: UpdateGoal;
  deleteGoal: DeleteGoal;
}) {
  ipcMain.handle('goal:list', async (_, params) => {
    return useCases.listGoals.execute(params);
  });

  ipcMain.handle('goal:create', async (_, dto) => {
    return useCases.createGoal.execute(dto);
  });

  ipcMain.handle('goal:update', async (_, uuid, dto) => {
    return useCases.updateGoal.execute(uuid, dto);
  });

  ipcMain.handle('goal:delete', async (_, uuid) => {
    return useCases.deleteGoal.execute(uuid);
  });
}

// apps/desktop/renderer/src/ipc/ipc-client.ts
const { ipcRenderer } = window.require('electron');

export const goalIpc = {
  list: (params) => ipcRenderer.invoke('goal:list', params),
  create: (dto) => ipcRenderer.invoke('goal:create', dto),
  update: (uuid, dto) => ipcRenderer.invoke('goal:update', uuid, dto),
  delete: (uuid) => ipcRenderer.invoke('goal:delete', uuid),
};
```

### Ports & Adapters 模式

#### 数据库策略：Prisma 统一 ORM

**决策**: 使用 Prisma 同时支持 PostgreSQL (API) 和 SQLite (Desktop)，复用相同的 schema 和 Repository 实现。

```
┌─────────────────────────────────────────────────────────────┐
│                    Prisma 统一架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   prisma/schema.prisma (共享)                               │
│   ├── datasource: env("DATABASE_URL")                       │
│   └── models: Goal, Task, Document, ...                     │
│                                                              │
│   ┌─────────────────┐         ┌─────────────────┐           │
│   │   API 服务端     │         │  Desktop 主进程  │           │
│   ├─────────────────┤         ├─────────────────┤           │
│   │ DATABASE_URL=   │         │ DATABASE_URL=   │           │
│   │ postgresql://.. │         │ file:./data.db  │           │
│   ├─────────────────┤         ├─────────────────┤           │
│   │ PrismaClient    │         │ PrismaClient    │           │
│   │ (同一实现)       │         │ (同一实现)       │           │
│   └─────────────────┘         └─────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Prisma Schema 配置

```prisma
// packages/infra/prisma/schema.prisma
datasource db {
  provider = "postgresql"  // 默认 PostgreSQL
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "windows", "darwin", "linux-musl"]
  // 支持多平台 Electron 打包
}

model Goal {
  uuid        String   @id @default(uuid())
  title       String
  description String?
  deadline    DateTime
  status      String   @default("active")
  progress    Float    @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  keyResults  KeyResult[]
  
  @@map("goals")
}

// ... 其他 models
```

#### PrismaClient 工厂

```typescript
// packages/infra/src/adapters/prisma/client.ts
import { PrismaClient } from '@prisma/client';

export type DatabaseProvider = 'postgresql' | 'sqlite';

export interface PrismaClientConfig {
  provider: DatabaseProvider;
  url?: string;  // 可选，默认使用环境变量
}

let prismaInstance: PrismaClient | null = null;

export function createPrismaClient(config?: PrismaClientConfig): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  // 如果提供了 URL，覆盖环境变量
  if (config?.url) {
    process.env.DATABASE_URL = config.url;
  }

  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

  return prismaInstance;
}

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    throw new Error('PrismaClient not initialized. Call createPrismaClient first.');
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
```

#### Repository 实现 (API + Desktop 共用)

```typescript
// packages/infra/src/adapters/prisma/goal.prisma.ts
import { PrismaClient } from '@prisma/client';
import { IGoalRepository } from '../../ports/repositories/goal.repository';
import { Goal } from '@dailyuse/domain-server';
import { GoalMapper } from './mappers/goal-mapper';

export class GoalPrismaRepository implements IGoalRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(uuid: string): Promise<Goal | null> {
    const record = await this.prisma.goal.findUnique({ 
      where: { uuid },
      include: { keyResults: true }
    });
    return record ? GoalMapper.toDomain(record) : null;
  }

  async findAll(params?: { page?: number; pageSize?: number }): Promise<Goal[]> {
    const { page = 1, pageSize = 20 } = params || {};
    const records = await this.prisma.goal.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { keyResults: true },
      orderBy: { createdAt: 'desc' }
    });
    return records.map(GoalMapper.toDomain);
  }

  async save(goal: Goal): Promise<void> {
    const data = GoalMapper.toPersistence(goal);
    await this.prisma.goal.upsert({
      where: { uuid: goal.uuid },
      create: data,
      update: data,
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }
}
```

#### API 服务端初始化

```typescript
// apps/api/src/main.ts
import { createPrismaClient } from '@dailyuse/infra/adapters/prisma';

// PostgreSQL 连接 (通过环境变量)
// DATABASE_URL=postgresql://user:pass@localhost:5432/dailyuse
const prisma = createPrismaClient({ provider: 'postgresql' });
```

#### Desktop 主进程初始化

```typescript
// apps/desktop/main/src/services/database.ts
import { app } from 'electron';
import path from 'path';
import { createPrismaClient, disconnectPrisma } from '@dailyuse/infra/adapters/prisma';

export async function initDatabase() {
  // SQLite 数据库存储在用户数据目录
  const dbPath = path.join(app.getPath('userData'), 'dailyuse.db');
  const databaseUrl = `file:${dbPath}`;

  const prisma = createPrismaClient({ 
    provider: 'sqlite',
    url: databaseUrl 
  });

  // 运行迁移 (首次启动或升级时)
  // 注意: Electron 打包后需要特殊处理迁移
  await runMigrations(dbPath);

  return prisma;
}

export async function closeDatabase() {
  await disconnectPrisma();
}

// Electron 打包后的迁移处理
async function runMigrations(dbPath: string) {
  // 方案1: 使用 prisma migrate deploy (需要打包 migration 文件)
  // 方案2: 使用 prisma db push (开发时)
  // 方案3: 自定义 SQL 迁移脚本
}
```

#### Electron 打包配置

```json5
// apps/desktop/electron-builder.json5
{
  "extraResources": [
    {
      "from": "node_modules/.prisma/client/",
      "to": "prisma-client",
      "filter": ["*.node", "schema.prisma"]
    },
    {
      "from": "prisma/migrations/",
      "to": "prisma-migrations"
    }
  ],
  "asarUnpack": [
    "node_modules/.prisma/**/*",
    "node_modules/@prisma/**/*"
  ]
}
```

### 数据同步服务

```typescript
// packages/sync/src/sync-engine.ts
export interface SyncConfig {
  strategy: 'realtime' | 'manual' | 'disabled';
  conflictResolution: 'server-wins' | 'client-wins' | 'manual';
  syncInterval?: number;  // for realtime strategy
}

export class SyncEngine {
  constructor(
    private config: SyncConfig,
    private localRepository: IRepository,
    private remoteApi: ISyncApi,
    private conflictResolver: ConflictResolver,
  ) {}

  async sync(): Promise<SyncResult> {
    // 1. 获取本地变更
    const localChanges = await this.localRepository.getUnsynced();
    
    // 2. 获取远程变更
    const remoteChanges = await this.remoteApi.getChanges(this.lastSyncTime);
    
    // 3. 检测冲突
    const conflicts = this.detectConflicts(localChanges, remoteChanges);
    
    // 4. 解决冲突
    const resolved = await this.conflictResolver.resolve(conflicts);
    
    // 5. 应用变更
    await this.applyChanges(resolved);
    
    return { success: true, syncedAt: new Date() };
  }
}

// apps/api/src/modules/sync/sync.controller.ts (新增)
@Controller('sync')
export class SyncController {
  @Post('push')
  async pushChanges(@Body() changes: ChangeSet) {
    return this.syncService.receiveChanges(changes);
  }

  @Get('pull')
  async pullChanges(@Query('since') since: Date) {
    return this.syncService.getChangesSince(since);
  }
}
```

### UI Token 提取示例

```typescript
// packages/ui/src/tokens/v1/colors.ts
export const colorsV1 = {
  primary: {
    main: '#1976D2',      // Vuetify blue
    light: '#42A5F5',
    dark: '#1565C0',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#9C27B0',
    light: '#BA68C8',
    dark: '#7B1FA2',
    contrast: '#FFFFFF',
  },
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
};

// packages/ui/src/tokens/v1/spacing.ts
export const spacingV1 = {
  unit: 4,  // 基准单位 4px
  xs: 4,    // 1 unit
  sm: 8,    // 2 units
  md: 16,   // 4 units
  lg: 24,   // 6 units
  xl: 32,   // 8 units
  xxl: 48,  // 12 units
};

// packages/ui/src/tokens/index.ts
import { colorsV1 } from './v1/colors';
import { spacingV1 } from './v1/spacing';
// import { colorsV2 } from './v2/colors';  // 未来

export type UIVersion = 'v1' | 'v2';

export function getTokens(version: UIVersion = 'v1') {
  switch (version) {
    case 'v1':
      return { colors: colorsV1, spacing: spacingV1, ... };
    case 'v2':
      // return { colors: colorsV2, spacing: spacingV2, ... };
    default:
      return { colors: colorsV1, spacing: spacingV1, ... };
  }
}
```

### 离线 AI 策略

```typescript
// packages/infra/src/ports/services/ai.service.ts
export interface IAIService {
  isAvailable(): Promise<boolean>;
  generateText(prompt: string): Promise<string>;
  // ... 其他 AI 方法
}

// packages/infra/src/adapters/ai/remote.ai.ts
export class RemoteAIService implements IAIService {
  constructor(private apiClient: ApiClient) {}

  async isAvailable(): Promise<boolean> {
    try {
      await this.apiClient.get('/ai/health');
      return true;
    } catch {
      return false;
    }
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.apiClient.post('/ai/generate', { prompt });
    return response.data.text;
  }
}

// packages/infra/src/adapters/ai/local.ai.ts (未来)
export class LocalAIService implements IAIService {
  constructor(private modelPath: string) {}

  async isAvailable(): Promise<boolean> {
    // 检查本地模型是否存在
    return fs.existsSync(this.modelPath);
  }

  async generateText(prompt: string): Promise<string> {
    // 调用本地大模型 (llama.cpp, ollama 等)
    return this.localModel.generate(prompt);
  }
}

// 使用时通过依赖注入选择实现
const aiService = navigator.onLine 
  ? new RemoteAIService(apiClient)
  : new LocalAIService('./models/llama-3.2');
```

## 实施阶段

### Phase 1: 包提取 (2-3 周)

1. 提取 `app-client` 从 `apps/web/src/modules/*/application/`
   - 重构为 Use Case 模式
   - 应用 kebab-case 命名规范
2. 提取 `app-server` 从 `apps/api/src/modules/*/application/`
   - 重构为 Use Case 模式
   - 分离 event-handlers
3. 创建 `infra` 包，定义 Ports 接口
4. 迁移现有 Repository 实现为 Adapters
5. 提取 `ui/tokens/v1` 从现有 Vuetify 主题

### Phase 2: Desktop MVP (3-4 周)

1. 搭建 Electron + React + shadcn 基础框架
2. 配置 Prisma + SQLite 环境
   - Electron 打包配置
   - 迁移策略实现
3. 实现 IPC 通信层
4. 复刻核心功能 UI (目标、任务、文档)

### Phase 3: 数据同步 (2-3 周)

1. API 端 sync 模块开发
2. Desktop 端 sync 集成
3. 冲突解决策略实现
4. 同步配置 UI

### Phase 4: 迭代优化 (持续)

1. UI V2 设计和实现
2. 本地大模型集成
3. 高级同步策略
4. 性能优化

## 影响

### 正面影响

✅ **用户体验提升**
- 离线可用，不依赖网络
- 本地执行，响应更快
- 数据本地存储，隐私性更好

✅ **代码质量提升**
- Ports & Adapters 模式提供清晰的测试边界
- 多环境适配能力
- 业务逻辑高度复用

✅ **架构灵活性**
- 未来可轻松添加移动端 (React Native)
- AI 服务可平滑切换本地/远程
- 同步策略可配置

### 负面影响

⚠️ **初期复杂度增加**
- 包数量增加，依赖管理更复杂
- 需要维护多个 Adapter 实现
- IPC 通信增加调试难度

⚠️ **开发成本**
- 需要学习 Electron + React
- UI 需要重新实现
- 同步逻辑复杂

⚠️ **维护成本**
- 需要同时维护 Web 和 Desktop
- SQLite 和 PostgreSQL 可能有差异
- 需要持续保持两端一致

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Prisma SQLite 与 PostgreSQL 语法差异 | 低 | 中 | Prisma 抽象了大部分差异，避免使用原生 SQL |
| Electron 打包 Prisma 复杂 | 中 | 中 | 使用 extraResources 配置，参考官方指南 |
| 同步冲突处理复杂 | 高 | 中 | 初期使用简单策略，逐步优化 |
| UI 复刻工作量大 | 高 | 中 | 分模块迭代，优先核心功能 |
| Electron 包体积大 | 中 | 低 | 优化打包配置，使用 asar |

## 相关决策

- [[001-use-nx-monorepo|ADR-001: 使用 Nx Monorepo]] - Monorepo 支持多 App 管理
- [[002-ddd-pattern|ADR-002: 采用 DDD 架构模式]] - 分层架构是提取的基础
- [[003-event-driven-architecture|ADR-003: 事件驱动架构]] - 跨进程事件通信

## 参考资料

- [Electron 官方文档](https://www.electronjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Ports and Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Local-First Software](https://www.inkandswitch.com/local-first/)
- [Prisma with SQLite](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [Prisma in Electron](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-electron)

---

**教训**: Local-First 架构需要预先设计好数据同步策略。使用 Prisma 统一 ORM 可以大幅减少维护成本，但需要注意 Electron 打包配置。UI 框架变更应该与架构提取分开进行，降低风险。

# 调度器独立包实施方案 (方案 C)

**创建日期：** 2026-01-20  
**实施预期时间：** 4-6 小时  
**方案状态：** 待执行

---

## 📋 目录

1. [架构对比分析](#架构对比分析)
2. [方案 C 核心原理](#方案-c-核心原理)
3. [包结构设计](#包结构设计)
4. [核心接口定义](#核心接口定义)
5. [实现细节](#实现细节)
6. [实施步骤](#实施步骤)
7. [验证策略](#验证策略)
8. [风险评估](#风险评估)

---

## 架构对比分析

### 问题根源

当前三层架构存在的矛盾：

```
[Application Layer]        ← 应该处理"如何执行"
       ↓
[Domain Layer]             ← 业务逻辑
       ↓
[Infrastructure Layer]     ← 应该是"被动的"（仓储、适配器）
```

**问题：调度器属于哪一层？**

- ❌ **Infrastructure 不应该主动调用 Application** → 导致循环依赖
- ❌ **Application 不应该关心"何时触发"** → 职责混乱
- ❌ **Domain 不是调度的位置** → 这是技术细节

### 方案 A（依赖注入）的局限性

```typescript
// 看起来解决了问题，但实际上只是"打补丁"
export class BreeExecutionEngine {
  private executor?: IScheduleTaskExecutor;
  setExecutor(executor: IScheduleTaskExecutor) {
    this.executor = executor;  // ✅ 接口替代具体类
  }
}
```

**问题：**
1. 只解决了循环依赖症状，未解决架构根本问题
2. Infrastructure 职责仍然混乱（既管数据又管触发）
3. 不可复用（Goal、Reminder、Backup 都要重复）
4. 切换调度引擎需要改多处代码

### 方案 C（独立 Scheduler 包）的优势

**架构变化：**

```
┌─────────────────────────────────────────┐
│         scheduler-server                │ ← 新增：调度协调层
│  (何时执行？用什么引擎？)                 │
└──────────────────┬──────────────────────┘
                   ↓ 实现
        ┌──────────────────────┐
        │ application-server   │ ← 业务逻辑（如何执行？）
        └──────────────────────┘
                   ↓ 使用
        ┌──────────────────────┐
        │infrastructure-server │ ← 数据访问（无循环！）
        └──────────────────────┘
```

**优势：**
- ✅ **彻底解决循环依赖** → 通过独立分层
- ✅ **职责清晰** → 三层各司其职
- ✅ **可复用** → 所有模块共享同一个 Scheduler
- ✅ **可扩展** → 切换引擎只改 scheduler 包内部
- ✅ **符合 SOLID 原则** → 单一职责、依赖倒置、开闭原则

---

## 方案 C 核心原理

### 核心设计原则

1. **接口驱动** - 通过 `ITaskHandler` 接口定义业务层与调度层的契约
2. **引擎隔离** - 调度引擎（Bree、Cron、Interval）完全隔离在 scheduler 包
3. **依赖单向** - Application 实现接口，Scheduler 调用接口，无反向依赖
4. **配置驱动** - 任务注册通过配置而非硬编码

### 职责划分

| 包 | 职责 | 主要类 | 关键依赖 |
|----|------|--------|----------|
| **scheduler-server** | 调度触发 | `IScheduler`, `BreeScheduler` | 无业务层依赖 |
| **application-server** | 业务执行 | `ScheduleTaskExecutor`, 实现 `ITaskHandler` | `scheduler-server` 接口 |
| **infrastructure-server** | 数据访问 | 仓储类 | 无 scheduler 依赖 |
| **domain-server** | 类型定义 | DTO、实体、枚举 | 无外部依赖 |

---

## 包结构设计

### 目录布局

```
packages/scheduler-server/
├── src/
│   ├── interfaces/
│   │   ├── ITaskHandler.ts           # 任务处理器接口
│   │   ├── IScheduler.ts             # 调度器接口
│   │   ├── IScheduleConfig.ts        # 调度配置接口
│   │   └── index.ts                  # 接口导出
│   │
│   ├── engines/
│   │   ├── BreeScheduler.ts          # Bree 实现（推荐）
│   │   ├── CronScheduler.ts          # node-cron 实现
│   │   ├── IntervalScheduler.ts      # setInterval 实现
│   │   └── index.ts                  # 引擎导出
│   │
│   ├── types/
│   │   ├── ScheduleConfig.ts         # 调度配置类型
│   │   ├── SchedulerOptions.ts       # 调度器选项类型
│   │   └── index.ts                  # 类型导出
│   │
│   ├── utils/
│   │   ├── logger.ts                 # 日志工具
│   │   └── validators.ts             # 验证工具
│   │
│   └── index.ts                      # 主入口，导出所有公开 API
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── jest.config.js
├── README.md
└── .eslintrc.json
```

### 包结构详细说明

**interfaces/** - 定义与业务层的契约
- `ITaskHandler` - 业务层必须实现的接口
- `IScheduler` - 调度器必须实现的接口
- `IScheduleConfig` - 调度配置接口

**engines/** - 调度引擎的具体实现
- `BreeScheduler` - 基于 Bree 库（支持 Worker）
- `CronScheduler` - 基于 node-cron 库（轻量级）
- `IntervalScheduler` - 基于原生 setInterval（简单场景）

**types/** - TypeScript 类型定义
- 避免与 domain-server 冲突
- 仅包含调度相关的技术类型

---

## 核心接口定义

### 1. ITaskHandler - 业务层实现的接口

```typescript
/**
 * 任务处理器接口
 * Application 层的服务类必须实现此接口
 */
export interface ITaskHandler {
  /**
   * 执行任务
   * @param taskId - 任务 ID (UUID)
   * @param context - 执行上下文（可选）
   * @throws 可以抛出错误，由调度器捕获并记录
   */
  execute(taskId: string, context?: unknown): Promise<void>;
}
```

### 2. IScheduler - 调度器必须实现的接口

```typescript
/**
 * 调度器接口
 * 所有具体调度器实现（Bree、Cron、Interval）都必须实现此接口
 */
export interface IScheduler {
  /**
   * 注册任务
   * @param taskId - 任务唯一标识
   * @param schedule - 调度配置（Cron表达式或间隔毫秒数）
   * @param handler - 任务处理器实例
   */
  register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void>;

  /**
   * 注销任务
   * @param taskId - 任务 ID
   */
  unregister(taskId: string): Promise<void>;

  /**
   * 启动调度器
   * 所有已注册的任务开始运行
   */
  start(): Promise<void>;

  /**
   * 停止调度器
   * 所有任务暂停运行
   */
  stop(): Promise<void>;

  /**
   * 获取所有已注册的任务 ID
   */
  getRegisteredTasks(): string[];

  /**
   * 检查任务是否已注册
   */
  isRegistered(taskId: string): boolean;
}
```

### 3. IScheduleConfig - 配置接口

```typescript
/**
 * 调度配置接口
 * 定义调度器的配置选项
 */
export interface IScheduleConfig {
  /**
   * 调度器类型: 'bree' | 'cron' | 'interval'
   */
  type: 'bree' | 'cron' | 'interval';

  /**
   * 是否自动启动
   */
  autoStart?: boolean;

  /**
   * 日志级别
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * 错误重试次数
   */
  retryAttempts?: number;

  /**
   * 错误重试延迟（毫秒）
   */
  retryDelay?: number;

  /**
   * 执行超时时间（毫秒）
   */
  executionTimeout?: number;

  /**
   * Bree 特定配置
   */
  bree?: {
    root?: string;
    defaultExtension?: string;
  };
}
```

---

## 实现细节

### 1. BreeScheduler 实现

```typescript
import Bree from 'bree';
import type { IScheduler, ITaskHandler } from '../interfaces';

export class BreeScheduler implements IScheduler {
  private bree: Bree;
  private handlers: Map<string, ITaskHandler> = new Map();
  private registeredTasks: Set<string> = new Set();

  constructor(options?: { root?: string }) {
    this.bree = new Bree({
      root: options?.root || false,
      jobs: [],
      defaultExtension: 'ts',
    });
  }

  async register(taskId: string, schedule: string, handler: ITaskHandler): Promise<void> {
    if (this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is already registered`);
    }

    this.handlers.set(taskId, handler);
    this.registeredTasks.add(taskId);

    this.bree.add({
      name: taskId,
      cron: schedule,
      worker: async () => {
        try {
          const taskHandler = this.handlers.get(taskId);
          if (taskHandler) {
            await taskHandler.execute(taskId);
          }
        } catch (error) {
          console.error(`Task ${taskId} failed:`, error);
          throw error;
        }
      },
    });
  }

  async unregister(taskId: string): Promise<void> {
    if (!this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is not registered`);
    }

    await this.bree.remove(taskId);
    this.handlers.delete(taskId);
    this.registeredTasks.delete(taskId);
  }

  async start(): Promise<void> {
    await this.bree.start();
  }

  async stop(): Promise<void> {
    await this.bree.stop();
  }

  getRegisteredTasks(): string[] {
    return Array.from(this.registeredTasks);
  }

  isRegistered(taskId: string): boolean {
    return this.registeredTasks.has(taskId);
  }
}
```

### 2. CronScheduler 实现

```typescript
import cron from 'node-cron';
import type { IScheduler, ITaskHandler } from '../interfaces';

export class CronScheduler implements IScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private handlers: Map<string, ITaskHandler> = new Map();
  private registeredTasks: Set<string> = new Set();
  private isRunning = false;

  async register(taskId: string, schedule: string, handler: ITaskHandler): Promise<void> {
    if (this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is already registered`);
    }

    this.handlers.set(taskId, handler);
    this.registeredTasks.add(taskId);

    const task = cron.schedule(schedule, async () => {
      try {
        const taskHandler = this.handlers.get(taskId);
        if (taskHandler) {
          await taskHandler.execute(taskId);
        }
      } catch (error) {
        console.error(`Task ${taskId} failed:`, error);
        throw error;
      }
    }, { scheduled: false });

    this.jobs.set(taskId, task);

    // 如果调度器已启动，启动这个任务
    if (this.isRunning) {
      task.start();
    }
  }

  async unregister(taskId: string): Promise<void> {
    if (!this.registeredTasks.has(taskId)) {
      throw new Error(`Task ${taskId} is not registered`);
    }

    const task = this.jobs.get(taskId);
    if (task) {
      task.stop();
      this.jobs.delete(taskId);
    }

    this.handlers.delete(taskId);
    this.registeredTasks.delete(taskId);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    for (const task of this.jobs.values()) {
      task.start();
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    for (const task of this.jobs.values()) {
      task.stop();
    }
  }

  getRegisteredTasks(): string[] {
    return Array.from(this.registeredTasks);
  }

  isRegistered(taskId: string): boolean {
    return this.registeredTasks.has(taskId);
  }
}
```

### 3. ScheduleTaskExecutor 在 Application 层的实现

```typescript
import type { ITaskHandler } from '@dailyuse/scheduler-server';
import { ScheduleTaskRepository } from '@dailyuse/infrastructure-server';
import { Logger } from '@nestjs/common';

/**
 * Schedule 任务执行器
 * 实现 ITaskHandler 接口，由 Scheduler 调用
 */
export class ScheduleTaskExecutor implements ITaskHandler {
  private static instance: ScheduleTaskExecutor;
  private readonly logger = new Logger(ScheduleTaskExecutor.name);

  private constructor(private repository: ScheduleTaskRepository) {}

  static getInstance(repository?: ScheduleTaskRepository): ScheduleTaskExecutor {
    if (!ScheduleTaskExecutor.instance && repository) {
      ScheduleTaskExecutor.instance = new ScheduleTaskExecutor(repository);
    }
    return ScheduleTaskExecutor.instance;
  }

  async execute(taskId: string, context?: unknown): Promise<void> {
    this.logger.log(`Executing schedule task: ${taskId}`);

    try {
      // 1. 从数据库加载任务
      const task = await this.repository.findByUuid(taskId);
      if (!task) {
        throw new Error(`Schedule task ${taskId} not found`);
      }

      // 2. 检查任务是否启用
      if (!task.isEnabled) {
        this.logger.warn(`Schedule task ${taskId} is disabled, skipping`);
        return;
      }

      // 3. 执行业务逻辑
      this.logger.debug(`Executing business logic for task: ${taskId}`);
      await task.execute(context);

      // 4. 更新执行时间
      task.lastExecutedAt = new Date();
      task.executionCount = (task.executionCount || 0) + 1;

      // 5. 保存
      await this.repository.save(task);

      this.logger.log(`Schedule task ${taskId} executed successfully`);
    } catch (error) {
      this.logger.error(`Failed to execute schedule task ${taskId}:`, error);
      throw error;
    }
  }
}
```

---

## 实施步骤

### Phase 1: 准备（30 分钟）
- [ ] 确认依赖安装（Bree、node-cron）
- [ ] 规划包版本
- [ ] 更新 pnpm-workspace.yaml

### Phase 2: 创建 Scheduler 包（1.5 小时）
- [ ] 创建目录结构
- [ ] 实现所有接口定义
- [ ] 实现三个调度引擎
- [ ] 创建工具函数和类型
- [ ] 创建 package.json 和配置文件
- [ ] 创建导出索引

### Phase 3: 更新现有代码（1 小时）
- [ ] 更新 Application 层实现 ITaskHandler
- [ ] 从 Infrastructure 中移除调度代码
- [ ] 更新类型依赖

### Phase 4: 创建初始化代码（45 分钟）
- [ ] 创建 Bootstrap 初始化逻辑
- [ ] 创建配置工厂
- [ ] 创建任务注册脚本

### Phase 5: 验证和测试（1.5 小时）
- [ ] 类型检查（tsc）
- [ ] Lint 检查（eslint）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 启动应用验证

**总计：4-6 小时**

---

## 验证策略

### 1. 编译验证
```bash
nx run packages-scheduler-server:build
```

### 2. 类型检查
```bash
tsc --noEmit
```

### 3. Lint 检查
```bash
nx lint packages-scheduler-server
```

### 4. 单元测试
```bash
nx test packages-scheduler-server
```

### 5. 集成测试
```bash
nx run-many --target test
```

### 6. 运行时验证
- 检查调度任务是否正确触发
- 验证数据库更新是否成功
- 检查日志记录

---

## 风险评估

### 低风险
- ✅ 接口清晰，实现相对简单
- ✅ 现有代码不需要大量修改
- ✅ 可以增量迁移，不需要一次性全部完成

### 中风险
- ⚠️ 需要更新 Application 层代码
- ⚠️ 需要运行时验证调度功能
- ⚠️ 可能影响现有的定时任务

### 缓解措施
- 先在开发环境验证
- 保留旧代码备份
- 详细的测试用例
- 逐步迁移模块

---

## 核心代码文件清单

| 文件 | 行数 | 优先级 |
|------|------|--------|
| `ITaskHandler.ts` | ~20 | P0 |
| `IScheduler.ts` | ~35 | P0 |
| `IScheduleConfig.ts` | ~30 | P0 |
| `BreeScheduler.ts` | ~80 | P0 |
| `CronScheduler.ts` | ~85 | P0 |
| `IntervalScheduler.ts` | ~75 | P1 |
| `ScheduleTaskExecutor.ts` | ~50 | P0 |
| `scheduler.bootstrap.ts` | ~40 | P0 |
| `package.json` | ~40 | P0 |
| `tsconfig.json` | ~20 | P0 |
| 单元测试 | ~300 | P1 |

**总代码行数（核心）：~400 行**

---

## 预期成果

✅ **架构改进**
- 消除循环依赖
- 职责清晰分离
- 符合 SOLID 原则

✅ **代码质量**
- 类型安全（TypeScript）
- 接口驱动设计
- 可测试的架构

✅ **可维护性**
- 易于扩展（新调度引擎）
- 易于测试（接口隔离）
- 易于重用（所有模块共享）

✅ **未来扩展**
- 支持分布式调度（切换到 BullMQ）
- 支持 MongoDB 调度（Agenda）
- 支持动态任务加载

---

## 相关链接

- **当前分析文档** `_bmad-output/circular-dependency-analysis.md`
- **Bree 文档** https://github.com/breejs/bree
- **node-cron 文档** https://github.com/kelektiv/node-cron
- **SOLID 原则** https://en.wikipedia.org/wiki/SOLID

---

**状态：✅ 方案已确认，准备实施**

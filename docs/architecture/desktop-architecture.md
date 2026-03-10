# Desktop 应用架构：积木组装指南

> **更新时间**: 2026-01-08  
> **技术版本**: Electron 39.2.6 + React 19.2.1  
> **核心理念**: Desktop 不是从零构建，而是**组装来自 L1-L4 的现成积木**

本文档展示 Desktop 应用如何从底层开始逐层依赖和组装 DailyUse 的五层架构。

---

## 核心观点：Desktop = 容器 + 组装

**Desktop 不是独立的应用**，而是一个 **Electron 容器** 和一套**积木组装**的组合体。

```
Desktop 应用
│
├─ L1: Contracts
│  ├─ ScheduleTaskDTO、ScheduleTaskStatus
│  ├─ TaskDTO、TaskStatus
│  └─ ...所有数据契约
│
├─ L2: Domain Models (domain-server)
│  ├─ ScheduleTask 聚合根、ScheduleConfig 值对象
│  ├─ Task 聚合根、TaskMetadata 值对象
│  └─ ...所有业务规则
│
├─ L3: Infrastructure (infrastructure-server)
│  ├─ SchedulePrismaRepository、ScheduleMemoryRepository
│  ├─ TaskPrismaRepository、TaskMemoryRepository
│  └─ 所有容器 (ScheduleContainer, TaskContainer, ...)
│
├─ L4: Application Services (application-server)
│  ├─ ScheduleApplicationService、TaskApplicationService
│  ├─ ...编排逻辑
│  └─ 依赖 L4.5 通用模式
│
├─ L4.5: Generic Patterns (@dailyuse/patterns) 【新】
│  ├─ ScheduleTaskQueue（通用任务队列框架，由 L4 继承）
│  ├─ MinHeap、BaseTaskQueue（通用数据结构和基类）
│  ├─ BaseRepository、QueryObject（通用仓储模式）
│  └─ ...可被所有 L4 packages 复用
│
└─ L5: Desktop 特定包装
   ├─ DesktopScheduler（L4 ScheduleTaskQueue + Electron powerMonitor）
   ├─ executeScheduleTask（L4 业务逻辑 + IPC + 本地通知）
   ├─ IPC Handlers（L4 services + Electron IPC）
   └─ Composition Root（装配所有积木）
```

---

## 架构全景图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   DailyUse Desktop Application                          │
│            Electron 39.2.6 + React 19.2.1 + Monorepo 积木              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔════════════════════════════════════════════════════════════════╗   │
│  ║         Renderer Process (React 19 - L5 客户端层)              ║   │
│  ║  ┌─────────────────────────────────────────────────────────┐  ║   │
│  ║  │  Pages / Components / Hooks (使用 L4 的业务逻辑)       │  ║   │
│  ║  │  Zustand Stores (使用 L4 的应用服务)                  │  ║   │
│  ║  └─────────────────────────────────────────────────────────┘  ║   │
│  ║                             │                                 ║   │
│  ║                    IPC Client (L3)                           ║   │
│  ║                             │                                 ║   │
│  ║                    contextBridge                             ║   │
│  ╚════════════════════════════════════════════════════════════════╝   │
│                                    │                                   │
│                              Preload Script                            │
│                                    │                                   │
│                            ipcMain.handle()                            │
│                                    │                                   │
│  ╔════════════════════════════════════════════════════════════════╗   │
│  ║     Main Process (Node.js - L5 服务端层 + L2-L4 组装)         ║   │
│  ║                                                                ║   │
│  ║  IPC Handlers                                                 ║   │
│  ║  ├─ goal.ipc-handler     (L4: GoalApplicationService)        ║   │
│  ║  ├─ task.ipc-handler     (L4: TaskApplicationService)        ║   │
│  ║  ├─ schedule.ipc-handler (L4: ScheduleTaskQueue)             ║   │
│  ║  └─ ...                                                       ║   │
│  ║                             │                                 ║   │
│  ║                             ▼                                 ║   │
│  ║  ┌────────────────────────────────────────────────────────┐  ║   │
│  ║  │  Application Services (L4)                             │  ║   │
│  ║  │  ├─ ScheduleTaskQueue (核心调度算法)                 │  ║   │
│  ║  │  ├─ ScheduleApplicationService                        │  ║   │
│  ║  │  └─ ...                                               │  ║   │
│  ║  └────────────────────────────────────────────────────────┘  ║   │
│  ║                             │                                 ║   │
│  ║                             ▼                                 ║   │
│  ║  ┌────────────────────────────────────────────────────────┐  ║   │
│  ║  │  Infrastructure (L3) + Domain (L2) + Contracts (L1)   │  ║   │
│  ║  │  ├─ ScheduleContainer, SchedulePrismaRepository       │  ║   │
│  ║  │  ├─ ScheduleTask, ScheduleConfig (业务规则)          │  ║   │
│  ║  │  └─ ScheduleTaskDTO, ScheduleTaskStatus (契约)       │  ║   │
│  ║  └────────────────────────────────────────────────────────┘  ║   │
│  ║                             │                                 ║   │
│  ║                             ▼                                 ║   │
│  ║  ┌────────────────────────────────────────────────────────┐  ║   │
│  ║  │  PowerSync (local-first SQLite runtime)               │  ║   │
│  ║  │  └─ dailyuse.db                                       │  ║   │
│  ║  └────────────────────────────────────────────────────────┘  ║   │
│  ║                                                                ║   │
│  ║  + Electron 特定功能                                          ║   │
│  ║    ├─ powerMonitor (电源事件)                                 ║   │
│  ║    ├─ Notification (本地通知)                                 ║   │
│  ║    ├─ app lifecycle (应用生命周期)                            ║   │
│  ║    └─ ...                                                     ║   │
│  ╚════════════════════════════════════════════════════════════════╝   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## L5 Desktop：从下往上的依赖链

### 第 1 步：启动数据库和 Composition Root

```typescript
// src/main/index.ts
import { app } from 'electron';
import { initializeDatabase } from './database';
import { configureMainProcessDependencies } from './di/desktop-main.composition-root';
import { registerAllHandlers } from './ipc/register-handlers';

app.whenReady().then(async () => {
  // 1️⃣ 初始化 L1-L3（数据库 + 依赖容器）
  await openPowerSyncLocalOnly();
  configureMainProcessDependencies();

  // 2️⃣ 注册 IPC Handlers（L5 的入口点）
  registerAllHandlers();

  // 3️⃣ 创建主窗口
  await createWindow();
});
```

### 第 2 步：Composition Root 装配所有积木

```typescript
// src/main/di/desktop-main.composition-root.ts
import {
  ScheduleContainer, // L3: 容器
  TaskContainer,
} from '@dailyuse/infrastructure-server';

import {
  PowerSyncScheduleRepository, // L3: 实现
  PowerSyncTaskRepository,
} from './powersync-adapters';

export function configureMainProcessDependencies(): void {
  // 装配 Schedule 模块（L1-L3）
  ScheduleContainer.getInstance().registerScheduleTaskRepository(new PowerSyncScheduleRepository());
  // 👆 L3 实现依赖 L2（ScheduleTask）依赖 L1（ScheduleTaskDTO）

  // 装配 Task 模块（L1-L3）
  TaskContainer.getInstance().registerTaskRepository(new PowerSyncTaskRepository());

  // ...其他模块

  console.log('✅ All L1-L3 dependencies configured');
}
```

**这一步的意义：**

- ✅ L1 (Contracts) 被所有层看到
- ✅ L2 (Domain) 验证业务规则
- ✅ L3 (Infrastructure) 提供实现
- ✅ L3 的容器管理所有实例

---

### 第 3 步：IPC Handlers（调用 L4 应用服务）

```typescript
// src/main/ipc/handlers/schedule.ipc-handler.ts
import { ipcMain } from 'electron';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import type { ScheduleTaskDTO } from '@dailyuse/contracts';

export function registerScheduleHandlers(): void {
  // IPC 通道：'schedule:getActive'
  // 依赖链：IPC → L4 应用服务 → L3 容器 → L2 领域模型 → L1 契约

  ipcMain.handle('schedule:getActive', async (_, accountUuid: string) => {
    // 从 L3 容器获取 L4 应用服务（这里用应用级编排）
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();

    // 调用 L2 的业务逻辑
    const tasks = await repository.findEnabled();

    // 返回 L1 契约（ScheduleTaskDTO）给客户端
    return tasks.map((task) => task.toClientDTO());
  });

  // 又例：触发任务执行（Desktop 特定的功能）
  ipcMain.handle('schedule:executeTask', async (_, taskUuid: string) => {
    // 1. 获取任务（L3 + L2）
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();
    const task = await repository.findByUuid(taskUuid);

    // 2. 执行任务（L5 特定的逻辑）
    if (task.canExecute()) {
      await executeScheduleTask(task);

      // 3. Desktop 特定：发送本地通知
      new Notification({
        title: '任务已执行',
        body: task.taskName,
      }).show();
    }
  });
}
```

**关键观察：**

- IPC Handler 是 Desktop 对外暴露的 API
- 它们内部调用 L4 的应用服务
- 然后加上 Desktop 特定的处理（通知、IPC 序列化等）

---

### 第 4 步：Schedule 模块的完整示例

**文件位置：** `apps/desktop/src/main/modules/schedule/`

#### 4.1 基础设施：DesktopScheduler

```typescript
// infrastructure/DesktopScheduler.ts
import { powerMonitor } from 'electron';
import {
  ScheduleTaskQueue, // 来自 L4
  type IScheduleTimer, // 来自 L4
  type IScheduleMonitor, // 来自 L4
} from '@dailyuse/application-server';

import { ScheduleContainer } from '@dailyuse/infrastructure-server';

export class DesktopScheduler {
  private queue: ScheduleTaskQueue;
  private static instance: DesktopScheduler | null = null;

  static createInstance(config: any): DesktopScheduler {
    if (!this.instance) {
      this.instance = new DesktopScheduler(config);
    }
    return this.instance;
  }

  private constructor(private config: any) {}

  async start(): Promise<void> {
    // 从 L3 获取仓储
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();

    // 使用 L4 的 ScheduleTaskQueue
    this.queue = new ScheduleTaskQueue({
      taskLoader: {
        loadActiveTasks: async () => {
          const tasks = await repository.findEnabled();
          // 转换为 L4 期望的格式
          return tasks.map((t) => ({
            taskUuid: t.uuid,
            nextRunAt: t.nextRunAt?.getTime() ?? Date.now(),
            cronExpression: t.schedule.cronExpression,
            timezone: t.schedule.timezone,
          }));
        },
      },
      onExecuteTask: this.config.onExecuteTask,
    });

    // 👇 Desktop 特定：与 Electron powerMonitor 集成
    powerMonitor.on('resume', () => {
      console.log('System resumed, checking missed tasks...');
      this.queue.checkMissedTasks();
    });

    powerMonitor.on('suspend', () => {
      console.log('System suspended, pausing scheduler...');
      this.queue.pause();
    });

    await this.queue.start();
  }
}
```

**依赖链分析：**

```
DesktopScheduler (L5)
├─ ScheduleTaskQueue (L4) ✓
├─ IScheduleTimer (L4) ✓
├─ IScheduleMonitor (L4) ✓
├─ ScheduleContainer (L3) ✓
├─ IScheduleTaskRepository (L2) ✓
└─ Electron's powerMonitor ✓ (Desktop 特定)
```

#### 4.2 执行：executeScheduleTask

```typescript
// application/services/execute-task.ts
import { Notification } from 'electron';
import type { ScheduleTask } from '@dailyuse/domain-server';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';

export async function executeScheduleTask(task: ScheduleTask): Promise<void> {
  try {
    // 1. 检查业务约束（L2）
    if (!task.canExecute()) {
      console.log(`Task ${task.uuid} cannot execute now`);
      return;
    }

    // 2. 执行任务（特定的业务逻辑）
    console.log(`Executing task: ${task.taskName}`);
    // ... 实际执行业务逻辑

    // 3. 记录执行结果（L2）
    task.recordExecution({
      executedAt: new Date(),
      status: 'SUCCESS',
    });

    // 4. 保存回数据库（L3）
    const repository = ScheduleContainer.getInstance().getScheduleTaskRepository();
    await repository.save(task);

    // 5. Desktop 特定：发送本地通知
    new Notification({
      title: '任务已执行',
      body: `${task.taskName} 执行成功`,
      icon: 'path/to/icon.png',
    }).show();

    // 6. Desktop 特定：触发 IPC 事件给 Renderer
    mainWindow?.webContents.send('schedule:task-executed', {
      taskUuid: task.uuid,
      taskName: task.taskName,
      executedAt: new Date(),
    });
  } catch (error) {
    console.error(`Task execution failed: ${task.uuid}`, error);
    // Desktop 特定：错误通知
    new Notification({
      title: '任务执行失败',
      body: error instanceof Error ? error.message : '未知错误',
    }).show();
  }
}
```

#### 4.3 初始化：Module 启动

```typescript
// initialization/index.ts
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-server';
import { DesktopScheduler } from '../infrastructure';
import { executeScheduleTask } from '../application/services';

export function registerScheduleInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 任务 1：模块初始化
  manager.registerTask({
    name: 'schedule-module-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Schedule] Initializing Schedule module...');
      // 任何模块级别的初始化
    },
  });

  // 任务 2：启动任务队列
  manager.registerTask({
    name: 'schedule-task-queue',
    phase: InitializationPhase.APP_STARTUP,
    priority: 55,
    dependencies: ['schedule-module-initialization'],
    initialize: async () => {
      console.log('[Schedule] Starting task queue...');

      const scheduler = DesktopScheduler.createInstance({
        onExecuteTask: executeScheduleTask,
      });

      await scheduler.start();
      console.log('[Schedule] Task queue started ✓');
    },
  });
}
```

---

## L4.5：通用模式层在 Desktop 中的应用

### 什么是 @dailyuse/patterns？

`@dailyuse/patterns` 是一个新的 L4 package，包含所有通用的、可复用的框架和数据结构。Desktop 应用通过继承这些通用类来实现特定功能。

```
┌─────────────────────────────────┐
│  @dailyuse/patterns             │ (L4.5 - 通用框架)
├─────────────────────────────────┤
│ scheduler/                      │
│  ├─ BaseTaskQueue               │ 通用任务队列基类
│  ├─ MinHeap                     │ 优先级队列数据结构
│  └─ IScheduleTimer 等接口       │ 可插拔接口
├─────────────────────────────────┤
│ repository/                     │
│  ├─ BaseRepository              │ 通用仓储基类
│  └─ QueryObject                 │ 查询对象基类
├─────────────────────────────────┤
│ cache/                          │
│  ├─ LRUCache                    │ LRU 缓存实现
│  └─ TTLCache                    │ TTL 缓存实现
└─────────────────────────────────┘
```

### Desktop 中使用 Patterns 的例子

**Before（代码散落）：**

```typescript
// 从 application-server 导入 MinHeap
import { MinHeap } from '@dailyuse/application-server/schedule/scheduler';

// MinHeap 混合在业务逻辑中，难以复用
```

**After（清晰的通用框架）：**

```typescript
// 从 patterns 导入通用基类
import { BaseTaskQueue, MinHeap } from '@dailyuse/patterns';

// Desktop 应用继承通用框架，添加 Electron 特定逻辑
export class DesktopScheduleTaskQueue extends BaseTaskQueue<ScheduleTask> {
  constructor(
    private electronTimer: ElectronTimerAdapter,
    private repository: IScheduleTaskRepository,
  ) {
    super();
  }

  // 继承通用队列逻辑，只需实现比较函数
  compare(a: ScheduleTask, b: ScheduleTask): number {
    return b.priority - a.priority;
  }

  // 重写执行方法，添加 Electron 特定逻辑
  async execute(task: ScheduleTask): Promise<void> {
    if (!task.canExecute()) return;

    // 使用 Electron 计时器（而不是系统计时器）
    await this.electronTimer.waitUntil(task.nextRunAt);

    // 执行任务
    await executeScheduleTask(task);

    // 发送 IPC 事件到 Renderer
    mainWindow?.webContents.send('schedule:executed', { taskId: task.id });
  }
}
```

### 好处

| 好处         | 详细说明                                |
| ------------ | --------------------------------------- |
| **高复用**   | MinHeap、BaseTaskQueue 可被所有模块复用 |
| **易测试**   | 通用模式不依赖 Electron，轻松 mock      |
| **易扩展**   | 新应用（如 Mobile）可继承同样的基类     |
| **清晰职责** | Desktop 只添加 Electron 特定逻辑        |

---

## Utils 包的清理（该文档的反面教材）

### 从前的混乱（现已解决）

旧的 `@dailyuse/utils` 包混合了不同职责的代码：

```typescript
// ❌ Before：什么都有
import { priorityCalculator } from '@dailyuse/utils'; // 业务计算
import { MinHeap } from '@dailyuse/utils'; // 通用模式
import { logger } from '@dailyuse/utils'; // 基础工具
import { ReminderErrors } from '@dailyuse/utils'; // 业务错误
```

### 现在的清晰分工

```typescript
// ✅ After：职责清晰
import { priorityCalculator } from '@dailyuse/domain-server/schedule/calculators';
import { MinHeap } from '@dailyuse/patterns/scheduler';
import { logger } from '@dailyuse/utils/shared';
import { ReminderErrors } from '@dailyuse/domain-server/reminder/errors';
```

**迁移详情：**

| 代码                 | 从                           | 到                                 | 理由                 |
| -------------------- | ---------------------------- | ---------------------------------- | -------------------- |
| `priorityCalculator` | utils/shared                 | domain-server/schedule/calculators | Schedule 特定        |
| `recurrence.ts`      | utils/shared                 | domain-server/schedule/calculators | Schedule 特定        |
| `MinHeap`            | application-server/scheduler | patterns/scheduler/priority-queue  | 通用模式             |
| `BaseTaskQueue`      | application-server/scheduler | patterns/scheduler                 | 通用基类             |
| `ReminderErrors`     | utils/errors                 | domain-server/reminder/errors      | 业务特定             |
| `logger`             | 保持                         | utils/shared                       | 基础工具，所有层都用 |
| `uuid` 工具          | 保持                         | utils/shared                       | 通用函数             |
| `debounce` 等        | 保持                         | utils/frontend                     | 前端工具             |

---

## 目录结构（L5 视角）

```
apps/desktop/
├── src/
│   ├── main/
│   │   ├── index.ts                              # 应用入口（第 1 步）
│   │   │
│   │   ├── database/
│   │   │   └── index.ts                          # PowerSync 本地初始化
│   │   │
│   │   ├── di/
│   │   │   ├── desktop-main.composition-root.ts  # 装配 L2-L4（第 2 步）
│   │   │   └── powersync-adapters/
│   │   │       └── *.repository.ts               # L3 实现
│   │   │
│   │   ├── ipc/
│   │   │   ├── handlers/
│   │   │   │   ├── goal.ipc-handler.ts           # 第 3 步
│   │   │   │   ├── task.ipc-handler.ts
│   │   │   │   ├── schedule.ipc-handler.ts
│   │   │   │   └── ...
│   │   │   └── register-handlers.ts
│   │   │
│   │   └── modules/
│   │       ├── goal/
│   │       ├── task/
│   │       └── schedule/                          # 完整示例（第 4 步）
│   │           ├── infrastructure/
│   │           │   ├── DesktopScheduler.ts       # 4.1
│   │           │   └── DesktopScheduleMonitor.ts
│   │           ├── application/
│   │           │   └── services/
│   │           │       └── execute-task.ts        # 4.2
│   │           └── initialization/
│   │               └── index.ts                   # 4.3
│   │
│   ├── preload/
│   │   └── index.ts                              # IPC bridge
│   │
│   └── renderer/                                  # L5 客户端
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── stores/
│
├── package.json                                   # 依赖：所有 @dailyuse/* 包
└── project.json
```

---

## 依赖流向（规则验证）

Desktop 的依赖必须遵循五层规则：

| 来源                                 | 可依赖         | 例子                      |
| ------------------------------------ | -------------- | ------------------------- |
| **Desktop IPC Handlers**             | L4、L3、L2、L1 | ✅ 可用 ScheduleTaskQueue |
| **Desktop 特定（DesktopScheduler）** | L4、L3、L2、L1 | ✅ 可用 Electron API      |
| **Desktop PowerSync Adapters**       | L2、L1         | ✅ 只实现 L3 接口         |

**违反规则示例（❌ 不允许）：**

```typescript
// ❌ Desktop 直接依赖 contracts（应该通过 Domain 层）
import { ScheduleTaskDTO } from '@dailyuse/contracts';
class DesktopScheduler { ... }

// ✅ 正确：通过 Domain 模型
import { ScheduleTask } from '@dailyuse/domain-server';
class DesktopScheduler { ... }
```

---

## 技术栈总览

| 层级           | 来源                              | 技术                                     |
| -------------- | --------------------------------- | ---------------------------------------- |
| **L5 Desktop** | 项目                              | Electron 39.2.6、PowerSync local runtime |
| **L4**         | `@dailyuse/application-server`    | ScheduleTaskQueue、算法、编排            |
| **L3**         | `@dailyuse/infrastructure-server` | 容器、仓储实现、依赖注入                 |
| **L2**         | `@dailyuse/domain-server`         | 业务规则、聚合根、值对象                 |
| **L1**         | `@dailyuse/contracts`             | DTO、枚举、类型定义                      |

---

## 应用启动流程

```
1. Electron app.whenReady()
   │
2. openPowerSyncLocalOnly()         【初始化 PowerSync 本地数据库】
   │
3. configureMainProcessDependencies() 【装配 L1-L3】
   │   ├─ ScheduleContainer.getInstance()
   │   ├─ .registerScheduleTaskRepository(new PowerSyncScheduleRepository())
   │   └─ ...其他容器和仓储
   │
4. registerAllHandlers()              【注册 IPC】
   │   ├─ registerScheduleHandlers()
   │   ├─ registerTaskHandlers()
   │   └─ ...
   │
5. registerScheduleInitializationTasks() 【启动 L5 特定的东西】
   │   ├─ schedule-module-initialization
   │   └─ schedule-task-queue          【启动 DesktopScheduler】
   │
6. createWindow()                     【创建 Renderer】
   │
✅ 应用运行，等待 IPC 请求
```

---

## 与其他应用的对比

### Desktop 的 ScheduleTaskQueue 使用

```typescript
// L4: application-server/src/schedule/scheduler/ScheduleTaskQueue.ts
export class ScheduleTaskQueue {
  async start(): Promise<void> {
    const tasks = await this.loadActiveTasks();
    // ... 核心调度逻辑
  }
}

// L5 Desktop: apps/desktop/src/main/modules/schedule/infrastructure
export class DesktopScheduler {
  // 使用 L4 的 ScheduleTaskQueue
  this.queue = new ScheduleTaskQueue({ ... });
  // 添加 Electron 特定功能
  powerMonitor.on('resume', () => this.queue.checkMissedTasks());
}
```

### API 的 ScheduleTaskQueue 使用

```typescript
// L5 API: apps/api/src/modules/schedule/controllers
@Controller('/schedules')
export class ScheduleController {
  constructor(
    private queue: ScheduleTaskQueue, // 同样是 L4
  ) {}

  @Post(':id/trigger')
  async triggerTask(id: string) {
    await this.queue.executeImmediately(id);
  }
}
```

**结论：** Desktop 和 API 使用同一个 ScheduleTaskQueue，但各自包装它以适应自己的环境。

---

## IPC 通道映射

| IPC 通道             | Handler 位置            | 依赖链             |
| -------------------- | ----------------------- | ------------------ |
| `schedule:getActive` | schedule.ipc-handler.ts | IPC → L3 → L2 → L1 |
| `schedule:execute`   | schedule.ipc-handler.ts | IPC → L4 → L3 → L2 |
| `schedule:stats`     | schedule.ipc-handler.ts | IPC → L4 Monitor   |

---

## 相关文档

- [拼项目.md - DailyUse 积木拼接架构](./拼项目.md) - 详细的五层架构理论
- [Schedule 模块完整实现](../sprint-artifacts/EPIC-016-schedule-optimization.md) - Story 1-4

---

**维护者**: DailyUse Team  
**最后更新**: 2026-01-08

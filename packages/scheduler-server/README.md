# @dailyuse/scheduler-server

独立的任务调度器包，提供统一的调度接口和多种调度引擎实现。

## 特性

- 🎯 **接口驱动** - 通过 `ITaskHandler` 接口实现业务逻辑与调度的解耦
- 🔧 **多引擎支持** - BreeScheduler（推荐）、CronScheduler（轻量级）、IntervalScheduler（简单）
- 📦 **零循环依赖** - 独立的 Scheduler 层，避免架构混乱
- 🚀 **易于扩展** - 实现 `IScheduler` 接口可轻松添加新的调度引擎

## 安装

```bash
pnpm install @dailyuse/scheduler-server
```

## 快速开始

### 基本用法

```typescript
import { BreeScheduler } from '@dailyuse/scheduler-server';
import type { ITaskHandler } from '@dailyuse/scheduler-server';

// 1. 实现任务处理器接口
class MyTaskHandler implements ITaskHandler {
  async execute(taskId: string): Promise<void> {
    console.log(`执行任务: ${taskId}`);
    // 您的业务逻辑
  }
}

// 2. 创建调度器实例
const scheduler = new BreeScheduler();

// 3. 注册任务
const handler = new MyTaskHandler();
await scheduler.register('task-1', '0 * * * *', handler); // 每小时执行一次

// 4. 启动调度器
await scheduler.start();

// 5. 停止调度器
// await scheduler.stop();
```

## 调度器选择

### BreeScheduler（推荐）

使用 Bree 库，支持 Worker 隔离，生产级别的稳定性。

```typescript
import { BreeScheduler } from '@dailyuse/scheduler-server';

const scheduler = new BreeScheduler({
  root: false, // 禁用文件系统 Worker
});
```

**适用场景：**
- 生产环境
- 需要高可靠性
- 复杂的调度需求

### CronScheduler（轻量级）

使用 node-cron 库，轻量级实现。

```typescript
import { CronScheduler } from '@dailyuse/scheduler-server';

const scheduler = new CronScheduler();
```

**适用场景：**
- 开发环境
- 简单任务调度
- 资源受限的环境

### IntervalScheduler（简单）

基于原生 setInterval，零依赖。

```typescript
import { IntervalScheduler } from '@dailyuse/scheduler-server';

const scheduler = new IntervalScheduler();

// 注册间隔任务（毫秒）
await scheduler.register('heartbeat', 30000, handler); // 每 30 秒执行一次
```

**适用场景：**
- 心跳检测
- 简单的固定间隔任务

## API 文档

### ITaskHandler 接口

任务处理器必须实现的接口。

```typescript
export interface ITaskHandler {
  execute(taskId: string, context?: unknown): Promise<void>;
}
```

### IScheduler 接口

调度器必须实现的接口。

```typescript
export interface IScheduler {
  // 注册任务
  register(taskId: string, schedule: string | number, handler: ITaskHandler): Promise<void>;

  // 注销任务
  unregister(taskId: string): Promise<void>;

  // 启动调度器
  start(): Promise<void>;

  // 停止调度器
  stop(): Promise<void>;

  // 获取所有已注册的任务
  getRegisteredTasks(): string[];

  // 检查任务是否已注册
  isRegistered(taskId: string): boolean;
}
```

## Cron 表达式

支持标准的 Cron 表达式（BreeScheduler 和 CronScheduler）。

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12 或 JAN - DEC)
│ │ │ │ ┌───────────── 星期 (0 - 7 或 SUN - SAT)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### 常见示例

- `0 * * * *` - 每小时的第 0 分钟
- `0 0 * * *` - 每天的 00:00
- `0 0 * * 0` - 每周日的 00:00
- `0 9 * * 1-5` - 工作日的 09:00
- `*/5 * * * *` - 每 5 分钟

## 错误处理

```typescript
try {
  await scheduler.register('task-1', '0 * * * *', handler);
  await scheduler.start();
} catch (error) {
  console.error('调度器启动失败:', error);
}
```

## 高级用法

### 条件注册

```typescript
const taskIds = await repository.findAllActiveTaskIds();

for (const taskId of taskIds) {
  const task = await repository.findByUuid(taskId);
  await scheduler.register(taskId, task.cronExpression, handler);
}

await scheduler.start();
```

### 动态任务管理

```typescript
// 注销旧任务
if (scheduler.isRegistered('old-task')) {
  await scheduler.unregister('old-task');
}

// 注册新任务
await scheduler.register('new-task', '0 0 * * *', handler);
```

## 与 DailyUse 架构的集成

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         scheduler-server                │ ← 调度协调层
│  (何时执行？用什么引擎？)                 │
└──────────────────┬──────────────────────┘
                   ↓ 实现
        ┌──────────────────────┐
        │ application-server   │ ← 业务逻辑（如何执行？）
        └──────────────────────┘
                   ↓ 使用
        ┌──────────────────────┐
        │infrastructure-server │ ← 数据访问
        └──────────────────────┘
```

### 依赖关系

```
Application Server
  ├── implements: ITaskHandler
  ├── depends on: scheduler-server (接口)
  └── depends on: infrastructure-server (仓储)

Scheduler Server
  ├── defines: IScheduler, ITaskHandler
  └── NO dependency on application-server ✅
```

## 测试

```bash
# 运行单元测试
pnpm test

# 运行类型检查
pnpm run type-check

# 运行 Lint
pnpm run lint

# 构建
pnpm run build
```

## 性能考虑

### BreeScheduler
- **CPU 使用率** - 低（使用 Worker 隔离）
- **内存使用量** - 中（每个 Worker 独立内存）
- **最大任务数** - 取决于系统资源

### CronScheduler
- **CPU 使用率** - 低（事件驱动）
- **内存使用量** - 低（无 Worker 开销）
- **最大任务数** - 数千个

### IntervalScheduler
- **CPU 使用率** - 低（简单 setInterval）
- **内存使用量** - 最低
- **最大任务数** - 数千个

## 许可证

MIT

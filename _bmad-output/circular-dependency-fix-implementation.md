# 🔧 循环依赖修复方案 - 代码实现指南

**优先级**: P0 - 关键  
**范围**: 4 个文件需要修改 | 1 个容器包需要创建  
**预计工作量**: 2-3 小时  
**验证方法**: `npm run build` + `npm run test`

---

## 📐 架构修复概览

```
修复前 (循环):
┌─────────────────────────┐
│  infrastructure-server  │
│  (imports from app)  ◄──┼─── ❌ 反向依赖
│                         │
└────────────┬────────────┘
             │
             │ (imports containers)
             ▼
┌─────────────────────────┐
│  application-server     │
│  (needs infrastructure) │
└─────────────────────────┘

修复后 (正确):
┌─────────────────────────────────────────┐
│  application-server                     │
│  (Bootstrap phase: 初始化并注入 Services) │
└────────┬────────────────────────────────┘
         │ setXxxService(instance)
         ▼
┌─────────────────────────────────────────┐
│  infrastructure-server                  │
│  (Runtime phase: 使用已注入的 Services)   │
│  (imports only containers)              │
└─────────────────────────────────────────┘
```

---

## 📝 修复方案详细步骤

### 第一步: 创建 Infrastructure 容器类

#### 1.1 创建 Schedule 容器

**文件**: `packages/infrastructure-server/src/schedule/di/schedule-container.ts`

```typescript
import type { ScheduleTaskExecutor } from '@dailyuse/application-server';

/**
 * Schedule 基础设施容器
 * 
 * 目的: 在 Infrastructure Layer 中注入 Application Layer 的 Service 实例
 * 这样可以避免 Infrastructure 直接导入 Application (循环依赖问题)
 * 
 * 初始化流程:
 * 1. Application bootstrap 创建 Service 实例
 * 2. Application bootstrap 调用 scheduleContainer.setScheduleTaskExecutor(instance)
 * 3. Infrastructure Cron Jobs 通过 getScheduleTaskExecutor() 获取实例
 */
export class ScheduleInfrastructureContainer {
  private scheduleTaskExecutor?: ScheduleTaskExecutor;

  /**
   * 设置 Schedule Task Executor (由 Application 层调用)
   */
  setScheduleTaskExecutor(executor: ScheduleTaskExecutor): void {
    this.scheduleTaskExecutor = executor;
  }

  /**
   * 获取 Schedule Task Executor (由 Infrastructure Cron Jobs 调用)
   */
  getScheduleTaskExecutor(): ScheduleTaskExecutor {
    if (!this.scheduleTaskExecutor) {
      throw new Error(
        'ScheduleTaskExecutor not initialized. ' +
        'Make sure scheduleApplicationBootstrap() is called before starting cron jobs.'
      );
    }
    return this.scheduleTaskExecutor;
  }

  /**
   * 重置容器 (用于测试)
   */
  reset(): void {
    this.scheduleTaskExecutor = undefined;
  }
}

/**
 * 全局容器实例
 * 由于这只是一个注入点，可以是单例
 */
export const scheduleInfrastructureContainer = new ScheduleInfrastructureContainer();
```

#### 1.2 创建其他容器 (类似模式)

**文件**: `packages/infrastructure-server/src/reminder/di/reminder-container.ts`

```typescript
import type { ReminderApplicationService } from '@dailyuse/application-server';

export class ReminderInfrastructureContainer {
  private reminderApplicationService?: ReminderApplicationService;

  setReminderApplicationService(service: ReminderApplicationService): void {
    this.reminderApplicationService = service;
  }

  getReminderApplicationService(): ReminderApplicationService {
    if (!this.reminderApplicationService) {
      throw new Error('ReminderApplicationService not initialized');
    }
    return this.reminderApplicationService;
  }

  reset(): void {
    this.reminderApplicationService = undefined;
  }
}

export const reminderInfrastructureContainer = new ReminderInfrastructureContainer();
```

**文件**: `packages/infrastructure-server/src/ai/di/ai-container.ts`

```typescript
import type { AIApplicationService } from '@dailyuse/application-server';

export class AIInfrastructureContainer {
  private aiApplicationService?: AIApplicationService;

  setAIApplicationService(service: AIApplicationService): void {
    this.aiApplicationService = service;
  }

  getAIApplicationService(): AIApplicationService {
    if (!this.aiApplicationService) {
      throw new Error('AIApplicationService not initialized');
    }
    return this.aiApplicationService;
  }

  reset(): void {
    this.aiApplicationService = undefined;
  }
}

export const aiInfrastructureContainer = new AIInfrastructureContainer();
```

**文件**: `packages/infrastructure-server/src/goal/di/goal-container.ts`

```typescript
import type { FocusModeApplicationService } from '@dailyuse/application-server';

export class GoalInfrastructureContainer {
  private focusModeApplicationService?: FocusModeApplicationService;

  setFocusModeApplicationService(service: FocusModeApplicationService): void {
    this.focusModeApplicationService = service;
  }

  getFocusModeApplicationService(): FocusModeApplicationService {
    if (!this.focusModeApplicationService) {
      throw new Error('FocusModeApplicationService not initialized');
    }
    return this.focusModeApplicationService;
  }

  reset(): void {
    this.focusModeApplicationService = undefined;
  }
}

export const goalInfrastructureContainer = new GoalInfrastructureContainer();
```

---

### 第二步: 修改 Infrastructure Cron Jobs (移除导入)

#### 2.1 修改 Schedule Cron Job

**修改文件**: `packages/infrastructure-server/src/schedule/cron/cron-job-manager.ts`

```typescript
// ❌ 移除这行
// import { ScheduleTaskExecutor } from '@dailyuse/application-server';

// ✅ 添加这行
import { scheduleInfrastructureContainer } from '../di/schedule-container';

export class CronJobManager {
  execute() {
    // ❌ 旧方式 (导致循环依赖)
    // const executor = new ScheduleTaskExecutor();

    // ✅ 新方式 (从容器获取已注入的实例)
    const executor = scheduleInfrastructureContainer.getScheduleTaskExecutor();
    executor.execute();
  }
}
```

**修改文件**: `packages/infrastructure-server/src/schedule/datasources/cron-job-manager.ts`

```typescript
// ❌ 移除这行
// import { ScheduleTaskExecutor } from '@dailyuse/application-server';

// ✅ 添加这行
import { scheduleInfrastructureContainer } from '../di/schedule-container';

export class CronJobManager {
  execute() {
    // ✅ 使用容器获取已注入的 Service
    const executor = scheduleInfrastructureContainer.getScheduleTaskExecutor();
    executor.execute();
  }
}
```

#### 2.2 修改 Reminder Cron Job

**修改文件**: `packages/infrastructure-server/src/reminder/cron/daily-analysis-cron-job.ts`

```typescript
// ❌ 移除 Application Layer 导入
// import { ... } from '@dailyuse/application-server';

// ✅ 添加容器导入
import { reminderInfrastructureContainer } from '../di/reminder-container';

export class DailyAnalysisCronJob {
  async execute() {
    // ✅ 从容器获取 Service
    const reminderService = reminderInfrastructureContainer.getReminderApplicationService();
    await reminderService.analyze();
  }
}
```

#### 2.3 修改 AI Container

**修改文件**: `packages/infrastructure-server/src/ai/di/a-i-container.ts`

```typescript
// ❌ 移除 Application Layer 导入
// import { ... } from '@dailyuse/application-server';

// ✅ 添加自身容器导入
import { aiInfrastructureContainer } from './ai-container';

export class AIContainer {
  initializeServices() {
    // ✅ 从容器获取已注入的 Service
    const aiService = aiInfrastructureContainer.getAIApplicationService();
    // ... 使用 aiService ...
  }
}
```

#### 2.4 修改 Goal Cron Job

**修改文件**: `packages/infrastructure-server/src/goal/cron/focus-mode-cron-job.ts`

```typescript
// ❌ 移除这行
// import { FocusModeApplicationService } from '@dailyuse/application-server';

// ✅ 添加这行
import { goalInfrastructureContainer } from '../di/goal-container';

export class FocusModeCronJob {
  async execute() {
    // ✅ 从容器获取已注入的 Service
    const focusModeService = goalInfrastructureContainer.getFocusModeApplicationService();
    await focusModeService.startFocusMode();
  }
}
```

---

### 第三步: Application 中添加 Bootstrap 初始化

#### 3.1 创建 Bootstrap 模块

**新文件**: `packages/application-server/src/bootstrap/infrastructure-injection-bootstrap.ts`

```typescript
/**
 * Infrastructure Injection Bootstrap
 * 
 * 目的: 在应用启动时，将 Application Layer Services 注入到 Infrastructure Layer 容器中
 * 这样可以避免循环依赖，同时保持架构的分层设计
 * 
 * 执行顺序:
 * 1. 应用启动
 * 2. 调用 bootstrapInfrastructureInjection()
 * 3. 此函数创建所有必要的 Application Services
 * 4. 将它们注入到 Infrastructure 容器
 * 5. 现在 Infrastructure 可以在运行时使用这些 Services
 */

import {
  scheduleInfrastructureContainer,
  reminderInfrastructureContainer,
  aiInfrastructureContainer,
  goalInfrastructureContainer,
} from '@dailyuse/infrastructure-server';

import { ScheduleTaskExecutor } from '../schedule/services/schedule-task-executor';
import { ReminderApplicationService } from '../reminder/services/reminder-application-service';
import { AIApplicationService } from '../ai/services/ai-application-service';
import { FocusModeApplicationService } from '../goal/services/focus-mode-application-service';

/**
 * 引导 Infrastructure 注入
 * 在应用启动时调用此函数
 */
export async function bootstrapInfrastructureInjection(): Promise<void> {
  try {
    // 1. 创建 Schedule Services
    const scheduleTaskExecutor = new ScheduleTaskExecutor();
    scheduleInfrastructureContainer.setScheduleTaskExecutor(scheduleTaskExecutor);
    console.log('[Bootstrap] ✅ Schedule services injected');

    // 2. 创建 Reminder Services
    const reminderService = new ReminderApplicationService();
    reminderInfrastructureContainer.setReminderApplicationService(reminderService);
    console.log('[Bootstrap] ✅ Reminder services injected');

    // 3. 创建 AI Services
    const aiService = new AIApplicationService();
    aiInfrastructureContainer.setAIApplicationService(aiService);
    console.log('[Bootstrap] ✅ AI services injected');

    // 4. 创建 Goal Services
    const focusModeService = new FocusModeApplicationService();
    goalInfrastructureContainer.setFocusModeApplicationService(focusModeService);
    console.log('[Bootstrap] ✅ Goal services injected');

    console.log('[Bootstrap] ✅ All infrastructure injections completed successfully');
  } catch (error) {
    console.error('[Bootstrap] ❌ Failed to bootstrap infrastructure injection:', error);
    throw error;
  }
}

/**
 * 清理注入 (用于测试清理)
 */
export function cleanupInfrastructureInjection(): void {
  scheduleInfrastructureContainer.reset();
  reminderInfrastructureContainer.reset();
  aiInfrastructureContainer.reset();
  goalInfrastructureContainer.reset();
}
```

#### 3.2 在主应用中调用 Bootstrap

**修改文件**: `packages/application-server/src/main.ts` (或应用入口点)

```typescript
import { bootstrapInfrastructureInjection } from './bootstrap/infrastructure-injection-bootstrap';

async function main() {
  try {
    // 1️⃣ 首先注入 Infrastructure Services (必须在启动 Cron 之前)
    await bootstrapInfrastructureInjection();

    // 2️⃣ 然后启动其他服务 (现在可以安全地使用 Infrastructure)
    // ... 启动其他模块 ...

    console.log('✅ Application started successfully');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

main();
```

---

## 🧪 验证清单

### 编译检查
```bash
# 检查 TypeScript 编译 (应该无错误)
npm run typecheck

# 构建项目 (应该成功，无循环依赖错误)
npm run build

# 详细的 Nx 构建输出
npx nx build
```

### 预期输出
```
✅ infrastructure-server:build SUCCESS
✅ application-server:build SUCCESS  
✅ All projects built successfully
```

### 测试验证
```bash
# 运行单元测试
npm run test

# 运行特定模块的测试
npx nx test packages/infrastructure-server
npx nx test packages/application-server
```

### 依赖检查
```bash
# 使用 Nx 检查依赖 (应该显示正确的单向依赖)
npx nx graph --file=/tmp/deps.json

# 手动检查导入 (应该找不到反向导入)
grep -r "from.*application-server" packages/infrastructure-server/src

# ✅ 预期: 只在导入类型和容器时出现，不在直接业务逻辑中
```

---

## 📚 修改影响分析

| 文件 | 类型 | 修改 | 风险 |
|------|------|------|------|
| `schedule-container.ts` | 新建 | 创建容器类 | 🟢 低 |
| `reminder-container.ts` | 新建 | 创建容器类 | 🟢 低 |
| `ai-container.ts` | 新建 | 创建容器类 | 🟢 低 |
| `goal-container.ts` | 新建 | 创建容器类 | 🟢 低 |
| `cron-job-manager.ts` | 修改 | 移除导入，使用容器 | 🟡 中 |
| `daily-analysis-cron-job.ts` | 修改 | 移除导入，使用容器 | 🟡 中 |
| `a-i-container.ts` | 修改 | 移除导入，使用容器 | 🟡 中 |
| `focus-mode-cron-job.ts` | 修改 | 移除导入，使用容器 | 🟡 中 |
| `infrastructure-injection-bootstrap.ts` | 新建 | 初始化函数 | 🟢 低 |
| `main.ts` | 修改 | 调用 bootstrap | 🟢 低 |

**总体风险**: 🟢 **低** - 所有修改都是局部的，不会影响核心业务逻辑

---

## 🔄 回滚计划

如果需要回滚:

```bash
# 1. 恢复所有 Infrastructure 文件到上一个版本
git checkout HEAD -- packages/infrastructure-server/src

# 2. 移除新添加的容器文件
git rm packages/infrastructure-server/src/*/di/*-container.ts

# 3. 恢复 Application 的 main.ts
git checkout HEAD -- packages/application-server/src/main.ts

# 4. 移除 bootstrap 文件
git rm packages/application-server/src/bootstrap/infrastructure-injection-bootstrap.ts

# 5. 验证回滚
npm run build
```

---

## 🚀 执行时间表

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| 1 | 创建容器类 (4 个文件) | 30 分钟 |
| 2 | 修改 Cron Jobs (4 个文件) | 20 分钟 |
| 3 | 创建 Bootstrap 模块 | 15 分钟 |
| 4 | 集成测试和验证 | 30 分钟 |
| 5 | 文档和提交 | 15 分钟 |
| **总计** | | **~2 小时** |

---

## ✅ 成功标志

- ✅ `npm run build` 成功，无循环依赖错误
- ✅ `npm run typecheck` 通过，类型正确
- ✅ `npm run test` 所有测试通过
- ✅ Cron 任务正常启动和执行
- ✅ 日志中看到 `[Bootstrap] ✅ All infrastructure injections completed successfully`

---

**准备就绪！** 🚀 建议立即实施此方案以解决阻止项目构建的循环依赖问题。


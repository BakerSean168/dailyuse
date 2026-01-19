# 🔴 循环依赖问题 - 快速参考指南

**生成时间**: 2026-01-19 | **优先级**: P0 - 关键  
**状态**: 已分析、方案已提供、待执行

---

## 📌 一句话总结

```
❌ 问题: infrastructure-server ↔ application-server 循环依赖
✅ 原因: Infrastructure 反向导入 Application (违反分层架构)
🔧 方案: 依赖注入容器 + Bootstrap 初始化
⏱️ 工作量: 2-3 小时
🎯 结果: AC3 & AC4 将被解除阻止
```

---

## 🎯 阻止项目的问题

| 指标                     | 当前    | 原因     |
| ------------------------ | ------- | -------- |
| **AC3: TypeScript 编译** | ⚠️ 失败 | 循环导入 |
| **AC4: 所有测试通过**    | ⚠️ 失败 | 无法构建 |
| **npm run build**        | 🔴 失败 | 循环依赖 |
| **npm run typecheck**    | 🔴 失败 | 循环导入 |

---

## 🔍 问题根本原因

### 循环导入链

```
应用启动:
1. application-server 导入 ScheduleContainer
   └─ 来自 infrastructure-server ✅ (正确)

2. infrastructure-server 导入 ScheduleTaskExecutor
   └─ 来自 application-server ❌ (错误)

结果: 循环依赖!
```

### 问题文件

需要修改 Infrastructure 中的这 5 个文件:

```
packages/infrastructure-server/src/
├── schedule/cron/cron-job-manager.ts                    ← 导入 application-server
├── schedule/datasources/cron-job-manager.ts            ← 导入 application-server
├── reminder/cron/daily-analysis-cron-job.ts            ← 导入 application-server
├── ai/di/a-i-container.ts                              ← 导入 application-server
└── goal/cron/focus-mode-cron-job.ts                     ← 导入 application-server
```

---

## ✅ 解决方案 (依赖注入)

### 三个核心步骤

#### 1️⃣ 创建容器类 (4 个新文件)

```typescript
// 每个容器都有相同的模式:

export class ScheduleInfrastructureContainer {
  private service?: Service;

  setService(s: Service) {
    this.service = s;
  }
  getService(): Service {
    if (!this.service) throw new Error('Not initialized');
    return this.service;
  }
  reset() {
    this.service = undefined;
  }
}

export const container = new ScheduleInfrastructureContainer();
```

**需要创建**:

- `schedule/di/schedule-container.ts`
- `reminder/di/reminder-container.ts`
- `ai/di/ai-container.ts`
- `goal/di/goal-container.ts`

#### 2️⃣ 修改 Cron Jobs (5 个文件改动)

**修改前**:

```typescript
import { ScheduleTaskExecutor } from '@dailyuse/application-server'; // ❌ 循环!

class CronJobManager {
  execute() {
    const executor = new ScheduleTaskExecutor();
  }
}
```

**修改后**:

```typescript
import { scheduleInfrastructureContainer } from '../di/schedule-container';

class CronJobManager {
  execute() {
    const executor = scheduleInfrastructureContainer.getScheduleTaskExecutor();
  }
}
```

#### 3️⃣ 添加 Bootstrap 初始化

```typescript
// packages/application-server/src/bootstrap/infrastructure-injection-bootstrap.ts

export async function bootstrapInfrastructureInjection() {
  const executor = new ScheduleTaskExecutor();
  scheduleInfrastructureContainer.setScheduleTaskExecutor(executor);
  // ... 其他服务 ...
}

// 在 main.ts 中调用:
await bootstrapInfrastructureInjection();
```

---

## 📊 修改清单

### 新建文件 (4 个)

- [ ] `packages/infrastructure-server/src/schedule/di/schedule-container.ts`
- [ ] `packages/infrastructure-server/src/reminder/di/reminder-container.ts`
- [ ] `packages/infrastructure-server/src/ai/di/ai-container.ts`
- [ ] `packages/infrastructure-server/src/goal/di/goal-container.ts`

### 修改文件 (5 个 Infrastructure)

- [ ] `packages/infrastructure-server/src/schedule/cron/cron-job-manager.ts`
  - 移除: `import { ScheduleTaskExecutor } from '@dailyuse/application-server'`
  - 添加: 使用 container 获取 service

- [ ] `packages/infrastructure-server/src/schedule/datasources/cron-job-manager.ts`
  - 移除: `import { ScheduleTaskExecutor } from '@dailyuse/application-server'`
  - 添加: 使用 container 获取 service

- [ ] `packages/infrastructure-server/src/reminder/cron/daily-analysis-cron-job.ts`
  - 移除: `import { ... } from '@dailyuse/application-server'`
  - 添加: 使用 container 获取 service

- [ ] `packages/infrastructure-server/src/ai/di/a-i-container.ts`
  - 移除: `import { ... } from '@dailyuse/application-server'`
  - 添加: 使用 container 获取 service

- [ ] `packages/infrastructure-server/src/goal/cron/focus-mode-cron-job.ts`
  - 移除: `import { FocusModeApplicationService } from '@dailyuse/application-server'`
  - 添加: 使用 container 获取 service

### 修改文件 (1 个 Application)

- [ ] `packages/application-server/src/bootstrap/infrastructure-injection-bootstrap.ts` (新建)
  - 创建所有 Application Services
  - 调用所有 container.setXxxService()

- [ ] `packages/application-server/src/main.ts` (修改)
  - 添加: `await bootstrapInfrastructureInjection()`

---

## 🚀 执行步骤

```bash
# 第一步: 创建所有新文件
# (参考 circular-dependency-fix-implementation.md)

# 第二步: 修改所有 Cron Job 文件
# (从文件中移除 application-server 导入)
# (改用 container 获取 service)

# 第三步: 验证
npm run typecheck          # ✅ 应该通过
npm run lint              # ✅ 应该通过
npm run build             # ✅ 应该成功
npm run test              # ✅ 应该通过
npm run start             # ✅ 应该启动

# 第四步: 提交
git commit -m "fix: resolve circular dependency..."
git push
```

---

## ✅ 验证成功的标志

```
✅ npm run build 成功 (无循环依赖错误)
✅ npm run typecheck 成功 (无类型错误)
✅ npm run test 成功 (所有测试通过)
✅ 应用启动日志: "[Bootstrap] ✅ All infrastructure injections completed successfully"
✅ Cron 任务正常启动和执行
✅ 无 "Service not initialized" 错误
```

---

## 📚 详细文档

| 文档                                                                                   | 内容               |
| -------------------------------------------------------------------------------------- | ------------------ |
| [circular-dependency-analysis.md](circular-dependency-analysis.md)                     | 详细的问题分析     |
| [circular-dependency-fix-implementation.md](circular-dependency-fix-implementation.md) | 完整的代码实现指南 |
| [circular-dependency-fix-verification.md](circular-dependency-fix-verification.md)     | 测试验证清单       |
| [party-mode-discussion-summary.md](party-mode-discussion-summary.md)                   | 讨论总结和决策     |

---

## ⚡ 速度执行指南

### 快速 5 分钟理解

```
问题: Infrastructure 和 Application 相互导入
方案: 使用容器模式实现注入，打破循环
步骤:
1. 创建 4 个容器类
2. 修改 5 个 Cron Job 文件
3. 添加 1 个 Bootstrap 函数
4. 运行验证

结果: AC3 和 AC4 解除阻止! 🚀
```

### 快速 30 分钟实施

```bash
# 第一阶段: 创建容器 (10 分钟)
# - 复制粘贴容器模式创建 4 个文件

# 第二阶段: 修改 Cron Jobs (10 分钟)
# - 在每个文件中替换导入语句
# - 改用 container.getXxxService()

# 第三阶段: Bootstrap (5 分钟)
# - 创建 bootstrap 函数
# - 在 main.ts 中调用

# 第四阶段: 验证 (5 分钟)
# - 运行 build 和 test
# - 检查是否成功
```

---

## 🔐 风险降低措施

| 风险              | 影响 | 缓解                    |
| ----------------- | ---- | ----------------------- |
| Services 未初始化 | 高   | 容器检查 + 清晰错误消息 |
| 初始化顺序错误    | 中   | 文档 + 日志             |
| 测试污染          | 中   | cleanup() 函数          |

**总体**: 🟢 低风险

---

## 📞 需要帮助?

- ❓ **理解问题?** 看 [party-mode-discussion-summary.md](party-mode-discussion-summary.md)
- 🔧 **如何编码?** 看 [circular-dependency-fix-implementation.md](circular-dependency-fix-implementation.md)
- ✅ **如何验证?** 看 [circular-dependency-fix-verification.md](circular-dependency-fix-verification.md)
- 📊 **完整分析?** 看 [circular-dependency-analysis.md](circular-dependency-analysis.md)

---

## 🎯 关键提醒

> ⚠️ **重要**: Bootstrap 必须在应用启动时**第一时间**调用，在任何 Cron Jobs 启动之前！

> ⚠️ **重要**: 不要忘记从 Infrastructure 中移除所有 `from '@dailyuse/application-server'` 导入！

> ⚠️ **重要**: 在测试中使用 `cleanupInfrastructureInjection()` 清理状态！

---

## 📈 预期收益

```
修复前:
├─ ❌ 无法编译 (AC3)
├─ ❌ 无法测试 (AC4)
├─ ❌ CI/CD 管道失效
└─ 🚫 无法发布

修复后:
├─ ✅ 编译成功 (AC3)
├─ ✅ 测试运行 (AC4)
├─ ✅ CI/CD 正常
└─ 🚀 可以发布
```

---

**📍 状态**: 方案已准备就绪，等待执行 🚀

**⏰ 预计时间**: 2-3 小时 (包括验证)

**👤 负责人**: Dev Team

**📅 建议**: 今日开始实施

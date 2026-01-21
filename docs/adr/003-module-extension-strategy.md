# ADR-003: 模块扩展策略 - 习惯与专注功能

> **状态**: ✅ Accepted  
> **决策日期**: 2025-12-08  
> **决策者**: Development Team  
> **相关 EPICs**: EPIC-006, EPIC-007, EPIC-008

---

## 📋 背景

在规划 EPIC-006/007/008（智能效率增强、专注模式、习惯追踪）时，面临一个关键架构决策：

**是新增独立模块（`focus`、`habit` 模块），还是扩展现有模块（`goal`、`reminder` 模块）？**

---

## 🎯 决策

### ✅ **采用模块扩展策略**

1. **专注功能（Pomodoro、Focus Mode）** → **扩展 `goal` 模块**
2. **习惯提醒系统** → **扩展 `reminder` 模块**
3. **习惯管理（CRUD + Streak）** → **新增轻量级 `habit` 模块**（但提醒功能委托给 `reminder`）

---

## 🔍 决策理由

### 1️⃣ **专注功能扩展 Goal 模块**

#### ✅ 优势

| 维度 | 说明 |
|------|------|
| **业务语义** | 专注是为了完成目标/任务，自然属于 Goal 领域 |
| **数据流转** | 专注时长直接累积到 Goal 进度，无需跨模块查询 |
| **统计集成** | Goal 已有 `GoalStatistics` 聚合根，专注统计自然融入 |
| **用户体验** | 用户在目标详情页直接看到专注记录，心智模型一致 |

#### 📐 实现方式

```typescript
// packages/domain-client/src/goal/
├── entities/
│   ├── PomodoroSession.ts       // 番茄钟会话实体
│   └── FocusSession.ts          // 通用专注会话
├── value-objects/
│   ├── PomodoroSettings.ts      // 番茄钟设置
│   └── FocusStatistics.ts       // 专注统计
└── aggregates/
    └── Goal.ts                  // 扩展方法:
                                 // - recordFocusSession()
                                 // - getPomodoroStats()
                                 // - totalFocusMinutes
```

#### 📊 数据模型扩展

```typescript
// Goal 聚合根扩展
export class Goal extends AggregateRoot implements GoalClient {
  // ... 现有字段
  
  // 新增专注相关字段
  private _totalFocusMinutes: number = 0;
  private _pomodoroCount: number = 0;
  private _focusSessions: FocusSession[] = [];
  
  // 新增方法
  recordPomodoroSession(session: PomodoroSession): void {
    this._pomodoroCount++;
    this._totalFocusMinutes += session.duration / 60;
    this.addDomainEvent(new PomodoroCompletedEvent(this.uuid, session));
  }
  
  getPomodoroStats(): PomodoroStats {
    return {
      totalPomodoros: this._pomodoroCount,
      totalFocusMinutes: this._totalFocusMinutes,
      averageSessionLength: this.calculateAverageSessionLength(),
    };
  }
}
```

#### 🚫 避免的问题

如果新增独立 `focus` 模块：
- ❌ **数据孤岛**: 专注统计与目标进度隔离
- ❌ **重复查询**: 需要跨模块关联查询 `Goal + FocusSession`
- ❌ **用户困惑**: 为什么专注和目标是两个东西？
- ❌ **维护成本**: 双重统计系统（GoalStatistics + FocusStatistics）

---

### 2️⃣ **习惯提醒扩展 Reminder 模块**

#### ✅ 优势

| 维度 | 说明 | 复用率 |
|------|------|--------|
| **提醒调度** | 复用 `ReminderTemplate` 的时间触发、重复规则 | 85% |
| **通知管理** | 复用 `NotificationConfig` 的多渠道通知 | 100% |
| **免打扰** | 复用 `DoNotDisturbPeriod` 的时段控制 | 100% |
| **提醒日志** | 复用 `ReminderHistory` 的执行记录 | 100% |

#### 📐 实现方式

```typescript
// packages/domain-client/src/reminder/entities/
export class HabitReminder extends ReminderTemplate {
  private _habitId: string;
  private _chainTrigger?: HabitChainConfig;
  private _locationTrigger?: LocationConfig;
  
  // 继承 ReminderTemplate 的所有能力:
  // - triggerConfig (时间配置)
  // - recurrence (重复规则)
  // - notificationConfig (通知设置)
  // - activeTimeConfig (生效时段)
  
  // 扩展习惯特定功能
  checkHabitChain(): boolean {
    // 检查习惯链是否满足触发条件
  }
  
  checkLocationTrigger(currentLocation: Location): boolean {
    // 检查地理位置触发条件
  }
}
```

#### 🔄 服务层扩展

```typescript
// packages/application-client/src/reminder/services/
export class HabitReminderService extends ReminderService {
  // 继承基础提醒能力
  // + 扩展习惯特定逻辑
  
  async createHabitReminder(
    habitId: string,
    config: HabitReminderConfig
  ): Promise<HabitReminder> {
    // 1. 调用父类创建基础提醒
    const baseReminder = await super.createReminder(config);
    
    // 2. 扩展习惯特定字段
    const habitReminder = new HabitReminder(baseReminder);
    habitReminder.setHabitId(habitId);
    
    return habitReminder;
  }
  
  async scheduleHabitChain(habitIds: string[]): Promise<void> {
    // 习惯链特有逻辑
  }
}
```

#### 🚫 避免的问题

如果独立实现习惯提醒系统：
- ❌ **重复造轮子**: 需要重新实现定时任务调度（与 `ReminderScheduler` 重复）
- ❌ **双重维护**: 提醒 bug 需要在两个模块修复
- ❌ **通知混乱**: 两套通知系统（reminder + habit），用户体验割裂
- ❌ **代码膨胀**: 70% 的代码与 `reminder` 模块重复

---

### 3️⃣ **习惯管理保持独立（但轻量）**

#### ✅ 为什么需要独立 `habit` 模块？

| 原因 | 说明 |
|------|------|
| **独立领域** | 习惯管理是独立的业务领域（Bounded Context） |
| **核心实体** | `Habit` 聚合根有自己的生命周期（创建、归档、Streak） |
| **低耦合** | 与 Goal/Task/Reminder 都有关联，但不从属于任何一个 |

#### 📐 职责边界

```typescript
// Habit 模块：只负责习惯本身的管理
habit/
├── aggregates/
│   └── Habit.ts            // 习惯 CRUD、Streak 计算
├── entities/
│   ├── HabitCheckIn.ts     // 打卡记录
│   └── HabitStreak.ts      // 连续打卡
└── services/
    └── HabitService.ts     // 习惯业务逻辑

// Reminder 模块：负责习惯提醒
reminder/
└── entities/
    └── HabitReminder.ts    // 习惯提醒（扩展 ReminderTemplate）

// Goal 模块：负责习惯统计
goal/
└── aggregates/
    └── GoalStatistics.ts   // 习惯可以作为长期目标追踪
```

#### 🔄 模块协作

```typescript
// 创建习惯时自动创建提醒
async createHabit(habitData: CreateHabitInput): Promise<Habit> {
  // 1. Habit 模块：创建习惯
  const habit = await habitService.create(habitData);
  
  // 2. Reminder 模块：创建提醒（如果用户设置了提醒时间）
  if (habitData.reminderTime) {
    await habitReminderService.createHabitReminder(
      habit.id,
      habitData.reminderTime
    );
  }
  
  return habit;
}
```

---

## 📊 对比总结

### 代码复用率

| 功能 | 新增模块 | 扩展模块 | 节省代码 |
|------|---------|---------|---------|
| 专注功能 | 100% 新代码 | 复用 Goal 统计 65% | **~800 行** |
| 习惯提醒 | 100% 新代码 | 复用 Reminder 85% | **~1500 行** |
| **总计** | **~3500 行** | **~1200 行** | **~2300 行** |

### 维护成本

| 维度 | 新增模块 | 扩展模块 |
|------|---------|---------|
| Bug 修复 | 需要在多个模块修复 | 统一修复 |
| 功能迭代 | 需要跨模块协调 | 同模块内演进 |
| 测试覆盖 | 需要大量集成测试 | 单元测试为主 |
| 文档维护 | 多份文档 | 统一文档 |

### 用户体验

| 场景 | 新增模块 | 扩展模块 |
|------|---------|---------|
| 查看专注统计 | 需要切换到专注模块 | 目标详情页直接显示 ✅ |
| 设置习惯提醒 | 需要在两个入口设置 | 统一的提醒管理界面 ✅ |
| 数据关联查询 | 需要手动关联 | 自动关联（聚合根内部）✅ |

---

## 🏗️ 实施计划

### Phase 1: 重构 Story 定义（已完成）

- ✅ STORY-032: 番茄钟计时器（Goal 模块扩展）
- ✅ STORY-033: 专注模式 UI（Goal 模块视图）
- ✅ STORY-035: 专注统计与徽章（Goal 模块统计）
- ✅ STORY-041: 习惯提醒系统（Reminder 模块扩展）
- ✅ STORY-037: 习惯管理（独立 Habit 模块）

### Phase 2: 模块扩展实施（待开发）

```
Week 1-2: Goal 模块扩展
  - PomodoroSession 实体
  - FocusStatistics 值对象
  - Goal.recordFocusSession() 方法

Week 3-4: Reminder 模块扩展
  - HabitReminder 实体（继承 ReminderTemplate）
  - HabitReminderService
  - 习惯链、地理位置触发器

Week 5: Habit 模块独立实现
  - Habit 聚合根
  - HabitCheckIn、HabitStreak 实体
  - HabitService
```

---

## 🎯 成功指标

| 指标 | 目标 | 原因 |
|------|------|------|
| 代码复用率 | ≥ 70% | 避免重复造轮子 |
| 集成测试数量 | < 30% (单元测试为主) | 低耦合 |
| 模块间依赖 | 单向依赖 | 清晰的架构层次 |
| 用户操作路径 | ≤ 3 步 | 简化用户体验 |

---

## 📚 相关文档

- [DDD 类型架构规范](../ddd-type-architecture.md)
- [Goal 模块架构](../../packages/packages-domain-client.md#goal-模块)
- [Reminder 模块架构](../../packages/packages-domain-client.md#reminder-模块)
- [EPIC-006: Smart Productivity](../../sprint-artifacts/EPIC-006-smart-productivity.md)
- [EPIC-007: Pomodoro & Focus](../../sprint-artifacts/EPIC-007-pomodoro-focus.md)
- [EPIC-008: Habits & Streaks](../../sprint-artifacts/EPIC-008-habits-streaks.md)

---

## 🔄 历史记录

| 日期 | 版本 | 变更 | 作者 |
|------|------|------|------|
| 2025-12-08 | v1.0 | 初始决策文档 | GitHub Copilot |

---

## 📝 备注

### 为什么不全部合并到一个模块？

**平衡原则**: 既要避免过度拆分（微服务陷阱），也要避免巨石模块（单体地狱）

| 场景 | 决策 |
|------|------|
| 功能复用 > 70% | ✅ 扩展现有模块 |
| 独立业务领域 | ✅ 新增模块（但保持轻量） |
| 功能复用 < 30% | ✅ 新增独立模块 |

### 如何判断是否需要新增模块？

参考 **DDD Bounded Context** 判断标准：

1. ✅ **独立的业务概念** (Habit 有自己的生命周期)
2. ✅ **不同的团队负责** (如果规模扩大，可以独立开发)
3. ✅ **可独立部署** (未来可以微服务化)
4. ❌ **核心能力依赖其他模块** (Habit Reminder 依赖 Reminder 70%)

### 未来演进方向

```
短期（6个月内）:
  - Goal 模块扩展完成
  - Reminder 模块扩展完成
  - Habit 模块轻量实现

中期（1年内）:
  - 考虑将 FocusStatistics 独立为 Analytics 模块
  - 考虑将 Badge 系统独立为 Gamification 模块

长期（2年内）:
  - 微服务化：Habit Service 可独立部署
  - 跨平台共享：Reminder 引擎可服务多个客户端
```

---

**决策状态**: ✅ **已接受并执行**  
**下一步**: 开始 Phase 2 实施（模块扩展开发）

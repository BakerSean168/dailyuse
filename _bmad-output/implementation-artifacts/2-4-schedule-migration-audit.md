# Story 2.4: Schedule 模块迁移审计 (Audit Report)

**日期**: 2026-01-17  
**状态**: 进行中 (In Progress)

## I. 关键发现 ⚡

**重要**: Schedule 模块的绝大多数业务逻辑已经存在于 packages 中!

- ✅ `packages/infrastructure-client/src/schedule/` - 已有完整的基础设施层
- ✅ `packages/application-client/src/schedule/` - 已有 30+ 个用例 (Use Cases)
- ✅ `packages/domain-client/src/schedule/` - 已有实体和值对象

**实际问题**: Web 层存在冗余的应用服务，这些服务在 packages 中已经存在!

**真正的 Story 2.4 目标**:

1. ❌ 删除 Web 层冗余的应用服务 (ScheduleEventApplicationService 等)
2. ✅ 创建导入桥接 (re-exports bridge)
3. ✅ 更新所有 Web 导入指向 packages
4. ✅ 清理并验证

**对标 Task 模块**:

- Task 模块故事 2-1 到 2-3 完成了服务迁移
- Schedule 模块中服务已迁移，但 Web 层未更新导入

---

## II. 模块结构分析 (更正版)

### 当前结构 (apps/web/src/modules/schedule)

```
schedule/
├── application/                     (应用层)
│   ├── index.ts                    (导出)
│   └── services/
│       ├── ScheduleEventApplicationService.ts       [🔴 需迁移]
│       ├── ScheduleConflictApplicationService.ts    [🔴 需迁移]
│       └── ScheduleTaskDetailService.ts             [🔴 需迁移]
├── infrastructure/                  (基础设施层)
│   └── api/
│       ├── index.ts
│       ├── scheduleApiClient.ts                     [🔴 需迁移]
│       ├── scheduleEventApiClient.ts                [🔴 需迁移]
│       └── scheduleTaskApi.ts                       [🔴 需迁移]
├── services/                        (Web应用服务)
│   └── ScheduleWebApplicationService.ts             [🔴 需迁移]
├── initialization/
│   └── scheduleInitialization.ts                    [⚪ 需更新导入]
├── presentation/                    (展示层 - 保留)
│   ├── components/                  [✅ 保留在 web]
│   │   ├── cards/
│   │   ├── ConflictAlert.vue
│   │   ├── CreateScheduleDialog.vue
│   │   ├── ScheduleConflictAlert.vue
│   │   ├── ScheduleEventList.vue
│   │   ├── ScheduleFormDemo.vue
│   │   ├── ScheduleTaskDetailDialog.vue
│   │   ├── WeekViewCalendar.vue
│   │   └── index.ts
│   ├── composables/                 [⚪ 部分迁移,部分保留]
│   │   ├── useSchedule.ts           [🔴 迁移逻辑,保留展示]
│   │   ├── useScheduleEvent.ts      [🔴 迁移逻辑,保留展示]
│   │   └── useScheduleTaskDetail.ts [🔴 迁移逻辑,保留展示]
│   ├── router/                      [✅ 保留在 web]
│   │   └── index.ts
│   ├── views/                       [✅ 保留在 web]
│   │   ├── ScheduleDashboardView.vue
│   │   └── ScheduleWeekView.vue
│   └── widgets/                     [✅ 保留在 web]
│       ├── registerScheduleWidgets.ts
│       └── ScheduleStatsWidget.vue
└── index.ts                         (模块导出 - 需更新)
```

**文件统计**:

- 总文件: 27 (17 TypeScript, 10 Vue)
- 需迁移: 9 TypeScript 文件
- 需保留: 8 Vue 组件 + 3 TypeScript 展示代码
- 需更新导入: 1 初始化文件

---

## II. 分层分析

### A. Infrastructure 层 (基础设施层)

**位置**: `apps/web/src/modules/schedule/infrastructure/api/`

**文件列表**:

1. **scheduleApiClient.ts** (261 行)
   - 职责: Schedule API 调用的客户端
   - 主要方法: CRUD operations for schedules and tasks
   - 依赖:
     - `@/shared/api/instances` (apiClient)
     - `@dailyuse/contracts/schedule`
   - **目标**: 迁移到 `packages/infrastructure-client/src/schedule/clients/`

2. **scheduleEventApiClient.ts**
   - 职责: ScheduleEvent API 特定的客户端
   - **目标**: 迁移到 `packages/infrastructure-client/src/schedule/clients/`

3. **scheduleTaskApi.ts**
   - 职责: ScheduleTask API 特定的客户端
   - **目标**: 迁移到 `packages/infrastructure-client/src/schedule/clients/`

**迁移映射**:

```
apps/web/src/modules/schedule/infrastructure/api/
  ├── scheduleApiClient.ts → packages/infrastructure-client/src/schedule/clients/schedule.api.client.ts
  ├── scheduleEventApiClient.ts → packages/infrastructure-client/src/schedule/clients/schedule-event.api.client.ts
  └── scheduleTaskApi.ts → packages/infrastructure-client/src/schedule/clients/schedule-task.api.client.ts
```

**导出桥接**: `packages/infrastructure-client/src/schedule/index.ts`

---

### B. Application 层 (应用层)

**位置**: `apps/web/src/modules/schedule/application/services/`

**文件列表**:

1. **ScheduleEventApplicationService.ts** (116 行)
   - 职责: ScheduleEvent CRUD 和业务逻辑
   - 依赖:
     - `@dailyuse/contracts/schedule`
     - `scheduleEventApiClient` from infrastructure
     - `@dailyuse/domain-client/schedule`
     - `@dailyuse/utils` (createLogger)
   - 模式: Singleton with getInstance()
   - **目标**: 迁移到 `packages/application-client/src/schedule/services/`

2. **ScheduleConflictApplicationService.ts**
   - 职责: Schedule 冲突检测和解析
   - **目标**: 迁移到 `packages/application-client/src/schedule/services/`

3. **ScheduleTaskDetailService.ts**
   - 职责: Schedule Task 详情管理
   - **目标**: 迁移到 `packages/application-client/src/schedule/services/`

**Web特定服务**:

4. **ScheduleWebApplicationService.ts** (367 行)
   - 职责: Web层的高层协调服务
   - 特性: 组合基础设施层和应用层
   - 模式: Singleton
   - 依赖:
     - `scheduleApiClient` from infrastructure
     - `ScheduleTask` from domain-client
   - **决策**: 部分迁移 + 部分创建新的 Web 适配器
     - **Option A** (推荐): 迁移核心业务逻辑到 `packages/application-client/src/schedule/services/schedule.web.adapter.ts`
     - 保留 Web 特定的展示逻辑在 `apps/web/src/modules/schedule/services/`

**迁移映射**:

```
apps/web/src/modules/schedule/application/services/
  ├── ScheduleEventApplicationService.ts → packages/application-client/src/schedule/services/schedule-event.application.service.ts
  ├── ScheduleConflictApplicationService.ts → packages/application-client/src/schedule/services/schedule-conflict.application.service.ts
  └── ScheduleTaskDetailService.ts → packages/application-client/src/schedule/services/schedule-task-detail.service.ts
```

---

### C. Domain 层 (领域层)

**注**: Schedule domain 可能已在 `packages/domain-client/src/schedule/` 存在

**检查需求**:

- [ ] 查看 `packages/domain-client/src/schedule/` 是否已有实体
- [ ] 审查现有实体是否完整
- [ ] 识别缺失的值对象和验证器

---

### D. Presentation 层 (展示层) - 保留在 Web

**保留位置**: `apps/web/src/modules/schedule/presentation/`

**Components**:

- Vue 组件 (.vue 文件) - 保留
- Component Index - 保留

**Composables** (需要决策):

- `useSchedule.ts` - 425 行 - 包含业务逻辑 + 展示逻辑 混合
  - 建议: 提取业务逻辑 → `packages/application-client/src/schedule/composables/use-schedule.ts`
  - 保留展示逻辑 → `apps/web/src/modules/schedule/presentation/composables/useSchedule.ts`

- `useScheduleEvent.ts` - 类似处理
- `useScheduleTaskDetail.ts` - 类似处理

---

## III. 依赖关系映射

### 入站依赖 (What imports from schedule)

```bash
grep -r "from.*schedule" apps/web/src --include="*.ts" --include="*.vue" | grep -v "node_modules"
```

**关键导入位置**:

1. `apps/web/src/modules/schedule/initialization/scheduleInitialization.ts`
   - 导入: ScheduleWebApplicationService, scheduleCondidate services
2. Vue 组件中的 composable 导入
3. 路由配置中的导入

### 出站依赖 (What schedule imports from)

**标准库**:

- `@dailyuse/contracts/schedule` - DTO 类型
- `@dailyuse/domain-client/schedule` - 领域实体
- `@dailyuse/utils` - 工具函数
- `@/shared/api/instances` - API 客户端实例
- `vue` - Vue 框架
- `@dailyuse/ui-vuetify` - UI 组件库

**内部跨模块**:

- 当前无其他模块依赖关系

---

## IV. 第三方依赖分析

### 时间/日期库 (Time/Date Libraries)

检查需求:

- [ ] 审查当前是否使用 date-fns、dayjs 或其他时间库
- [ ] 检查时区处理库的使用
- [ ] 评估 RFC 5545 循环规则库

**可能的库** (检查 package.json):

- `date-fns` - 日期操作
- `ical.js` 或 `rrule` - RFC 5545 支持
- `date-fns-tz` - 时区支持

---

## V. 迁移策略

### 分阶段迁移 (Phase by Phase)

**第1阶段**: Infrastructure 层 (最少依赖)

- 迁移所有 API 客户端
- 创建 `packages/infrastructure-client/src/schedule/`
- 更新导入

**第2阶段**: Domain 层 (无框架依赖)

- 审查现有 domain 实体
- 补充缺失的值对象
- 创建验证器

**第3阶段**: Application 层 (依赖前两个)

- 迁移 ApplicationServices
- 迁移 composables 的业务逻辑部分
- 创建 re-exports 桥接

**第4阶段**: Web 层重构

- 删除旧位置的文件
- 更新所有导入语句
- 确保仅 Presentation 代码保留

**第5阶段**: 测试和验证

- 运行单元测试
- 运行集成测试
- 验证导入路径

---

## VI. 风险评估

| 风险                          | 可能性 | 影响 | 缓解策略                       |
| ----------------------------- | ------ | ---- | ------------------------------ |
| 时区处理边界情况              | 中     | 高   | 创建详细的时区测试套件         |
| 循环规则复杂性                | 中     | 中   | 充分的单元测试,参考 RFC 5545   |
| 导入循环依赖                  | 低     | 高   | 严格分层,频繁运行 nx dep-graph |
| Composable 业务逻辑提取不完整 | 中     | 中   | 逐一审查每个 composable        |

---

## VII. 清单

### 迁移前检查

- [ ] 审查所有文件内容和依赖关系 (本审计)
- [ ] 生成完整的依赖关系图
- [ ] 确认 domain-client 中已有实体定义
- [ ] 获取时间库需求清单

### 迁移过程检查

- [ ] Infrastructure 层迁移完成
- [ ] Domain 层补充完成
- [ ] Application 层迁移完成
- [ ] Web 层更新导入
- [ ] 删除旧文件

### 验证检查

- [ ] 所有导入指向新位置
- [ ] 所有测试通过
- [ ] 无循环依赖
- [ ] ESLint 通过
- [ ] TypeScript 编译成功

---

## 附录

### A. 与 Task 模块迁移的对比

| 方面                 | Task | Schedule     |
| -------------------- | ---- | ------------ |
| Infrastructure 文件  | 2-3  | 3            |
| Application Services | 2-3  | 3-4          |
| Domain Complexity    | 低   | 中-高        |
| 时间逻辑             | 无   | 是 (DST, TZ) |
| 外部库依赖           | 基础 | 时间库       |

### B. 包结构参考

**Application Client**:

```
packages/application-client/src/
├── task/
│   └── services/
│       ├── task-instance-sync.service.ts
│       ├── task-schedule-integration.service.ts
│       └── index.ts
└── schedule/  ← NEW
    ├── services/
    ├── composables/
    └── index.ts
```

**Infrastructure Client**:

```
packages/infrastructure-client/src/
├── task/
└── schedule/  ← NEW
    ├── clients/
    ├── mappers/
    └── index.ts
```

**Domain Client**:

```
packages/domain-client/src/
├── task/
└── schedule/  ← REVIEW/补充
    ├── entities/
    ├── value-objects/
    ├── validators/
    └── index.ts
```

---

**下一步**: 开始第1阶段 - Infrastructure 层迁移

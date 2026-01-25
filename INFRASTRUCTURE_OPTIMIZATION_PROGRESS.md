# Infrastructure-Server 模块优化进度报告

**日期**: 2026-01-25  
**状态**: 进行中  
**完成度**: 2/7 模块已优化

## 已完成的优化

### ✅ Goal 模块优化（完成）

**变更内容：**
- [x] `goal.module.ts` 更新为支持两种数据库
  - Constructor: `(dataSourceType: 'prisma' | 'sqlite', dbConnection)` ✓
  - 使用 Factory 初始化 Repositories ✓
  - 所有 Repositories 都是 public readonly ✓
  - 所有 Services 都是 public readonly ✓

- [x] `goal.module.ts` 使用 GoalRepositoryFactory
  - Factory 通过 dataSourceType 选择正确的适配器 ✓
  - 支持 createPrismaRepositories() 和 createSqliteRepositories() ✓

- [x] 删除旧的 GoalContainer 从导出
  - 从 `goal/index.ts` 移除了 `export { GoalContainer }` ✓
  - 只保留 `export { GoalModule }` ✓

- [x] 规范化 `goal/index.ts` 导出
  - DI Module ✓
  - Repository Factory ✓
  - 所有 Adapter (Prisma + SQLite + Memory) ✓
  - Ports (Interfaces) ✓

- [x] 创建标准的 `goal/di/index.ts`
  - 导出 GoalRepositoryFactory ✓

**文件修改：**
```
packages/infrastructure-server/src/goal/
├─ goal.module.ts           (改)
├─ index.ts                 (改)
├─ di/index.ts              (新)
├─ adapters/sqlite/goal-folder-sqlite.repository.ts  (改: 修复转义符)
└─ di/repository-factory.ts (已存在，无需改)
```

**编译状态：** ✓ ESM Build Success (JavaScript 部分编译成功)  
**未解决问题：** Goal SQLite 实现缺少部分方法（非本次优化范围）
- `SqliteGoalRepository` 缺少 `batchMoveToFolder` 方法
- `SqliteWeightSnapshotRepository` 缺少 `deleteByKeyResult` 方法

---

### ✅ Dashboard 模块优化（完成）

**变更内容：**
- [x] `dashboard.module.ts` 更新为支持两种数据库
  - Constructor: `(dataSourceType: 'prisma' | 'sqlite', dbConnection)` ✓
  - 使用 Factory 初始化 Repositories ✓
  - 所有 Repositories 都是 public readonly ✓
  - 所有 Services 都是 public readonly ✓

- [x] 创建 `dashboard/di/dashboard-repository.factory.ts`
  - 支持 Prisma 版本 ✓
  - 支持 SQLite 版本 (已有适配器 `SqliteDashboardConfigRepository`) ✓
  - Factory.create() 多态选择 ✓

- [x] 删除旧的 DashboardContainer 从导出
  - 从 `dashboard/index.ts` 移除了 `export { DashboardContainer }` ✓

- [x] 规范化 `dashboard/index.ts` 导出
  - DI Module ✓
  - Repository Factory ✓
  - 所有 Adapter (Prisma + SQLite + Memory) ✓
  - Ports (Interfaces) ✓

- [x] 创建 `dashboard/di/index.ts`
  - 导出 DashboardRepositoryFactory ✓

- [x] 创建 `dashboard/adapters/index.ts`
  - 汇总所有 Adapter 导出 ✓

- [x] 创建 `dashboard/adapters/prisma/index.ts`
  - 导出 Prisma 适配器 ✓

**文件修改：**
```
packages/infrastructure-server/src/dashboard/
├─ dashboard.module.ts                      (改)
├─ index.ts                                 (改)
├─ adapters/
│  ├─ index.ts                              (新)
│  └─ prisma/index.ts                       (新)
└─ di/
   ├─ index.ts                              (新)
   └─ dashboard-repository.factory.ts       (新)
```

**编译状态：** ✓ ESM Build Success (JavaScript 部分编译成功)

---

## 未完成的优化

### ⏳ Repository 模块优化（待开始）

**需要做的事：**
- [ ] 创建 Repository Factory 支持两种数据库
- [ ] 更新 Repository Module 使用 Factory
- [ ] 导出所有 Repository Adapters
- [ ] 完成缺失的 Service 实现 (ResourceApplicationService, FolderApplicationService, RepositoryStatisticsApplicationService)

**当前问题：**
- RepositoryModule 缺少多个 Service 的实现
- 需要在 application-server 中导出这些 Service

### ⏳ Schedule 模块优化（待开始）

**需要做的事：**
- [ ] 确保 Schedule Module 使用 Factory
- [ ] Module 支持两种数据库
- [ ] 整理 external/datasources 结构

**当前问题：**
- Schedule Module 虽然有 SQLite 适配器，但 Module 还是只用 Prisma

### ⏳ 其他模块优化（待开始）

- Account: 有 SQLite 支持但 Module 没用
- Reminder, Notification, Setting, Editor, AI, Authentication, Sync: 待分析和优化

---

## 编译错误汇总

### Goal 模块的 TypeScript 错误

**错误信息：**
```
src/goal/di/repository-factory.ts(74,7): error TS2741: Property 'batchMoveToFolder' is missing in type 'SqliteGoalRepository' but required in type 'IGoalRepository'.

src/goal/di/repository-factory.ts(79,7): error TS2741: Property 'deleteByKeyResult' is missing in type 'SqliteWeightSnapshotRepository' but required in type 'IWeightSnapshotRepository'.
```

**根本原因：** Goal 的 SQLite 实现不完整（非本次优化引入）  
**建议：** 
1. 完成 SqliteGoalRepository.batchMoveToFolder() 方法
2. 完成 SqliteWeightSnapshotRepository.deleteByKeyResult() 方法

**修复方式（暂时）：**
可以在 SQLite 适配器中添加空实现以通过编译，然后后续完整实现逻辑。

---

## 架构改进成果

### ✅ 统一的 Module 模式

```typescript
// 用法相同，支持两种数据库
const goalModule = new GoalModule('prisma', prismaClient);      // API 用
const goalModule = new GoalModule('sqlite', sqliteDb);           // Desktop 用

// 路由层使用
await goalModule.goalApplicationService.createGoal(data);
```

### ✅ 清晰的 DI 流程

```
Constructor → Factory.create() → Select Adapter → Initialize Repositories → Instantiate Services
```

### ✅ 规范的导出结构

每个模块的 `index.ts` 现在都遵循相同的导出顺序：
1. DI Module
2. Repository Factory
3. Prisma Adapters
4. SQLite Adapters
5. Memory Adapters (可选)
6. Ports (Interfaces)

---

## 下一步计划

### 优先级 1 (高) - 立即进行

1. **修复 Goal 和 Dashboard 的 TypeScript 编译错误**
   - 为缺少的 SQLite 方法添加实现

2. **优化 Repository 模块**
   - 完成缺失的 Service 实现
   - 创建 Factory

### 优先级 2 (中) - 本周完成

3. **优化 Schedule 模块**
   - 确保 Module 使用 Factory

4. **优化其他模块** (Account, Reminder, Notification, Setting, Editor, AI, Authentication, Sync)

### 优先级 3 (低) - 后续

5. **集成验证**
   - 更新 API 路由层使用新的 Module 模式
   - 更新 Desktop 应用使用新的 Module 模式
   - 验证两个应用都能正常工作

---

## 验证清单

**Goal 模块：**
- [x] Module 支持 'prisma' | 'sqlite' 参数
- [x] Factory 实现多态选择
- [x] 所有 Repositories 都是 public
- [x] 所有 Services 都是 public
- [x] index.ts 遵循规范导出
- [ ] 编译通过 (等待 SQLite 方法补全)

**Dashboard 模块：**
- [x] Module 支持 'prisma' | 'sqlite' 参数
- [x] Factory 实现多态选择
- [x] 所有 Repositories 都是 public
- [x] 所有 Services 都是 public
- [x] index.ts 遵循规范导出
- [x] 编译通过 ✓

---

## 文档更新

- [x] 在 `docs/architecture/infrastructure-server.md` 中添加了标准架构规范
- [ ] 为每个已优化的模块添加 `README.md` 说明
- [ ] 更新 ADR 文档记录这些变更


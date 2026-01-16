# 🔧 Epic 1 & Epic 2 实施修复指南

**审查完成**: 2026-01-16  
**用户**: Baker  
**通信语言**: 中文  
**状态**: 修复执行中

---

## 📊 当前状态

| 指标 | 当前 | 目标 | 进度 |
|------|------|------|------|
| AC 完成率 | 33% | 100% | ▯▯▯▯▯ 10% |
| 编译错误 | 47 | 0 | ▯▯▯▯▯ 2% |
| 故事完成 | 2/12 | 12/12 | ▯▯▯▯▯ 17% |
| 测试通过 | 8/50 | 50/50 | ▯▯▯▯▯ 16% |

---

## 🎯 Phase 1: P0 修复 (关键编译问题)

### ✅ 完成 (1/6)

#### ✅ 1. TaskSortBy/TaskFilterBy 导出修复
- **文件**: packages/contracts/src/modules/task/index.ts
- **修改**: 分离 enum 和 type 导出
- **状态**: ✅ 完成
- **验证**: contracts build 通过

---

### 🔄 进行中 (0/5)

#### 2. 其他编译错误修复
由于编译错误跨多个包的依赖链，建议分阶段修复。

**建议执行顺序**:
```
Phase 1.2: 修复底层包 (已完成)
  ✅ contracts package
  
Phase 1.3: 修复 domain 包
  [ ] domain-client typecheck
  [ ] domain-server typecheck
  
Phase 1.4: 修复 application 包
  [ ] application-client typecheck
  [ ] application-server typecheck
  
Phase 1.5: 修复 api/web/desktop
  [ ] api typecheck
  [ ] web typecheck  
  [ ] desktop typecheck
```

---

## 🎯 Phase 2: P1 修复 (关键功能实现)

### 目标: 完成 Story 1.5, 2.5, 2.6

#### Story 1.5 - TaskQueryService 应用层集成

**当前状态**: 🔴 0% 完成  
**关键任务**:

```typescript
// 需要实现的方法:
class TaskQueryService {
  // 1. enrichWithPriority - 计算单个任务优先级
  private enrichWithPriority(dto: TaskTemplateServerDTO): TaskTemplateServerDTO {
    // 实现逻辑
  }

  // 2. enrichMultipleWithPriority - 批量计算优先级
  private enrichMultipleWithPriority(dtos: TaskTemplateServerDTO[]): TaskTemplateServerDTO[] {
    // 实现逻辑
  }

  // 3. getTasksWithPrioritySorting - 获取并排序任务列表
  async getTasksWithPrioritySorting(
    accountUuid: string,
    sortBy: TaskSortBy = TaskSortBy.PRIORITY
  ): Promise<TaskTemplateServerDTO[]> {
    // 实现逻辑
  }

  // 4. applyFilters - 应用过滤条件
  private applyFilters(
    dtos: TaskTemplateServerDTO[],
    filters?: TaskFilterBy[]
  ): TaskTemplateServerDTO[] {
    // 实现逻辑
  }
}
```

**预期工作量**: 2 小时  
**单元测试**: 需要编写 >=80% 覆盖

---

#### Story 2.5 - 排序和过滤参数支持

**当前状态**: 🔴 0% 完成  
**关键任务**:

```typescript
// 需要完善的类:
class TaskQueryValidator {
  // 验证排序参数
  validateSortBy(sortBy: TaskSortBy): ValidationResult {
    // 检查是否为有效的排序字段
  }

  // 验证过滤参数
  validateFilterBy(filters: TaskFilterBy[]): ValidationResult {
    // 检查所有过滤条件的有效性
    // 支持多个过滤条件的组合 (AND 关系)
  }

  // 验证排序和过滤的组合
  validateSortAndFilterCombination(
    sortBy: TaskSortBy,
    filters: TaskFilterBy[]
  ): ValidationResult {
    // 检查组合有效性
  }
}
```

**预期工作量**: 1 小时  
**集成测试**: 需要添加

---

#### Story 2.6 - 性能基准测试

**当前状态**: 🔴 0% 完成 (有编译错误)  
**关键问题**:

1. 导入路径错误
2. mock 对象类型不匹配
3. 异步调用缺少 await

**修复步骤**:
1. 修复 benchmark-utils.ts 导入
2. 修复 mock 对象返回类型
3. 验证基准测试运行

**预期工作量**: 1 小时  
**验证命令**: `pnpm nx test application-server --testPathPattern="bench"`

---

## 🎯 Phase 3: P2 修复 (UX 完整性)

### Story 2.4 - 列表可视化优化

**当前状态**: 🔴 0% 完成  
**需要的文件**:

1. **packages/contracts/src/modules/task/priority-colors.ts** (新建)
```typescript
export const PRIORITY_COLORS: Record<ImportanceLevel, string> = {
  [ImportanceLevel.Vital]: '#FF4444',    // 红色
  [ImportanceLevel.Important]: '#FF8800', // 橙色
  [ImportanceLevel.Moderate]: '#4488FF',  // 蓝色
  [ImportanceLevel.Minor]: '#999999',     // 灰色
  [ImportanceLevel.Trivial]: '#CCCCCC',   // 浅灰
};
```

2. **apps/web/src/styles/priority-colors.css** (新建)
```css
.priority-vital { color: #FF4444; }
.priority-important { color: #FF8800; }
.priority-moderate { color: #4488FF; }
.priority-minor { color: #999999; }
.priority-trivial { color: #CCCCCC; }
```

3. **更新 TaskTemplateCard.vue** - 添加颜色显示
4. **更新 TaskCard.tsx** - 桌面端同步

**预期工作量**: 2 小时

---

### Story 1.4 - API 文档更新

**当前状态**: 🟡 40% 完成  
**需要完成**:

1. Swagger 文档更新
   - TaskDTO 添加 `@readonly priority` 注释
   - 移除 `urgency` 和 `priority` 输入字段
   - 添加 `importance` 输入字段

2. API 契约同步
   - Web 端 TaskDTO
   - Desktop 端 TaskTemplate
   - 确保字段一致

**预期工作量**: 1 小时

---

## 📋 立即可执行的修复步骤

### 现在可以做的:

1. **分析并修复 ui-vuetify 导入错误**
   - 检查 `@dailyuse/ui-vue` 的导出
   - 可能需要构建 ui-vue 包

2. **实现 Story 1.5 的核心方法**
   - 参考 [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md) 中的代码示例
   - 编写单元测试
   - 验证测试通过

3. **运行测试验证进度**
   ```bash
   # 测试 Story 1.5
   pnpm nx test application-server --testPathPattern="task-query"
   
   # 测试 Story 1.2, 1.3
   pnpm nx test domain-server --testPathPattern="priority"
   ```

---

## 🚦 质量检查清单

在标记 story 为 "done" 之前:

- [ ] 所有 AC 实现完成 ✅
- [ ] 编译无错误: `pnpm nx run-many --target=typecheck` ✅
- [ ] 单元测试通过: `pnpm nx test <package>` ✅
- [ ] 集成测试通过 (如适用) ✅
- [ ] 代码审查通过 ✅
- [ ] 文档更新完成 ✅

---

## 📞 参考文档

- [CODE_REVIEW_FINAL_REPORT.md](CODE_REVIEW_FINAL_REPORT.md) - 审查详细报告
- [QUICK_FIX_GUIDE.md](QUICK_FIX_GUIDE.md) - 快速修复指南
- [DETAILED_CODE_FIXES.md](DETAILED_CODE_FIXES.md) - 代码级修复示例
- [REVIEW_EXECUTIVE_SUMMARY.md](REVIEW_EXECUTIVE_SUMMARY.md) - 执行摘要

---

**建议**: 按照本文档中的 Phase 1 → Phase 2 → Phase 3 顺序执行修复，确保每个 phase 完成后再进入下一个。

---

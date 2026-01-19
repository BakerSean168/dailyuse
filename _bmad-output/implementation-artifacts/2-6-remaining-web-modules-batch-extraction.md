# Story 2.6: 剩余模块批量拆分 (Web)

Status: ready-for-dev

<!-- Note: Batch Migration Story - 10 modules in parallel. Coordination critical. -->

## Story

As a 前端架构师,
I want 将剩余 10 个 Web 模块的非 presentation 代码批量迁移到对应 client packages,
so that 整个 Web 层完成拆分，完成 Epic 2 的核心目标。

## Acceptance Criteria

1. **Given** 剩余 10 个模块（account, ai, app, authentication, dashboard, editor, notification, reminder, repository, setting）存在非 presentation 代码
   **When** 开发团队按批量迁移计划执行
   **Then** 所有 10 个模块的 application/infrastructure/services 迁移到对应 client packages
   **And** 每个模块的源代码树结构与前期 Task/Schedule/Goal 模块一致
   **And** 无模块被遗漏

2. **Given** 10 个模块分 3 个 Group 并行迁移
   **When** 平行工作流执行（最多 5 天）
   **Then** 所有 Group 按计划完成迁移
   **And** 日常同步协调无阻塞
   **And** 跨模块依赖关系被正确处理

3. **Given** 所有模块已迁移
   **When** 执行代码质量和集成验证
   **Then** 所有单元测试通过（100% pass rate）
   **And** 所有集成测试通过
   **And** 无循环依赖检测到
   **And** ESLint 检查 100% 通过

4. **Given** 迁移和验证完成
   **When** 启动 Web 应用
   **Then** 应用正常启动无错误
   **And** 所有功能模块正常工作
   **And** 可进入故事 2-7（Web 入口重构）

## Tasks / Subtasks

### Phase 1: 批量迁移准备 (Tasks 1-2)

- [ ] **Task 1**: 设置迁移工具和自动化脚本
  - [ ] 创建批量迁移脚本（barrel exports 生成、路径替换等）
  - [ ] 配置并行测试运行器
  - [ ] 准备质量检查工具和集成脚本
  - [ ] 创建迁移进度跟踪工具
  - [ ] 验证脚本在 Task 模块上工作正常

- [ ] **Task 2**: 创建团队工作计划和沟通机制
  - [ ] 分配 10 个模块到 3 个 Group（见下表）
  - [ ] 为每个 Group 分配 2-3 名开发者
  - [ ] 设置日常同步会议（每日 15:00）
  - [ ] 创建共享的迁移跟踪表
  - [ ] 定义合并策略和冲突解决流程

### Phase 2: Group A 迁移 (Tasks 3-4) - Day 1-2

**Modules: account, ai, app**

- [ ] **Task 3**: Group A 模块分析和准备
  - [ ] 审计 account 模块结构（估 3h）
  - [ ] 审计 ai 模块结构（估 2h）
  - [ ] 审计 app 模块结构（估 2h）
  - [ ] 创建 3 个模块的迁移映射文档
  - [ ] 标识模块间依赖关系

- [ ] **Task 4**: Group A 模块迁移执行
  - [ ] 迁移 account 模块到 packages（Infrastructure → Application → Domain）
  - [ ] 迁移 ai 模块到 packages
  - [ ] 迁移 app 模块到 packages
  - [ ] 更新所有导入路径为包别名
  - [ ] 运行 Group A 模块的完整测试套件

### Phase 3: Group B 迁移 (Tasks 5-6) - Day 2-3

**Modules: authentication, dashboard, editor**

- [ ] **Task 5**: Group B 模块分析和准备
  - [ ] 审计 authentication 模块（估 4h，中等复杂度）
  - [ ] 审计 dashboard 模块（估 3h）
  - [ ] 审计 editor 模块（估 3h）
  - [ ] 创建迁移映射文档
  - [ ] 标识与 Group A 的交互

- [ ] **Task 6**: Group B 模块迁移执行
  - [ ] 迁移 authentication 模块到 packages
  - [ ] 迁移 dashboard 模块到 packages
  - [ ] 迁移 editor 模块到 packages
  - [ ] 处理与 Group A 模块的依赖关系
  - [ ] 运行 Group B 完整测试

### Phase 4: Group C 迁移 (Tasks 7-8) - Day 3-4

**Modules: notification, reminder, repository, setting**

- [ ] **Task 7**: Group C 模块分析和准备
  - [ ] 审计 notification 模块（估 4h）
  - [ ] 审计 reminder 模块（估 3h）
  - [ ] 审计 repository 模块（估 5h，最复杂）
  - [ ] 审计 setting 模块（估 3h）
  - [ ] 创建迁移映射文档
  - [ ] 标识与其他 Group 的交互

- [ ] **Task 8**: Group C 模块迁移执行
  - [ ] 迁移 notification 模块到 packages
  - [ ] 迁移 reminder 模块到 packages
  - [ ] 迁移 repository 模块到 packages（最复杂，可能需要结对编程）
  - [ ] 迁移 setting 模块到 packages
  - [ ] 运行 Group C 完整测试

### Phase 5: 全局验证和优化 (Tasks 9-14) - Day 4-5

- [ ] **Task 9**: 跨模块依赖验证
  - [ ] 构建完整的模块依赖图
  - [ ] 检测所有循环依赖
  - [ ] 验证依赖方向（下向上）
  - [ ] 解决任何依赖违规
  - [ ] 生成最终依赖报告

- [ ] **Task 10**: 全局测试套件执行
  - [ ] 运行所有 10 个模块的单元测试
  - [ ] 运行集成测试
  - [ ] 运行 Web 应用 E2E 测试
  - [ ] 检查测试覆盖率 ≥ 80%
  - [ ] 修复任何失败

- [ ] **Task 11**: Web 应用启动验证
  - [ ] 启动 Web 应用（npm run dev）
  - [ ] 验证无导入错误
  - [ ] 验证无类型错误
  - [ ] 进行基本功能冒烟测试
  - [ ] 记录任何问题

- [ ] **Task 12**: 代码质量检查
  - [ ] ESLint 检查（所有包）
  - [ ] TypeScript strict 编译
  - [ ] 代码审查检查清单
  - [ ] 文档完整性验证
  - [ ] 性能回归检查

- [ ] **Task 13**: 迁移完成文档
  - [ ] 生成 10 个模块的迁移总结
  - [ ] 更新最佳实践文档
  - [ ] 创建故障排除指南
  - [ ] 为故事 2-7 准备入场文档
  - [ ] 团队知识转移会议

- [ ] **Task 14**: 最终验收和交接
  - [ ] Product Owner 验收确认
  - [ ] 所有积压项处理完毕
  - [ ] 标记故事为完成
  - [ ] 准备 Epic 2 回顾
  - [ ] 计划故事 2-7

## Dev Notes

### Batch Migration Strategy

**平行工作流程**

```
Timeline: 5 天 (Day 1-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day 1-2: Group A Migration (3 modules)
├─ Team A: account module
├─ Team B: ai module
└─ Team C: app module
   ↓ (Daily sync 15:00)

Day 2-3: Group B Migration (3 modules)
├─ Team D: authentication module
├─ Team E: dashboard module
└─ Team F: editor module
   ↓ (Daily sync 15:00)

Day 3-4: Group C Migration (4 modules)
├─ Team G: notification module
├─ Team H: reminder module
├─ Team I: repository module
└─ Team J: setting module
   ↓ (Daily sync 15:00)

Day 4-5: Global Verification & Finalization
├─ Dependency Verification
├─ Full Test Suite
├─ Web App Validation
├─ Quality Checks
└─ Documentation & Handoff
```

### 10 个模块清单

| Group | 模块           | 复杂度      | 依赖                 | 预计时间 | 分配   |
| ----- | -------------- | ----------- | -------------------- | -------- | ------ |
| A     | account        | Low         | 无                   | 3h       | Team A |
| A     | ai             | Low         | account              | 2h       | Team B |
| A     | app            | Low         | account, ai          | 2h       | Team C |
| B     | authentication | Medium      | account              | 4h       | Team D |
| B     | dashboard      | Medium      | task, goal, schedule | 3h       | Team E |
| B     | editor         | Medium      | 无                   | 3h       | Team F |
| C     | notification   | Medium-High | task, goal, schedule | 4h       | Team G |
| C     | reminder       | Medium      | schedule, task       | 3h       | Team H |
| C     | repository     | High        | 无（但其他模块依赖） | 5h       | Team I |
| C     | setting        | Medium      | account              | 3h       | Team J |

**总计：32h 工作量 ÷ 10 个并行 teams = ~3.2 天 + 1.8 天验证 = 5 天**

### 模块间依赖关系

```
account
├── authentication
└── setting

ai
└── app

task (already extracted in Epic 2-1-2-3)
├── dashboard
├── notification
└── reminder

goal (already extracted in Epic 2-5)
├── dashboard
└── notification

schedule (already extracted in Epic 2-4)
├── dashboard
├── notification
└── reminder

editor (独立)

repository (独立，但被其他模块引用)
├── account
├── task
├── goal
└── schedule
```

### 质量检查清单

**Daily 同步（每日 15:00）**

- [ ] 各 Group 迁移进度报告
- [ ] 遇到的阻塞问题
- [ ] 跨 Group 依赖问题
- [ ] 需要的支持

**迁移完成检查**（每个 Group）

- [ ] 所有非 presentation 代码已迁移
- [ ] 所有导入路径已更新为包别名
- [ ] 所有单元测试通过
- [ ] 无循环依赖
- [ ] ESLint 检查通过
- [ ] TypeScript 编译成功

**全局验证检查**（Day 5）

- [ ] 10 个模块全部迁移完成
- [ ] 依赖图验证通过
- [ ] 完整测试套件通过
- [ ] Web 应用启动成功
- [ ] 冒烟测试通过
- [ ] 代码审查检查清单通过

### 关键注意事项

**1. 跨模块依赖管理**

- repository 模块被许多模块引用，务必优先或最后处理
- Task/Schedule/Goal 模块已完成，其他模块可放心依赖
- 避免新创建的循环依赖

**2. 并行工作冲突**

- 使用 git feature branches（每个模块一个分支）
- 定期 rebase 防止冲突
- 集中测试后再合并主干

**3. 测试策略**

- Group 内测试：各 team 负责
- Group 间测试：每日同步后验证
- 全局测试：Day 5 集中执行

**4. 文档和知识转移**

- 每个 Group 完成后生成文档
- 模块迁移模板已成熟，复用前期最佳实践
- Day 5 安排团队知识共享会

### 平行工作建议

**工作分配** (10 个 modules, 10 个 developers)

```
Day 1-2:
- Developer 1: account module (Group A lead)
- Developer 2: ai module
- Developer 3: app module
- Developers 4-7: Group B 准备

Day 2-3:
- Developers 1-3: Group C 准备
- Developer 4: authentication module (Group B lead)
- Developer 5: dashboard module
- Developer 6: editor module
- Developer 7: 支持 Group A 完成

Day 3-4:
- Developer 8: notification module (Group C lead)
- Developer 9: reminder module
- Developer 10: repository module (可能需要结对编程)
- Others: 支持 Group C

Day 4-5:
- 全体: 全局验证、测试、文档
```

## Project Structure Notes

**完整的 10 个模块迁移清单**

### Group A 模块结构

**account 模块**

```
apps/web/src/modules/account/
├── components/ → apps/web 保留
├── pages/ → apps/web 保留
├── stores/ → @app/application-client/account/
├── composables/ → @app/application-client/account/
├── services/ → @inf/infrastructure-client/account/
├── domain/ → @dom/domain-client/account/
└── types/ → @dom/domain-client/account/types/
```

**ai 模块**（依赖 account）

```
apps/web/src/modules/ai/
├── components/ → apps/web 保留
├── stores/ → @app/application-client/ai/
├── composables/ → @app/application-client/ai/
├── services/ → @inf/infrastructure-client/ai/
└── domain/ → @dom/domain-client/ai/
```

**app 模块**（依赖 account, ai）

```
类似结构
```

### Group B 模块结构

**authentication, dashboard, editor** - 类似结构

### Group C 模块结构

**notification, reminder, repository, setting** - 类似结构

## References

- [Task 模块迁移 (Stories 2-1~2-3)](2-1-task-application-to-client.md)
- [Schedule 模块迁移 (Story 2-4)](2-4-schedule-module-web-extraction.md)
- [Goal 模块迁移 (Story 2-5)](2-5-goal-module-web-extraction.md)
- [Web 包结构指南](docs/standards/structure.md#Web Package Structure)
- [模块依赖管理](docs/standards/architecture.md#Module Dependencies)
- [批量迁移最佳实践](docs/guides/batch-migration.md)

## Dev Agent Record

### Team Planning & Workload Distribution

**建议团队规模**：10-12 人（最大化并行）

**工作分配**（参考上文平行工作部分）

**日常协调**

- 每日 15:00 同步会议（15 分钟）
- 共享迁移进度表
- 遇到问题立即升级

### Parallel Workflow Best Practices

**分支策略**

- 主分支：main
- 迁移分支：feature/web-batch-migration-{group}
- 模块分支：feature/web-module-{moduleName}-extraction

**合并策略**

- Group 内完成 → Code Review → Merge to develop
- 所有 Group 完成 → Final Integration Test → Merge to main

**冲突处理**

- 跨 Group 依赖冲突 → Daily sync 协商
- 文件冲突 → 所有者 resolve
- 测试冲突 → 联合调查

### Risk Management

**识别的风险**

| 风险     | 概率   | 影响   | 缓解                   |
| -------- | ------ | ------ | ---------------------- |
| 依赖冲突 | High   | High   | 定期同步、依赖图验证   |
| 测试失败 | Medium | High   | 频繁运行测试、早期发现 |
| 文件冲突 | Medium | Medium | 分支策略、及时合并     |
| 知识遗漏 | Low    | Medium | 文档齐全、知识转移     |
| 性能回退 | Low    | Medium | 性能测试、监控         |

**缓解策略**

1. 使用自动化脚本减少人工错误
2. 每日同步防止隐性问题
3. 分组隔离降低全局风险
4. 全局验证把控最后质量

### Success Criteria & KPIs

**完成指标**

- ✅ 10 个模块 100% 迁移
- ✅ 0 个循环依赖
- ✅ 测试覆盖率 ≥ 80%
- ✅ 0 个遗留的相对路径导入
- ✅ Web 应用启动无错误
- ✅ 5 天内完成（按计划）

**质量指标**

- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ ESLint 100% 通过
- ✅ TypeScript strict 编译成功
- ✅ 代码覆盖率维持或提升

**团队效率指标**

- ✅ 平均每个模块 < 3.5h
- ✅ 无关键阻塞 > 2h
- ✅ 团队满意度 ≥ 8/10
- ✅ 遗留问题 < 5 个

### Completion Checklist

- [ ] 团队角色分配完成
- [ ] 工具和脚本准备就绪
- [ ] 10 个模块全部分析完成
- [ ] Group A 迁移完成并验证
- [ ] Group B 迁移完成并验证
- [ ] Group C 迁移完成并验证
- [ ] 全局依赖验证通过
- [ ] 完整测试套件通过
- [ ] Web 应用启动验证成功
- [ ] 文档完成
- [ ] 代码审查完成
- [ ] 团队知识转移完成
- [ ] 故事标记为完成
- [ ] Epic 2 回顾会议

### Transition to Story 2-7

**Story 2-7 的前置条件**

- ✅ Story 2-6 完成（本故事）
- ✅ 10 个模块全部提取
- ✅ Web 层仅包含展示代码
- ✅ 所有业务逻辑在 packages 中

**Story 2-7 的目标**

- 重构 apps/web/src/ 入口
- 纯粹的 Vue 展示层
- 所有业务逻辑通过 composables 导入

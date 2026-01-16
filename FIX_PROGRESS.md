# 🚀 实施修复计划 - 基于审查结果

**用户**: Baker  
**开始时间**: 2026-01-16  
**目标**: 将 AC 完成率从 33% 提升到 100%  

---

## ✅ 已完成的修复

### 1. ✅ 修复 TaskSortBy/TaskFilterBy 导出 (5 分钟)
**文件**: packages/contracts/src/modules/task/index.ts  
**状态**: 完成 ✅  
**修改**: 分离 enum 和 type 导出，符合 verbatimModuleSyntax 要求

### 2. ✅ 构建 contracts 包 (5 分钟)
**命令**: pnpm nx run contracts:build  
**状态**: 完成 ✅  
**结果**: 所有 .d.ts 类型声明文件生成成功

---

## 🔄 后续修复步骤

现在需要按照以下顺序修复剩余问题：

### Phase 1: 修复编译错误 (持续)

**已通过测试的**:
- ✅ application-server test passed
- ✅ contracts build passed

**仍需修复的**:
- [ ] ui-vuetify:build - @dailyuse/ui-vue 导入错误
- [ ] api:typecheck - 待检查
- [ ] desktop:typecheck - @dailyuse/ui-shadcn 导入错误

### Phase 2: 实现缺失的功能

**Story 1.5 - TaskQueryService 完整实现**
- [ ] enrichWithPriority() 方法
- [ ] getTasksWithPrioritySorting() 方法
- [ ] 单元测试覆盖 >=80%

**Story 2.5 - TaskQueryValidator 完整实现**
- [ ] 过滤验证逻辑
- [ ] 组合过滤支持
- [ ] 集成测试

**Story 2.6 - 基准测试修复**
- [ ] 修复导入错误
- [ ] 修复 mock 类型
- [ ] 验证性能指标

### Phase 3: UX 完整性

**Story 2.4 - 列表可视化优化**
- [ ] 优先级颜色定义
- [ ] icon 指示符映射
- [ ] Web 端实现
- [ ] Desktop 端实现

**Story 1.4 - API 文档和定义**
- [ ] Swagger 文档更新
- [ ] DTO 定义同步
- [ ] 契约验证

---

## 推荐的执行策略

由于编译错误涉及多个包的依赖链，建议：

1. **先运行测试而不是 typecheck** - 测试可能会给出更清晰的错误信息
2. **按包依赖顺序修复** - 先修复底层包 (contracts → domain → application → api)
3. **逐个测试** - 每个修复后运行相关的测试

---

推荐下一步: 
```bash
# 运行测试查看关键编译错误
pnpm nx test application-server
pnpm nx test api
```

---

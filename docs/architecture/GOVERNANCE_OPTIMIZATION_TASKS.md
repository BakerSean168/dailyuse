# Governance 包优化 - 任务追踪

**开始日期**: 2026-03-13  
**目标分支**: `refactor/governance-code-quality`  
**预期完成**: 3-5 工作日（按 Phase 推进）

---

## 📊 整体进度

| Phase | 名称          | 状态      | 优先级    | 预计工作量 |
| ----- | ------------- | --------- | --------- | ---------- |
| 1     | P0 - 数据安全 | ⏳ 待开始 | 🔴 HIGH   | 2h         |
| 2     | P1 - 代码规范 | ⏳ 待开始 | 🔴 HIGH   | 6h         |
| 3     | P2 - 质量提升 | ⏳ 待开始 | 🟡 MEDIUM | 3h         |

**总计**: ~11 小时工作量

---

## Phase 1: P0 - 数据安全 (2h)

### ✅ 完成标志

- [ ] 所有 enum 值统一为 PascalCase
- [ ] 仅一份 CreateRuleSchema 权威定义
- [ ] 无模板残留文件
- [ ] 构建和测试都通过

### 具体任务

#### Task P0.1.1 - 分析枚举引用

- [ ] 运行搜索确认 rule.enums 的所有引用点
- [ ] 确认只有 rule-crud.dto.ts 引用
- **时间估计**: 5 min

#### Task P0.1.2 - 删除重复枚举文件

- [ ] 备份 `contracts/domain/rule.enums.ts` 内容
- [ ] 删除文件
- [ ] 验证没有引用报错
- **时间估计**: 10 min

#### Task P0.2.1 - 统一 rule-crud.dto.ts

- [ ] 更新 enum 值为 PascalCase
- [ ] 移除对 rule.enums 的导入
- [ ] 运行 `nx run governance:test` 验证
- **时间估计**: 15 min

#### Task P0.2.2 - 验证 rules.ts 正确性

- [ ] 检查 rules.ts 是否已使用 PascalCase（应该已对）
- [ ] 确认无不一致
- **时间估计**: 10 min

#### Task P0.3.1 - 清理模板文件

- [ ] 搜索 rule-example, complex-example 的所有引用
- [ ] 删除 `contracts/dtos/rule-example.dto.ts`
- [ ] 删除 `contracts/dtos/complex-example.dto.ts`
- **时间估计**: 10 min

#### Task P0.3.2 - 检查 config.ts

- [ ] 检查 EXAMPLE\_\* 常量的实际用途
- [ ] 确认是否需要删除或重命名
- **时间估计**: 10 min

### Validation

```bash
# Phase 1 完成后运行
nx run governance:build && nx run governance:test
```

**成功标志**: ✅ 全绿

---

## Phase 2: P1 - 代码规范 (6h)

### ✅ 完成标志

- [ ] 无 `fail()` 调用（除 import）
- [ ] 无手动 Result 字面量 `{ ok: ... }`
- [ ] 所有错误码格式统一
- [ ] Domain 实体使用 Result 而非 throw
- [ ] 客户端服务使用 constructor 注入
- [ ] 构建和测试都通过

### 具体任务

#### Task P1.1.1 - 统一 controller 中的 fail() 调用

- [ ] 打开 `governance.controller.ts`
- [ ] 搜索所有 `fail(` 调用（记下行号）
- [ ] 逐一替换为 `error()` 或 `ResultErrors.*`
- [ ] 运行测试验证
- **时间估计**: 20 min

#### Task P1.1.2 - 统一 http adapter 中的 fail() 调用

- [ ] 打开 `rule-http.adapter.ts`
- [ ] 搜索所有 `fail(` 调用
- [ ] 替换为 `error()`
- **时间估计**: 10 min

#### Task P1.1.3a - 更新 list-rules.ts 的 Result 字面量

- [ ] 打开 `application-client/services/list-rules.ts`
- [ ] 查找第 64-74 行的 `{ ok: true, data: { ... } }`
- [ ] 替换为 `ok({ ... })`
- [ ] 确保导入 `ok` 函数
- **时间估计**: 5 min

#### Task P1.1.3b - 更新其余 5 个客户端服务文件

- [ ] `create-rule.ts` — 替换字面量为 `ok()`
- [ ] `delete-rule.ts` — 同上
- [ ] `get-rule.ts` — 同上
- [ ] `search-rules.ts` — 同上
- [ ] `update-rule.ts` — 同上
- **时间估计**: 25 min （每个 ~5 min）

#### Task P1.2.1 - 生成错误码映射表

- [ ] 运行搜索生成全部错误码列表
- [ ] 建立映射表（新 → 标准）
- [ ] 分析每个错误码应该映射到哪个标准码
- **时间估计**: 20 min

#### Task P1.2.2 - 更新 use case 错误码

- [ ] 更新 `application-server/use-cases/**/*.ts` 中的错误码
- [ ] 按映射表替换
- [ ] 运行测试验证
- **时间估计**: 30 min

#### Task P1.2.3 - 更新 controller 错误码

- [ ] 检查 `normalizeRuleMutationError()` 方法
- [ ] 简化或删除该方法（因为 use cases 已返回标准码）
- [ ] 验证没有破坏 API 响应
- **时间估计**: 15 min

#### Task P1.2.4 - 更新 adapter 错误码

- [ ] 更新 `infrastructure-client/adapters/**/*.ts` 中的错误码
- [ ] 按映射表替换
- **时间估计**: 10 min

#### Task P1.3.1 - 改造 RuleRevision.create() 返回 Result

- [ ] 打开 `domain-server/entities/rule-revision.ts`
- [ ] 改变方法签名：`() => RuleRevision` 改为 `() => Result<RuleRevision>`
- [ ] 将 `throw new Error(...)` 改为 `return error(...)`
- [ ] 添加成功路径 `return ok(...)`
- [ ] 更新 JSDoc
- **时间估计**: 20 min

#### Task P1.3.2 - 更新 Rule 中对 RuleRevision.create() 的调用

- [ ] 在 `domain-server/aggregates/rule.ts` 中找到所有调用
- [ ] 添加 Result 处理逻辑
- [ ] 运行单元测试验证
- **时间估计**: 20 min

#### Task P1.4.1 - 检查 RuleClientService 引用

- [ ] 搜索所有 `RuleClientService` 的引用
- [ ] 确定是否需要删除或标记 @deprecated
- **时间估计**: 10 min

#### Task P1.4.2 - 改造 6 个客户端服务为 constructor 注入

- [ ] `create-rule.ts` — 删除 singleton 逻辑，改为 constructor
- [ ] `delete-rule.ts` — 同上
- [ ] `get-rule.ts` — 同上
- [ ] `list-rules.ts` — 同上
- [ ] `search-rules.ts` — 同上
- [ ] `update-rule.ts` — 同上
- [ ] 更新导出（移除工厂方法）
- [ ] 更新测试（如有）
- **时间估计**: 40 min

#### Task P1.4.3 - 验证 Phase 2 所有测试通过

- [ ] 运行 `nx run governance:test`
- [ ] 确保所有测试都通过
- [ ] 修复任何失败的测试
- **时间估计**: 30 min

### Validation

```bash
# Phase 2 中间检查点
rg "fail\(" packages/governance/src/
rg "\{ ok: (true|false)" packages/governance/src/

# Phase 2 完成后运行
nx run governance:build && nx run governance:test
```

**成功标志**: ✅ 全绿 + 无 fail() + 无字面量 Result

---

## Phase 3: P2 - 质量提升 (3h)

### ✅ 完成标志

- [ ] 所有文件使用中文注释
- [ ] PowerSync 文件都有 JSDoc
- [ ] Mapper 文件命名统一
- [ ] 导出结构清晰
- [ ] 构建和测试都通过

### 具体任务

#### Task P2.1.1 - 翻译 domain-client 注释

- [ ] 打开 `domain-client/aggregates/rule.ts`
- [ ] 翻译所有英文 JSDoc 为中文
- [ ] 打开 `domain-client/entities/rule-revision.ts`
- [ ] 翻译所有英文 JSDoc 为中文
- **时间估计**: 20 min

#### Task P2.1.2 - 为 PowerSync 文件补充 JSDoc

- [ ] `rule-powersync.repository.ts` — 添加 JSDoc
- [ ] `rule-revision-powersync.repository.ts` — 添加 JSDoc
- [ ] `mappers/rule-powersync.mapper.ts` — 添加 JSDoc
- [ ] `mappers/rule-revision-powersync.mapper.ts` — 添加 JSDoc
- **时间估计**: 20 min

#### Task P2.2.1 - 重命名 PowerSync mapper 文件

- [ ] `mv powersync-rule.mapper.ts rule-powersync.mapper.ts`
- [ ] `mv powersync-rule-revision.mapper.ts rule-revision-powersync.mapper.ts`
- **时间估计**: 5 min

#### Task P2.2.2 - 更新所有导入

- [ ] 更新 `powersync/index.ts` 中的导出
- [ ] 更新 `rule-powersync.repository.ts` 中的导入
- [ ] 更新 `rule-revision-powersync.repository.ts` 中的导入
- [ ] 运行构建验证
- **时间估计**: 15 min

#### Task P2.3.1 - 梳理顶层导出

- [ ] 审查 `src/index.ts` 的所有导出
- [ ] 标记应该 @internal 的导出
- [ ] 添加必要的导出说明
- **时间估计**: 15 min

#### Task P2.3.2 - 验证 Phase 3 所有测试通过

- [ ] 运行 `nx run governance:build`
- [ ] 运行 `nx run governance:test`
- [ ] 确保所有通过
- **时间估计**: 10 min

### Validation

```bash
# Phase 3 完成后运行
nx run governance:build && nx run governance:test

# 文件检查
ls packages/governance/src/infrastructure-server/adapters/powersync/mappers/
# 应显示：
#   - rule-powersync.mapper.ts ✅
#   - rule-revision-powersync.mapper.ts ✅
```

**成功标志**: ✅ 全绿 + 文件命名正确 + JSDoc 完整

---

## 📝 提交记录

### Phase 1 提交

```
commit: feat(governance): [Phase 1] consolidate duplicate enum definitions

- Delete contracts/domain/rule.enums.ts
- Update rule-crud.dto.ts to use PascalCase enum values
- Remove template files from contracts/dtos/
- Standardize enum values across all files

Tests: ✅ All tests pass
```

### Phase 2 提交 (可分为 4 个 commit)

```
commit 1: feat(governance): [Phase 2.1] unify Result constructor usage

commit 2: feat(governance): [Phase 2.2] standardize error code format

commit 3: feat(governance): [Phase 2.3] adopt Result pattern in domain entities

commit 4: feat(governance): [Phase 2.4] decompose client services to constructor injection
```

### Phase 3 提交

```
commit: docs(governance): [Phase 3] improve documentation and code quality

- Unify JSDoc language to Chinese
- Add JSDoc to PowerSync implementations
- Standardize mapper file naming
- Clarify public API exports
```

---

## 🔍 质量检查清单

在每个 Phase 后：

```
[ ] 代码审查 - 逻辑是否正确
[ ] 构建验证 - `nx run governance:build` ✅
[ ] 测试验证 - `nx run governance:test` ✅
[ ] 类型检查 - `npx tsc --noEmit` ✅
[ ] Git 状态 - `git status` - 无意外文件
[ ] Lint 检查 - 无 ESLint 错误
[ ] 导入验证 - 无循环导入或破坏的引用
```

---

## 📅 日程建议

**Day 1**: 完成 Phase 1 (数据安全) ~2h

- 早上 1h: P0.1 + P0.2
- 中午 30min: P0.3
- 午后 30min: 验证 + 提交

**Day 2-3**: 完成 Phase 2 (代码规范) ~6h

- Day 2 上午 3h: P1.1 + P1.2 第一部分
- Day 2 下午 3h: P1.2 第二部分 + P1.3 + P1.4 第一部分
- Day 3 上午 2h: P1.4 第二部分 + 测试验证
- Day 3 下午 1h: 修复任何测试失败 + 提交

**Day 4**: 完成 Phase 3 (质量提升) ~3h

- 上午 2h: P2.1 + P2.2
- 下午 1h: P2.3 + 验证 + 提交

**Day 5 (可选)**: 代码审查 + 反馈改进

---

## 🎯 关键成功因素

1. **每个 task 完成后立即验证** - 不要等到 phase 末
2. **测试驱动** - 任何改动后必须跑测试
3. **清晰的 commit** - 按 phase/task 分组，便于追踪
4. **文档同步** - 更新对应的 README/JSDoc
5. **备份计划** - 大改动前最好有分支备份

---

## 📞 帮助和支持

如果遇到问题：

1. **构建失败**: 检查 `nx run governance:test --verbose`
2. **引用报错**: 使用 `rg` 搜索所有调用点
3. **类型错误**: 检查 TypeScript 类型推导，可能需要显式类型注解
4. **测试失败**: 检查测试是否需要更新以适应新的签名

---

## ✨ 完成后的改进

重构完成后，governance 包将成为：

✅ **DDD 最佳实践的活文档**

- 统一的 Result 模式
- 清晰的错误码规范
- 完整的中文文档和注释

✅ **代码质量标杆**

- 统一的命名和文件组织
- 清晰的分层架构
- 完整的 JSDoc 覆盖

✅ **其他包的迁移参考**

- task/goal 包可参考 governance 的模式
- 逐步统一项目代码风格
- 降低新开发者的学习成本

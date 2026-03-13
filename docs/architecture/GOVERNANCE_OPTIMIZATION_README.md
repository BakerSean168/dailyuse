# Governance 包代码质量优化 - 总体指南

**生成时间**: 2026-03-13  
**优化分支**: `refactor/governance-code-quality`  
**目标**: 将 governance 包转变为 DDD 最佳实践活文档  
**预计工作量**: ~11 小时

---

## 🎯 优化目标

governance 包在架构中的定位独特：不仅是一个功能模块，而且是 **DDD 模式、Result 错误处理、代码规范的活文档和参考实现**。

本优化计划通过以下方式提升其质量：

1. **消除数据不一致** — 删除重复的枚举和 schema 定义
2. **统一代码规范** — Result 用法、错误码格式、异常处理
3. **改善文档质量** — 中文注释、完整 JSDoc、清晰架构

这样做的好处：

- ✅ governance 包成为项目代码标准的示范
- ✅ task、goal 等包可参考 governance 进行迁移
- ✅ 新开发者通过 governance 学习项目约定

---

## 📚 文档导航

| 文档                                                                                | 用途                         | 面向                 |
| ----------------------------------------------------------------------------------- | ---------------------------- | -------------------- |
| **📋 [governance-refactoring-plan.md](./governance-refactoring-plan.md)**           | 完整的重构方案和决策说明     | 架构师、技术负责人   |
| **✅ [governance-refactoring-checklist.md](./governance-refactoring-checklist.md)** | 逐文件、逐行的修改清单       | 执行开发者           |
| **📅 [GOVERNANCE_OPTIMIZATION_TASKS.md](./GOVERNANCE_OPTIMIZATION_TASKS.md)**       | 任务分解、时间估计、进度跟踪 | 项目管理、执行开发者 |
| **📖 [本文件]**                                                                     | 快速开始指南                 | 所有人               |

---

## 🚀 快速开始

### Step 1: 理解全景

```bash
# 1. 阅读重构方案（了解为什么）
cat docs/architecture/governance-refactoring-plan.md | head -100

# 2. 查看审查发现（了解哪些问题）
# 见 governance-refactoring-plan.md 中的"P0-P2 优先级分类"部分
```

### Step 2: 准备工作环境

```bash
# 创建或切换到优化分支
git checkout -b refactor/governance-code-quality

# 安装依赖（如有变更）
npm install

# 验证初始状态
nx run governance:build
nx run governance:test
```

### Step 3: 按 Phase 执行

```bash
# Phase 1: 数据安全 (2h)
# 详见 governance-refactoring-checklist.md 中的 "Phase 1" 部分

# Phase 2: 代码规范 (6h)
# 详见 governance-refactoring-checklist.md 中的 "Phase 2" 部分

# Phase 3: 质量提升 (3h)
# 详见 governance-refactoring-checklist.md 中的 "Phase 3" 部分
```

### Step 4: 验证和提交

```bash
# 每个 Phase 完成后运行完整验证
nx run governance:build && nx run governance:test

# 查看变更（应该是预期的改动）
git diff --stat

# 按 Phase 提交（见提交模板）
git add .
git commit -m "feat(governance): [Phase X] description"
```

---

## 🔍 三大问题类别速览

### P0 - 数据安全风险 🔴 HIGH

**问题**: 同一概念在三处定义，且值不一致 → 运行时数据错配

**症状**:

```typescript
// contracts/domain/rule.enums.ts (旧)
RuleStatus = 'draft' | 'active' | 'deprecated';

// contracts/value-objects/rule-status.ts (新)
RuleStatus = 'Draft' | 'Active' | 'Deprecated';

// contracts/api/rule-crud.dto.ts (旧，会导致验证失败)
severity: z.enum(RuleSeverityValues); // 用的是小写值
```

**修复方案**: P0.1 + P0.2 + P0.3（文件级操作，最清晰）

- 删除 `contracts/domain/rule.enums.ts`
- 统一 `rule-crud.dto.ts` 为 PascalCase
- 删除模板文件

**预计时间**: 2 小时

---

### P1 - 代码规范混乱 🟡 MEDIUM

**问题**: Result 用法、错误码格式、异常处理在不同位置不一致

**症状**:

```typescript
// controller 中
return fail({ code: '...', message: '...' })

// use case 中
return error('RULE.NOT_FOUND', 'not found')

// client service 中
return { ok: true, data: { ... } }

// domain entity 中
throw new Error(...)
```

**修复方案**: P1.1 + P1.2 + P1.3 + P1.4（代码级操作）

- 统一使用 `error()` 和 `ResultErrors.*`
- 统一错误码格式为 `SCREAMING_SNAKE_CASE`
- 统一异常处理为 Result 模式
- 统一客户端服务为 constructor 注入

**预计时间**: 6 小时

---

### P2 - 文档和质量 🟢 LOW

**问题**: 中英文混杂、某些实现无文档、命名不一致

**症状**:

```typescript
// domain-server: 中文
/**  规则聚合根 */

// domain-client: 英文
/** Client Rule */

// PowerSync repos: 无 JSDoc
export class RulePowerSyncRepository

// 文件命名: 不一致
powersync-rule.mapper.ts     // 适配器在前
rule-prisma.mapper.ts        // 实体在前
```

**修复方案**: P2.1 + P2.2 + P2.3（质量提升）

- 统一注释语言为中文
- 补充 PowerSync 实现的 JSDoc
- 统一文件命名为 `{entity}-{adapter}` 模式

**预计时间**: 3 小时

---

## 📊 变更影响范围

```
governance 包结构
├── contracts/
│   ├── domain/
│   │   └── rule.enums.ts                    ❌ 删除
│   ├── value-objects/
│   │   ├── rule-status.ts                   ✅ 保留（PascalCase）
│   │   └── rule-severity.ts                 ✅ 保留
│   ├── api/
│   │   ├── rules.ts                         ✅ 更新验证（确保 PascalCase）
│   │   └── rule-crud.dto.ts                 ⚠️  更新枚举值
│   └── dtos/
│       ├── rule-example.dto.ts              ❌ 删除
│       ├── complex-example.dto.ts           ❌ 删除
│       └── config.ts                        ⚠️  检查用途
│
├── domain-server/
│   ├── aggregates/rule.ts                   ⚠️  Result 签名不变，但处理 P1.3
│   └── entities/rule-revision.ts            🔄 改为返回 Result
│
├── domain-client/
│   ├── aggregates/rule.ts                   🔄 翻译注释为中文
│   └── entities/rule-revision.ts            🔄 翻译注释为中文
│
├── application-server/
│   └── use-cases/**/*.ts                    🔄 统一错误码格式
│
├── application-client/
│   └── services/
│       ├── rule-client-service.ts           ⚠️  标记 @deprecated
│       ├── create-rule.ts                   🔄 constructor 注入 + ok()
│       ├── delete-rule.ts                   🔄 constructor 注入 + ok()
│       ├── get-rule.ts                      🔄 constructor 注入 + ok()
│       ├── list-rules.ts                    🔄 constructor 注入 + ok()
│       ├── search-rules.ts                  🔄 constructor 注入 + ok()
│       └── update-rule.ts                   🔄 constructor 注入 + ok()
│
├── controllers/
│   └── governance.controller.ts             🔄 error() + 标准错误码
│
└── infrastructure-server/adapters/
    ├── prisma/                              ✅ 无需改动
    └── powersync/
        ├── rule-powersync.repository.ts     🔄 添加 JSDoc
        ├── rule-revision-powersync.repository.ts
        └── mappers/
            ├── rule-powersync.mapper.ts     📝 重命名 + JSDoc
            ├── rule-revision-powersync.mapper.ts
            └── ...

图例:
✅ 无需改动
🔄 需要改动
🔧 需要验证
⚠️  可能需要改动
❌ 删除
```

---

## ⏱️ 时间线

```
Day 1 (2h)   : Phase 1 - P0 数据安全
              上午: P0.1 + P0.2 (1h)
              下午: P0.3 + 验证 (1h)

Day 2-3 (6h) : Phase 2 - P1 代码规范
              Day 2: P1.1 + P1.2 第一部分 (3h)
              Day 3: P1.2 第二部分 + P1.3 + P1.4 (3h)

Day 4 (3h)   : Phase 3 - P2 质量提升
              上午: P2.1 + P2.2 (2h)
              下午: P2.3 + 最终验证 (1h)

Day 5 (可选) : 代码审查、修改反馈、final commit
```

---

## ✅ 完成标志

### 数据一致性 ✅

```bash
# 应该找不到重复的枚举定义
rg "RuleStatus.*=.*'(Draft|draft)" packages/governance/src/ | wc -l
# 预期结果: 1 (只有一处定义)

# 应该找不到 rule.enums 或 rule-crud.dto 的引用
rg "from.*rule.enums|from.*rule-crud" packages/governance/src/
# 预期结果: (空)
```

### 代码规范一致 ✅

```bash
# 不应该有 fail() 调用
rg "fail\(" packages/governance/src/ --type ts | grep -v import
# 预期结果: (空)

# 不应该有手动 Result 字面量
rg "\{ ok: (true|false)" packages/governance/src/ --type ts
# 预期结果: (空)

# 所有错误码应该符合标准
rg "code: '[^A-Z_]|code: '.*\." packages/governance/src/ --type ts
# 预期结果: (空)
```

### 文档质量 ✅

```bash
# PowerSync 文件应该都有 JSDoc
rg "/\*\*" packages/governance/src/infrastructure-server/adapters/powersync/ --type ts | head -1
# 预期结果: 显示多个 JSDoc 块

# 文件命名应该统一
ls packages/governance/src/infrastructure-server/adapters/powersync/mappers/
# 预期结果:
#   rule-powersync.mapper.ts ✅
#   rule-revision-powersync.mapper.ts ✅
```

### 测试通过 ✅

```bash
nx run governance:build
# ✅ 构建成功

nx run governance:test
# ✅ 所有测试通过
```

---

## 🔗 相关资源

| 资源                | 链接                                                                         |
| ------------------- | ---------------------------------------------------------------------------- |
| 完整重构方案        | [governance-refactoring-plan.md](./governance-refactoring-plan.md)           |
| 修改清单            | [governance-refactoring-checklist.md](./governance-refactoring-checklist.md) |
| 任务追踪            | [GOVERNANCE_OPTIMIZATION_TASKS.md](./GOVERNANCE_OPTIMIZATION_TASKS.md)       |
| 源代码              | [`packages/governance/src`](/packages/governance/src)                        |
| DDD 架构指南        | [ddd-architecture.md](./ddd-architecture.md)                                 |
| Result Pattern 说明 | [result-pattern.md](./result-pattern.md)                                     |

---

## 💡 实施建议

### 1. 代码审查策略

**按 Phase 分别提交 PR**:

- PR 1: Phase 1 (P0) — 数据安全，快速通过
- PR 2: Phase 2 (P1) — 代码规范，需要仔细审查
- PR 3: Phase 3 (P2) — 质量提升，可快速通过

这样做的好处：

- 每个 PR 都是逻辑完整的改动
- 如果某个 PR 有问题，可以单独处理
- 代码审查更容易关注重点

### 2. 测试覆盖

**关键测试点**:

- [ ] Unit tests — governance package 的测试全部通过
- [ ] Integration tests — 与其他包的集成不破裂
- [ ] Type check — `npx tsc --noEmit` 无类型错误
- [ ] Build — `nx run governance:build` 能生成产物

### 3. 文档维护

**需要同步更新的文档**:

- [ ] `packages/governance/README.md` — 说明新的 Result 用法规范
- [ ] Architecture ADR — 更新决策记录
- [ ] 迁移指南 — task/goal 包参考 governance 进行迁移

### 4. 后续计划

优化完成后：

- [ ] **将 governance 的做法推广到其他包** — task, goal 包参考 governance 进行迁移
- [ ] **建立代码规范文档** — 统一 Result 用法、错误码格式、命名约定
- [ ] **新手培训** — 新开发者通过 governance 包学习项目约定

---

## ❓ 常见问题

**Q: 这个优化会不会破坏已有功能？**

A: 不会。改动都是内部重构，不改变公开 API 的行为。所有变更后都会运行完整测试套件。

---

**Q: 如果遇到某个 Phase 无法完成怎么办？**

A: 使用 `git stash` 保存当前进度，切回 main 分支，然后重新创建分支。如果某个文件改乱了，可以用 `git checkout -- <file>` 恢复。

---

**Q: 能否一次性完成所有 Phase？**

A: 可以，但不推荐。分阶段做的好处是：

1. 每个 Phase 都是逻辑完整的改动
2. 中间可以暂停和审查
3. 如果中途发现问题，影响范围更小
4. 更容易进行代码审查

建议: 每天完成一个 Phase，这样可以每天都有可提交的成果。

---

**Q: 测试失败了怎么办？**

A:

1. 读错误信息，找出具体问题
2. 查看 git diff 看改了什么
3. 通常是因为 API 签名改了（如返回类型从 T 改为 Result<T>）
4. 需要同时更新测试代码以适应新签名

使用 `nx run governance:test -- --watch` 可以进入 watch 模式，改一行代码测试立即运行。

---

## 📞 获得帮助

如果遇到问题或有疑问：

1. **查看 checklist** — 每个具体任务都有详细说明
2. **查看原审查报告** — governance-refactoring-plan.md 的"发现"部分有背景
3. **运行验证命令** — 文档中提供了验证步骤
4. **查看 git history** — 看看 Phase 之间的变化

---

## 🎉 完成后的收获

重构完成后：

✨ **governance 包变成了项目的代码标准示范**

- 统一的 Result 模式
- 清晰的错误处理约定
- 完整的中文文档

📚 **新开发者有了学习资源**

- 通过 governance 包了解 DDD 模式
- 通过 governance 包了解项目约定
- 少走弯路，提高生产力

🚀 **其他包有了迁移标杆**

- task/goal 包可以参考 governance 进行改进
- 项目代码风格逐步统一
- 技术债逐步清偿

---

**让我们开始吧！** 🚀

下一步: 打开 [governance-refactoring-checklist.md](./governance-refactoring-checklist.md)，从 Phase 1 Task P0.1.1 开始。

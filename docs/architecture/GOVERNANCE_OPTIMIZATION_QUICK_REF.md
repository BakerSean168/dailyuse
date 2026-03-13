# Governance 包优化 - 快速参考卡

**打印这个！** 优化过程中随时查阅

---

## 📋 Phase 快速概览

### Phase 1: 数据安全 (2h)

**三个小任务**:

1. ❌ 删除 `contracts/domain/rule.enums.ts`
2. ⚠️ 更新 `contracts/api/rule-crud.dto.ts` 枚举值为 PascalCase
3. ❌ 删除 `contracts/dtos/rule-example.dto.ts` 和 `complex-example.dto.ts`

**验证命令**:

```bash
rg "rule.enums|rule-crud|rule-example" packages/governance/src/
# 应为空

nx run governance:test
# 应全绿
```

---

### Phase 2: 代码规范 (6h)

**四个中等任务**:

| 任务 | 位置                             | 改什么                  |
| ---- | -------------------------------- | ----------------------- |
| P1.1 | Controller + Adapter             | `fail()` → `error()`    |
| P1.2 | Use Cases + Controller + Adapter | 错误码统一格式          |
| P1.3 | Domain Entity                    | `throw` → `Result<>`    |
| P1.4 | Client Services (6 个文件)       | 单例 → constructor 注入 |

**验证命令**:

```bash
# P1.1 验证
rg "fail\(" packages/governance/src/ --type ts | grep -v import

# P1.2 验证
rg "code: '[A-Z_.]+" packages/governance/src/ --type ts | grep -v ResultCode

# P1.3 验证
rg "throw new Error" packages/governance/src/domain-server --type ts

# P1.4 验证
rg "static createInstance|static getInstance" packages/governance/src/

# 全部验证
nx run governance:test
```

---

### Phase 3: 质量提升 (3h)

**三个小任务**:

1. 🔄 翻译 domain-client 注释为中文
2. 📝 为 PowerSync 文件补充 JSDoc
3. 📝 重命名 PowerSync mapper: `powersync-*.ts` → `*-powersync.ts`

**验证命令**:

```bash
# 文件检查
ls packages/governance/src/infrastructure-server/adapters/powersync/mappers/

# 应显示:
#   rule-powersync.mapper.ts ✅
#   rule-revision-powersync.mapper.ts ✅
#   (无 powersync-rule.mapper.ts ❌)

nx run governance:test
```

---

## 🔥 关键改动一览

### ❌ 删除的文件

```
packages/governance/src/contracts/domain/rule.enums.ts
packages/governance/src/contracts/dtos/rule-example.dto.ts
packages/governance/src/contracts/dtos/complex-example.dto.ts
```

### 🔄 重命名的文件

```
powersync-rule.mapper.ts → rule-powersync.mapper.ts
powersync-rule-revision.mapper.ts → rule-revision-powersync.mapper.ts
```

### ⚠️ 需要修改的文件

| 文件                                                       | 改什么                                               |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `contracts/api/rule-crud.dto.ts`                           | 枚举值 lowercase → PascalCase                        |
| `controllers/governance.controller.ts`                     | `fail()` → `error()`                                 |
| `infrastructure-client/adapters/http/rule-http.adapter.ts` | `fail()` → `error()`                                 |
| `domain-server/entities/rule-revision.ts`                  | `throw` → `Result<>`                                 |
| `domain-server/aggregates/rule.ts`                         | 处理 RuleRevision.create() 返回的 Result             |
| `application-server/use-cases/**/*.ts`                     | 错误码统一格式                                       |
| `application-client/services/*.ts` (6 个)                  | 字面量 Result → `ok()`/`error()`, 单例 → constructor |
| `infrastructure-server/adapters/powersync/**/*.ts`         | 补充 JSDoc                                           |
| `domain-client/**/*.ts`                                    | 翻译注释为中文                                       |

---

## 🎯 每日任务分配

### Day 1 (2h) - Phase 1

```
08:00 - 08:30  P0.1 - 分析 rule.enums 引用
08:30 - 08:45  P0.1 - 删除 rule.enums.ts
08:45 - 09:00  P0.2 - 更新 rule-crud.dto.ts
09:00 - 09:15  P0.3 - 删除示范文件
09:15 - 10:00  验证 + 提交

✅ 验证: nx run governance:test
✅ 提交: feat(governance): [Phase 1] consolidate enum definitions
```

### Day 2 (3h) - Phase 2 Part 1

```
09:00 - 09:30  P1.1 - 更新 controller fail()
09:30 - 10:00  P1.1 - 更新 adapter fail()
10:00 - 10:30  P1.1 - 更新 6 个 client services 的字面量 Result
10:30 - 11:30  P1.2 - 生成错误码映射表 + 更新 use cases
11:30 - 12:00  P1.2 - 更新 controller 错误码处理
12:00 - 13:00  午餐

13:00 - 13:30  P1.2 - 更新 adapter 错误码
13:30 - 14:30  验证测试 + 修复失败

✅ 验证: nx run governance:test
✅ 提交: feat(governance): [Phase 2.1-2.2] unify Result and error codes
```

### Day 3 (3h) - Phase 2 Part 2 & 3

```
09:00 - 09:30  P1.3 - 改造 RuleRevision.create() 返回 Result
09:30 - 10:15  P1.3 - 更新 Rule 中的调用方
10:15 - 11:00  P1.4 - 改造 6 个 client services (constructor 注入)
11:00 - 11:30  验证 + 修复
11:30 - 12:00  提交

✅ 验证: nx run governance:test
✅ 提交: feat(governance): [Phase 2.3-2.4] Result patterns and service refactor
```

### Day 4 (3h) - Phase 3

```
09:00 - 09:30  P2.1 - 翻译 domain-client 注释
09:30 - 10:00  P2.1 - 为 PowerSync 文件补充 JSDoc
10:00 - 10:15  P2.2 - 重命名 mapper 文件
10:15 - 10:45  P2.2 - 更新导入引用
10:45 - 11:15  P2.3 - 梳理导出结构
11:15 - 12:00  验证 + 提交

✅ 验证: nx run governance:test
✅ 提交: docs(governance): [Phase 3] improve doc and quality
```

---

## 💻 常用命令速查

### 搜索和验证

```bash
# 查找所有 fail() 调用
rg "fail\(" packages/governance/src/ --type ts -n

# 查找所有手动 Result 字面量
rg "\{ ok: (true|false)" packages/governance/src/ --type ts -n

# 查找 throw 语句（应该没有在 domain entities 中）
rg "throw new Error" packages/governance/src/domain-server --type ts

# 查找错误码（检查格式是否统一）
rg "code: '[^']+" packages/governance/src/ --type ts | sort | uniq
```

### 构建和测试

```bash
# 完整构建
nx run governance:build

# 运行所有测试
nx run governance:test

# 仅运行特定模块的测试
nx run governance:test -- domain-server
nx run governance:test -- domain-client
nx run governance:test -- application-server

# Watch 模式（改代码立即运行测试）
nx run governance:test -- --watch

# 类型检查
npx tsc --noEmit

# Lint 检查
npx eslint packages/governance/src
```

### Git 操作

```bash
# 查看改了什么
git diff --stat

# 详细看某个文件的改动
git diff packages/governance/src/path/to/file.ts

# 暂存所有改动
git add .

# 提交
git commit -m "feat(governance): [Phase X] description"

# 查看提交日志
git log --oneline | head -10

# 如果需要撤销某个文件的改动
git checkout -- packages/governance/src/path/to/file.ts

# 如果改乱了，恢复到上次提交
git reset --hard HEAD
```

---

## 🐛 常见问题速解

**Q: 构建失败，说某个类型找不到**

```bash
# 原因：可能是删除了文件或改了导出
# 解决：运行构建看详细错误
nx run governance:build --verbose

# 或使用 TypeScript 编译器检查
npx tsc --noEmit

# 查看是否有 import 引用了已删除的文件
rg "from.*rule.enums|from.*rule-example" packages/governance/src/
```

**Q: 测试失败，说 API 签名不对**

```bash
# 原因：可能改了方法签名（如返回类型）
# 解决：更新测试以适应新签名

# 首先看哪个测试失败
nx run governance:test -- --reporter=verbose

# 打开对应的测试文件，更新期望值
# 例如 create() 返回类型改了，测试中的期望也要改
```

**Q: 文件改乱了想恢复**

```bash
# 恢复单个文件到上次提交状态
git checkout -- packages/governance/src/path/to/file.ts

# 恢复整个目录
git checkout -- packages/governance/src/

# 如果已经 add 了，先 reset
git reset HEAD packages/governance/src/path/to/file.ts
git checkout -- packages/governance/src/path/to/file.ts
```

**Q: 提交信息写错了想改**

```bash
# 如果还没推送，可以改 commit message
git commit --amend -m "新的 commit message"

# 如果已经推送了，就算了别改了
```

---

## ✅ Phase 完成检查表

### 完成 Phase 1 后

- [ ] `rg "rule.enums"` 结果为空
- [ ] `rg "rule-crud"` 结果为空（除了 api/rules.ts）
- [ ] `rg "rule-example|complex-example"` 结果为空
- [ ] `nx run governance:test` ✅ 全绿

### 完成 Phase 2 后

- [ ] `rg "fail\(" | grep -v import` 结果为空
- [ ] `rg "\{ ok: (true|false)"` 结果为空
- [ ] `rg "throw new Error" packages/governance/src/domain-server` 结果为空
- [ ] `rg "static createInstance"` 结果为空（应无客户端 singletons）
- [ ] `nx run governance:test` ✅ 全绿

### 完成 Phase 3 后

- [ ] PowerSync mapper 文件名已改为 `*-powersync.ts` 格式
- [ ] `ls infrastructure-server/adapters/powersync/mappers/` 显示新名称
- [ ] PowerSync 文件都有 JSDoc（可用 `rg "/\*\*"` 验证数量）
- [ ] domain-client 文件中中文注释已添加
- [ ] `nx run governance:build && nx run governance:test` ✅ 全绿

---

## 📞 求助资源

| 需要帮助       | 查看文件                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| 不知道做什么   | [GOVERNANCE_OPTIMIZATION_README.md](./GOVERNANCE_OPTIMIZATION_README.md)                 |
| 需要详细步骤   | [governance-refactoring-checklist.md](./governance-refactoring-checklist.md)             |
| 需要时间计划   | [GOVERNANCE_OPTIMIZATION_TASKS.md](./GOVERNANCE_OPTIMIZATION_TASKS.md)                   |
| 需要理解为什么 | [governance-refactoring-plan.md](./governance-refactoring-plan.md)                       |
| 需要架构背景   | [ddd-architecture.md](./ddd-architecture.md) 或 [result-pattern.md](./result-pattern.md) |

---

## 🎯 快速决策表

**遇到选择题时**:

| 情景                   | 决策                                            |
| ---------------------- | ----------------------------------------------- |
| 该不该改 class A？     | 查 checklist，如果在列表里就改，不在就不改      |
| 改完了能不能提交？     | 先跑 `nx run governance:test`，全绿就能提       |
| 能不能跳过某个 Phase？ | 不能，顺序很重要（P0 → P1 → P2）                |
| 遇到测试失败了？       | 不要改测试，先看 git diff，理解改了什么，再决定 |
| 某个文件改得很复杂？   | 可以用 `git diff` 看改动，或者恢复重来          |

---

## 🚀 启动！

现在就开始吧：

1. 打开 Terminal，进入项目目录
2. 运行: `git checkout -b refactor/governance-code-quality`
3. 打开: [governance-refactoring-checklist.md](./governance-refactoring-checklist.md)
4. 从 **Phase 1 > Task P0.1.1** 开始

祝你成功！ 💪

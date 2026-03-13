# Governance 包代码规范优化方案

**状态**: 规划阶段  
**优化分支**: 已创建  
**目标**: 将 governance 包作为活文档、示范典范的同时，提升代码规范一致性和类型安全

---

## 📋 执行日程

- **Phase 1** (P0 - 数据安全): 消除枚举值冲突和 schema 定义重复
- **Phase 2** (P1 - 代码规范): 统一 Result 用法、错误码格式、异常处理模式
- **Phase 3** (P2 - 质量提升): 文档规范、去重、命名、代码清理

每个 Phase 完成后运行验证：

```bash
nx run governance:build
nx run governance:test
```

---

## Phase 1: P0 - 数据安全（核心一致性）

### P0.1 消除枚举值定义冲突

**问题**: 同一概念在三处定义，且值的 casing 不一致

| 文件                                         | RuleStatus 值                         | RuleSeverity 值                | 问题              |
| -------------------------------------------- | ------------------------------------- | ------------------------------ | ----------------- |
| `contracts/domain/rule.enums.ts`             | `'draft'`, `'active'`, `'deprecated'` | `'mandatory'`, `'recommended'` | lowercase （旧）  |
| `contracts/value-objects/rule-status.ts`     | `'Draft'`, `'Active'`, `'Deprecated'` | `'Mandatory'`, `'Recommended'` | PascalCase （新） |
| `domain-shared/value-objects/rule-status.ts` | `'Draft'`, `'Active'`, `'Deprecated'` | `'Mandatory'`, `'Recommended'` | PascalCase （新） |

**影响**:

- ❌ `rule-crud.dto.ts` 用 lowercase，会导致运行时数据不匹配
- ❌ API 请求验证可能失败

**解决方案**:

- [ ] **P0.1.1** 删除 `packages/governance/src/contracts/domain/rule.enums.ts`
  - 备份内容（注释保留）
  - 检查引用（只被 `rule-crud.dto.ts` 引用）
  - 删除文件

- [ ] **P0.1.2** 更新 `packages/governance/src/contracts/api/rule-crud.dto.ts`
  - 修改 enum 值为 PascalCase：`['Draft', 'Active', 'Deprecated']`
  - 修改 severity enum：`['Mandatory', 'Recommended']`
  - 运行 test 确认不破坏现有 API

**验证**:

```bash
# 确保没有 lowercase 枚举值在代码中存在
nx run governance:test -- --grep "RuleStatus|RuleSeverity"
```

---

### P0.2 统一 CreateRuleSchema 定义

**问题**: 两套互相矛盾的 schema

| 文件                             | 字段                                                     | 枚举值     | 验证规则               | 问题        |
| -------------------------------- | -------------------------------------------------------- | ---------- | ---------------------- | ----------- |
| `contracts/api/rules.ts`         | 完整（goodExamples, badExamples, liveReferenceLocation） | PascalCase | 严格（regex、min/max） | 主要版本 ✅ |
| `contracts/api/rule-crud.dto.ts` | 简化（status, examples）                                 | lowercase  | 宽松                   | 冗余 ❌     |

**影响**:

- ❌ 开发者不知道哪个是权威版本
- ❌ Zod 验证规则不一致
- ❌ schema 字段名不一致

**解决方案**:

- [ ] **P0.2.1** 确认 `rules.ts` 是唯一权威 schema
  - 检查整个项目对 `rule-crud.dto.ts` 的引用
  - 确保没有其他代码依赖 rule-crud.dto

- [ ] **P0.2.2** 删除/替换所有对 `rule-crud.dto.ts` 的导入
  - 搜索: `from.*rule-crud.dto`
  - 替换为 `from.*rules`

- [ ] **P0.2.3** 删除文件 `packages/governance/src/contracts/api/rule-crud.dto.ts`

**验证**:

```bash
# 确认没有残留引用
rg "rule-crud.dto" packages/governance/src/
# 结果应为空
```

---

### P0.3 清理模板残留文件

**问题**: 示范文件还在代码中

- `contracts/dtos/rule-example.dto.ts` — 示范 DTO 文件
- `contracts/dtos/complex-example.dto.ts` — 示范 DTO 文件
- `contracts/configs/config.ts` — `ExampleModuleConfig` 命名

**解决方案**:

- [ ] **P0.3.1** 删除示范 DTO 文件
  - `packages/governance/src/contracts/dtos/rule-example.dto.ts`
  - `packages/governance/src/contracts/dtos/complex-example.dto.ts`
  - 检查是否有引用（应该没有）

- [ ] **P0.3.2** 检查 `config.ts` 的实际用途
  - 如果 `ExampleModuleConfig` 是示范，删除或重命名为实际用途的名字
  - 检查引用确认其用途

**验证**:

```bash
nx run governance:build  # 确保构建通过
```

---

## Phase 2: P1 - 代码规范统一

### P1.1 统一 Result 构造函数用法

**问题**: 混用 `fail()` 和 `error()`

| 使用者       | 位置                                                       | 用法                      | 问题    |
| ------------ | ---------------------------------------------------------- | ------------------------- | ------- |
| controller   | `controllers/governance.controller.ts`                     | `fail({ code, message })` | 不一致  |
| http adapter | `infrastructure-client/adapters/http/rule-http.adapter.ts` | `fail(...)`               | 不一致  |
| 其他所有     | use cases, domain, services                                | `error(code, message)`    | 一致 ✅ |

**规范决定**:

- **Domain/UseCase 层**: 使用 `error(code, message, details?)` 或 `ResultErrors.*` 工厂
- **Controller/Adapter 层**: 使用 `fail()` 当需要完整 ResultError 对象时；简单情况用 `error()`
- governance 模块：**统一使用 `error()` + `ResultErrors.*`**，不使用 `fail()`（保持与其他包一致）

**解决方案**:

- [ ] **P1.1.1** 更新 controller 中的 fail() 调用
  - 文件: `packages/governance/src/controllers/governance.controller.ts`
  - 将所有 `fail({ code, message, details })` 替换为 `error(code, message, details)`
  - 如果需要自定义错误构造，改用 `ResultErrors.*` 工厂

- [ ] **P1.1.2** 更新 HTTP adapter 中的 fail() 调用
  - 文件: `packages/governance/src/infrastructure-client/adapters/http/rule-http.adapter.ts`
  - 同上替换

- [ ] **P1.1.3** 更新 client services 的 Result 字面量
  - 6 个文件使用 `{ ok: true, data }` 而不是 `ok(data)`
  - 文件列表:
    - `application-client/services/list-rules.ts:64`
    - `application-client/services/create-rule.ts`
    - `application-client/services/get-rule.ts`
    - `application-client/services/update-rule.ts`
    - `application-client/services/delete-rule.ts`
    - `application-client/services/search-rules.ts`
  - 替换 `{ ok: true, data: ... }` → `ok(...)`
  - 替换 `{ ok: false, error: ... }` → `fail(...)`

- [ ] **P1.1.4** 在 governance 包 README 中添加规范说明
  - 创建/编辑 `packages/governance/README.md`
  - 文档化 Result 用法规范

**验证**:

```bash
# 检查是否还有 fail() 调用
rg "fail\(" packages/governance/src/ --type ts

# 检查是否还有字面量 Result 构造
rg "\{ ok: (true|false)" packages/governance/src/ --type ts
```

---

### P1.2 统一错误码格式

**问题**: 错误码格式混乱

| 来源             | 格式                   | 示例                                  |
| ---------------- | ---------------------- | ------------------------------------- |
| Use cases        | `MODULE.OPERATION`     | `'RULE.NOT_FOUND'` ❌                 |
| Controller       | `MODULE.MODULE.ERROR`  | `'GOVERNANCE.RULE.CREATE_FAILED'` ❌  |
| HTTP Adapter     | `SNAKE_CASE`           | `'RULE_FETCH_ERROR'` ❌               |
| 标准 (task/goal) | `SCREAMING_SNAKE_CASE` | `'VALIDATION_ERROR'`, `'CONFLICT'` ✅ |

**规范决定**: 使用 `ResultCode` 中定义的标准错误码或 `SCREAMING_SNAKE_CASE`

常用错误码:

- `'NOT_FOUND'` — 资源不存在
- `'VALIDATION_ERROR'` — 参数验证失败
- `'CONFLICT'` — 冲突（e.g., 重复的 code）
- `'INTERNAL_ERROR'` — 服务器内部错误
- `'BUSINESS_ERROR'` — 业务规则违反

**解决方案**:

- [ ] **P1.2.1** 扫描所有错误码并建立映射表
  - 输入: 扫描结果
  - 输出: 所有错误码及其应该映射到的标准码

- [ ] **P1.2.2** 更新 use case 中的错误码
  - 例: `'RULE.NOT_FOUND'` → `'NOT_FOUND'`
  - 例: `'RULE.CREATE_FAILED'` → `'CONFLICT'` 或 `'INTERNAL_ERROR'`（按具体原因）
  - 文件: `application-server/use-cases/**/*.ts`

- [ ] **P1.2.3** 更新 controller 中的错误码
  - 例: `'GOVERNANCE.RULE.CREATE_FAILED'` → `'INTERNAL_ERROR'`
  - 同时移除 `normalizeRuleMutationError()` 中的错误码转换逻辑（因为不再需要）
  - 文件: `controllers/governance.controller.ts`

- [ ] **P1.2.4** 更新 adapter 中的错误码
  - 例: `'RULE_FETCH_ERROR'` → `'INTERNAL_ERROR'`
  - 文件: `infrastructure-client/adapters/**/*.ts`

**验证**:

```bash
# 确保所有错误码都符合标准
rg "'[A-Z_]+'" packages/governance/src/ --type ts | grep error | grep -v "ResultCode\|ResultErrors"
```

---

### P1.3 统一异常处理模式

**问题**: `RuleRevision.create()` throws，而 `Rule.create()` 返回 Result

| 实体                    | 模式                   | 原因                                   |
| ----------------------- | ---------------------- | -------------------------------------- |
| `Rule.create()`         | 返回 `Result<Rule>`    | governance 推荐模式 ✅                 |
| `RuleRevision.create()` | `throw new Error(...)` | 与 task/goal 一致，但与 Rule 不一致 ❌ |

**决定**: governance 作为活文档，采用 Result 模式（而非 throw）。这是我们想要推广给其他包的最佳实践。

**解决方案**:

- [ ] **P1.3.1** 更新 `RuleRevision.create()` 返回 Result
  - 文件: `domain-server/entities/rule-revision.ts`
  - 改为: `static create(...): Result<RuleRevision>`
  - 验证逻辑改为返回 `error(...)` 而非 throw
  - 调用方（rule.ts）需要处理 Result

- [ ] **P1.3.2** 更新 Rule.create() 调用 RuleRevision.create() 的地方
  - 检查 rule.ts 中是否直接调用 `RuleRevision.create()`
  - 添加 Result 处理（可能需要传播或转化错误）

- [ ] **P1.3.3** 添加架构决策注释
  - 在两个 create() 方法的 JSDoc 中添加说明：
    ```typescript
    /**
     * ...
     * 【架构决策】
     * ✅ 返回 Result<T> 而非抛异常
     * 这是 governance 包推荐的模式，作为 DDD 活文档的示范。
     * 详见: docs/architecture/governance-refactoring-plan.md#P1.3
     */
    ```

**验证**:

```bash
# 运行 domain 测试确保逻辑不变
nx run governance:test -- domain-server
```

---

### P1.4 清理重复的客户端服务层

**问题**: 两套并行的客户端服务实现

| 实现         | 位置                                                                         | 模式              | 状态                                 |
| ------------ | ---------------------------------------------------------------------------- | ----------------- | ------------------------------------ |
| 6 个单独文件 | `application-client/services/{create,get,update,delete,list,search}-rule.ts` | 独立 singleton 类 | 新模式（governance 推荐）            |
| 单一类       | `application-client/services/rule-client-service.ts`                         | Constructor 注入  | 旧模式（被 goal 标记为 @deprecated） |

**决定**: 保留 6 个单独文件（这是新推荐模式），删除/标记 RuleClientService。

**解决方案**:

- [ ] **P1.4.1** 检查 RuleClientService 是否有外部依赖
  - 搜索所有对 `RuleClientService` 的引用
  - 如果没有或只有测试，直接删除
  - 如果有外部依赖，改为 @deprecated + 迁移指示

- [ ] **P1.4.2** 将 6 个单独类从 singleton 改为 constructor 注入
  - 当前模式: static createInstance() / getInstance()
  - 改为: export class GetRule { constructor(apiClient) {} }
  - 理由: 与 server use case 保持一致，方便依赖注入

- [ ] **P1.4.3** 统一 Result 用法（同 P1.1.3）
  - 所有 6 个文件中的 `{ ok: true, data }` → `ok(data)`

- [ ] **P1.4.4** 在 governance README 中说明这是推荐模式
  - 解释为什么分离成单独文件
  - 说明如何使用

**验证**:

```bash
# 检查是否还有 RuleClientService 的引用
rg "RuleClientService" packages/governance/

# 检查导出是否清晰
cat packages/governance/src/application-client/services/index.ts
```

---

## Phase 3: P2 - 质量提升

### P2.1 统一注释语言和规范

**问题**: 中英文注释混杂

| 模块            | 注释语言              | 状态      |
| --------------- | --------------------- | --------- |
| domain-server   | 中文 JSDoc            | ✅ 好     |
| domain-client   | 英文 JSDoc            | ❌ 不一致 |
| contracts/api   | 中文消息 + 中文 JSDoc | ✅ 好     |
| PowerSync repos | 无 JSDoc              | ❌ 缺失   |

**决定**: governance 作为面向中文开发者的活文档，统一使用**中文注释**。每个文件头部添加模块级 JSDoc。

**解决方案**:

- [ ] **P2.1.1** 创建注释规范文档
  - 新建: `docs/architecture/governance-doc-standards.md`
  - 模板: 每个公共导出都需要 JSDoc
  - 包含: 中文 + 设计决策说明（【DDD 模式示范】、【业务职责】等）

- [ ] **P2.1.2** 统一 domain-client 注释为中文
  - 文件: `domain-client/aggregates/rule.ts`, `domain-client/entities/rule-revision.ts`
  - 翻译所有英文注释为中文

- [ ] **P2.1.3** 为 PowerSync repositories 补充 JSDoc
  - 4 个文件都补充 JSDoc（参考 Prisma repository 的风格）
  - 包括:
    - `infrastructure-server/adapters/powersync/rule-powersync.repository.ts`
    - `infrastructure-server/adapters/powersync/rule-revision-powersync.repository.ts`
    - `infrastructure-server/adapters/powersync/mappers/powersync-rule.mapper.ts`
    - `infrastructure-server/adapters/powersync/mappers/powersync-rule-revision.mapper.ts`

- [ ] **P2.1.4** 检查所有 index.ts 的 JSDoc
  - 每层都应有简短的模块级说明

**验证**:

```bash
# 检查关键文件是否都有 JSDoc
nx run governance:build --verbose
```

---

### P2.2 统一 Mapper 文件命名

**问题**: 两种命名风格

| 适配器    | 当前风格                   | 问题          |
| --------- | -------------------------- | ------------- |
| Prisma    | `rule-prisma.mapper.ts`    | 实体在前 ✅   |
| PowerSync | `powersync-rule.mapper.ts` | 适配器在前 ❌ |

**决定**: 统一为 `{entity}-{adapter}.mapper.ts`

**解决方案**:

- [ ] **P2.2.1** 重命名 PowerSync mapper 文件
  - `powersync-rule.mapper.ts` → `rule-powersync.mapper.ts`
  - `powersync-rule-revision.mapper.ts` → `rule-revision-powersync.mapper.ts`

- [ ] **P2.2.2** 更新所有导入引用
  - `infrastructure-server/adapters/powersync/index.ts`
  - `infrastructure-server/adapters/powersync/rule-powersync.repository.ts`
  - `infrastructure-server/adapters/powersync/rule-revision-powersync.repository.ts`

**验证**:

```bash
nx run governance:build
```

---

### P2.3 梳理导出结构

**问题**: 某些导出不清晰或冗余

**解决方案**:

- [ ] **P2.3.1** 审查顶层 `src/index.ts` 的导出
  - 确保导出的是稳定的公开 API
  - 隐藏内部实现细节

- [ ] **P2.3.2** 检查各层 index.ts 的导出清晰度
  - `contracts/index.ts` — 所有契约类型
  - `domain-server/index.ts` — 聚合根、实体、库接口
  - `domain-client/index.ts` — 客户端视图模型
  - `application-server/index.ts` — 用例类
  - `application-client/index.ts` — 客户端服务和映射器
  - `infrastructure-server/index.ts` — 存储库实现、模块
  - `infrastructure-client/index.ts` — 适配器工厂

- [ ] **P2.3.3** 添加 `@internal` JSDoc 标记隐藏实现细节
  - 使用 TypeScript/JSDoc @internal 标记不应外部使用的导出

**验证**:

```bash
# 检查类型是否正确导出
npx tsc --noEmit
```

---

## ✅ 完成清单

### Phase 1 完成标志

- [ ] P0.1: 删除 rule.enums.ts 无编译错误
- [ ] P0.2: rule-crud.dto.ts 删除无引用报错
- [ ] P0.3: 示范文件删除构建通过
- [ ] 运行: `nx run governance:test` ✅ 所有测试通过

### Phase 2 完成标志

- [ ] P1.1: 无 `fail()` 调用，无字面量 Result 构造
- [ ] P1.2: 所有错误码符合 `ResultCode` 标准
- [ ] P1.3: RuleRevision.create() 返回 Result，测试通过
- [ ] P1.4: RuleClientService 删除/标记 @deprecated，6 个文件使用 constructor 注入
- [ ] 运行: `nx run governance:test` ✅ 所有测试通过

### Phase 3 完成标志

- [ ] P2.1: 所有文件使用中文注释，PowerSync repos 有 JSDoc
- [ ] P2.2: 所有 mapper 文件使用 `{entity}-{adapter}` 命名
- [ ] P2.3: 导出结构清晰，@internal 标记到位
- [ ] 运行: `nx run governance:build && nx run governance:test` ✅ 全部通过

---

## 📚 参考文档

- [Governance 活文档首页](/docs/architecture/README.md)
- [DDD 架构指南](/docs/architecture/ddd-architecture.md)
- [Result Pattern 设计](/docs/architecture/result-pattern.md)
- [Governance 模块源码](/packages/governance/README.md)

---

## 🔄 迭代反馈

完成每个 Phase 后：

1. 运行完整测试: `nx run governance:test`
2. 构建验证: `nx run governance:build`
3. 审查变更: `git diff --stat`
4. 提交规范: 按 Phase 分组提交，清晰的提交消息

例如:

```
feat(governance): [Phase 1] remove duplicate RuleStatus enum definitions

- Delete contracts/domain/rule.enums.ts (lowercase version)
- Update rule-crud.dto.ts enum values to PascalCase
- Verify no build/test failures

Related: #issue-number
```

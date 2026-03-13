# Governance 包重构 - 代码修改清单

**文档用途**: 逐项记录需要修改的具体文件、行号和修改内容  
**更新于**: 2026-03-13  
**状态**: 📋 规划中

---

## Phase 1: P0 - 数据安全（文件级操作）

### P0.1 - 删除重复枚举定义

#### 待删除文件

```
packages/governance/src/contracts/domain/rule.enums.ts
```

**检查清单**:

- [ ] 验证该文件只被 rule-crud.dto.ts 引用
- [ ] 备份内容（如有必要）
- [ ] 删除文件

**验证命令**:

```bash
rg "from.*rule.enums" packages/governance/src/ --type ts
# 结果应仅显示 rule-crud.dto.ts 中的引用
```

---

### P0.2 - 统一 Schema 定义

#### 文件: `packages/governance/src/contracts/api/rule-crud.dto.ts`

**修改内容**:

```typescript
// 修改前（行 3）：
import { RuleSeverityValues, RuleStatusValues } from '../domain/rule.enums';

// 修改后（改为从 value-objects 导入）：
// ❌ 删除这行，使用硬编码 PascalCase 值

// 修改前（行 10-11）：
severity: z.enum(RuleSeverityValues),
status: z.enum(RuleStatusValues),

// 修改后：
severity: z.enum(['Mandatory', 'Recommended']),
status: z.enum(['Draft', 'Active', 'Deprecated']),
```

**完整修改后的文件应该是**:

```typescript
import { z } from 'zod';
import type { RuleClientDTO } from '../aggregates';

export const CreateRuleSchema = z.object({
  code: z.string().min(1, 'Rule code is required').max(64),
  title: z.string().min(1, 'Rule title is required').max(256),
  description: z.string().min(1, 'Rule description is required').max(4000),
  severity: z.enum(['Mandatory', 'Recommended']), // ← 改为 PascalCase
  status: z.enum(['Draft', 'Active', 'Deprecated']), // ← 改为 PascalCase
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  examples: z.object({}).optional(), // 简化为空对象（可选）
});

export type CreateRuleReq = z.infer<typeof CreateRuleSchema>;
export type CreateRuleRes = RuleClientDTO;
```

**检查**:

- [ ] 验证导入 `RuleSeverityValues`, `RuleStatusValues` 已删除
- [ ] 验证 enum 值已更新为 PascalCase
- [ ] 运行 `nx run governance:test` 确保测试通过

---

#### 文件: `packages/governance/src/contracts/api/rules.ts`

**检查清单** (本文件无需修改，只需验证)：

- [ ] 验证该文件是否已使用 PascalCase enum 值（第 63, 202, 203, 236 行）
- [ ] 验证没有导入 `rule.enums`

**现状验证** (应该已正确):

```typescript
// 第 63 行应该是：
severity: z.enum(['Mandatory', 'Recommended'], { ... }),

// 第 202-203 行应该是：
status: z.enum(['Draft', 'Active', 'Deprecated']).optional(),
severity: z.enum(['Mandatory', 'Recommended']).optional(),
```

---

### P0.3 - 清理模板残留文件

#### 待删除文件

```
packages/governance/src/contracts/dtos/rule-example.dto.ts
packages/governance/src/contracts/dtos/complex-example.dto.ts
```

**检查清单**:

- [ ] 搜索整个项目确认无引用
  ```bash
  rg "rule-example|complex-example" packages/governance/src/ --type ts
  # 应为空
  ```
- [ ] 删除文件

#### 检查文件: `packages/governance/src/contracts/configs/config.ts`

**修改内容**:

确认 `ExampleModuleConfig` 的用途。如果是示范，删除或重命名：

```typescript
// 修改前：
export const EXAMPLE_MODULE_CONFIG = { ... };
export const EXAMPLE_GENERATION_CONFIG = { ... };

// 修改后（如果确实是示范）：
// 删除 EXAMPLE_ 前缀或改为实际用途名称
export const GENERATION_CONFIG = { ... };
export const VIEW_CONFIG = { ... };
export const VALIDATION_CONFIG = { ... };
```

**检查**:

- [ ] 验证 EXAMPLE\_\* 常量的实际用途
- [ ] 确认导出和引用地点
- [ ] 重命名或删除

---

## Phase 2: P1 - 代码规范统一

### P1.1 - 统一 Result 构造函数用法

#### 文件 1: `packages/governance/src/controllers/governance.controller.ts`

**修改位置**: 控制器中所有 `fail()` 调用

**示例修改** (需要在全文件中查找):

```typescript
// 修改前：
return fail({
  code: 'VALIDATION_ERROR',
  message: '参数验证失败',
  details: formatZodErrors(parsed.error.issues),
});

// 修改后：
return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(parsed.error.issues));

// 或使用工厂（推荐）：
return ResultErrors.validation(formatZodErrors(parsed.error.issues), '参数验证失败');
```

**检查清单**:

- [ ] 搜索所有 `fail(` 调用
  ```bash
  rg "fail\(" packages/governance/src/controllers/ --type ts -n
  ```
- [ ] 逐一替换为 `error()` 或 `ResultErrors.*`
- [ ] 验证测试通过

---

#### 文件 2: `packages/governance/src/infrastructure-client/adapters/http/rule-http.adapter.ts`

**修改内容** (同上，搜索 `fail(` 并替换):

```typescript
// 修改前：
return fail({
  code: 'RULE_FETCH_ERROR',
  message: 'Failed to fetch rule',
});

// 修改后：
return error('INTERNAL_ERROR', 'Failed to fetch rule');
```

**检查清单**:

- [ ] 搜索 `fail(` 调用
- [ ] 替换

---

#### 文件组: `packages/governance/src/application-client/services/*.ts`

**6 个文件清单**:

1. `create-rule.ts`
2. `delete-rule.ts`
3. `get-rule.ts`
4. `list-rules.ts`
5. `search-rules.ts`
6. `update-rule.ts`

**修改内容**: 替换所有手动 Result 字面量

```typescript
// 修改前（常见于 return 语句）：
return {
  ok: true,
  data: {
    /* ... */
  },
};

return {
  ok: false,
  error: { code: '...', message: '...' },
};

// 修改后：
return ok({
  /* ... */
});

return error('CODE', 'message');
```

**具体位置** (每个文件):

**`list-rules.ts`**:

- 第 64-74 行: `{ ok: true, data: { ... } }` → `ok({ ... })`

**其他 5 个文件**: 类似模式

**检查清单**:

- [ ] 每个文件搜索 `\{ ok: (true|false)`
  ```bash
  rg "\{ ok: (true|false)" packages/governance/src/application-client/services/ --type ts -n
  ```
- [ ] 逐一替换为 `ok()` / `error()`
- [ ] 确保导入 `ok`, `error` (或 `fail`)

---

### P1.2 - 统一错误码格式

**第一步**: 生成现有错误码的完整列表

```bash
# 搜索所有错误码定义
rg "code: '[A-Z_.]+" packages/governance/src/ --type ts -o | sort | uniq
```

**预期结果**（示例）:

```
code: 'RULE.NOT_FOUND'
code: 'RULE.CREATE_FAILED'
code: 'GOVERNANCE.RULE.CREATE_FAILED'
code: 'VALIDATION_ERROR'
code: 'INTERNAL_ERROR'
```

**错误码映射表** (待补充完整):

| 当前错误码                        | 标准错误码                         | 理由                |
| --------------------------------- | ---------------------------------- | ------------------- |
| `'RULE.NOT_FOUND'`                | `'NOT_FOUND'`                      | 直接使用 ResultCode |
| `'RULE.CREATE_FAILED'`            | `'INTERNAL_ERROR'` 或 `'CONFLICT'` | 取决于失败原因      |
| `'GOVERNANCE.RULE.CREATE_FAILED'` | 同上                               | 删除模块前缀        |
| `'VALIDATION_ERROR'`              | 保持不变                           | 已符合标准          |

**修改文件清单**:

#### 文件: `packages/governance/src/application-server/use-cases/**/*.ts`

所有 use case 文件中的错误码修改

示例文件:

- `commands/create-rule.use-case.ts`
- `commands/update-rule.use-case.ts`
- `commands/delete-rule.use-case.ts`
- `queries/get-rule.use-case.ts`
- `queries/list-rules.use-case.ts`
- `queries/search-rules.use-case.ts`
- `queries/get-rule-revisions.use-case.ts`

**修改模式**:

```typescript
// 修改前：
return error('RULE.NOT_FOUND', 'Rule not found');

// 修改后：
return error('NOT_FOUND', 'Rule not found');
```

---

#### 文件: `packages/governance/src/controllers/governance.controller.ts`

**修改位置**: `normalizeRuleMutationError()` 方法（第 66-96 行）

```typescript
// 当前方法应该简化或删除（如果不再需要错误码转换）
private normalizeRuleMutationError<T>(result: Result<T>): Result<T> {
  // ❌ 这个方法可能不再需要
  // ✅ 如果 use cases 已经返回标准错误码，这里可以直接返回 result
  return result;
}
```

**或者完全移除**，直接在 use case 方法中写：

```typescript
async createRule(input: unknown, ctx: Context): Promise<Result<CreateRuleRes>> {
  const parsed = CreateRuleSchema.safeParse(input);
  if (!parsed.success) {
    return error('VALIDATION_ERROR', '参数验证失败', formatZodErrors(...));
  }
  // 直接调用 use case，不再进行错误码转换
  return this.useCases.createRule(parsed.data, this.toExecutionContext(ctx));
}
```

---

#### 文件: `packages/governance/src/infrastructure-client/adapters/http/rule-http.adapter.ts`

**修改位置**: 所有 `error()` 调用中的错误码

```typescript
// 修改前：
return error('RULE_FETCH_ERROR', 'Failed to fetch');

// 修改后：
return error('INTERNAL_ERROR', 'Failed to fetch');
```

---

### P1.3 - 统一异常处理模式

#### 文件: `packages/governance/src/domain-server/entities/rule-revision.ts`

**修改位置**: `RuleRevision.create()` 方法（第 129-145 行）

**修改前**:

```typescript
static create(props: Omit<RuleRevisionState, 'id' | 'createdAt'> & { id?: RuleRevisionId }): RuleRevision {
  if (props.changedFields.length === 0) {
    throw new Error('RuleRevision must have at least one changed field');
  }
  // ...
}
```

**修改后**:

```typescript
static create(props: Omit<RuleRevisionState, 'id' | 'createdAt'> & { id?: RuleRevisionId }): Result<RuleRevision> {
  if (props.changedFields.length === 0) {
    return error('VALIDATION_ERROR', 'RuleRevision must have at least one changed field');
  }
  // ...
  return ok(new RuleRevision({ /* ... */ }));
}
```

**签名变更**:

```typescript
// 修改前：
static create(...): RuleRevision

// 修改后：
static create(...): Result<RuleRevision>
```

**调用方修改**: `domain-server/aggregates/rule.ts`

在 Rule 中调用 `RuleRevision.create()` 的地方需要处理 Result：

```typescript
// 找到所有 RuleRevision.create() 的调用
// 修改前：
const revision = RuleRevision.create({ ... });

// 修改后：
const revisionResult = RuleRevision.create({ ... });
if (!isOk(revisionResult)) {
  return revisionResult;  // 传播错误
}
const revision = revisionResult.data;
```

**检查清单**:

- [ ] 搜索 `RuleRevision.create(` 的所有调用点
  ```bash
  rg "RuleRevision\.create\(" packages/governance/src/ --type ts -n
  ```
- [ ] 更新返回类型为 `Result<RuleRevision>`
- [ ] 更新验证异常为 `error()` 返回
- [ ] 更新成功路径为 `return ok(...)`
- [ ] 更新所有调用方以处理 Result
- [ ] 运行测试验证

---

### P1.4 - 清理重复的客户端服务层

#### 检查: `packages/governance/src/application-client/services/rule-client-service.ts`

**任务 1**: 查找所有引用

```bash
rg "RuleClientService" packages/governance/ --type ts -n
rg "RuleClientService" . --type ts -n  # 在整个项目中搜索
```

**结果**:

- 如果没有外部引用 → 删除文件
- 如果有引用 → 标记为 `@deprecated`

**标记为 @deprecated**（如果需要）:

```typescript
/**
 * @deprecated Use individual service files instead (CreateRule, GetRule, etc.)
 *
 * 迁移指南: 将 RuleClientService 的方法调用改为使用对应的单独服务文件。
 * 例如:
 *   // 旧: new RuleClientService(client).fetchRules()
 *   // 新: new ListRules(client).execute()
 */
export class RuleClientService {
  // ...
}
```

**任务 2**: 统一 6 个服务文件的模式

文件列表:

- `create-rule.ts`
- `delete-rule.ts`
- `get-rule.ts`
- `list-rules.ts`
- `search-rules.ts`
- `update-rule.ts`

**修改模式**: 从 singleton 改为 constructor 注入

**修改前**（当前模式）:

```typescript
export class ListRules {
  private static instance: ListRules;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  static createInstance(apiClient: IRuleApiClient): ListRules {
    ListRules.instance = new ListRules(apiClient);
    return ListRules.instance;
  }

  static getInstance(apiClient?: IRuleApiClient): ListRules {
    if (!ListRules.instance) {
      if (!apiClient) {
        throw new Error('ListRules: API client is required...');
      }
      ListRules.instance = new ListRules(apiClient);
    }
    return ListRules.instance;
  }

  static resetInstance(): void {
    ListRules.instance = undefined as unknown as ListRules;
  }

  async execute(...): Promise<Result<...>> {
    // ...
  }
}
```

**修改后**（新模式，与 server use case 一致）:

```typescript
export class ListRules {
  constructor(private readonly apiClient: IRuleApiClient) {}

  async execute(...): Promise<Result<...>> {
    // ...
  }
}

// 使用示例：
// const service = new ListRules(apiClient);
// const result = await service.execute(query);
```

**检查清单** (每个文件):

- [ ] 删除所有 `static instance`, `createInstance`, `getInstance`, `resetInstance`
- [ ] 改为公开构造函数
- [ ] 更新导出（无需工厂方法）
- [ ] 更新测试（如有）

**同时完成 P1.1.3**: 替换 Result 字面量为 `ok()` / `error()`

---

### P1.4 补充: 更新导出

#### 文件: `packages/governance/src/application-client/services/index.ts`

检查当前导出，确保导出所有 6 个服务类而不是工厂方法：

```typescript
// 修改前（如果有 createInstance 导出）：
export { ListRules } from './list-rules';
export { CreateRule } from './create-rule';
// ...

// 修改后（应该如此）：
export class ListRules {
  /* ... */
}
export class CreateRule {
  /* ... */
}
```

---

## Phase 3: P2 - 质量提升

### P2.1 - 统一注释语言

#### 文件: `packages/governance/src/domain-client/aggregates/rule.ts`

**任务**: 翻译所有英文注释为中文

```typescript
// 修改前：
/**
 * Client Rule
 * Rich view model with helper methods
 */

// 修改后：
/**
 * 规则客户端视图模型
 * 提供丰富的视图层辅助方法
 */
```

**检查清单**:

- [ ] 逐行检查并翻译
- [ ] 确保中文注释清晰准确

---

#### 文件: `packages/governance/src/domain-client/entities/rule-revision.ts`

**同上操作**

---

#### 4 个 PowerSync 文件补充 JSDoc

文件列表:

1. `infrastructure-server/adapters/powersync/rule-powersync.repository.ts`
2. `infrastructure-server/adapters/powersync/rule-revision-powersync.repository.ts`
3. `infrastructure-server/adapters/powersync/mappers/powersync-rule.mapper.ts`
4. `infrastructure-server/adapters/powersync/mappers/powersync-rule-revision.mapper.ts`

**补充内容** (参考 Prisma 版本):

```typescript
/**
 * RulePowerSyncRepository - PowerSync 离线优先实现
 *
 * 【业务职责】
 * 实现 IRuleRepository 接口，使用 PowerSync 数据库作为存储后端。
 * 支持 Electron 应用的离线-优先工作流。
 *
 * 【对比 Prisma 实现】
 * - 支持本地缓存和离线编辑
 * - 自动同步到云端
 * - 用于桌面应用（Electron）
 *
 * @see {@link IRuleRepository} 接口定义
 * @see {@link RulePrismaRepository} 云端实现
 */
export class RulePowerSyncRepository implements IRuleRepository {
  // ...
}
```

---

### P2.2 - 统一 Mapper 文件命名

#### 重命名操作

```bash
# PowerSync 目录
mv packages/governance/src/infrastructure-server/adapters/powersync/mappers/powersync-rule.mapper.ts \
   packages/governance/src/infrastructure-server/adapters/powersync/mappers/rule-powersync.mapper.ts

mv packages/governance/src/infrastructure-server/adapters/powersync/mappers/powersync-rule-revision.mapper.ts \
   packages/governance/src/infrastructure-server/adapters/powersync/mappers/rule-revision-powersync.mapper.ts
```

**更新导入** (3 个文件):

#### 文件: `infrastructure-server/adapters/powersync/index.ts`

```typescript
// 修改前：
export * from './mappers/powersync-rule.mapper';
export * from './mappers/powersync-rule-revision.mapper';

// 修改后：
export * from './mappers/rule-powersync.mapper';
export * from './mappers/rule-revision-powersync.mapper';
```

#### 文件: `infrastructure-server/adapters/powersync/rule-powersync.repository.ts`

```typescript
// 修改前：
import { PowerSyncRuleMapper } from './mappers/powersync-rule.mapper';

// 修改后：
import { PowerSyncRuleMapper } from './mappers/rule-powersync.mapper';
```

#### 文件: `infrastructure-server/adapters/powersync/rule-revision-powersync.repository.ts`

```typescript
// 修改前：
import { PowerSyncRuleRevisionMapper } from './mappers/powersync-rule-revision.mapper';

// 修改后：
import { PowerSyncRuleRevisionMapper } from './mappers/rule-revision-powersync.mapper';
```

---

### P2.3 - 梳理导出结构

#### 文件: `packages/governance/src/index.ts` (顶层)

**检查任务**:

- [ ] 所有导出是否都是稳定的公开 API
- [ ] 是否有实现细节被暴露（应该隐藏）

**标记为 @internal** 的导出示例:

```typescript
/**
 * @internal 内部使用，不建议外部调用
 */
export { GovernanceContainer } from './infrastructure-server/di/governance-container';
```

---

## 📋 分阶段检查清单

### Phase 1 验证清单

```bash
# 1. 构建验证
nx run governance:build
# ✅ 应通过

# 2. 测试验证
nx run governance:test
# ✅ 所有测试通过

# 3. 引用检查
rg "rule.enums|rule-crud.dto|rule-example|complex-example" packages/governance/src/
# ✅ 应为空

# 4. 类型检查
npx tsc --noEmit
# ✅ 无错误
```

### Phase 2 验证清单

```bash
# 1. fail() 检查
rg "fail\(" packages/governance/src/ --type ts
# ✅ 应为空（除 result module import）

# 2. 字面量 Result 检查
rg "\{ ok: (true|false)" packages/governance/src/ --type ts
# ✅ 应为空

# 3. 错误码格式检查
rg "code: '[^A-Z_]|code: '.*\." packages/governance/src/ --type ts
# ✅ 应为空（仅标准错误码）

# 4. 异常检查（throw 关键字）
rg "throw new Error" packages/governance/src/domain-server --type ts
# ✅ 应为空（改用 Result）

# 5. 测试验证
nx run governance:test
# ✅ 所有测试通过

# 6. 构建验证
nx run governance:build
# ✅ 应通过
```

### Phase 3 验证清单

```bash
# 1. 中文注释检查（示范检查几个文件）
cat packages/governance/src/domain-client/aggregates/rule.ts | head -30
# ✅ 应显示中文 JSDoc

# 2. PowerSync JSDoc 检查
rg "/\*\*" packages/governance/src/infrastructure-server/adapters/powersync/ --type ts | wc -l
# ✅ 应有足够的 JSDoc 块

# 3. 文件命名检查
ls packages/governance/src/infrastructure-server/adapters/powersync/mappers/
# ✅ 应显示：
#    - rule-powersync.mapper.ts ✅
#    - rule-revision-powersync.mapper.ts ✅
#    - powersync-rule.mapper.ts ❌ (应不存在)

# 4. 最终完整测试
nx run governance:test
nx run governance:build
# ✅ 都应通过
```

---

## 💾 提交模板

按 Phase 分组提交，每个 Phase 作为一个或多个 commit：

### Phase 1 提交模板

```
feat(governance): [Phase 1] consolidate duplicate enum definitions and schemas

Consolidates three separate RuleStatus/RuleSeverity definitions into one:
- Deletes contracts/domain/rule.enums.ts (lowercase version)
- Updates rule-crud.dto.ts to use PascalCase values
- Removes template files from contracts/dtos/
- Standardizes enum values across all files to PascalCase

Tests: ✅ All tests pass
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P0
```

### Phase 2 提交模板（分多个 commit）

```
feat(governance): [Phase 2.1] unify Result constructor usage

Standardizes Result construction across client services:
- Replace manual Result literals { ok: true, data } with ok()
- Replace fail() calls with error() in controllers
- Update 6 client service files: {create,delete,get,list,search,update}-rule.ts
- Removes inconsistent fail() usage pattern

Tests: ✅ All tests pass
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P1.1
```

```
feat(governance): [Phase 2.2] standardize error code format

Normalizes all error codes to SCREAMING_SNAKE_CASE standard:
- Remove module prefixes (RULE.NOT_FOUND → NOT_FOUND)
- Use ResultCode enum values where applicable
- Simplify error code normalization in controller
- Align with project convention (task, goal packages)

Tests: ✅ All tests pass
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P1.2
```

```
feat(governance): [Phase 2.3] adopt Result pattern in domain entities

Refactors error handling to use Result instead of throw:
- RuleRevision.create() now returns Result<RuleRevision>
- Updates all call sites to handle Result
- Adds architectural decision comments
- Establishes governance package as DDD best practice reference

Tests: ✅ All tests pass (including domain entity tests)
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P1.3
```

```
feat(governance): [Phase 2.4] decompose and refactor client services

Restructures client service layer for consistency:
- Converts 6 individual service classes from singleton to constructor injection
- Updates RuleClientService as @deprecated with migration guide
- Aligns client services with server use case patterns
- Prepares for easier testing and dependency injection

Tests: ✅ All tests pass
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P1.4
```

### Phase 3 提交模板

```
docs(governance): [Phase 3] improve documentation and code quality

Documentation and quality improvements:
- Unifies JSDoc language to Chinese (governance as living documentation)
- Adds JSDoc to PowerSync repository implementations
- Renames PowerSync mappers to consistent {entity}-{adapter} pattern
- Clarifies public API exports with @internal markers
- Updates index.ts files for clarity

Tests: ✅ All tests pass
Build: ✅ Builds without errors

Fixes: governance-refactoring-plan.md#P2
```

---

## 🔗 相关资源

- [Governance 重构方案](/docs/architecture/governance-refactoring-plan.md) — 整体规划
- [Governance 源代码](/packages/governance/src) — 实现代码
- [DDD 架构指南](/docs/architecture/ddd-architecture.md) — 架构模式
- [Result Pattern 说明](/docs/architecture/result-pattern.md) — Error handling

---

## ✍️ 进度跟踪

使用以下方式跟踪进度：

```markdown
- [x] P0.1 - 删除重复枚举定义
- [ ] P0.2 - 统一 Schema 定义
- [ ] P0.3 - 清理模板残留
- [ ] P1.1 - 统一 Result 构造
- [ ] P1.2 - 统一错误码格式
- [ ] P1.3 - 统一异常处理
- [ ] P1.4 - 重构客户端服务
- [ ] P2.1 - 统一注释语言
- [ ] P2.2 - 统一文件命名
- [ ] P2.3 - 梳理导出结构
```

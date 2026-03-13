# Governance Documentation Standards

# 规则治理文档标准

> Conventions for code comments and documentation in the `@dailyuse/governance` package.
> `@dailyuse/governance` 包的代码注释和文档约定。

---

## 1. Language Policy / 语言策略

### Bilingual Comments (English + Chinese)

All code comments in the governance package use **bilingual format**: English first, followed by Chinese translation.

治理包中的所有代码注释使用**双语格式**：先英文，后中文翻译。

**Rationale**: The team operates bilingually. English ensures international readability; Chinese ensures the primary team can scan code quickly.

**原因**：团队双语运作。英文确保国际可读性；中文确保主要团队可以快速扫描代码。

---

## 2. Comment Formats / 注释格式

### 2.1 File Headers

Every `.ts` file should begin with a bilingual file-level JSDoc block:

每个 `.ts` 文件应以双语的文件级 JSDoc 块开头：

```typescript
/**
 * RuleRevision Entity - Domain Client
 * 规则修订版本实体 - 客户端领域
 *
 * Provides client-side revision record capabilities:
 * - Audit history viewing
 * - Change detail display
 *
 * 提供客户端修订版本记录功能：
 * - 审计历史查看
 * - 更改详情显示
 */
```

### 2.2 Section Headers

Use `=====` separator lines to delineate major code sections:

使用 `=====` 分隔线标注主要代码区域：

```typescript
// ================= Public Properties (Getters) =================
// ================= 公开属性（Getter） =================
```

Standard sections (in order):

- Internal State Interface / 内部状态接口
- Constructor (Private) / 构造函数（私有）
- Public Properties (Getters) / 公开属性（Getter）
- UI Helper Methods / UI 辅助方法
- Domain Logic / 领域逻辑
- Factory Methods / 工厂方法
- DTO Conversion / DTO 转换

### 2.3 Single-Line Property Comments

For getters and simple properties, use single-line bilingual JSDoc:

对于 Getter 和简单属性，使用单行双语 JSDoc：

```typescript
/** Rule code (e.g. DDD-001). 规则代码（例如 DDD-001）。 */
get code(): string { ... }

/** Rule status: Draft, Active, or Deprecated. 规则状态：草稿、生效或已废弃。 */
get status(): RuleStatus { ... }
```

### 2.4 Method-Level JSDoc Blocks

For methods with parameters, use block-style bilingual JSDoc:

对于有参数的方法，使用块级双语 JSDoc：

```typescript
/**
 * Saves a rule (upsert: insert if new, update if existing).
 * 保存规则（存在则更新，不存在则插入）。
 *
 * @param rule - Domain Rule aggregate to persist 要持久化的领域规则聚合根
 * @returns Result<void> - ok on success, error('INTERNAL_ERROR') on failure
 *                         成功返回 ok，失败返回 error('INTERNAL_ERROR')
 */
async save(rule: Rule): Promise<Result<void>> { ... }
```

### 2.5 Inline Comments

For short inline explanations, add Chinese on the next line:

对于简短的行内注释，在下一行添加中文：

```typescript
// Defensive copy to ensure immutability
// 防御性复制以确保不可变性
this._props = { ...state };
```

### 2.6 Class-Level JSDoc

For class declarations, use structured bilingual JSDoc listing capabilities:

对于类声明，使用结构化的双语 JSDoc 列出功能：

```typescript
/**
 * RuleRevision Entity - Client side.
 * RuleRevision 实体 - 客户端侧。
 *
 * Provides a client-side view of revision records, supporting:
 * 提供修订版本记录的客户端视图，支持：
 * - Instance creation from API responses
 *   从 API 响应创建实例
 * - UI helper methods (change summaries, field comparisons)
 *   UI 辅助方法（更改摘要、字段比较）
 */
```

---

## 3. When to Document / 何时编写文档

### Must Document (Required)

| What                                     | Why                                                |
| ---------------------------------------- | -------------------------------------------------- |
| File headers                             | Explain module purpose and DDD layer role          |
| Class declarations                       | Describe responsibilities and usage pattern        |
| Public methods                           | API contract for consumers                         |
| Factory methods (`.create()`, `.load()`) | Document validation and construction               |
| Repository methods                       | Document query behavior, error codes, side effects |
| Mapper classes                           | Document serialization/deserialization strategy    |
| Section headers                          | Visual navigation in large files                   |

### Optional (Nice to Have)

| What                         | When                                     |
| ---------------------------- | ---------------------------------------- |
| Private methods              | Only if complex logic that isn't obvious |
| Interface fields             | Only if the name isn't self-documenting  |
| Simple re-export index files | Brief header explaining the module       |

### Skip (Anti-Pattern)

| What                               | Why                                             |
| ---------------------------------- | ----------------------------------------------- |
| Trivial getters with obvious names | `get id()` doesn't need `/** The ID */`         |
| Repeating the type signature       | Don't write `@returns string` when it's obvious |
| Paraphrasing the code              | `// increment i by 1` for `i++` adds nothing    |

---

## 4. Layer-Specific Conventions / 分层约定

### 4.1 Domain Layer (domain-client, domain-server, domain-shared)

- **File header**: Describe DDD role (Aggregate Root, Entity, Value Object)
- **Class comment**: List capabilities (what it provides to consumers)
- **Properties**: Bilingual single-line JSDoc for all public getters
- **Factory methods**: Document validation rules and invariants
- **Section headers**: Required for files > 100 lines

### 4.2 Infrastructure Layer (infrastructure-server/adapters)

- **File header**: Name the persistence technology (PowerSync, Supabase, etc.)
- **Class comment**: Reference the interface it implements
- **Methods**: Document SQL behavior, error codes returned, transaction boundaries
- **Mappers**: Document serialization format (JSON fields, date formats, branded types)
- **Helper functions**: Document edge cases and fallback behavior

### 4.3 Application Layer (application-server, application-client)

- **Use cases**: Document preconditions, postconditions, and error scenarios
- **Command/Query handlers**: Reference the domain operations invoked

### 4.4 Contracts Layer

- **DTOs**: Document which layer produces/consumes each DTO
- **Interfaces**: Document the contract, not the implementation

---

## 5. @example Usage / @example 用法

Include `@example` blocks for:

- Factory methods showing typical construction
- UI helpers showing return values
- Repository methods showing usage patterns

为以下内容包含 `@example` 块：

- 工厂方法，展示典型的构建方式
- UI 辅助方法，展示返回值
- 仓储方法，展示使用模式

```typescript
/**
 * Returns the display label for the current status.
 * 返回当前状态的显示标签。
 *
 * @example
 * rule.displayStatus // '生效中'
 */
get displayStatus(): string { ... }
```

---

## 6. JSDoc Tags Reference / JSDoc 标签参考

| Tag         | Usage                                                 |
| ----------- | ----------------------------------------------------- |
| `@param`    | Method parameters - include bilingual description     |
| `@returns`  | Return value description                              |
| `@throws`   | Only for methods that throw (not Result-based errors) |
| `@example`  | Code examples with expected output                    |
| `@internal` | Mark exports not intended for external consumers      |
| `@see`      | Cross-reference related classes or docs               |

---

## 7. Index File Conventions / 索引文件约定

Re-export index files should have a brief header:

重新导出的索引文件应有简短的头部注释：

```typescript
/**
 * Governance Aggregates - Domain Client
 * 规则治理模块聚合根导出 - 领域客户端
 *
 * domain-client 的聚合根特点：
 * - Anemic Domain Model + Rich View Model
 * - 专注于 UI 辅助和展示逻辑
 * - 使用 load() 从状态创建
 */

export { Rule } from './rule';
export type { RuleState } from './rule';
```

---

## 8. Anti-Patterns to Avoid / 应避免的反模式

1. **English-only comments** - Always include Chinese translation
2. **Comment rot** - Update comments when code changes
3. **Over-commenting** - Don't document what the type system already expresses
4. **Undocumented public API** - Every exported symbol needs JSDoc
5. **Missing section headers** - Large files (>100 lines) need visual structure
6. **Inconsistent format** - Follow the patterns in this document exactly

---

## 9. Quick Reference Template / 快速参考模板

```typescript
/**
 * [English file description]
 * [中文文件描述]
 *
 * [English capability list]:
 * - Capability 1
 * - Capability 2
 *
 * [中文功能列表]：
 * - 功能 1
 * - 功能 2
 */

// ================= [Section Name] =================
// ================= [区域名称] =================

/**
 * [English class description].
 * [中文类描述]。
 */
export class MyClass {
  /** [English property]. [中文属性]。 */
  get myProp(): string { ... }

  /**
   * [English method description].
   * [中文方法描述]。
   *
   * @param param - [English] [中文]
   * @returns [English description]
   */
  myMethod(param: string): Result<void> { ... }
}
```

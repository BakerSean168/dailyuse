# Governance Module - 活文档（Living Documentation）

这个模块是一个**参考实现**，展示如何在 `@dailyuse/governance` 中构建一个标准的 DDD 业务模块。

## 📚 文件结构

```
governance/
├── aggregates/          # 聚合根定义（DDD）
│   ├── rule-client.ts         # 客户端视图（前端/API 消费者）
│   ├── rule-server.ts         # 服务端视图 + 领域事件
│   └── index.ts                # 导出汇总
├── entities/            # 实体定义（有 ID 的子对象）
│   ├── rule-revision-client.ts # 修订实体（客户端）
│   ├── rule-revision-server.ts # 修订实体（服务端）
│   └── index.ts                # 导出汇总
├── value-objects/       # 值对象（不可变）
│   ├── rule-status.ts         # 状态枚举
│   ├── rule-severity.ts       # 严重级别
│   ├── change-type.ts         # 变更类型
│   └── index.ts                # 导出汇总
├── api/                 # REST API 定义
│   ├── requests.ts      # 请求数据结构
│   ├── responses.ts     # 响应数据结构
│   ├── endpoints.ts     # 路由定义
│   └── index.ts         # 导出汇总
├── protocol/            # 模块间通信协议
│   ├── governance-event-map.ts  # 事件定义
│   ├── governance-rpc-map.ts    # RPC 定义
│   └── index.ts                # 导出汇总
├── configs/             # 配置常量
│   ├── config.ts        # 配置定义
│   └── index.ts         # 导出汇总
├── domain/              # 领域定义（事件、仓储接口）
│   ├── events/          # 领域事件类型
│   ├── repositories/    # 仓储接口
│   └── index.ts         # 导出汇总
├── index.ts             # 模块主入口
└── README.md            # 本文件
```

## 🎯 核心概念

### 0. **依赖宪法（Import Constitution）**

**内部引用走具体路径，外部引用走包名入口。**

这条规则用于避免 barrel re-export 造成的循环依赖和 Rollup 分块问题。
内部模块请直接引用具体文件路径；对外只暴露 `index.ts` 入口。

### 1. **Aggregate Root（聚合根）vs Entity（实体）**

| 特性 | Aggregate Root | Entity                     |
| ---- | -------------- | -------------------------- |
| 定义 | 聚合的顶级实体 | 聚合内的子实体或独立实体   |
| 位置 | `aggregates/`  | `entities/`                |
| 访问 | 外部可直接访问 | 外部只能通过聚合根访问     |
| 例子 | Rule（主对象） | RuleRevision（修订子对象） |

### 2. **Value Objects（值对象）**

**特点：**

- 不可变（Immutable）
- 无唯一标识（ID）
- 相等性通过值判断

**示例：**

1. [rule-status.ts](./value-objects/rule-status.ts) - 状态枚举（简单值对象）
2. [rule-severity.ts](./value-objects/rule-severity.ts) - 严重级别（简单值对象）
3. [change-type.ts](./value-objects/change-type.ts) - 变更类型（展示 const-object 模式）

### 3. **时间类型选择规范（防腐层设计）**

项目使用防腐层（Anti-Corruption Layer）设计，通过类型别名隔离外部实现细节：

| 层级           | 类型              | 实际类型 | 使用场景           | 示例            |
| -------------- | ----------------- | -------- | ------------------ | --------------- |
| **传输层**     | `TransferDate`    | `number` | API 请求/响应、DTO | `1704067200000` |
| **业务逻辑层** | `DomainDate`      | `Date`   | 领域计算、规则验证 | `new Date()`    |
| **持久化层**   | `PersistenceDate` | `Date`   | Prisma/ORM 持久化  | `new Date()`    |

**防腐层优势：**

- ✅ **隔离变化**：未来如需改变时间存储格式（如改为 bigint），只需修改 `primitives/` 下的类型定义
- ✅ **类型安全**：编译时检查，防止类型混用
- ✅ **统一规范**：全项目使用一致的时间处理模式

**实际应用示例：**

- **Entities**: [rule-revision-server.ts](./entities/rule-revision-server.ts) - 展示实体中时间类型
- **Value Objects**: [change-type.ts](./value-objects/change-type.ts) - 展示 const-object 模式

### 4. **Protocol（协议）**

### 4. **Protocol（协议）**

- **EventMap**：定义模块发出的事件
- **RpcMap**：定义模块处理的 RPC 请求

```typescript
// 事件：异步通知其他模块
export type GovernanceEventMap = {
  'governance:rule-created': { code: string; title: string };
};

// RPC：同步请求其他模块
export type GovernanceRpcMap = {
  'governance:check-rule-existence': [{ code: string }, boolean];
};
```

### 5. **Configs（配置）**

- **作用**：集中管理模块的配置常量
- **内容**：默认值、限制、业务规则等

```typescript
export const EXAMPLE_VALIDATION_CONFIG = {
  NAME_MAX_LENGTH: 256,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 10,
} as const;
```

## 📋 使用指南

### 新建一个模块时，按照以下步骤：

#### 1️⃣ **定义 Value Objects** (`value-objects/`)

```typescript
// MyStatus - 状态枚举
export const MyStatus = {
  DRAFT: { code: 'DRAFT', label: '草稿' },
  PUBLISHED: { code: 'PUBLISHED', label: '已发布' },
};

// MyProperty - 复杂值对象
export function createMyProperty(input: MyPropertyDTO): MyProperty {
  // 验证逻辑
  return {
    /* 不可变对象 */
  };
}
```

#### 2️⃣ **定义 Entities（如果需要）** (`entities/`)

```typescript
// 子实体（如 Tag、Comment 等）
export interface MyTagClient {
  id: string;
  name: string;
  color: string;
}

export interface MyTagServer {
  id: string;
  name: string;
  color: string;
}
```

#### 3️⃣ **定义 Aggregates** (`aggregates/`)

```typescript
// Client 版本（前端用）
export interface MyClient {
  id: MyId;
  name: string;
  status: MyStatusType;
  // ...
}

// Server 版本（后端用）
export interface MyServer {
  readonly id: MyId;
  readonly name: string;
  readonly status: MyStatusType;
  // ...内部字段
}
```

#### 4️⃣ **定义 Protocol** (`protocol/`)

```typescript
// EventMap - 模块发出的事件
export type MyEventMap = {
  'my:created': { id: string; name: string };
  'my:updated': { id: string };
};

// RpcMap - 模块处理的 RPC
export type MyRpcMap = {
  'my:check-existence': [{ id: string }, boolean];
};
```

#### 5️⃣ **定义 Configs** (`configs/`)

**配置常量：** 可调整的业务参数（使用 SCREAMING_SNAKE_CASE）

```typescript
// 验证规则配置
export const MY_VALIDATION_CONFIG = {
  NAME_MAX_LENGTH: 256,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 10,
} as const;

// 业务行为配置
export const MY_GENERATION_CONFIG = {
  DEFAULT_BATCH_SIZE: 50,
  MAX_BATCH_SIZE: 200,
} as const;
```

**区分：**

- `configs/` → 可调整参数（如 `DEFAULT_PAGE_SIZE: 20`）
- `value-objects/` → 固定概念（如 `Status.Active`）

#### 6️⃣ **定义 API Layer** (`api/`)

```typescript
// Request DTO（用户输入）
export interface CreateMyRequest {
  name: string;
  status?: string;
}

// Response DTO（API 响应）
export type MyResponse = MyClientDTO;

// Endpoints（路由定义）
export const MY_API_ENDPOINTS = {
  create: { method: 'POST', path: '/api/my' /* ... */ },
  get: { method: 'GET', path: '/api/my/:id' /* ... */ },
};
```

#### 7️⃣ **导出汇总** (`index.ts`)

```typescript
export * from './aggregates';
export * from './entities';
export * from './value-objects';
export * from './protocol';
export * from './configs';
export * from './api';
```

## ✅ 检查清单

新模块应该包含：

- [ ] Value Objects（至少 1 个状态枚举）
- [ ] Entities（如果有子对象需要 ID）
- [ ] Client Aggregate（前端用）
- [ ] Server Aggregate（后端用）
- [ ] Protocol - EventMap（事件定义）
- [ ] Protocol - RpcMap（RPC 定义）
- [ ] Configs（配置常量）
- [ ] API Request/Response DTOs
- [ ] API Endpoints 定义
- [ ] 模块导出 index.ts
- [ ] 注释说明每个部分的用途

## 🔗 集成到项目中

当你复制这个结构创建新模块时：

### 1. 在 `contracts/src/modules/yourModule/` 下创建

```bash
cp -r packages/governance/src/contracts packages/your-module/src/contracts
# Then rename all Rule → YourEntity references
# 然后修改所有 Rule → YourEntity 的引用
```

### 2. 更新 `contracts/package.json`

```json
{
  "exports": {
    "./your-module": {
      "types": "./dist/modules/yourModule/index.d.ts",
      "import": "./dist/modules/yourModule/index.js"
    }
  }
}
```

### 3. 在 `contracts/src/index.ts` 中导出

```typescript
export * from './modules/yourModule';
```

### 4. 使用

```typescript
import type { YourModuleClient } from '@dailyuse/contracts/your-module';
import { YOUR_MODULE_API_ENDPOINTS } from '@dailyuse/contracts/your-module';
```

## 🤖 配合 AI（Spec Kit）使用

当你有了这个参考实现后，可以这样指导 AI：

```
"Generate a UserOrder module based on the architecture
in @dailyuse/governance contracts. Follow the same patterns
for aggregates, value objects, and API definitions.
Use RuleServer as the pattern for domain modeling."
```

## ⚠️ 常见错误

### ❌ 混淆 DTO 和 Domain Model

```typescript
// ❌ Wrong: returning server model directly to API
// ❌ 错误：直接返回 Server 模型给 API
export async function getRule(id: string): Promise<RuleServer> {
  // RuleServer contains internal fields that should not be serialized
  // RuleServer 包含内部字段，不应该序列化
}

// ✅ Correct: convert to Client DTO first
// ✅ 正确：先转换到 Client DTO
export async function getRule(id: string): Promise<RuleClient> {
  const rule = await service.findById(id);
  return rule.toClientDTO();
}
```

### ❌ 在 Value Object 中放入可变逻辑

```typescript
// ❌ Wrong: mutable value object
// ❌ 错误：可变的值对象
export class RuleStatus {
  public setValue(newValue: string) {
    // ❌ Mutable! 可变！
    this.value = newValue;
  }
}

// ✅ Correct: use const object as const
// ✅ 正确：使用 const object as const
export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
} as const;
// To change, create a new status reference
// 如果需要改变，创建新的状态引用
const newStatus = RuleStatus.Active;
```

### ❌ 忘记领域事件

```typescript
// ❌ Wrong: no event after creation
// ❌ 错误：创建后没有事件
async function createRule(request: CreateRuleRequest) {
  const rule = RuleServer.create(/* ... */);
  await repository.save(rule);
  // Other modules have no way to know a new Rule was created
  // 其他模块无法知道创建了新 Rule
}

// ✅ Correct: publish domain event
// ✅ 正确：发布领域事件
async function createRule(request: CreateRuleRequest) {
  const rule = RuleServer.create(/* ... */);
  await repository.save(rule);
  await eventBus.publish(RuleCreatedEvent);
  // Other modules can subscribe to this event
  // 其他模块可以订阅此事件
}
```

## 📖 进一步阅读

- **DDD 概念**：[Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- **DTO Pattern**：Martin Fowler - Data Transfer Object
- **Event Sourcing**：为什么使用事件而不是状态存储
- **Aggregate Design**：如何设计合理的聚合边界

## 🎓 Reference Implementation Files / 参考实现文件

If this document feels too dense, browse these actual implementation files:
如果你觉得这个文档太密集，可以查看这些文件的完整实现：

1. [rule-status.ts](./value-objects/rule-status.ts) - Simple const-object enum. 简单枚举值对象
2. [rule-severity.ts](./value-objects/rule-severity.ts) - Const-object value object with labels. 带标签的值对象
3. [change-type.ts](./value-objects/change-type.ts) - Change type value object. 变更类型值对象
4. [rule-client.ts](./aggregates/rule-client.ts) - Client-side aggregate root. 前端聚合根
5. [rule-server.ts](./aggregates/rule-server.ts) - Server-side aggregate root + domain events. 后端聚合根 + 事件
6. [rules.ts](./api/rules.ts) - API schema definitions (Zod). API 请求/响应定义
7. [endpoints.ts](./api/endpoints.ts) - API route definitions. API 路由定义

Every file has bilingual comments (English + Chinese)!
每个文件都有中英双语注释！

---

**This module IS the living documentation. New team members can Copy & Paste, adjust the data structures, and ship.**
**这个模块就是活文档。新同学可以直接 Copy & Paste，改改数据结构就能用。**

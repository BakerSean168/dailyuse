# Example Module - 活文档（Living Documentation）

这个模块是一个**参考实现**，展示如何在 `@dailyuse/contracts` 中构建一个标准的业务模块。

## 📚 文件结构

```
example/
├── aggregates/          # 聚合根定义（DDD）
│   ├── example-client.ts       # 客户端视图（前端/API 消费者）
│   ├── example-server.ts       # 服务端视图 + 领域事件
│   └── index.ts                # 导出汇总
├── entities/            # 实体定义（有 ID 的子对象）
│   ├── example-tag-client.ts   # 标签实体（客户端）
│   ├── example-tag-server.ts   # 标签实体（服务端）
│   └── index.ts                # 导出汇总
├── value-objects/       # 值对象（不可变）
│   ├── example-status.ts       # 状态枚举
│   ├── example-property.ts     # 复杂值对象
│   ├── example-time-range.ts   # 时间范围（展示时间类型）
│   └── index.ts                # 导出汇总
├── api/                 # REST API 定义
│   ├── requests.ts      # 请求数据结构
│   ├── responses.ts     # 响应数据结构
│   ├── endpoints.ts     # 路由定义
│   └── index.ts         # 导出汇总
├── protocol/            # 模块间通信协议
│   ├── example-event-map.ts    # 事件定义
│   ├── example-rpc-map.ts      # RPC 定义
│   └── index.ts                # 导出汇总
├── configs/             # 配置常量
│   ├── config.ts        # 配置定义
│   └── index.ts         # 导出汇总
├── dtos/                # 特殊 DTO（统计、报表等）
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

| 特性 | Aggregate Root | Entity |
|------|----------------|--------|
| 定义 | 聚合的顶级实体 | 聚合内的子实体或独立实体 |
| 位置 | `aggregates/` | `entities/` |
| 访问 | 外部可直接访问 | 外部只能通过聚合根访问 |
| 例子 | Example（主对象） | ExampleTag（标签子对象） |

### 2. **Value Objects（值对象）**

**特点：**
- 不可变（Immutable）
- 无唯一标识（ID）
- 相等性通过值判断

**示例：**
1. [example-status.ts](./value-objects/example-status.ts) - 状态枚举（简单值对象）
2. [example-property.ts](./value-objects/example-property.ts) - 复杂值对象（带验证）
3. [example-time-range.ts](./value-objects/example-time-range.ts) - 时间范围（展示时间类型选择）

### 3. **时间类型选择规范（防腐层设计）**

项目使用防腐层（Anti-Corruption Layer）设计，通过类型别名隔离外部实现细节：

| 层级 | 类型 | 实际类型 | 使用场景 | 示例 |
|------|------|----------|-----------|------|
| **传输层** | `TransferDate` | `number` | API 请求/响应、DTO | `1704067200000` |
| **业务逻辑层** | `DomainDate` | `Date` | 领域计算、规则验证 | `new Date()` |
| **持久化层** | `PersistenceDate` | `Date` | Prisma/ORM 持久化 | `new Date()` |

**防腐层优势：**
- ✅ **隔离变化**：未来如需改变时间存储格式（如改为 bigint），只需修改 `primitives/` 下的类型定义
- ✅ **类型安全**：编译时检查，防止类型混用
- ✅ **统一规范**：全项目使用一致的时间处理模式

**实际应用示例：**
- **Entities**: [example-tag-server.ts](./entities/example-tag-server.ts) - 展示实体中 3 种时间类型
- **Value Objects**: [example-time-range.ts](./value-objects/example-time-range.ts) - 展示时间范围处理和类型转换

### 4. **Protocol（协议）**

### 4. **Protocol（协议）**

- **EventMap**：定义模块发出的事件
- **RpcMap**：定义模块处理的 RPC 请求

```typescript
// 事件：异步通知其他模块
export type ExampleEventMap = {
  'example:created': { id: string; name: string };
};

// RPC：同步请求其他模块
export type ExampleRpcMap = {
  'example:check-existence': [{ id: string }, boolean];
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
  return { /* 不可变对象 */ };
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
  create: { method: 'POST', path: '/api/my', /* ... */ },
  get: { method: 'GET', path: '/api/my/:id', /* ... */ },
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
cp -r contracts/src/modules/example contracts/src/modules/yourModule
# 然后修改所有 Example → YourModule 的引用
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
in contracts/src/modules/example. Follow the same patterns 
for aggregates, value objects, and API definitions. 
Use ExampleServer as the pattern for domain modeling."
```

## ⚠️ 常见错误

### ❌ 混淆 DTO 和 Domain Model

```typescript
// ❌ 错误：直接返回 Server 模型给 API
export async function getExample(id: string): Promise<ExampleServer> {
  // ExampleServer 包含内部字段，不应该序列化
}

// ✅ 正确：先转换到 Client DTO
export async function getExample(id: string): Promise<ExampleClient> {
  const server = await service.findById(id);
  return toClientDTO(server);
}
```

### ❌ 在 Value Object 中放入可变逻辑

```typescript
// ❌ 错误
export class ExampleStatus {
  public setValue(newValue: string) { // ❌ 可变！
    this.value = newValue;
  }
}

// ✅ 正确：使用 const object as const
export const ExampleStatus = {
  Draft: 'Draft',
  Active: 'Active',
} as const;
// 如果需要改变，创建新的状态对象
const newStatus = ExampleStatus.Active;
```

### ❌ 忘记领域事件

```typescript
// ❌ 错误：创建后没有事件
async function createExample(request: CreateExampleRequest) {
  const example = new ExampleServer(/* ... */);
  await repository.save(example);
  // 其他模块无法知道创建了新 Example
}

// ✅ 正确
async function createExample(request: CreateExampleRequest) {
  const example = new ExampleServer(/* ... */);
  await repository.save(example);
  await eventBus.publish(ExampleCreatedEvent);
  // 其他模块可以订阅此事件
}
```

## 📖 进一步阅读

- **DDD 概念**：[Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- **DTO Pattern**：Martin Fowler - Data Transfer Object
- **Event Sourcing**：为什么使用事件而不是状态存储
- **Aggregate Design**：如何设计合理的聚合边界

## 🎓 示例项目结构

如果你觉得这个文档太密集，可以查看这些文件的完整实现：

1. [example-status.ts](./value-objects/example-status.ts) - 简单枚举
2. [example-property.ts](./value-objects/example-property.ts) - 复杂值对象
3. [example-client.ts](./aggregates/example-client.ts) - 前端聚合根
4. [example-server.ts](./aggregates/example-server.ts) - 后端聚合根 + 事件
5. [requests.ts](./api/requests.ts) - API 请求定义
6. [endpoints.ts](./api/endpoints.ts) - API 路由定义

每个文件都有详细的中文注释！

---

**这个模块就是活文档。新同学可以直接 Copy & Paste，改改数据结构就能用。** 🚀

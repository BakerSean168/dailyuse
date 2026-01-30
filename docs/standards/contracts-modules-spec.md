# Contracts 包开发规范：实体、聚合根与 DTO 定义

**版本**: 1.0
**适用范围**: `libs/contracts`
**读者**: 开发人员, AI 助手

## 1. 核心设计理念

`contracts` 包是整个 Monorepo 的 **类型契约中心 (Type Registry)**。它充当了 "Interface Definition Language" (IDL) 的角色。

**核心原则**:

1. **Pure Types (纯类型)**: 仅包含 `interface`, `type`, `const` (用于枚举)。**严禁包含业务逻辑、类方法或运行时代码**。
2. **Layer Separation (分层)**: 明确区分 Client (前端/API消费者) 和 Server (后端/持久层) 的数据形态。
3. **Single Source of Truth (唯一真值)**: 所有的 DTO、API 接口定义、实体形状定义都必须在此处，供 `domain-client`, `domain-server`, `domain-shared` 引用。

---

## 2. 基础类型规范 (Primitives)

为了解决时间序列化问题，我们定义三种标准的基础类型（应在 `@dailyuse/contracts/primitives` 中定义）：

| 类型名称 | TS 类型 | 用途 | 场景 |
| --- | --- | --- | --- |
| `DomainDate` | `Date` | 领域内部使用的日期对象 | 聚合根/值对象内部属性 |
| `TransferDate` | `number` | 传输层使用的日期 (时间戳) | API JSON, ClientDTO |
| `PersistenceDate` | `Date` | `number` | 持久层使用的日期 |

---

## 3. 值对象定义规范 (Value Object Contracts)

在 Contracts 包中，值对象不是 Class，而是 **数据的形状 (Shape)**。我们需要定义三种形态：

### 3.1 命名与结构

对于一个名为 `AccountProfile` 的值对象：

1. **Domain Shape (`AccountProfile`)**: 领域层看到的形状（使用 `DomainDate`）。
2. **Transfer DTO (`AccountProfileDTO`)**: API 传输的形状（使用 `TransferDate`）。
3. **Persistence DTO (`AccountProfilePersistenceDTO`)**: 落库的形状（使用 `PersistenceDate`）。

### 3.2 模板 (AI 参照)

```typescript
import type { DomainDate, TransferDate, PersistenceDate } from '@/primitives';
import type { GenderType } from './gender-type';

// 1. Domain Shape (给 domain-shared 中的 Class 实现用)
export interface AccountProfile {
  nickname: string;
  gender: GenderType;
  birthday?: DomainDate; // ✅ 使用 Date 对象
}

// 2. Transfer DTO (给前端 API / domain-client 用)
export interface AccountProfileDTO {
  nickname: string;
  gender: GenderType;
  birthday?: TransferDate; // ✅ 使用 number 时间戳
}

// 3. Persistence DTO (给 domain-server / Repository 用)
export interface AccountProfilePersistenceDTO {
  nickname: string;
  gender: GenderType;
  birthday?: PersistenceDate; // ✅ 匹配数据库类型
}

```

---

## 4. 聚合根与实体定义规范 (Aggregate/Entity Contracts)

由于前后端对实体的需求不同，必须**拆分定义**。

### 4.1 通用规则

* **Id**: 必须使用强类型 ID (如 `IdentityId`)，不要使用 `string`。
* **Status**: 必须引用枚举类型。
* **Components**: 引用上面定义的值对象 Domain Shape。

### 4.2 Client 端定义 (`EntityClient`)

* **用途**: 定义 `domain-client` 中聚合根 Class 必须实现的接口。
* **DTO**: `EntityClientDTO` (对应 API 返回的 JSON)。

```typescript
// === 引用 ===
import type { IdentityId } from "../value-objects/identity-id";
import type { AccountProfile, AccountProfileDTO } from "../value-objects/account-profile";
import type { DomainDate, TransferDate } from "@/primitives";

// === 1. Client 实体接口 ===
export interface AccountClient {
  id: IdentityId;          // 强类型 ID
  profile: AccountProfile; // 引用 Domain Shape
  createdAt: DomainDate;   // 领域内使用 Date
}

// === 2. Client DTO (API Response) ===
export interface AccountClientDTO {
  id: string;                 // 传输层 ID 降级为 string
  profile: AccountProfileDTO; // 引用 Transfer DTO
  createdAt: TransferDate;    // 传输层使用 number
}

// === 3. Client 静态工厂接口 ===
export interface AccountClientStatic {
  fromClientDTO(dto: AccountClientDTO): AccountClient;
}

```

### 4.3 Server 端定义 (`EntityServer`)

* **用途**: 定义 `domain-server` 中聚合根 Class 必须实现的接口。
* **DTO**:
* `EntityServerDTO`: 用于构造函数的内部 DTO。
* `EntityPersistenceDTO`: 用于 Repository 的数据库行数据。



```typescript
// === 引用 ===
// 注意：Server 端 ID 可能定义在不同的路径
import type { IdentityId } from "@/modules/authentication/value-objects/identity-id";
import type { AccountProfile, AccountProfileDTO, AccountProfilePersistenceDTO } from "../value-objects/account-profile";
import type { DomainDate, TransferDate, PersistenceDate } from "@/primitives";

// === 1. Server 实体接口 ===
export interface AccountServer {
  id: IdentityId;
  profile: AccountProfile;
  createdAt: DomainDate;
}

// === 2. Server DTO (内部构造用) ===
// 通常与 ClientDTO 结构相似，但用途不同
export interface AccountServerDTO {
  id: string;
  profile: AccountProfileDTO;
  createdAt: TransferDate;
}

// === 3. Persistence DTO (数据库用) ===
export interface AccountPersistenceDTO {
  id: string;
  profile: AccountProfilePersistenceDTO; // 引用 Persistence DTO
  createdAt: PersistenceDate;
}

// === 4. Server 静态工厂接口 ===
export interface AccountServerStatic {
  fromPersistenceDTO(dto: AccountPersistenceDTO): AccountServer;
}

```

---

## 5. 枚举与常量类型规范 (Enums)

为了更好的 TypeScript 支持和 JSON 序列化，推荐使用 `const object` + `keyof typeof` 模式，而不是 TS `enum`。

### 5.1 模板

```typescript
// 定义常量对象
export const GenderType = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const; // ✅ 必须加 as const

// 导出类型
export type GenderType = keyof typeof GenderType;

```

---

## 6. 常见误区检查清单 (Checklist)

在编写 Contracts 时，请检查：

* [ ] **是否包含了逻辑？** (Contracts 必须是纯类型，不包含函数实现)。
* [ ] **DTO 中是否使用了 `DomainDate`？** (错误：DTO 必须使用 `TransferDate` 或 `PersistenceDate`)。
* [ ] **实体接口中是否使用了 `string` 作为 ID？** (错误：实体接口应使用强类型 ID，DTO 才用 string)。
* [ ] **是否混淆了 Client 和 Server？** (ClientDTO 和 PersistenceDTO 的结构往往不同，严禁混用)。
* [ ] **引用路径是否正确？** (尽量使用 `@/primitives` 等别名，保持路径整洁)。

---

## 7. 一个模块的目录结构建议

```text
packages/contracts/src/
├── shared/
│   └── index.ts          <-- 导出 shared 相关类型，importanceLevel 等
├── primitives/
│   └── index.ts          <-- 导出 DomainDate 等
├── modules/
│   ├── account/
│   │   ├── value-objects/
│   │   │   ├── account-profile.ts
│   │   │   └── gender-type.ts
│   │   ├── aggregates/
│   │   │   ├── account.client.ts
│   │   │   └── account.server.ts
│   │   ├── entities/
│   │   │   ├── xx.client.ts
│   │   │   └── xx.server.ts
│   │   └── index.ts
│   └── ...
└── index.ts

```
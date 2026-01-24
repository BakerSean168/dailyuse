# DTO 命名约定规范

## 目录
1. [目的](#目的)
2. [核心原则](#核心原则)
3. [命名规范](#命名规范)
4. [DTO 分类](#dto-分类)
5. [代码示例](#代码示例)
6. [常见违规](#常见违规)
7. [修复检查清单](#修复检查清单)
8. [常见问题](#常见问题)

## 目的

本文档定义了 Daily Use 项目中所有数据传输对象（DTO）的命名约定，确保代码的一致性和可维护性。DTO 是应用程序不同层之间传递数据的标准方式。

## 核心原则

### 1. **分层命名规范**
- **ServerDTO**: 服务端内部使用，采用 **camelCase** 命名
- **ClientDTO**: 客户端序列化/反序列化，采用 **camelCase** 命名  
- **PersistenceDTO**: 数据库持久化，遵循 **camelCase** 命名（与 ServerDTO 一致）

### 2. **PersistenceDTO 特殊规则**
PersistenceDTO 用于数据库持久化，应遵循 **camelCase** 命名，与 ServerDTO 一致。

**历史背景**: 早期项目中 PersistenceDTO 混用 snake_case，这是错误的做法。本规范要求统一改为 camelCase。

**关键点**：
- DTO 接口属性 → **camelCase**
- 数据库列名 → **snake_case**（保持不变）
- 仓储层 → **负责映射转换**

### 3. **日期字段规范**
- ServerDTO/ClientDTO: 使用 `number` (epoch ms) 或 `string` (ISO 8601)
- PersistenceDTO: 
  - 如果数据库列是 INTEGER: 使用 `number`
  - 如果数据库列是 DATETIME/TEXT: 使用 `Date` 或 `string` (ISO 8601)

### 4. **JSON 字段规范**
- ServerDTO/ClientDTO: 使用对象类型（如 `Object`, `Record<string, any>`）
- PersistenceDTO: 使用 `string`（因为数据库存储为 JSON 字符串）

## 命名规范

### ServerDTO / ClientDTO

| 场景 | 示例 | 说明 |
|------|------|------|
| 简单属性 | `accountUuid`, `taskTitle` | camelCase |
| 时间戳 | `createdAt`, `updatedAt` | camelCase，表示时间点 |
| 布尔值 | `isEnabled`, `isDeleted` | camelCase，is/has 前缀 |
| 引用ID | `repositoryUuid`, `parentUuid` | camelCase，Uuid 后缀 |
| JSON 字段 | `metadata: Object`, `stats: Record` | 使用对象类型 |
| 数组 | `tags: string[]`, `items: T[]` | camelCase，单数形式 |

### PersistenceDTO

**原则**: PersistenceDTO 应使用与 ServerDTO 相同的 camelCase 命名。

| 场景 | 示例 | 说明 |
|------|------|------|
| 简单属性 | `accountUuid`, `taskTitle` | **camelCase**（不是 account_uuid） |
| 时间戳 | `createdAt`, `updatedAt` | **camelCase**（不是 created_at） |
| 布尔值 | `isEnabled`, `isDeleted` | **camelCase**（不是 is_enabled） |
| JSON 字段 | `metadata: string` | string 类型，含序列化后的 JSON |
| 引用ID | `repositoryUuid`, `parentUuid` | **camelCase**（不是 repository_uuid） |

## DTO 分类

### 1. ServerDTO
用于服务端内部业务逻辑，提供给 API 端点使用。

```typescript
// ✅ 正确
export interface TaskServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### 2. ClientDTO
用于客户端和服务端通信，序列化时转为 JSON。

```typescript
// ✅ 正确
export interface TaskClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### 3. PersistenceDTO
用于数据库操作，传递给 ORM 或原生 SQL。

```typescript
// ✅ 正确 (使用 camelCase)
export interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;  // ✅ 不是 account_uuid
  title: string;
  isCompleted: boolean;  // ✅ 不是 is_completed
  createdAt: number;     // ✅ 不是 created_at
  updatedAt: number;     // ✅ 不是 updated_at
}

// ❌ 错误 (混用 snake_case)
export interface TaskPersistenceDTO {
  uuid: string;
  account_uuid: string;   // ❌ 违规
  title: string;
  is_completed: boolean;  // ❌ 违规
  created_at: number;     // ❌ 违规
  updated_at: number;     // ❌ 违规
}
```

## 代码示例

### 完整示例：Task 实体

#### 1. 接口定义

```typescript
// ✅ 正确的 ServerDTO
export interface TaskServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

// ✅ 正确的 ClientDTO
export interface TaskClientDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

// ✅ 正确的 PersistenceDTO
export interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;      // camelCase
  title: string;
  description?: string | null;
  isCompleted: boolean;     // camelCase，不是 is_completed
  createdAt: number;        // camelCase，不是 created_at
  updatedAt: number;        // camelCase，不是 updated_at
  deletedAt?: number | null;
}
```

#### 2. 领域对象实现

```typescript
export class Task extends AggregateRoot {
  public toServerDTO(): TaskServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      title: this.title,
      description: this.description,
      isCompleted: this.isCompleted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  public toPersistenceDTO(): TaskPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,  // ✅ camelCase
      title: this.title,
      description: this.description,
      isCompleted: this.isCompleted,  // ✅ camelCase
      createdAt: this.createdAt,      // ✅ camelCase
      updatedAt: this.updatedAt,      // ✅ camelCase
      deletedAt: this.deletedAt,
    };
  }

  public static fromPersistenceDTO(dto: TaskPersistenceDTO): Task {
    return new Task({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,  // ✅ 访问 camelCase 属性
      title: dto.title,
      description: dto.description,
      isCompleted: dto.isCompleted,  // ✅ 访问 camelCase 属性
      createdAt: dto.createdAt,      // ✅ 访问 camelCase 属性
      updatedAt: dto.updatedAt,      // ✅ 访问 camelCase 属性
      deletedAt: dto.deletedAt,
    });
  }
}
```

#### 3. 仓储实现

```typescript
// ✅ 正确的仓储实现
export class SqliteTaskRepository {
  async save(task: Task): Promise<void> {
    const dto = task.toPersistenceDTO();

    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        uuid, account_uuid, title, is_completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dto.uuid,
      dto.accountUuid,      // ✅ 访问 DTO 的 camelCase 属性
      dto.title,
      dto.isCompleted,      // ✅ 访问 DTO 的 camelCase 属性
      dto.createdAt,        // ✅ 访问 DTO 的 camelCase 属性
      dto.updatedAt,        // ✅ 访问 DTO 的 camelCase 属性
    );
  }

  async findById(uuid: string): Promise<Task | null> {
    const stmt = this.db.prepare(`SELECT * FROM tasks WHERE uuid = ?`);
    const row = stmt.get(uuid) as any;

    if (!row) return null;

    return Task.fromPersistenceDTO({
      uuid: row.uuid,
      accountUuid: row.account_uuid,  // ✅ 数据库 snake_case → DTO camelCase
      title: row.title,
      isCompleted: row.is_completed === 1,  // ✅ 类型转换
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}
```

## 常见违规

### 违规示例 1：PersistenceDTO 使用 snake_case

```typescript
// ❌ 错误
export interface TaskPersistenceDTO {
  uuid: string;
  account_uuid: string;   // ❌ 应为 accountUuid
  is_completed: boolean;  // ❌ 应为 isCompleted
  created_at: number;     // ❌ 应为 createdAt
  updated_at: number;     // ❌ 应为 updatedAt
}

// ✅ 正确
export interface TaskPersistenceDTO {
  uuid: string;
  accountUuid: string;    // ✅ camelCase
  isCompleted: boolean;   // ✅ camelCase
  createdAt: number;      // ✅ camelCase
  updatedAt: number;      // ✅ camelCase
}
```

### 违规示例 2：仓储中访问错误的 DTO 字段名

```typescript
// ❌ 错误：DTO 定义是 accountUuid，但访问时用了 account_uuid
const dto = task.toPersistenceDTO();
const accountId = dto.account_uuid;  // ❌ 属性不存在

// ✅ 正确
const dto = task.toPersistenceDTO();
const accountId = dto.accountUuid;  // ✅ 正确的属性名
```

### 违规示例 3：混合 snake_case 和 camelCase

```typescript
// ❌ 错误：混合命名
export interface ReminderGroupPersistenceDTO {
  uuid: string;
  accountUuid: string;      // camelCase
  control_mode: string;     // ❌ snake_case（不一致）
  is_enabled: boolean;      // ❌ snake_case（不一致）
  createdAt: number;        // camelCase
  updatedAt: number;        // camelCase
}

// ✅ 正确：统一使用 camelCase
export interface ReminderGroupPersistenceDTO {
  uuid: string;
  accountUuid: string;      // ✅ camelCase
  controlMode: string;      // ✅ camelCase
  isEnabled: boolean;       // ✅ camelCase
  createdAt: number;        // ✅ camelCase
  updatedAt: number;        // ✅ camelCase
}
```

## 修复检查清单

### 步骤 1：审查所有 PersistenceDTO 定义

- [ ] 检查 `packages/contracts/src/modules/*/` 中的所有 `*Server.ts` 文件
- [ ] 搜索所有包含 `PersistenceDTO` 的接口定义
- [ ] 验证所有属性使用 **camelCase** 命名
- [ ] 使用 IDE 的查找引用功能找到所有使用该 DTO 的地方

### 步骤 2：审查所有仓储实现

- [ ] 检查 `packages/infrastructure-server/src/*/adapters/sqlite/*repository.ts`
- [ ] 验证所有 `toPersistenceDTO()` 返回值都使用 camelCase 属性
- [ ] 验证所有 `fromPersistenceDTO()` 访问都使用 camelCase 属性
- [ ] 验证 SQL 列名（snake_case）和 DTO 属性名（camelCase）的映射关系

### 步骤 3：审查 Prisma 仓储实现

- [ ] 检查 `packages/infrastructure-server/src/*/adapters/prisma/*repository.ts`
- [ ] 验证所有 DTO 属性访问使用 camelCase
- [ ] 确保 Prisma 返回的对象正确映射到 DTO

### 步骤 4：运行类型检查和测试

```bash
# 类型检查
pnpm nx run-many --target lint --parallel

# 单元测试
pnpm nx run-many --target test --parallel

# 构建检查
pnpm nx run-many --target build --parallel

# 特定包构建检查
pnpm nx build infrastructure-server
```

### 步骤 5：代码审查

- [ ] 提交 PR 并请求代码审查
- [ ] 验证所有修改都遵循规范
- [ ] 检查是否有其他相关文件遗漏
- [ ] 合并并部署

## 常见问题

### Q1: 为什么 PersistenceDTO 要用 camelCase 而不是 snake_case？

**A**: 虽然数据库列通常使用 snake_case，但 DTO 作为 TypeScript 接口应遵循 JavaScript 命名规范。仓储层负责在以下位置进行映射：

1. **DTO → SQL**: `dto.accountUuid` → SQL 列 `account_uuid`
2. **SQL → DTO**: SQL 列 `account_uuid` → `dto.accountUuid`

```typescript
// 在仓储层进行映射
stmt.run(
  dto.accountUuid,  // DTO 使用 camelCase
  // → 映射到数据库列 account_uuid
);

// 从数据库读取时反向映射
return Task.fromPersistenceDTO({
  accountUuid: row.account_uuid,  // 数据库 snake_case → DTO camelCase
});
```

这样做的好处：
- **一致性**: 所有 TypeScript 代码遵循统一的命名规范
- **安全性**: IDE 的自动完成和类型检查更有效
- **可维护性**: 代码更容易理解和修改

### Q2: 如果数据库列已经是 snake_case，我需要改数据库吗？

**A**: 不需要。只需修改 DTO 接口为 camelCase，在仓储层做映射即可。这是推荐的做法，因为：
1. 避免数据库迁移的风险
2. 保持向后兼容性
3. 仓储层本来就是做数据转换的地方

### Q3: 历史代码中有混用的情况怎么办？

**A**: 这是本规范要解决的问题。根据以下优先级修复：
1. **高优先级**: 影响多个仓储的 DTO（如 Resource, Folder 等）
2. **中优先级**: 常用的 DTO（如 Task, Goal 等）
3. **低优先级**: 不常用的 DTO

修复时：
1. 先改 DTO 接口（添加 camelCase 属性，保留旧属性如果有依赖）
2. 更新所有使用该 DTO 的代码
3. 删除旧的 snake_case 属性

### Q4: Prisma 仓储的 DTO 映射有什么特殊之处吗？

**A**: Prisma 仓储的映射通常更简单，因为 Prisma 已经返回 camelCase 对象。但仍需确保：

```typescript
// ✅ 正确
const prismaRecord = await prisma.task.findUnique({ where: { id } });
return Task.fromPersistenceDTO({
  uuid: prismaRecord.uuid,
  accountUuid: prismaRecord.accountUuid,  // Prisma 已是 camelCase
  createdAt: prismaRecord.createdAt,
});

// ❌ 错误
return Task.fromPersistenceDTO({
  accountUuid: prismaRecord.account_uuid,  // Prisma 没有这个属性
});
```

### Q5: 什么时候应该遵循这个规范？

**A**: 所有新代码必须遵循。对于现有代码：
- 如果正在修改相关的 DTO 或仓储 → 一起修复
- 如果只是查看代码 → 提交 issue 记录下来
- 如果有空闲时间 → 可以主动修复并提交 PR

## 已验证的 PersistenceDTO

以下 PersistenceDTO 已验证遵循本规范（使用 camelCase）：

- ✅ AIUsageQuotaPersistenceDTO
- ✅ KeyResultPersistenceDTO
- ✅ NotificationChannelPersistenceDTO
- ✅ DoNotDisturbConfigPersistenceDTO
- ✅ NotificationPersistenceDTO
- ✅ 以及其他 60+ 个 PersistenceDTO

## 修复记录

### 2026-01-24
**修复内容**:
- ✅ ReminderGroupPersistenceDTO: `control_mode` → `controlMode`
- ✅ ResourcePersistenceDTO: `repository_uuid`, `folder_uuid`, `created_at`, `updated_at` → camelCase
- ✅ 更新所有依赖仓储文件（5 个 SQLite 仓储）

**涉及文件**:
- packages/contracts/src/modules/reminder/aggregates/ReminderGroupServer.ts
- packages/contracts/src/modules/repository/entities/ResourceServer.ts
- packages/infrastructure-server/src/reminder/adapters/sqlite/reminder-group-sqlite.repository.ts
- packages/infrastructure-server/src/repository/adapters/sqlite/resource-sqlite.repository.ts
- packages/infrastructure-server/src/repository/adapters/sqlite/folder-sqlite.repository.ts
- packages/infrastructure-server/src/task/adapters/sqlite/task-template-sqlite.repository.ts
- packages/infrastructure-server/src/goal/adapters/sqlite/goal-sqlite.repository.ts

---

**最后更新**: 2026-01-24  
**维护者**: Architecture Team  
**版本**: 1.0  
**状态**: Active

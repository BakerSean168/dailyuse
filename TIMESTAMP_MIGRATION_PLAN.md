# 🎯 时间戳统一迁移计划

**版本**: v1.0  
**日期**: 2026-01-25  
**状态**: 待执行  
**优先级**: 高（架构基础）

---

## 📊 执行概览

| 项目 | 数量 | 说明 |
|------|------|------|
| 需要修改的 Models | ~60 个 | DateTime → Timestamptz |
| 需要修改的 DTO | 待统计 | 统一为 Date 类型 |
| 需要创建的工具函数 | 3-5 个 | 时间转换和格式化 |
| 数据库迁移 | ❌ 无 | 直接修改（无现存数据） |
| 预计工作量 | 2-3 天 | 一个开发者 |

---

## ✅ 转换规则

### Prisma Model 层（数据库）

```
❌ DateTime → ✅ DateTime (with @db.Timestamptz)
❌ BigInt   → ✅ DateTime (with @db.Timestamptz)
❌ Int      → ✅ DateTime (with @db.Timestamptz)
```

**关键点：**
- PostgreSQL 使用 `TIMESTAMP WITH TIME ZONE` (Timestamptz)
- Prisma DateTime 类型映射到 `TIMESTAMPTZ`
- 自动处理 UTC 和时区转换
- 默认值使用 `@default(now())`

### TypeScript DTO 层（应用）

```
❌ Date      → ✅ Date（保持不变）
❌ BigInt    → ✅ Date
❌ Int       → ✅ Date
❌ number    → ✅ Date
```

**关键点：**
- 所有 DTO 的时间字段统一为 `Date` 对象
- Prisma 自动转换 Timestamptz → Date
- API 序列化时转换为 ISO 8601 或时间戳

### API 返回层（客户端）

```typescript
// 选项 A: ISO 8601 字符串（推荐）
{
  "createdAt": "2026-01-25T10:30:00.000Z",
  "updatedAt": "2026-01-25T10:35:00.000Z"
}

// 选项 B: Unix 时间戳（毫秒）
{
  "createdAt": 1737788400000,
  "updatedAt": 1737788700000
}

// 选项 C: 混合（根据 userSetting.localeTimezone 转换）
{
  "createdAt": "2026-01-25 18:30:00",  // Asia/Shanghai
  "createdAtTs": 1737788400000         // 备用时间戳
}
```

---

## 📋 文件修改清单

### 第一优先级：核心数据模型（必须）

#### Database Schema
- **文件**: [packages/infrastructure-server/prisma/schema.prisma](packages/infrastructure-server/prisma/schema.prisma)
  - 修改 61 个模型中的时间字段
  - 删除所有 `@db.Text` 的时间戳存储
  - 统一使用 `DateTime` + `@map("field_name")`

#### 模型分类统计

| 分类 | Models | 时间字段数 |
|------|--------|-----------|
| 账户/认证 | account, authCredential, authSession | 12 |
| 文档管理 | document, document_version, document_link | 9 |
| 编辑器 | editorWorkspace*, editorWorkspaceSession* | 15 |
| 目标/任务 | goal, goalFolder, goalRecord, taskTemplate, taskInstance | 20 |
| 提醒/日程 | reminderTemplate, reminderInstance, reminderResponse, schedule, focusMode, focusSession | 18 |
| 资源库 | repository, folder, resource, repositoryExplorer, repositoryResource | 12 |
| 其他 | 通知、设置、统计等 | 16 |
| **合计** | **60+** | **102+** |

### 第二优先级：转换工具库（必须）

#### 新建文件
- **路径**: `packages/infrastructure-server/src/shared/utils/timestamp.ts`
- **功能**:
  ```typescript
  export class TimestampUtil {
    // 当前时间为 UTC+8 (Asia/Shanghai)
    static getCurrentTimestamp(): Date { }
    
    // 毫秒时间戳 → Date
    static fromMilliseconds(ms: number): Date { }
    
    // 秒级时间戳 → Date
    static fromSeconds(sec: number): Date { }
    
    // Date → ISO 8601 字符串
    static toISO(date: Date): string { }
    
    // Date → 毫秒时间戳
    static toMilliseconds(date: Date): number { }
    
    // Date → 按用户时区格式化
    static formatByUserTz(date: Date, userTz: string): string { }
  }
  ```

### 第三优先级：DTO 类型定义（必须）

#### 扫描位置
```
packages/infrastructure-server/src/
├── modules/*/dtos/
├── shared/dtos/
└── common/dtos/
```

**替换规则**:
```typescript
// ❌ 旧
export class AccountPersistenceDTO {
  createdAt: number;        // Unix timestamp
  updatedAt: BigInt;        // BigInt
  lastActiveAt?: DateTime;  // DateTime string
}

// ✅ 新
export class AccountPersistenceDTO {
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}
```

#### DTO 文件估计数量
- 预计 30-50 个 DTO 文件需要修改
- 每个文件平均修改 2-5 个时间字段

### 第四优先级：业务逻辑适配（必须）

#### 需要更新的文件类型

1. **Service 层** (`*.service.ts`)
   - 移除手动时间戳转换逻辑
   - 直接使用 `Date` 对象
   - 删除 `new Date().getTime()` → 统一用 Date

2. **Controller 层** (`*.controller.ts`)
   - 更新 API 响应序列化
   - 添加时区处理逻辑

3. **Repository 层** (`*.repository.ts`)
   - Prisma 自动处理转换，无需修改

4. **Entity 类** (`*.entity.ts`)
   - 确保时间字段为 `Date` 类型

---

## 🔧 转换步骤（按顺序执行）

### Step 1: 更新 Prisma Schema（1-2 小时）

**目标**: 将所有时间字段统一为 `DateTime` + `Timestamptz`

**需要替换的模式**:

```prisma
// Pattern 1: DateTime（已正确）
✅ createdAt DateTime @default(now()) @map("created_at")
// → 保持不变

// Pattern 2: BigInt 毫秒（repository, folder, resource等）
❌ createdAt BigInt @default(dbgenerated("extract(epoch from now())::bigint * 1000")) @map("created_at")
✅ createdAt DateTime @default(now()) @map("created_at")

// Pattern 3: Int 秒级（document系列）
❌ createdAt Int @default(dbgenerated("extract(epoch from now())::integer")) @map("created_at")
✅ createdAt DateTime @default(now()) @map("created_at")

// Pattern 4: BigInt 不带 dbgenerated（focusMode等）
❌ createdAt BigInt @map("created_at")
✅ createdAt DateTime @map("created_at")
```

**需要修改的具体位置**:

| Model | 字段 | 当前类型 | 行号 |
|-------|------|--------|------|
| focusMode | createdAt, updatedAt | BigInt | 316-317 |
| focusMode | startTime, endTime, actualEndTime | BigInt | 311-315 |
| repository | createdAt, updatedAt | BigInt | 760-761 |
| folder | createdAt, updatedAt | BigInt | 784-785 |
| resource | createdAt, updatedAt, modifiedAt | BigInt | 823-825 |
| document | createdAt, updatedAt, deletedAt | Int | 150-152 |
| document_version | createdAt | Int | 176 |
| document_link | createdAt, updatedAt | Int | 194-195 |
| reminderTemplate | lastAnalysisTime, adjustmentTime | BigInt | 708, 715 |
| reminderResponse | timestamp | BigInt | 730 |
| keyResultWeightSnapshot | snapshotTime | BigInt | 421 |
| taskTemplate | startDate, dueDate, completedAt | BigInt | 1066-1068 |
| schedule | startTime, endTime | BigInt | 1011-1012 |

### Step 2: 创建时间戳工具库（30 分钟）

**文件**: `packages/infrastructure-server/src/shared/utils/timestamp.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TimestampUtil {
  constructor(private configService: ConfigService) {}

  /**
   * 获取当前 UTC 时间
   */
  static getCurrentUTC(): Date {
    return new Date();
  }

  /**
   * 毫秒级时间戳转换为 Date（兼容旧数据）
   */
  static fromMilliseconds(ms: number | bigint): Date {
    if (typeof ms === 'bigint') {
      return new Date(Number(ms));
    }
    return new Date(ms);
  }

  /**
   * 秒级时间戳转换为 Date（兼容旧数据）
   */
  static fromSeconds(sec: number): Date {
    return new Date(sec * 1000);
  }

  /**
   * Date 转换为毫秒时间戳（用于 API 响应）
   */
  static toMilliseconds(date: Date): number {
    return date.getTime();
  }

  /**
   * Date 转换为 ISO 8601 字符串（用于 API 响应）
   */
  static toISO(date: Date): string {
    return date.toISOString();
  }

  /**
   * 格式化为本地时区字符串
   * @param date 
   * @param userTimezone 用户时区 (e.g., 'Asia/Shanghai')
   * @param format 格式字符串 (e.g., 'yyyy-MM-dd HH:mm:ss')
   */
  static formatByTimezone(
    date: Date,
    userTimezone: string = 'Asia/Shanghai',
    format: string = 'yyyy-MM-dd HH:mm:ss'
  ): string {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return formatter.format(date);
  }
}
```

### Step 3: 更新所有 DTO（2-3 小时）

**流程**:
1. 遍历所有 DTO 文件
2. 找到时间相关字段
3. 改为 `Date` 类型
4. 移除相关的转换注解

**示例转换**:

```typescript
// ❌ 旧 AccountPersistenceDTO
export class AccountPersistenceDTO {
  uuid: string;
  username: string;
  createdAt: number;          // ❌ number
  updatedAt: number;          // ❌ number
  lastActiveAt?: number;      // ❌ number
  deletedAt?: number;         // ❌ number
}

// ✅ 新 AccountPersistenceDTO
export class AccountPersistenceDTO {
  uuid: string;
  username: string;
  createdAt: Date;            // ✅ Date
  updatedAt: Date;            // ✅ Date
  lastActiveAt?: Date;        // ✅ Date
  deletedAt?: Date;           // ✅ Date
}
```

### Step 4: 更新 Service 层逻辑（1-2 小时）

**查找模式**:
```typescript
// ❌ 需要删除的代码
const now = new Date().getTime();
const timestamp = Date.now();
const ms = Math.floor(date.getTime());
new Date(bigIntValue.toString());

// ✅ 应该使用的代码
const now = new Date();
const timestamp = new Date();
const ms = date;
```

**常见修改位置**:
- `entity.createdAt = new Date().getTime()` → `entity.createdAt = new Date()`
- `findBy({ createdAt: { gte: timestamp } })` → `findBy({ createdAt: { gte: new Date(ts) } })`

### Step 5: 更新 API 响应序列化（30 分钟）

**更新 Serializer/Interceptor**:

```typescript
import { Injectable } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

@Injectable()
export class DateSerializerInterceptor extends ClassSerializerInterceptor {
  // 自动将 Date 对象序列化为 ISO 8601 字符串
  serialize(response: any) {
    return JSON.parse(
      JSON.stringify(response, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();  // 或返回 value.getTime() for timestamp
        }
        return value;
      })
    );
  }
}
```

### Step 6: 运行测试和验证（1 小时）

```bash
# 1. 重新生成 Prisma Client
pnpm prisma generate

# 2. 验证 schema 完整性
pnpm prisma validate

# 3. 运行类型检查
pnpm tsc --noEmit

# 4. 运行单元测试
pnpm test

# 5. 运行集成测试
pnpm test:integration

# 6. 手动测试关键接口
curl http://localhost:3000/api/accounts
```

---

## ⚠️ 注意事项

### 关键点 1：Prisma DateTime 和 PostgreSQL Timestamptz

```prisma
// Prisma DateTime 类型自动映射到 PostgreSQL TIMESTAMP WITH TIME ZONE
createdAt DateTime @map("created_at")

// PostgreSQL 会自动：
// 1. 存储为 UTC
// 2. 返回时保持时区信息
// 3. Prisma 自动转换为 JS Date 对象
```

### 关键点 2：时区处理

- **数据库**: 始终使用 UTC 存储
- **应用层**: 使用 `userSetting.localeTimezone` 应用用户时区
- **API**: 返回 ISO 8601（包含 Z 表示 UTC）或本地化字符串

### 关键点 3：索引和查询

```prisma
// ✅ 继续使用这些索引（Timestamptz 可以索引）
@@index([createdAt])
@@index([updatedAt])
@@index([targetDate])

// ✅ 范围查询（自动支持）
where: {
  createdAt: { gte: new Date('2026-01-01') }
}
```

### 关键点 4：Prisma @updatedAt 字段

某些模型使用了 `@updatedAt`:
```prisma
updatedAt DateTime @updatedAt @map("updated_at")
```

这是特殊的 Prisma 指令，会自动更新时间戳。保持不变即可。

### 关键点 5：BigInt 字段保留

某些字段的 BigInt 是用于其他用途的（如 `snapshotTime`, `timestamp`），仅在**代表时间**时才转换为 DateTime。

---

## 📝 修改清单模板

```
[ ] Step 1: 修改 Prisma Schema
  [ ] focusMode (4 fields)
  [ ] repository (2 fields)
  [ ] folder (2 fields)
  [ ] resource (3 fields)
  [ ] document (3 fields)
  [ ] document_version (1 field)
  [ ] document_link (2 fields)
  [ ] reminderTemplate (2 fields)
  [ ] reminderResponse (1 field)
  [ ] keyResultWeightSnapshot (1 field)
  [ ] taskTemplate (3 fields)
  [ ] schedule (2 fields)
  [ ] (其他模型... )

[ ] Step 2: 创建 TimestampUtil
  [ ] 新建文件
  [ ] 实现 5 个工具函数
  [ ] 添加单元测试

[ ] Step 3: 更新 DTO 类型
  [ ] 扫描所有 DTO 文件（预期 30-50 个）
  [ ] 逐个更新为 Date 类型
  [ ] 验证类型一致性

[ ] Step 4: 更新 Service 逻辑
  [ ] 删除手动时间戳转换
  [ ] 统一使用 Date 对象
  [ ] 验证业务逻辑

[ ] Step 5: 更新 API 序列化
  [ ] 配置 DateSerializerInterceptor
  [ ] 测试 JSON 响应格式
  [ ] 文档化 API 返回格式

[ ] Step 6: 测试和验证
  [ ] 类型检查通过
  [ ] 单元测试通过
  [ ] 集成测试通过
  [ ] 关键接口手动测试
```

---

## 🎬 快速开始命令

```bash
# 1. 验证当前 schema
cd packages/infrastructure-server
pnpm prisma validate

# 2. 生成 Prisma Client
pnpm prisma generate

# 3. 格式化 Schema（可选）
pnpm prisma format

# 4. 查看 schema diff（修改后执行）
pnpm prisma diff --script

# 5. 类型检查
pnpm tsc --noEmit

# 6. 测试
pnpm test

# 7. 如需查看生成的 SQL（参考用）
pnpm prisma migrate dev --name update_timestamps --create-only
```

---

## 📞 FAQ

**Q: 如果有现存数据怎么办？**
A: 由于项目无现存数据，直接修改 schema 即可。如有数据，需要编写迁移脚本。

**Q: BigInt 字段都要改吗？**
A: 只有**代表时间的** BigInt 才改成 DateTime。其他用途的 BigInt（如 ID、计数）保持不变。

**Q: API 应该返回什么格式的时间？**
A: 推荐 ISO 8601（`2026-01-25T10:30:00.000Z`），客户端可自行转换时区。

**Q: 如何处理时区问题？**
A: 数据库统一 UTC，应用层根据 `userSetting.localeTimezone` 格式化返回。

**Q: Prisma DateTime 会有精度问题吗？**
A: PostgreSQL TIMESTAMPTZ 精确到微秒，足够应用使用。

---

## 🔗 相关文档

- [Prisma DateTime](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#datetime)
- [PostgreSQL TIMESTAMP WITH TIME ZONE](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [JavaScript Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)

---

**下一步**: 待批准后，按 Step 1 开始执行 ✅

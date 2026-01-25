# 📋 时间戳统一迁移 - 执行计划总结

**制定时间**: 2026-01-25  
**执行状态**: ⏳ 待确认  
**核准者**: @user

---

## 🎯 核心决策

### ✅ 已确认的方案

| 层级 | 当前状态 | 目标状态 | 说明 |
|------|--------|--------|------|
| **数据库层** | DateTime / BigInt / Int 混乱 | `DateTime` (Timestamptz) | PostgreSQL 使用 `TIMESTAMP WITH TIME ZONE` |
| **应用层** | 数字、BigInt、DateTime 混乱 | `Date` 对象统一 | Prisma 自动转换 Timestamptz → Date |
| **API 返回** | 混乱 | ISO 8601 或时间戳 | 由业务决定，推荐 ISO 8601 |
| **时区处理** | 无标准 | UTC 存储 + 用户时区应用 | 从 userSetting 读取用户时区 |
| **数据迁移** | 无需考虑 | 直接修改 Schema | 项目无现存数据，可安全修改 |

---

## 📊 工作量评估

### 预计规模

```
┌────────────────────────────────────────┐
│ 需要修改的模型: 60+ 个                  │
│ 需要修改的 DTO 文件: 35-50 个          │
│ 需要修改的 Service: 20-30 个           │
│ 需要修改的 Controller: 3-5 个          │
│ 需要创建的工具类: 1 个                  │
│                                        │
│ 总代码行数变更: 500-1000 行             │
│ 预计工作时间: 5-9 小时                  │
│ 建议分配: 1 个全职开发 2-3 天          │
└────────────────────────────────────────┘
```

### 分阶段时间表

```
第一天 (3-4 小时)
├── Step 1: 修改 Prisma Schema (30 min)
├── Step 2: 创建 TimestampUtil (20 min)
└── Step 3: 开始更新 DTO (2-3 hours)

第二天 (3-4 小时)
├── Step 3: 完成 DTO 更新 (1-2 hours)
└── Step 4: 更新 Service 逻辑 (2-2.5 hours)

第三天 (1-2 小时)
├── Step 5: API 序列化配置 (30 min)
└── Step 6: 测试和验证 (30 min - 1 hour)
```

---

## 🔄 转换规则速查表

### Prisma Schema

```prisma
// ❌ 旧
createdAt BigInt @default(dbgenerated("extract(epoch from now())::bigint * 1000"))
createdAt Int @default(dbgenerated("extract(epoch from now())::integer"))
createdAt DateTime? @map("created_at")

// ✅ 新（全部统一）
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @map("updated_at")
deletedAt DateTime? @map("deleted_at")
```

### TypeScript DTO

```typescript
// ❌ 旧
export class AccountDTO {
  createdAt: number;
  updatedAt: bigint;
  lastActiveAt?: number | null;
}

// ✅ 新
export class AccountDTO {
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date | null;
}
```

### Service 层逻辑

```typescript
// ❌ 旧
const now = new Date().getTime();
const data = { createdAt: now };
findBy({ createdAt: { gte: Number(bigIntValue) } });

// ✅ 新
const now = new Date();
const data = { createdAt: now };
findBy({ createdAt: { gte: new Date(someDateValue) } });
```

### API 返回序列化

```typescript
// ✅ 选项 A: ISO 8601（推荐）
{
  "createdAt": "2026-01-25T10:30:00.000Z",
  "updatedAt": "2026-01-25T10:35:00.000Z"
}

// ✅ 选项 B: 毫秒时间戳
{
  "createdAt": 1737788400000,
  "updatedAt": 1737788700000
}

// ✅ 选项 C: 本地化字符串（如需要）
{
  "createdAt": "2026-01-25 18:30:00",  // Asia/Shanghai
  "createdAtTs": 1737788400000
}
```

---

## 📝 前置条件检查

- [x] 已备份现有代码（git commit）
- [ ] 所有开发者理解新方案
- [ ] 决定 API 时间格式（ISO 8601 / 时间戳）
- [ ] 确认时区标准（UTC 存储 + 用户时区应用）
- [ ] 准备开发环境

---

## 🚀 执行步骤概览

### Step 1: Prisma Schema 修改 (30 min)

需要修改的模型和字段：

| Model | 字段 | 旧类型 | 新类型 | 优先级 |
|-------|------|--------|--------|--------|
| focusMode | startTime, endTime, actualEndTime | BigInt | DateTime | 🔴 HIGH |
| focusMode | createdAt, updatedAt | BigInt | DateTime | 🔴 HIGH |
| repository | createdAt, updatedAt | BigInt | DateTime | 🔴 HIGH |
| folder | createdAt, updatedAt | BigInt | DateTime | 🔴 HIGH |
| resource | createdAt, updatedAt, modifiedAt | BigInt | DateTime | 🔴 HIGH |
| document | createdAt, updatedAt, deletedAt | Int | DateTime | 🔴 HIGH |
| document_version | createdAt | Int | DateTime | 🔴 HIGH |
| document_link | createdAt, updatedAt | Int | DateTime | 🔴 HIGH |
| schedule | startTime, endTime | BigInt | DateTime | 🟡 MEDIUM |
| reminderTemplate | lastAnalysisTime, adjustmentTime | BigInt | DateTime | 🟡 MEDIUM |
| reminderResponse | timestamp | BigInt | DateTime | 🟡 MEDIUM |
| keyResultWeightSnapshot | snapshotTime | BigInt | DateTime | 🟡 MEDIUM |
| taskTemplate | startDate, dueDate, completedAt | BigInt | DateTime | 🟡 MEDIUM |

### Step 2: 创建 TimestampUtil (20 min)

**文件**: `packages/infrastructure-server/src/shared/utils/timestamp.ts`

```typescript
// 5 个工具函数
- getCurrentUTC(): Date
- fromMilliseconds(ms): Date
- fromSeconds(sec): Date
- toMilliseconds(date): number
- toISO(date): string
- formatByTimezone(date, tz, format): string
```

### Step 3: 更新 DTO 文件 (2-3 hours)

扫描并修改 35-50 个 DTO 文件中的时间字段：

```
✅ 全部改为 Date 类型
❌ 删除 @Type(() => Date) 装饰器（如有）
❌ 删除 number / bigint 类型
```

### Step 4: 更新 Service 逻辑 (1-2 hours)

在 20-30 个 Service 文件中：

```
❌ 删除: new Date().getTime(), Date.now()
❌ 删除: new Date(bigIntValue.toString())
✅ 统一使用: Date 对象
✅ Prisma 自动转换
```

### Step 5: API 序列化配置 (30 min)

配置全局拦截器处理日期序列化：

```typescript
// 自动将 Date 转换为 ISO 8601
app.useGlobalInterceptors(new DateSerializerInterceptor());
```

### Step 6: 测试验证 (1 hour)

```bash
pnpm prisma validate
pnpm tsc --noEmit
pnpm test
pnpm test:integration
```

---

## ⚡ 风险分析

### 🟢 低风险

- 无现存数据，无迁移风险
- Prisma 自动处理转换，无业务逻辑复杂性
- PostgreSQL 完全支持 TIMESTAMP WITH TIME ZONE

### 🟡 中风险

- DTO 更新工作量大（35-50 文件）
- Service 逻辑修改需要逐个确认
- API 客户端可能需要适配时间格式

### 🔴 高风险

- 无（已评估）

---

## ✅ 完成标准

执行完成后应满足：

```
[ ] 没有 TypeScript 类型错误
[ ] 没有时间戳转换逻辑散落代码
[ ] Prisma generate 成功
[ ] 所有单元测试通过
[ ] 所有集成测试通过
[ ] API 返回格式正确
[ ] 时区转换功能验证
[ ] Code Review 通过
```

---

## 📚 生成的文档

| 文档 | 位置 | 用途 |
|------|------|------|
| **迁移计划** | [TIMESTAMP_MIGRATION_PLAN.md](./TIMESTAMP_MIGRATION_PLAN.md) | 详细步骤和注意事项 |
| **修改清单** | [TIMESTAMP_DETAILED_CHECKLIST.md](./TIMESTAMP_DETAILED_CHECKLIST.md) | 所有修改点的清单 |
| **执行总结** | 本文件 | 快速参考 |

---

## 📞 Q&A

**Q: 能不能先只改 Schema，DTO 后续再改？**  
A: 不建议。建议一次性完成，否则会有长期类型不一致的问题。

**Q: 如果中途遇到问题怎么办？**  
A: 每个 Step 完成后通过 `tsc --noEmit` 验证，发现问题及时调整。

**Q: 需要更新文档吗？**  
A: 建议更新 API 文档（如 Swagger/OpenAPI）说明时间字段格式。

**Q: 多人开发时如何协调？**  
A: 建议一个人完成 Step 1-2，然后并行做 Step 3（DTO 分模块）。

---

## 🎬 下一步

请确认以下内容：

- [ ] 同意统一方案（DTO 用 Date，DB 用 Timestamptz）
- [ ] 确定 API 时间格式（ISO 8601 / 毫秒时间戳）
- [ ] 分配开发资源（预计 1 人 2-3 天）
- [ ] 准备好开发环境（Node.js, pnpm, PostgreSQL）

**确认后即可开始执行 Step 1** ✅

---

**文档生成**: 2026-01-25 22:00 UTC  
**预计完成**: 2026-01-28 12:00 UTC  
**制定者**: AI Assistant (Claude)

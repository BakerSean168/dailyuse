# 🚀 时间戳统一迁移 - 快速参考卡片

## 一句话总结

**将所有时间数据统一为 PostgreSQL 的 `TIMESTAMPTZ` 存储 + TypeScript 的 `Date` 对象操作**

---

## 核心三角

```
┌─────────────────────────────────────┐
│  API 返回                           │
│  ISO 8601 / Timestamp               │
└────────────┬────────────────────────┘
             │ serialize()
┌────────────▼────────────────────────┐
│  应用层 (DTO/Service)               │
│  统一使用 Date 对象                  │
└────────────┬────────────────────────┘
             │ Prisma 自动转换
┌────────────▼────────────────────────┐
│  数据库层 (PostgreSQL)              │
│  TIMESTAMP WITH TIME ZONE           │
└─────────────────────────────────────┘
```

---

## 修改速查表

### 🔧 需要修改的模型（13个，共30个字段）

```
❌ 修改前          ✅ 修改后
─────────────────  ─────────────────
createdAt: BigInt  createdAt: DateTime
updatedAt: Int     updatedAt: DateTime
startTime: BigInt  startTime: DateTime
─────────────────  ─────────────────
```

**具体模型列表**:
1. focusMode (5字段)
2. repository (2字段)
3. folder (2字段)
4. resource (3字段)
5. document (3字段)
6. document_version (1字段)
7. document_link (2字段)
8. schedule (2字段)
9. reminderTemplate (2字段)
10. reminderResponse (1字段)
11. keyResultWeightSnapshot (1字段)
12. taskTemplate (3字段)

### 📝 所有其他模型 (40+个)

✅ 已正确使用 DateTime，**保持不变**

---

## 代码修改示例

### Prisma Schema

```prisma
❌ createdAt BigInt @default(dbgenerated("extract(epoch from now())::bigint * 1000"))
✅ createdAt DateTime @default(now()) @map("created_at")

❌ createdAt Int @default(dbgenerated("extract(epoch from now())::integer"))
✅ createdAt DateTime @map("created_at")
```

### TypeScript DTO

```typescript
❌ createdAt: number | bigint | string
✅ createdAt: Date
```

### Service 业务逻辑

```typescript
❌ const now = new Date().getTime()
✅ const now = new Date()

❌ findBy({ createdAt: { gte: Number(ts) } })
✅ findBy({ createdAt: { gte: new Date(ts) } })
```

---

## 工作量评估

```
文件数     行数      时间
──────────────────────────
Schema      1       13      30 min
DTO        35-50   300-500  2-3 h
Service    20-30   100-200  1-2 h
工具        1       50      20 min
API 序列化  3-5     50-100  30 min
测试        -       -       1-2 h
──────────────────────────
合计        60+    500-1000 5-9 h
```

---

## 6 步执行计划

```
第一天
├─ Step 1: 修改 Prisma Schema (30 min)
├─ Step 2: 创建 TimestampUtil (20 min)
└─ Step 3: 开始更新 DTO (2-3 h)

第二天
├─ Step 3: 完成 DTO 更新 (1-2 h)
└─ Step 4: 更新 Service 逻辑 (2-2.5 h)

第三天
├─ Step 5: API 序列化配置 (30 min)
└─ Step 6: 测试验证 (30 min-1 h)
```

---

## 验证命令

```bash
# 1. Schema 验证
pnpm prisma validate

# 2. 生成 Client
pnpm prisma generate

# 3. 类型检查
pnpm tsc --noEmit

# 4. 运行测试
pnpm test

# 5. 集成测试
pnpm test:integration
```

---

## 时区处理指南

```
数据库       UTC 存储 (TIMESTAMP WITH TIME ZONE)
应用层       Date 对象 (原始 UTC)
API 返回     ISO 8601 (含 Z 标记 = UTC)
显示给用户    从 userSetting.localeTimezone 读取用户时区
             使用 Intl.DateTimeFormat 格式化
```

---

## 风险评估

```
🟢 低风险     无现存数据，无迁移风险
🟢 低风险     Prisma 自动处理转换
🟡 中风险     DTO 文件修改工作量大
🟡 中风险     需要测试所有时间相关接口
🔴 高风险     无
```

---

## API 响应格式选择

### 选项 A: ISO 8601 ✅ 推荐

```json
{
  "createdAt": "2026-01-25T10:30:00.000Z",
  "updatedAt": "2026-01-25T10:35:00.000Z"
}
```

### 选项 B: 毫秒时间戳

```json
{
  "createdAt": 1737788400000,
  "updatedAt": 1737788700000
}
```

### 选项 C: 本地化字符串

```json
{
  "createdAt": "2026-01-25 18:30:00",
  "createdAtTs": 1737788400000
}
```

---

## 关键时间戳

| 里程碑 | 时间 | 状态 |
|------|------|------|
| 计划制定 | 2026-01-25 | ✅ |
| 获得确认 | 待定 | ⏳ |
| 开始执行 | 预计 2026-01-26 | 📅 |
| 预计完成 | 预计 2026-01-28 | 📅 |

---

## 重要文件

| 文件 | 用途 |
|------|------|
| [TIMESTAMP_MIGRATION_PLAN.md](./TIMESTAMP_MIGRATION_PLAN.md) | 📖 完整详细计划 |
| [TIMESTAMP_DETAILED_CHECKLIST.md](./TIMESTAMP_DETAILED_CHECKLIST.md) | ✅ 修改清单 |
| [TIMESTAMP_EXEC_SUMMARY.md](./TIMESTAMP_EXEC_SUMMARY.md) | 📋 执行摘要 |

---

## 快速开始

```bash
# 1. 阅读完整计划
cat TIMESTAMP_MIGRATION_PLAN.md

# 2. 确认无误后，创建功能分支
git checkout -b feat/timestamp-migration

# 3. 按 Step 1-6 依次执行
# Step 1: 修改 schema.prisma
vim packages/infrastructure-server/prisma/schema.prisma

# Step 2: 创建工具
touch packages/infrastructure-server/src/shared/utils/timestamp.ts

# 3. 验证
pnpm prisma validate && pnpm tsc --noEmit

# 4. 提交和测试
git add . && git commit -m "feat: unify timestamp to DateTime"
pnpm test
```

---

## 常见问题速答

| Q | A |
|---|---|
| 有现存数据吗？ | 无，可直接修改 schema |
| 需要写迁移脚本吗？ | 不需要，无数据 |
| BigInt 都要改吗？ | 只改**时间**的 BigInt |
| 多久完成？ | 1 人 2-3 天 |
| 有风险吗？ | 低风险（无现存数据） |

---

**⏱ 打印此卡片，随时参考！**

最后更新: 2026-01-25 22:30 UTC

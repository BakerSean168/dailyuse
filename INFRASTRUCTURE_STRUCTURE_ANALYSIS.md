# Infrastructure-Server 模块结构分析报告

## 📊 当前问题诊断

### 1. 结构不一致性问题

#### **问题1：Prisma 仓储位置混乱**

**现状发现：**
- ❌ **Goal 模块**: Prisma 仓储在 `repositories/` 文件夹
  - `repositories/prisma-goal-repository.ts`
  - `repositories/prisma-focus-mode-repository.ts`
  
- ✅ **Goal 模块**: 同时在 `adapters/prisma/` 也有
  - `adapters/prisma/goal-prisma.repository.ts`
  
- ❌ **Account 模块**: Prisma 仓储也在 `repositories/`
  - `repositories/prisma-account.repository.ts`
  
- ✅ **Account 模块**: 同时在 `adapters/prisma/` 也有
  - `adapters/prisma/` (新迁移的位置)

**结论**：存在**重复定义**和**路径混乱**

---

#### **问题2：Adapters 子目录不统一**

| 模块 | prisma/ | sqlite/ | memory/ | 状态 |
|------|---------|---------|---------|------|
| goal | ✅ | ✅ | ✅ | 完整 |
| account | ✅ | ✅ | ✅ | 完整 |
| ai | ✅ | ✅ | ❌ | 缺 memory |
| authentication | ✅ | ✅ | ❌ | 缺 memory |
| notification | ❌ | ✅ | ❌ | 只有 sqlite |
| schedule | ❌ | ✅ | ❌ | 只有 sqlite |
| task | ❌ | ✅ | ❌ | 只有 sqlite |

**问题**：
- 部分模块的 Prisma 实现还在旧的 `repositories/` 位置
- 部分模块缺少 `adapters/prisma/` 子目录

---

#### **问题3：Repositories 文件夹的混淆**

**两种用途混在一起：**

1. **旧架构残留** - 直接放 Prisma 实现：
   ```
   goal/repositories/
     ├── prisma-goal-repository.ts      ❌ 应该在 adapters/prisma/
     └── prisma-focus-mode-repository.ts ❌ 应该在 adapters/prisma/
   ```

2. **正确用途** - 放具体实现类：
   ```
   authentication/repositories/
     ├── prisma-auth-session-repository.ts    ❌ 混乱
     └── bcrypt-password-encryptor.ts         ✅ 正确（非仓储）
   ```

---

#### **问题4：缺少统一的导出结构**

**现状：**
- ❌ 有些模块有 `adapters/prisma/index.ts`
- ❌ 有些模块没有
- ❌ 有些模块的 `repositories/index.ts` 导出的是 Prisma 实现
- ❌ 有些模块的 `ports/index.ts` 导出接口

**导致的问题：**
```typescript
// 不同模块的导入方式完全不同
import { GoalRepository } from '@dailyuse/infrastructure-server/goal/repositories';  // ❌
import { GoalPrismaRepository } from '@dailyuse/infrastructure-server/goal/adapters/prisma';  // ✅
import { SqliteGoalRepository } from '@dailyuse/infrastructure-server/goal/adapters/sqlite';  // ✅
```

---

## 🎯 推荐的统一结构

### **标准模块结构模板**

```
{module}/
├── adapters/                    # 数据访问实现（按技术栈分）
│   ├── prisma/                 # Prisma (PostgreSQL) 实现
│   │   ├── index.ts            # 导出所有 Prisma 仓储
│   │   ├── {entity}-prisma.repository.ts
│   │   └── schema.prisma.ts    # Prisma 特定类型/映射（可选）
│   ├── sqlite/                 # SQLite (better-sqlite3) 实现
│   │   ├── index.ts            # 导出所有 SQLite 仓储
│   │   ├── sqlite-{entity}.repository.ts
│   │   └── schema.ts           # 表结构定义
│   └── memory/                 # 内存实现（测试用）
│       ├── index.ts
│       └── {entity}-memory.repository.ts
├── di/                         # 依赖注入容器
│   ├── index.ts
│   ├── {module}-container.ts   # 模块容器
│   └── repository-factory.ts   # 仓储工厂（可选）
├── ports/                      # 仓储接口定义（Port）
│   ├── index.ts
│   └── {entity}-repository.port.ts
├── {module}.module.ts          # 模块入口（可选）
└── index.ts                    # 模块导出
```

---

## 🔧 具体改进方案

### **方案A：完全清理（推荐）**

**目标**：删除所有 `repositories/` 文件夹，统一使用 `adapters/`

**步骤**：
1. 将 `repositories/prisma-*.ts` 移动到 `adapters/prisma/`
2. 重命名为标准格式：`{entity}-prisma.repository.ts`
3. 删除空的 `repositories/` 文件夹
4. 更新所有导入路径

**优点**：
- ✅ 结构清晰，职责明确
- ✅ 技术栈分离清楚
- ✅ 符合端口-适配器（Hexagonal）架构
- ✅ 便于后续扩展新的适配器（如 MongoDB）

**缺点**：
- ❌ 需要大量文件移动和导入更新

---

### **方案B：保留 Repositories（不推荐）**

**目标**：保持 `repositories/` 但只用于导出

**结构**：
```
{module}/
├── adapters/
│   ├── prisma/
│   └── sqlite/
├── repositories/          # 仅作为导出聚合
│   └── index.ts          # 重新导出 adapters 中的内容
└── ports/
```

**优点**：
- ✅ 减少文件移动

**缺点**：
- ❌ 增加额外的中间层
- ❌ 职责不清晰
- ❌ 容易混淆

---

## 📋 推荐的统一标准

### **命名规范**

| 类型 | 位置 | 命名格式 | 示例 |
|------|------|----------|------|
| **Prisma 仓储** | `adapters/prisma/` | `{entity}-prisma.repository.ts` | `goal-prisma.repository.ts` |
| **SQLite 仓储** | `adapters/sqlite/` | `sqlite-{entity}.repository.ts` | `sqlite-goal.repository.ts` |
| **Memory 仓储** | `adapters/memory/` | `{entity}-memory.repository.ts` | `goal-memory.repository.ts` |
| **接口定义** | `ports/` | `{entity}-repository.port.ts` | `goal-repository.port.ts` |

### **导出规范**

```typescript
// adapters/prisma/index.ts
export { GoalPrismaRepository } from './goal-prisma.repository';
export { GoalFolderPrismaRepository } from './goal-folder-prisma.repository';

// adapters/sqlite/index.ts
export { SqliteGoalRepository } from './sqlite-goal.repository';
export { SqliteGoalFolderRepository } from './sqlite-goal-folder.repository';

// ports/index.ts
export type { IGoalRepository } from './goal-repository.port';
export type { IGoalFolderRepository } from './goal-folder-repository.port';

// di/index.ts
export { GoalRepositoryFactory } from './repository-factory';
export { GoalModule } from './goal-module';

// index.ts (模块根)
export * from './ports';
export * from './di';
export * from './adapters/prisma';
export * from './adapters/sqlite';
```

---

## 🚀 迁移执行计划

### **阶段 1：清理重复文件**

```bash
# 对每个模块执行：
1. 检查 repositories/ 中的 Prisma 文件
2. 确认 adapters/prisma/ 中是否已有同名/同功能文件
3. 如果有重复，删除 repositories/ 中的旧文件
4. 如果 repositories/ 中的是唯一版本，移动到 adapters/prisma/
```

### **阶段 2：统一命名**

```bash
# 批量重命名
repositories/prisma-goal-repository.ts 
  → adapters/prisma/goal-prisma.repository.ts
  
repositories/prisma-account.repository.ts
  → adapters/prisma/account-prisma.repository.ts
```

### **阶段 3：创建缺失的 adapters**

```bash
# 为缺少 Prisma 适配器的模块创建
notification/adapters/prisma/
schedule/adapters/prisma/
task/adapters/prisma/
```

### **阶段 4：更新导入**

```bash
# 全局搜索替换
from '@dailyuse/infrastructure-server/{module}/repositories'
  → '@dailyuse/infrastructure-server/{module}/adapters/prisma'
```

---

## 💡 最终推荐

**采用方案A（完全清理）+ 标准化命名规范**

**理由**：
1. 符合端口-适配器架构原则
2. 技术栈清晰分离
3. 便于新技术接入（MongoDB, Redis等）
4. 降低理解和维护成本
5. 导入路径语义清晰

**预期收益**：
- ✅ 所有模块结构统一
- ✅ 代码组织清晰
- ✅ 便于新人理解
- ✅ 支持多数据源切换
- ✅ 符合 DDD 分层架构

---

## 🎬 立即开始？

需要我开始执行清理和统一化吗？我可以：
1. 自动化移动和重命名文件
2. 更新所有导入路径
3. 创建缺失的适配器目录
4. 生成标准的 index.ts 导出文件

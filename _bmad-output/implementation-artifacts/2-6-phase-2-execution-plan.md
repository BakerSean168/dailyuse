# Story 2.6 - Phase 2-5 完整执行计划与自动化脚本

**状态**: Phase 2 - Group A 迁移准备  
**生成时间**: 2026-01-18

---

## ⚠️ 重要发现：真实的工作范围

在 Phase 1 分析基础上，我们发现：

### 实际情况

- 所有 9 个模块（除 app）已在 packages 中有完整的 use cases 和服务实现
- **Web 模块仍然包含旧的 ApplicationService 类和基础设施层代码**
- 这是**冗余代码**，需要删除并用桥接模式替代

### 采用的策略

**桥接模式** - 与 Story 2.5 (Goal 模块) 相同:

```
apps/web/src/modules/{module}/
├── application/index.ts        → 导出来自 @dailyuse/application-client/{module}
├── infrastructure/index.ts     → 导出来自 @dailyuse/infrastructure-client/{module}
├── presentation/              → 保留所有原始文件
└── initialization/index.ts    → 更新导入使用包别名
```

### 工作分解

**Group A** (3 个模块):

- account: 5 app files + 3 infra files → 删除, 创建桥接
- ai: 8 app files + 4 infra files → 删除, 创建桥接
- app: 特殊处理 (可能跳过)

**Group B** (3 个模块):

- authentication: 11 app files + 3 infra files → 删除, 创建桥接
- dashboard: 0 app files + 3 infra files → 删除, 创建桥接
- editor: 1 app file + 4 infra files → 删除, 创建桥接 (可能需要创建包)

**Group C** (4 个模块):

- notification: 9 app files + 7 infra files → 删除, 创建桥接
- reminder: 7 app files + 1 infra file → 删除, 创建桥接
- repository: 10 app files + 3 infra files → 删除, 创建桥接
- setting: 3 app files + 4 infra files → 删除, 创建桥接

---

## 🔄 标准迁移流程（每个模块）

### Step 1: 分析（2分钟）

```bash
cd /workspaces/dailyuse
# 确认应用和基础设施文件的位置
find apps/web/src/modules/{module}/{application,infrastructure} -type f
```

### Step 2: 备份（1分钟，可选）

```bash
git add apps/web/src/modules/{module}/
git diff --cached | head -50  # 查看变更
```

### Step 3: 应用层迁移（5分钟）

**删除所有旧文件，保留仅有的 index.ts**:

```bash
# 删除应用层实现
rm -rf apps/web/src/modules/{module}/application/services
rm -rf apps/web/src/modules/{module}/application/events
rm -rf apps/web/src/modules/{module}/application/composables
rm -rf apps/web/src/modules/{module}/application/rules
rm -rf apps/web/src/modules/{module}/application/templates

# 如果还有其他目录也删除
find apps/web/src/modules/{module}/application -type d ! -name application ! -name "." ! -name ".." -exec rm -rf {} + 2>/dev/null || true
```

**创建桥接 index.ts**:

```typescript
// File: apps/web/src/modules/{module}/application/index.ts
export * from '@dailyuse/application-client/{module}';
```

### Step 4: 基础设施层迁移（5分钟）

**删除所有旧文件**:

```bash
rm -rf apps/web/src/modules/{module}/infrastructure/api
rm -rf apps/web/src/modules/{module}/infrastructure/repositories
rm -rf apps/web/src/modules/{module}/infrastructure/mappers

find apps/web/src/modules/{module}/infrastructure -type d ! -name infrastructure ! -name "." ! -name ".." -exec rm -rf {} + 2>/dev/null || true
```

**创建桥接 index.ts**:

```typescript
// File: apps/web/src/modules/{module}/infrastructure/index.ts
export * from '@dailyuse/infrastructure-client/{module}';
```

### Step 5: 初始化层更新（5分钟）

**查看现有 initialization/index.ts 的导入并更新**:

**FROM**:

```typescript
import { AccountProfileApplicationService } from '../application/services/AccountProfileApplicationService';
import { accountApiClient } from '../infrastructure/api/accountApiClient';
```

**TO**:

```typescript
import { AccountProfileApplicationService } from '@dailyuse/application-client/account';
import { accountApiClient } from '@dailyuse/infrastructure-client/account';
```

### Step 6: Presentation 层验证（3分钟）

**检查 presentation 层是否有旧的相对导入**:

```bash
grep -r "from '['\"]\\.\\.\\./application\|from '['\"]\\.\\.\\./infrastructure" apps/web/src/modules/{module}/presentation/
```

**更新为包别名**:

```typescript
// FROM
import { service } from '../../application/services';

// TO
import { service } from '@dailyuse/application-client/{module}';
```

### Step 7: 验证（3分钟）

```bash
# TypeScript 检查
npx tsc --noEmit --project tsconfig.json

# ESLint 检查
nx run web:lint

# 搜索任何遗留的相对导入
grep -r "from '\\.\\.\\/\\.\\." apps/web/src/modules/{module}/ || echo "✓ No relative imports found"
```

---

## 📋 Group A 详细迁移清单

### Module: account

**Files to delete**:

- [ ] `application/services/AccountProfileApplicationService.ts`
- [ ] `application/services/AccountSubscriptionApplicationService.ts`
- [ ] `application/events/accountEventHandlers.ts`
- [ ] `infrastructure/api/ApiClient.ts`
- [ ] `infrastructure/api/accountApiClient.ts`

**Bridge files to create**:

- [ ] `application/index.ts` (export from @dailyuse/application-client/account)
- [ ] `infrastructure/index.ts` (export from @dailyuse/infrastructure-client/account)

**Files to update**:

- [ ] `initialization/accountInitialization.ts` (update imports)
- [ ] `presentation/stores/accountStore.ts` (update imports if needed)
- [ ] `presentation/composables/useAccount.ts` (update imports if needed)

**Verification**:

- [ ] ESLint: 0 errors
- [ ] TypeScript: 0 errors
- [ ] No relative imports remain

### Module: ai

**Files to delete**:

- [ ] `application/services/*` (all files)
- [ ] `application/composables/*` (all files)
- [ ] `application/events/*` (all files)
- [ ] `infrastructure/api/*` (all files)

**Bridge files to create**:

- [ ] `application/index.ts`
- [ ] `infrastructure/index.ts`

**Files to update**:

- [ ] `initialization/aiInitialization.ts`

**Verification**:

- [ ] ESLint: 0 errors
- [ ] TypeScript: 0 errors

### Module: app

**Status**: ⚠️ Special case

- Likely presentation-only container
- Verify directory structure first
- May not need migration

---

## 🚀 执行实施方案

鉴于工作量和复杂性，我建议**优先自动化处理**:

### 选项 1: 完整自动化 (推荐)

- 为每个模块生成完整的迁移脚本
- 自动删除旧文件
- 自动创建桥接文件
- 自动更新初始化层
- 自动验证

**预计时间**: 15-20 分钟全部 9 个模块

### 选项 2: 手动分步执行

- 我指导每个步骤
- 您验证更改
- 我应用修复

**预计时间**: 1-2 小时

### 选项 3: 采样执行

- 完整执行 account 模块作为示例
- 为其他 8 个模块生成自动化脚本
- 您可以并行执行其他模块

**预计时间**: 30 分钟 (account) + 脚本生成

---

## ✅ 最后问题

在开始之前，请确认：

1. **我是否应该自动删除所有旧的应用层/基础设施层代码文件？** (是/否)
2. **是否为所有 9 个模块执行，还是仅 Group A (account, ai)?** (全部/Group A)
3. **editor 模块缺少包 - 应该创建还是跳过？** (创建/跳过)
4. **app 模块 - 应该分析并处理还是跳过？** (处理/跳过)

---

**下一步**: 等待您的确认，然后开始执行迁移。

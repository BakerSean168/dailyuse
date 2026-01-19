# API 模块提取执行指南（方案 B）

**开始时间**: 2026-01-19  
**状态**: 准备阶段完成，待执行  
**负责人**: _待分配_

---

## 当前状态

✅ **已完成**:

1. ADR-020 创建并批准（API 统一提取策略）
2. API 模块代码已恢复（恢复到提交前状态）
   - 应用层文件: 66 个
   - 基础设施层文件: 79 个
3. 详细提取映射表已创建
4. 执行计划已制定

---

## 执行阶段详解

### Phase 1: Authentication 模块（P0）

#### 1.1 应用层迁移

```bash
# 创建目标目录
mkdir -p packages/application-server/src/authentication/services
mkdir -p packages/application-server/src/authentication/handlers

# 复制文件（示例）
cp apps/api/src/modules/authentication/application/services/AuthenticationApplicationService.ts \
   packages/application-server/src/authentication/services/authentication-application.service.ts
```

**需要迁移的文件**:

- `AuthenticationApplicationService.ts` → `authentication-application.service.ts`
- `ApiKeyApplicationService.ts` → `api-key-application.service.ts`
- `PasswordManagementApplicationService.ts` → `password-management-application.service.ts`
- `SessionManagementApplicationService.ts` → `session-management-application.service.ts`
- `TwoFactorApplicationService.ts` → `two-factor-application.service.ts`
- `RememberMeApplicationService.ts` → `remember-me-application.service.ts`
- `AccountCreatedHandler.ts` (从 `application/event-handlers/`) → `account-created.handler.ts` (到 `handlers/`)

**修复 imports** (每个迁移的文件):

```typescript
// Before: 相对路径导入
import { IAuthSessionRepository } from '../repositories/IAuthSessionRepository';

// After: packages 导入
import { IAuthSessionRepository } from '@dailyuse/infrastructure-server';
```

#### 1.2 基础设施层迁移

```bash
# 创建目标目录
mkdir -p packages/infrastructure-server/src/authentication/repositories
mkdir -p packages/infrastructure-server/src/authentication/di

# 复制文件
cp apps/api/src/modules/authentication/infrastructure/repositories/PrismaAuthCredentialRepository.ts \
   packages/infrastructure-server/src/authentication/repositories/prisma-auth-credential.repository.ts
```

**需要迁移的文件**:

- `PrismaAuthCredentialRepository.ts`
- `PrismaAuthSessionRepository.ts`
- `AuthenticationContainer.ts` (到 `di/authentication-container.ts`)

#### 1.3 更新 API routes

```typescript
// apps/api/src/modules/authentication/routes.ts（新建）
import { Router } from 'express';
import { AuthenticationContainer } from '@dailyuse/infrastructure-server';
import { AuthenticatedRequest } from '../types';

export function registerAuthRoutes(router: Router): void {
  const container = AuthenticationContainer.getInstance();
  const authService = container.getAuthenticationApplicationService();

  // 登录
  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error; // 全局错误处理器处理
    }
  });

  // 退出
  router.post('/auth/logout', async (req: AuthenticatedRequest, res) => {
    try {
      await authService.logout(req.user.sessionId);
      res.json({ success: true });
    } catch (error) {
      throw error;
    }
  });

  // 刷新 token
  router.post('/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  });

  // ... 其他端点
}

export function registerApiKeyRoutes(router: Router): void {
  const container = AuthenticationContainer.getInstance();
  const apiKeyService = container.getApiKeyApplicationService();

  // API Key 管理端点...
}
```

#### 1.4 验证步骤

```bash
# 1. 编译检查
pnpm tsc --noEmit

# 2. 单元测试
pnpm test packages/application-server/src/authentication
pnpm test packages/infrastructure-server/src/authentication

# 3. 检查导入
grep -r "from '\.\./" apps/api/src/modules/authentication/interface | wc -l
# 应该返回 0（所有导入都应该来自 packages）

# 4. 删除空目录
rm -rf apps/api/src/modules/authentication/application
rm -rf apps/api/src/modules/authentication/infrastructure
```

---

### Phase 2: Account 模块（P0）

类似 Authentication 的流程...

**关键文件**:

```
应用层:
  - AccountApplicationService.ts
  - AccountStatusApplicationService.ts
  - RegistrationApplicationService.ts

基础设施层:
  - PrismaAccountRepository.ts
  - AccountContainer.ts
```

---

### Phase 3: AI 模块（P1）- 最复杂

#### 3.1 应用层（5 个 services）

- `AIConversationService.ts`
- `AIGenerationApplicationService.ts`
- `AIProviderConfigService.ts`
- `AIProviderSwitchingService.ts`
- `GoalGenerationApplicationService.ts`

#### 3.2 基础设施层（最重）

**Adapters** (7 个):

- `BaseAIAdapter.ts`
- `OpenAIAdapter.ts`
- `DeepSeekAdapter.ts`
- `GroqAdapter.ts`
- `SiliconFlowAdapter.ts`
- `OpenRouterAdapter.ts`
- `CustomOpenAICompatibleAdapter.ts`
- `AIAdapterFactory.ts`

**Repositories** (5 个):

- `PrismaAIConversationRepository.ts`
- `PrismaAIGenerationTaskRepository.ts`
- `PrismaAIProviderConfigRepository.ts`
- `PrismaAIUsageQuotaRepository.ts`
- `KnowledgeGenerationTaskRepository.ts`

**其他**:

- `AIContainer.ts` (DI)
- `AIErrors.ts` (到 domain)
- `templates.ts` (提示词模板)
- `QuotaEnforcementService.ts` (基础设施服务)

#### 3.3 特殊考虑

```typescript
// AI Adapters 接口需要在 domain 中定义
// packages/domain-server/src/ai/ports/ai-adapter.port.ts

export interface IAIAdapter {
  testConnection(): Promise<boolean>;
  generateCompletion(prompt: string, options: GenerationOptions): Promise<string>;
  // ...
}

// Adapters 实现在 infrastructure 中
// packages/infrastructure-server/src/ai/adapters/openai.adapter.ts

export class OpenAIAdapter implements IAIAdapter {
  constructor(private config: OpenAIConfig) {}

  async testConnection(): Promise<boolean> { ... }
  async generateCompletion(prompt: string, options: GenerationOptions): Promise<string> { ... }
}
```

---

### Phase 4: Goal 模块（P1）

**应用层** (10 个 services):

- `GoalApplicationService.ts`
- `GoalFolderApplicationService.ts`
- `GoalStatisticsApplicationService.ts`
- `GoalReviewApplicationService.ts`
- `GoalKeyResultApplicationService.ts`
- `GoalRecordApplicationService.ts`
- `FocusSessionApplicationService.ts`
- `FocusModeApplicationService.ts`
- `GoalCrossModuleQueryService.ts`
- `GoalEventPublisher.ts` (事件发布器)

**基础设施层**:

- 5 个 Repositories
- Mappers（对象映射）
- Cron 任务
- DI Container

---

### Phase 5-8: 其他模块（P2-P4）

按照优先级逐个迁移...

---

## 批量迁移脚本（可选）

### 自动化迁移脚本

```bash
#!/bin/bash
# scripts/migrate-api-to-packages.sh

set -e

MODULES=("authentication" "account" "ai" "goal" "task" "reminder" "schedule" "dashboard" "notification" "repository" "setting" "editor")

for module in "${MODULES[@]}"; do
  echo "🔄 迁移模块: $module"

  # 迁移应用层
  if [ -d "apps/api/src/modules/$module/application" ]; then
    echo "  📦 迁移应用层..."
    mkdir -p "packages/application-server/src/$module/services"
    mkdir -p "packages/application-server/src/$module/handlers"

    # 复制 services
    cp -v apps/api/src/modules/$module/application/services/*.ts \
           packages/application-server/src/$module/services/ 2>/dev/null || true

    # 复制 event-handlers
    if [ -d "apps/api/src/modules/$module/application/event-handlers" ]; then
      cp -v apps/api/src/modules/$module/application/event-handlers/*.ts \
             packages/application-server/src/$module/handlers/ 2>/dev/null || true
    fi
  fi

  # 迁移基础设施层
  if [ -d "apps/api/src/modules/$module/infrastructure" ]; then
    echo "  📦 迁移基础设施层..."
    mkdir -p "packages/infrastructure-server/src/$module/repositories"
    mkdir -p "packages/infrastructure-server/src/$module/di"

    # 复制 repositories
    cp -v apps/api/src/modules/$module/infrastructure/repositories/*.ts \
           packages/infrastructure-server/src/$module/repositories/ 2>/dev/null || true

    # 复制 DI Container
    if [ -f "apps/api/src/modules/$module/infrastructure/di/${module^}Container.ts" ]; then
      cp -v "apps/api/src/modules/$module/infrastructure/di/${module^}Container.ts" \
            "packages/infrastructure-server/src/$module/di/$module-container.ts"
    fi

    # 复制其他基础设施文件
    for subdir in adapters services mappers cron errors; do
      if [ -d "apps/api/src/modules/$module/infrastructure/$subdir" ]; then
        mkdir -p "packages/infrastructure-server/src/$module/$subdir"
        cp -rv "apps/api/src/modules/$module/infrastructure/$subdir/" \
               "packages/infrastructure-server/src/$module/$subdir/" || true
      fi
    done
  fi

  echo "  ✅ 迁移完成"
done

echo ""
echo "🔍 修复 imports..."
# 这需要手动或更复杂的脚本处理

echo "📋 验证..."
pnpm tsc --noEmit

echo "✅ 迁移完成！"
```

### 导入修复脚本

```bash
#!/bin/bash
# scripts/fix-imports-after-migration.sh

# 在 packages 中，更新相对路径导入为 package 导入

# 示例：修复 authentication 模块
find packages/application-server/src/authentication -name "*.ts" -exec sed -i \
  "s|from '\.\./\.\.\/\.\./infrastructure|from '@dailyuse/infrastructure-server'|g" {} \;

find packages/infrastructure-server/src/authentication -name "*.ts" -exec sed -i \
  "s|from '\.\./\.\.\/\.\./domain|from '@dailyuse/domain-server'|g" {} \;
```

---

## 完成后的验证清单

### ✅ 编译验证

```bash
pnpm tsc --noEmit
# 预期: 0 errors
```

### ✅ 文件结构验证

```bash
# API 中没有 application 和 infrastructure 文件夹
if find apps/api/src/modules -type d \( -name "application" -o -name "infrastructure" \) | grep -q .; then
  echo "❌ 仍存在 application/infrastructure 文件夹"
  exit 1
fi
echo "✅ API 项目已清理"
```

### ✅ 导入验证

```bash
# API routes 中的导入应该来自 packages
grep -r "from '@dailyuse/" apps/api/src/modules | wc -l
# 应该返回一个较大的数字（每个 routes 文件都有多个导入）

# 不应该有相对路径导入指向 API 项目的其他模块
grep -r "from '\.\./\.\./application" apps/api/src/modules | wc -l
# 应该返回 0
```

### ✅ 测试验证

```bash
# 运行所有测试
pnpm test

# 运行 API 集成测试（如有）
pnpm test:e2e:api

# 启动 API 服务器验证
pnpm dev:api
```

---

## 常见问题与解决

### Q: 复制文件后文件名应该怎么改？

**A**: 遵循 kebab-case 命名规范：

```
源: AccountStatusApplicationService.ts
目标: account-status-application.service.ts

源: PrismaAccountRepository.ts
目标: prisma-account.repository.ts

源: AccountContainer.ts
目标: account-container.ts (在 di/ 文件夹中)
```

### Q: imports 怎么修复？

**A**: 使用 VSCode 的 "Update Imports" 功能或手动替换：

```typescript
// Before
import { IRepository } from '../repositories/IRepository';
import { logger } from '../../../utils/logger';

// After
import { IRepository } from '@dailyuse/infrastructure-server';
import { logger } from '@dailyuse/utils';
```

### Q: DI Container 怎么导出？

**A**: 在 Infrastructure Package 的 index.ts 中导出：

```typescript
// packages/infrastructure-server/src/index.ts
export { AuthenticationContainer } from './authentication/di/authentication-container';
export { AccountContainer } from './account/di/account-container';
export { AIContainer } from './ai/di/ai-container';
// ... 其他 containers
```

### Q: 如何处理循环依赖？

**A**: 检查依赖关系：

```
Authentication (no deps)
  ↓
Account (deps: Authentication)
  ↓
Goal (deps: Authentication, Account, Task)
  ↓
Task (deps: Authentication)

如果出现循环:
- 提取公共接口到 domain
- 使用 event system 替代直接调用
- 使用 lazy loading
```

---

## 执行进度追踪

使用此表格追踪执行进度：

| 模块           | 优先级 | 应用层 | 基础设施层 | Routes | 测试 | 验证 | 状态   |
| -------------- | ------ | ------ | ---------- | ------ | ---- | ---- | ------ |
| Authentication | P0     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Account        | P0     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| AI             | P1     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Goal           | P1     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Task           | P2     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Reminder       | P2     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Schedule       | P2     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Dashboard      | P3     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Notification   | P3     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Repository     | P3     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Setting        | P3     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |
| Editor         | P4     | ⭕     | ⭕         | ⭕     | ⭕   | ⭕   | 未开始 |

**图例**: ⭕ = 未开始，🔄 = 进行中，✅ = 完成

---

## 下一步

1. **确认**：是否同意按照方案 B 执行？
2. **分配**：指派负责人
3. **排期**：确定开始时间
4. **开始**：从 Authentication 模块开始（P0）

---

**创建日期**: 2026-01-19  
**文档版本**: 1.0  
**准备就绪**: ✅ 是

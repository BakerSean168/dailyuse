# API Routes 统一重构计划

**开始时间**: 2026-01-19  
**目标**: 将所有 routes 文件统一为基于用例拆分、包含 Swagger 注释的格式  
**参考标准**: goal-keyresult.routes.ts

## 📋 重构进度

### ✅ 已完成的模块

#### 1. AI 模块 (3 个 routes 文件)

- ✅ ai-provider.routes.ts (Provider 管理)
- ✅ ai-generation.routes.ts (内容生成)
- ✅ ai-chat.routes.ts (对话功能)
- ✅ index.ts (聚合器更新)

**特点**:

- 按功能拆分成 3 个独立的 routes 文件
- 每个文件对应一个主要用例
- 完整的 Swagger 注释
- 使用 `@dailyuse/application-server` 中的服务
- 统一的错误处理和日志

---

### 🔄 待重构的模块

#### 2. Task 模块

**当前状态**: 部分完成（有 swagger，但需要优化）  
**文件**:

- taskInstanceRoutes.ts (221 行)
- taskTemplateRoutes.ts
- taskStatisticsRoutes.ts
- taskDependencyRoutes.ts

**重构方案**:

- ✅ 保持当前的 4 个分割文件（已按用例拆分）
- 需要更新导入：从 Controller → 从 Application Services
- 添加统一的 middleware 和错误处理
- 优化 Swagger 注释

**优先级**: 🟠 高

---

#### 3. Reminder 模块

**当前状态**: 大型单文件 (631 行)  
**文件**:

- reminderRoutes.ts (631 行)
- reminderGroupRoutes.ts

**建议拆分**:

```
reminder-template.routes.ts     - 模板 CRUD (150 行)
reminder-group.routes.ts         - 群组管理 (120 行)
reminder-execution.routes.ts     - 执行/历史 (120 行)
reminder-smart-frequency.routes.ts - 智能频率 (100 行)
reminder-search.routes.ts        - 搜索统计 (80 行)
```

**优先级**: 🟠 高

---

#### 4. Schedule 模块

**当前状态**: 未检查  
**建议拆分方向**:

- schedule-calendar.routes.ts
- schedule-slot.routes.ts
- schedule-sync.routes.ts

**优先级**: 🟡 中

---

#### 5. Notification 模块

**当前状态**: 未检查  
**建议拆分方向**:

- notification-preference.routes.ts
- notification-history.routes.ts
- notification-send.routes.ts

**优先级**: 🟡 中

---

#### 6. Repository 模块

**当前状态**: 未检查  
**建议拆分方向**:

- repository-crud.routes.ts
- repository-statistics.routes.ts
- repository-search.routes.ts

**优先级**: 🟡 中

---

#### 7. Setting 模块

**当前状态**: 未检查  
**建议拆分方向**:

- setting-user.routes.ts (用户设置)
- setting-notification.routes.ts (通知设置)
- setting-appearance.routes.ts (外观设置)

**优先级**: 🟡 中

---

#### 8. Editor 模块

**当前状态**: 未检查  
**建议拆分方向**:

- editor-document.routes.ts
- editor-collaborative.routes.ts

**优先级**: 🟡 低

---

#### 9. Dashboard 模块

**当前状态**: 文件位置不同 (routes.ts)  
**建议拆分方向**:

- dashboard-overview.routes.ts
- dashboard-widget.routes.ts
- dashboard-sync.routes.ts

**优先级**: 🟡 低

---

## 🎯 统一标准

所有重构后的 routes 文件应遵循以下标准：

### 1. 文件结构

```typescript
/**
 * [Module] [Feature] Routes
 * 描述
 *
 * 端点:
 * - METHOD path - 描述
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { SomeApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('[RoutesName]');
const responseBuilder = createResponseBuilder();

export function registerXxxRoutes(): Router {
  const router: Router = ExpressRouter();
  router.use(authMiddleware); // 如果需要认证

  // 路由定义...

  return router;
}
```

### 2. Swagger 注释规范

```typescript
/**
 * @swagger
 * /api/path:
 *   post:
 *     tags: [Tag Name]
 *     summary: 操作摘要
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const service = await SomeService.getInstance();
    const result = await service.doSomething(req.body);
    res.json(responseBuilder.success(result, 'Operation successful'));
  } catch (error) {
    logger.error('Operation failed:', error);
    throw error;
  }
});
```

### 3. 错误处理

- 所有路由都应该用 try-catch 包裹
- 错误应该被记录到 logger
- 统一使用 responseBuilder.success 或 responseBuilder.error
- 让全局错误处理器处理异常

### 4. 认证

- 所有需要认证的 routes 应该在文件顶部调用 `router.use(authMiddleware)`
- 或者在单个路由中应用: `router.post('/', authMiddleware, handler)`
- 使用 `req.user.accountUuid` 获取当前用户

### 5. 服务注入

- 从 `@dailyuse/application-server` 导入服务类
- 使用 `await Service.getInstance()` 获取单例
- 不应该在 routes 中直接访问数据库或创建业务逻辑

---

## 📊 预期工作量

| 模块         | 文件数 | 行数     | 工作量    | 优先级 |
| ------------ | ------ | -------- | --------- | ------ |
| AI           | 3      | 800      | ✅ 完成   | 已完成 |
| Task         | 4      | 800      | 1-2h      | 🟠 高  |
| Reminder     | 5      | 700      | 2-3h      | 🟠 高  |
| Schedule     | 3      | 600      | 1.5-2h    | 🟡 中  |
| Notification | 3      | 400      | 1-1.5h    | 🟡 中  |
| Repository   | 3      | 500      | 1-1.5h    | 🟡 中  |
| Setting      | 3      | 300      | 0.5-1h    | 🟡 中  |
| Editor       | 2      | 200      | 0.5h      | 🟡 低  |
| Dashboard    | 3      | 300      | 0.5-1h    | 🟡 低  |
| **总计**     | **29** | **5200** | **8-14h** | -      |

---

## 🔄 执行流程

### 第一阶段：高优先级模块 (Task, Reminder)

1. 分析现有 routes 结构
2. 按用例拆分文件
3. 更新导入 (Controller → Application Services)
4. 添加完整 Swagger 注释
5. 测试编译和运行

### 第二阶段：中优先级模块 (Schedule, Notification, Repository)

重复第一阶段流程

### 第三阶段：低优先级模块 (Setting, Editor, Dashboard)

重复第一阶段流程

### 第四阶段：验证和清理

1. 验证所有 routes 都已重构
2. 删除旧的 Controller 文件（如果已全部迁移到 routes）
3. 更新主 router 的聚合器
4. 完整的编译和测试

---

## 📝 检查清单

### 文件拆分检查

- [ ] 每个 routes 文件都代表一个明确的用例
- [ ] 文件行数控制在 200-400 行以内
- [ ] 文件名遵循 kebab-case 规范

### 代码质量检查

- [ ] 所有路由都有 Swagger 文档
- [ ] 所有路由都有认证检查（如需要）
- [ ] 所有异步操作都有 try-catch
- [ ] 所有服务调用都从 packages 导入
- [ ] 统一使用 responseBuilder

### 集成检查

- [ ] index.ts 正确导入和聚合所有子 routes
- [ ] TypeScript 编译通过 (0 errors)
- [ ] 所有现有单元测试仍通过
- [ ] API 服务器可以正常启动

---

## 🎉 完成标志

重构完成的标志：

1. ✅ 所有 routes 文件都按用例拆分
2. ✅ 所有文件都有完整的 Swagger 注释
3. ✅ 所有导入都来自 @dailyuse/application-server
4. ✅ TypeScript 编译 0 errors
5. ✅ API 服务器正常运行
6. ✅ 旧的 Controller 文件已清理
7. ✅ 文档已更新

---

**文档更新时间**: 2026-01-19

# API 路由模式 - 快速参考指南

## 新路由创建检查清单

当需要为 API 添加新的路由功能时，遵循以下步骤：

### 1️⃣ 确定功能位置

```
你要添加的功能属于哪个模块?
├─ Authentication (登录、认证、密钥等)
├─ Account (账户管理、资料、会话)
├─ Goal (目标管理)
├─ Task (任务管理)
├─ Reminder (提醒管理)
└─ ... 其他模块
```

### 2️⃣ 创建路由文件

**文件位置**: `/apps/api/src/modules/[MODULE]/interface/http/[module]-[feature].routes.ts`

**文件名例子**:

- `authentication-oauth.routes.ts` (新增 OAuth 功能)
- `goal-archive.routes.ts` (新增目标归档功能)
- `account-preferences.routes.ts` (新增账户偏好设置)

### 3️⃣ 使用标准模板

```typescript
/**
 * [Module] [Feature] Routes
 * 简要说明这个路由文件的功能
 *
 * 端点:
 * - HTTP_METHOD /path/:param - 端点说明
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { SomeApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('[Module][Feature]Routes');
const responseBuilder = createResponseBuilder();

export function register[Feature]Routes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/path:
   *   method:
   *     tags: [Module]
   *     summary: 操作简述
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [field1]
   *             properties:
   *               field1:
   *                 type: string
   *     responses:
   *       200:
   *         description: 成功响应
   */
  router.method('/path/:uuid', authMiddleware, async (req, res) => {
    try {
      const service = await SomeApplicationService.getInstance();
      const result = await service.method(req.params.uuid, req.body);
      res.status(200).json(responseBuilder.success(result, 'Success message'));
    } catch (error) {
      logger.error('Operation failed:', error);
      throw error;
    }
  });

  return router;
}
```

### 4️⃣ 更新模块的 index.ts

**位置**: `/apps/api/src/modules/[MODULE]/interface/http/index.ts`

```typescript
// 添加导入
import { register[Feature]Routes } from './[module]-[feature].routes';

// 在 register[Module]Routes() 函数中添加
export function register[Module]Routes(): Router {
  const router = ExpressRouter();

  // 现有路由...
  router.use('/', registerExisting1Routes());
  router.use('/', registerExisting2Routes());

  // 新增路由
  router.use('/', register[Feature]Routes());  // ← 添加这行

  return router;
}
```

### 5️⃣ 测试和验证

```bash
# 1. TypeScript 编译检查
npx tsc --noEmit

# 2. 确认 Swagger 文档可访问
# 访问 http://localhost:3000/api/swagger

# 3. 使用 Postman 或 curl 测试端点
curl -X GET http://localhost:3000/api/path \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 常见模式和示例

### 模式 1: 简单的 GET 端点（获取数据）

```typescript
router.get('/:uuid', authMiddleware, async (req, res) => {
  try {
    const service = await SomeApplicationService.getInstance();
    const data = await service.get(req.params.uuid);
    res.json(responseBuilder.success(data, 'Data retrieved'));
  } catch (error) {
    logger.error('Get failed:', error);
    throw error;
  }
});
```

### 模式 2: 创建新资源（POST）

```typescript
router.post('/', authMiddleware, async (req, res) => {
  try {
    const service = await SomeApplicationService.getInstance();
    const created = await service.create(req.body);
    res.status(201).json(responseBuilder.success(created, 'Created'));
  } catch (error) {
    logger.error('Create failed:', error);
    throw error;
  }
});
```

### 模式 3: 更新资源（PUT/PATCH）

```typescript
router.put('/:uuid', authMiddleware, async (req, res) => {
  try {
    const service = await SomeApplicationService.getInstance();
    const updated = await service.update(req.params.uuid, req.body);
    res.json(responseBuilder.success(updated, 'Updated'));
  } catch (error) {
    logger.error('Update failed:', error);
    throw error;
  }
});
```

### 模式 4: 删除资源（DELETE）

```typescript
router.delete('/:uuid', authMiddleware, async (req, res) => {
  try {
    const service = await SomeApplicationService.getInstance();
    await service.delete(req.params.uuid);
    res.json(responseBuilder.success(null, 'Deleted'));
  } catch (error) {
    logger.error('Delete failed:', error);
    throw error;
  }
});
```

### 模式 5: 不需要认证的路由

```typescript
// 不添加 authMiddleware
router.post('/register', async (req, res) => {
  try {
    // ... 处理逻辑
  } catch (error) {
    logger.error('Register failed:', error);
    throw error;
  }
});
```

---

## 代码风格指南

### ✅ 推荐

```typescript
// 1. 清晰的函数命名
export function registerLoginRoutes(): Router { }

// 2. 统一的错误处理
try {
  const result = await service.doSomething();
  res.json(responseBuilder.success(result, 'Message'));
} catch (error) {
  logger.error('Operation failed:', error);
  throw error;
}

// 3. 使用 responseBuilder 构建响应
res.status(201).json(responseBuilder.success(data, 'Created'));

// 4. 完整的 Swagger 注释
/**
 * @swagger
 * /api/path:
 *   post:
 *     tags: [Module]
 *     summary: 简短描述
 */

// 5. 正确的 middleware 顺序
router.post('/path', authMiddleware, async (req, res) => { }
```

### ❌ 不推荐

```typescript
// 1. 通用的函数名
export function routes(): Router { }

// 2. 吞掉错误
try {
  // ...
} catch (error) {
  console.log('error'); // ← 这是坏的！
}

// 3. 手动构建响应对象
res.json({ code: 0, data: result, msg: 'Success' }); // ← 应该用 responseBuilder

// 4. 缺少文档
router.post('/path', async (req, res) => { } // ← 没有 Swagger 和 JSDoc

// 5. 错误的 middleware 顺序
router.post('/path', async (req, res) => { } // ← authMiddleware 丢失了
```

---

## 常见问题 FAQ

### Q1: 如何添加多个 middleware？

```typescript
router.post('/path', authMiddleware, customMiddleware1, customMiddleware2, async (req, res) => {
  // ...
});
```

### Q2: 如何处理需要高级权限的端点？

```typescript
// 方式 1: 在服务层检查权限
try {
  const result = await AdminService.getInstance()
    .checkPermission(req.user)
    .then(() => AdminService.deleteUser(uuid));
} catch (error) {
  logger.error('Permission denied:', error);
  throw error;
}

// 方式 2: 使用自定义 middleware (推荐后续改进)
router.delete('/:uuid', authMiddleware, adminMiddleware, async (req, res) => {
  // ...
});
```

### Q3: 路由文件变得太大了怎么办？

**继续拆分！** 当文件超过 200 行时，考虑再细分功能域：

```
goal-keyresult.routes.ts (192 行 - 可以，但接近上限)

如果继续增长，考虑拆分为:
goal-keyresult-crud.routes.ts
goal-keyresult-progress.routes.ts
```

### Q4: 如何在不同的路由文件间共享逻辑？

```typescript
// 创建共享的 utility 文件
// apps/api/src/modules/goal/interface/http/goal.shared.ts

export async function validateGoalOwnership(goalUuid: string, accountUuid: string) {
  const service = await GoalApplicationService.getInstance();
  const goal = await service.getGoal(goalUuid);
  if (goal.accountUuid !== accountUuid) {
    throw new Error('Unauthorized');
  }
  return goal;
}

// 在路由文件中使用
import { validateGoalOwnership } from './goal.shared';

router.put('/:uuid', authMiddleware, async (req, res) => {
  try {
    await validateGoalOwnership(req.params.uuid, req.user.accountUuid);
    // ...
  } catch (error) {
    logger.error('Update failed:', error);
    throw error;
  }
});
```

### Q5: 如何测试新的路由？

```typescript
// 使用 Jest/Vitest 编写测试
describe('Goal CRUD Routes', () => {
  let router: Router;

  beforeEach(() => {
    router = registerCrudRoutes();
  });

  it('should create goal', async () => {
    const request = supertest(express().use(router));
    const response = await request
      .post('/goals')
      .set('Authorization', 'Bearer token')
      .send({ title: 'Test Goal' });

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('SUCCESS');
  });
});
```

---

## 性能最佳实践

### ✅ 做这些

1. **使用分页处理大数据集**

   ```typescript
   router.get('/', authMiddleware, async (req, res) => {
     const { page = 1, limit = 20 } = req.query;
     // 使用 offset = (page - 1) * limit
   });
   ```

2. **缓存频繁访问的数据**

   ```typescript
   const cache = new Map();
   router.get('/stats', authMiddleware, async (req, res) => {
     const key = `stats_${req.user.accountUuid}`;
     if (cache.has(key)) return res.json(cache.get(key));
     // ...
   });
   ```

3. **异步处理耗时操作**
   ```typescript
   router.post('/generate', authMiddleware, async (req, res) => {
     const jobId = await BackgroundJobService.enqueue(/* ... */);
     res.json(responseBuilder.success({ jobId }, 'Processing'));
     // 不要 await 后续操作
   });
   ```

### ❌ 避免这些

1. ❌ N+1 查询
2. ❌ 同步处理大文件
3. ❌ 返回整个对象而不是分页
4. ❌ 忘记设置 query 参数限制

---

## 部署检查清单

部署新的路由文件前，确保：

- [ ] ✅ 所有 TypeScript 编译无错误
- [ ] ✅ Swagger 文档完整
- [ ] ✅ 错误处理正确
- [ ] ✅ 权限检查到位
- [ ] ✅ 日志记录完整
- [ ] ✅ 单元测试通过（如有）
- [ ] ✅ e2e 测试通过（如有）
- [ ] ✅ Code review 通过
- [ ] ✅ API 向后兼容

---

## 联系和支持

遇到问题或有改进建议？

- 查看 ADR-021 了解完整的架构决策
- 参考 api-refactor-completion-report.md 了解详细细节
- 咨询项目架构师或核心团队成员

**记住**: 好的代码不仅要能工作，还要易于理解、维护和扩展！

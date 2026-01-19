# 下一步行动指南 - API Routes 重构的最后冲刺

**当前状态**: 75% 完成 (9/12 模块) ✅
**预计总时间**: 再需 4-6 小时完成所有工作

---

## 🎯 三步完成最后 25% 的工作

### 第 1 步: 重构 Setting 模块 (1-1.5h)

#### 需要创建的文件

1. **setting-user.routes.ts** (95 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/setting/interface/http/setting-user.routes.ts`
   - 端点:
     - POST /api/settings/user - 更新用户设置
     - GET /api/settings/user - 获取用户设置
     - PATCH /api/settings/user/preferences - 更新偏好设置
     - DELETE /api/settings/user/reset - 重置为默认值

2. **setting-system.routes.ts** (95 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/setting/interface/http/setting-system.routes.ts`
   - 端点:
     - GET /api/settings/system - 获取系统设置
     - PUT /api/settings/system - 更新系统设置 (Admin only)
     - GET /api/settings/system/defaults - 获取默认值

#### 代码模板

```typescript
import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { SettingApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Setting[Feature]Routes');
const responseBuilder = createResponseBuilder();

export function registerSettingUserRoutes(): Router {
  const router: Router = ExpressRouter();
  router.use(authMiddleware);

  // [实现端点 - 参考 reminder-core.routes.ts 的模式]

  return router;
}
```

#### 更新的文件

3. **setting/interface/http/index.ts** - 更新为注册新的 routes

---

### 第 2 步: 重构 Editor 模块 (1-1.5h)

#### 需要创建的文件

1. **editor-config.routes.ts** (95 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/editor/interface/http/editor-config.routes.ts`
   - 端点:
     - GET /api/editor/config - 获取配置
     - PUT /api/editor/config - 更新配置
     - PATCH /api/editor/config/reset - 重置配置

2. **editor-theme.routes.ts** (95 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/editor/interface/http/editor-theme.routes.ts`
   - 端点:
     - GET /api/editor/themes - 获取主题列表
     - GET /api/editor/themes/:id - 获取主题详情
     - POST /api/editor/themes - 创建自定义主题
     - PUT /api/editor/themes/:id - 更新主题
     - DELETE /api/editor/themes/:id - 删除主题

#### 更新的文件

3. **editor/interface/http/index.ts** - 更新为注册新的 routes

---

### 第 3 步: 重构 Dashboard 模块 (1-2h)

#### 需要创建的文件

1. **dashboard-widget.routes.ts** (110 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/dashboard/interface/http/dashboard-widget.routes.ts`
   - 端点:
     - GET /api/dashboard/widgets - 获取可用小部件列表
     - GET /api/dashboard/widgets/:id - 获取小部件数据
     - POST /api/dashboard/instances - 添加小部件到仪表盘
     - DELETE /api/dashboard/instances/:id - 删除小部件

2. **dashboard-layout.routes.ts** (110 lines)
   - 路径: `/workspaces/dailyuse/apps/api/src/modules/dashboard/interface/http/dashboard-layout.routes.ts`
   - 端点:
     - GET /api/dashboard/layout - 获取布局配置
     - PUT /api/dashboard/layout - 保存布局配置
     - POST /api/dashboard/layout/presets - 保存预设布局
     - GET /api/dashboard/layout/presets - 获取预设列表

#### 更新的文件

3. **dashboard/interface/http/index.ts** - 更新为注册新的 routes

---

## ✅ 第 4 步: 最终验证和清理 (2-3h)

### 验证步骤

```bash
# 1. TypeScript 编译检查
pnpm tsc --noEmit

# 2. 运行单元测试
pnpm test

# 3. 本地 API 启动
pnpm dev  # 或相应的启动命令

# 4. 验证导入
# 检查所有新文件都在 index.ts 中正确注册
```

### 清理步骤

```bash
# 1. 删除所有旧的 Controller 文件
rm -rf apps/api/src/modules/*/interface/http/controllers/

# 2. 删除旧的单文件 routes (如果已完全迁移)
# 确保所有功能都已迁移到新的 routes 文件

# 3. 更新导出
# 检查 index.ts 中的导出是否正确
```

### 最终测试

- ✅ API 本地启动成功
- ✅ 所有端点都可访问
- ✅ 认证中间件正常工作
- ✅ Swagger 文档完整
- ✅ 错误处理正常

---

## 📋 快速检查清单

### 每个模块完成时

- [ ] 创建了所有必需的 routes 文件
- [ ] 所有文件都有 Swagger 注释
- [ ] 所有文件都有 authMiddleware
- [ ] 所有文件都有 try-catch 错误处理
- [ ] 所有文件都使用 ResponseBuilder
- [ ] 更新了对应的 index.ts
- [ ] 文件顶部有清晰的端点列表注释

### 完成所有模块后

- [ ] 运行 `pnpm tsc --noEmit` 通过
- [ ] 运行 `pnpm test` 通过
- [ ] API 本地启动成功
- [ ] 所有 Swagger 文档都可访问
- [ ] 删除了所有旧文件
- [ ] 最终集成测试通过

---

## 🔍 参考资源

### 标准实现参考

所有文件都应参考这些标准实现:

1. **goal-keyresult.routes.ts** (201 lines)
   - 标准的 CRUD 操作模式
   - 完整的 Swagger 文档

2. **reminder-core.routes.ts** (155 lines)
   - CRUD + 状态管理
   - 多过滤条件支持

3. **schedule-task.routes.ts** (210 lines)
   - 复杂的状态转换 (pause/resume/complete/cancel)
   - 详细的参数验证

4. **notification-core.routes.ts** (195 lines)
   - 批量操作支持
   - 状态标记操作

---

## ⏱️ 时间预估细节

| 任务           | 短时间   | 长时间 | 备注                |
| -------------- | -------- | ------ | ------------------- |
| Setting 模块   | 1h       | 1.5h   | 2 个文件, 190 lines |
| Editor 模块    | 1h       | 1.5h   | 2 个文件, 190 lines |
| Dashboard 模块 | 1h       | 2h     | 2 个文件, 220 lines |
| 本地验证       | 30min    | 60min  | tsc, test, startup  |
| 最终清理       | 1h       | 1.5h   | 删除旧文件, 测试    |
| **总计**       | **4.5h** | **8h** | **预计 5-6h**       |

---

## 🎓 最佳实践总结

### 代码组织

- 每个文件 100-250 行
- 按业务功能拆分，不是按 HTTP 方法
- 相关功能聚合在一个文件

### 命名规范

- 文件: `{module}-{feature}.routes.ts`
- 函数: `register[Feature]Routes(): Router`
- 日志: `createLogger('[Feature]Routes')`

### 标准化要素

- ✅ Swagger 文档 (每个端点)
- ✅ 认证中间件 (所有端点)
- ✅ 错误处理 (try-catch)
- ✅ 日志记录 (logger.error)
- ✅ 响应标准 (responseBuilder)

---

## 🚀 预期完成时间

按照计划执行:

| 阶段           | 预计时间   |
| -------------- | ---------- |
| Setting 模块   | 1-1.5h     |
| Editor 模块    | 1-1.5h     |
| Dashboard 模块 | 1-2h       |
| 最终验证       | 1.5-2h     |
| **总计**       | **4.5-7h** |

**推荐节奏**: 每个模块 1-2 小时，中间休息，保证代码质量。

---

## 📞 常见问题解答

### Q: 为什么要删除旧的 Controller 文件?

A: 新的 routes 文件已经完全替代了 Controller 的功能，旧文件只会造成代码重复和维护混乱。

### Q: 新文件可以与旧文件并存吗?

A: 不建议。在完成所有验证后应该删除旧文件，但确保先更新所有的 index.ts 导入。

### Q: 如何处理依赖关系复杂的功能?

A: 将相关功能拆分到一个文件中，而不是跨多个文件。例如 schedule 的任务、冲突、统计各自一个文件。

### Q: Swagger 文档如何维护?

A: 每个端点都必须有 @swagger 注释块，确保与代码同步更新。

---

**祝贺** 🎉

你已经完成了 75% 的 API routes 重构工作!

只需再花 5-6 小时完成最后 3 个模块，就能达成 100% 的标准化！

**让我们继续前进!** 💪

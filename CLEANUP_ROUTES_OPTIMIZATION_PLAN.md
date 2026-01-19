# Routes 文件结构优化清理计划

## 目标

1. 删除所有旧的单体 routes 文件（aiRoutes.ts, aiConversationRoutes.ts 等）
2. 删除所有 controller 文件夹（如果已完全迁移到 routes）
3. 将 routes 文件夹移到 interface 层级，删除 http 中间文件夹
4. 更新所有导入路径

## 需要删除的旧 Routes 文件

### AI 模块

- ❌ /apps/api/src/modules/ai/interface/http/aiRoutes.ts
- ❌ /apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts
- ❌ /apps/api/src/modules/ai/interface/http/aiGenerationRoutes.ts

### Reminder 模块

- ❌ /apps/api/src/modules/reminder/interface/http/reminderRoutes.ts
- ❌ /apps/api/src/modules/reminder/interface/http/reminderGroupRoutes.ts

### Schedule 模块

- ❌ /apps/api/src/modules/schedule/interface/http/routes/scheduleRoutes.ts
- ❌ /apps/api/src/modules/schedule/interface/http/routes/scheduleEventRoutes.ts
- ❌ /apps/api/src/modules/schedule/interface/http/routes/scheduleStatisticsRoutes.ts

### Notification 模块

- ❌ /apps/api/src/modules/notification/interface/http/notificationRoutes.ts
- ❌ ❌ /apps/api/src/modules/notification/interface/http/sseRoutes.ts

### Setting 模块

- ❌ /apps/api/src/modules/setting/interface/http/settingRoutes.ts

### Editor 模块

- ❌ /apps/api/src/modules/editor/interface/http/routes/editorRoutes.ts

### 其他需要检查的旧文件

- ❌ /apps/api/src/modules/task/interface/http/routes/taskInstanceRoutes.ts
- ❌ /apps/api/src/modules/task/interface/http/routes/taskStatisticsRoutes.ts
- ❌ /apps/api/src/modules/task/interface/http/routes/taskDependencyRoutes.ts
- ❌ /apps/api/src/modules/task/interface/http/routes/taskTemplateRoutes.ts
- ❌ /apps/api/src/modules/goal/interface/http/ 下所有旧文件
- ❌ /apps/api/src/modules/repository/interface/http/routes/ 下旧文件
- ❌ /apps/api/src/modules/account/interface/http/accountRoutes.ts
- ❌ /apps/api/src/modules/authentication/interface/http/authenticationRoutes.ts

## 重构步骤

### 阶段 1: 优化 AI 模块

1. 检查 index.ts 中的导入
2. 删除旧的 aiRoutes.ts, aiConversationRoutes.ts, aiGenerationRoutes.ts
3. 验证 TypeScript 编译

### 阶段 2: 优化 Reminder 模块

1. 检查 index.ts 中的导入
2. 删除旧的 reminderRoutes.ts, reminderGroupRoutes.ts
3. 验证编译

### 阶段 3: 优化 Schedule 模块

1. 检查 index.ts 中的导入
2. 删除旧的 scheduleRoutes.ts 等文件
3. 验证编译

### 阶段 4: 优化 Notification 模块

1. 检查 index.ts 中的导入
2. 删除旧的 notificationRoutes.ts, sseRoutes.ts
3. 验证编译

### 阶段 5: 优化 Setting 模块

1. 检查 index.ts 中的导入
2. 删除旧的 settingRoutes.ts
3. 验证编译

### 阶段 6: 优化 Editor 模块

1. 检查 index.ts 中的导入
2. 删除旧的 editorRoutes.ts
3. 验证编译

### 阶段 7: 优化 Repository 模块

1. 检查现有结构
2. 删除旧文件
3. 验证编译

### 阶段 8: 最终清理

1. 验证所有模块编译正常
2. 检查所有导入路径正确
3. 删除空的文件夹（如 controllers/）

## 结构转换

### 当前结构示例（AI）

```
/modules/ai/interface/http/
  ├── index.ts                    (导入并聚合所有路由)
  ├── ai-provider.routes.ts       (新文件)
  ├── ai-generation.routes.ts     (新文件)
  ├── ai-chat.routes.ts           (新文件)
  ├── aiRoutes.ts                 (旧文件 - 待删除)
  ├── aiConversationRoutes.ts     (旧文件 - 待删除)
  └── aiGenerationRoutes.ts       (旧文件 - 待删除)
```

### 目标结构（简化后）

```
/modules/ai/interface/
  ├── routes/
  │   ├── index.ts
  │   ├── ai-provider.routes.ts
  │   ├── ai-generation.routes.ts
  │   └── ai-chat.routes.ts
  └── [其他接口层 - 如 gRPC, GraphQL 等]
```

## 注意事项

1. 在删除文件前必须确保 index.ts 不再导入它们
2. 验证所有导入路径更新
3. 逐个模块优化，及时验证编译
4. 最后运行 pnpm test 确保功能正常

## 状态追踪

- [ ] AI 模块清理完成
- [ ] Reminder 模块清理完成
- [ ] Schedule 模块清理完成
- [ ] Notification 模块清理完成
- [ ] Setting 模块清理完成
- [ ] Editor 模块清理完成
- [ ] Repository 模块清理完成
- [ ] 其他模块清理完成
- [ ] 最终 TypeScript 验证完成

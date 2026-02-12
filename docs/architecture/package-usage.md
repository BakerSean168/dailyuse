# 共享包使用规�?

本文档定义了 DailyUse 项目中各共享包的使用规范，帮助开发者正确选择和使用包�?

---

## 包架构概�?

```
┌─────────────────────────────────────────────────────────────────�?
�?                     @dailyuse 包生�?                           �?
├─────────────────────────────────────────────────────────────────�?
�?                                                                 �?
�? ┌─────────────�?   ┌─────────────�?   ┌─────────────�?         �?
�? �? contracts  �?   �?   utils    �?   �?  assets    �?         �?
�? �? (类型/DTO) �?   �? (工具函数) �?   �? (静态资�? �?         �?
�? └──────┬──────�?   └──────┬──────�?   └──────┬──────�?         �?
�?        �?                 �?                 �?                 �?
�?        �?                 �?                 �?                 �?
�? ┌──────────────────────────────────────────────────────────�?  �?
�? �?              可被任何层级使用的基础�?                    �?  �?
�? └──────────────────────────────────────────────────────────�?  �?
�?                                                                 �?
�? ┌────────────────────�?        ┌────────────────────�?         �?
�? �?  domain-client    �?        �?  domain-server    �?         �?
�? �?  (客户端领�?      �?        �?  (服务端领�?      �?         �?
�? └─────────┬──────────�?        └─────────┬──────────�?         �?
�?           �?                             �?                     �?
�?           �?                             �?                     �?
�? ┌────────────────────�?        ┌────────────────────�?         �?
�? �?application-client �?        �?application-server �?         �?
�? �?  (客户端用�?      �?        �?  (服务端用�?      �?         �?
�? └─────────┬──────────�?        └─────────┬──────────�?         �?
�?           �?                             �?                     �?
�?           �?                             �?                     �?
�? ┌────────────────────�?        ┌────────────────────�?         �?
�? │infrastructure-     �?        │infrastructure-     �?         �?
�? �?    client         �?        �?    server         �?         �?
�? �? (客户端适配�?     �?        �? (服务端适配�?     �?         �?
�? └────────────────────�?        └────────────────────�?         �?
�?        �?                             �?                        �?
�?        �?                             �?                        �?
�? ┌────────────────────�?        ┌────────────────────�?         �?
�? �? Renderer Process  �?  IPC   �?  Main Process     �?         �?
�? �?  (Vue/React)      �?◄─────�?�?  (Electron)       �?         �?
�? └────────────────────�?        └────────────────────�?         �?
�?                                                                 �?
└─────────────────────────────────────────────────────────────────�?
```

---

## 包清单与用�?

| 包名 | 层级 | 用�?| 依赖 |
|------|------|------|------|
| `@dailyuse/contracts` | 基础 | 类型定义、DTO、枚�?| �?|
| `@dailyuse/utils` | 基础 | 通用工具函数 | �?|
| `@dailyuse/assets` | 基础 | 图标、字体等静态资�?| �?|
| `@dailyuse/domain-client` | 领域 | 客户端领域模�?| contracts |
| `@dailyuse/domain-server` | 领域 | 服务端领域模型、聚合根 | contracts |
| `@dailyuse/application-client` | 应用 | 客户端用�?服务 | domain-client |
| `@dailyuse/application-server` | 应用 | 服务端用�?服务 | domain-server |
| `@dailyuse/infrastructure-client` | 适配�?| IPC 客户端、Container | application-client |
| `@dailyuse/infrastructure-server` | 适配�?| Container、注入配�?| application-server |
| `@dailyuse/ui-core` | UI | 通用 UI 工具 | - |
| `@dailyuse/ui-react` | UI | React 组件 | ui-core |
| `@dailyuse/ui-vue` | UI | Vue 组件 | ui-core |
| `@dailyuse/ui-react-shadcn` | UI | shadcn 组件 | ui-react |
| `@dailyuse/ui-vuetify` | UI | Vuetify 组件 | ui-vue |
| `@dailyuse/test-utils` | 测试 | 测试辅助工具 | - |

---

## 使用场景矩阵

| 包名 | Web 前端 | Desktop 渲染进程 | Desktop 主进�?| API 服务�?|
|------|:--------:|:----------------:|:--------------:|:----------:|
| `contracts` | �?| �?| �?| �?|
| `utils` | �?| �?| �?| �?|
| `assets` | �?| �?| �?| �?|
| `domain-client` | �?| �?| �?| �?|
| `domain-server` | �?| �?| �?| �?|
| `application-client` | �?| �?| �?| �?|
| `application-server` | �?| �?| �?| �?|
| `infrastructure-client` | �?| �?| �?| �?|
| `infrastructure-server` | �?| �?| �?| �?|
| `ui-react` | React | React | �?| �?|
| `ui-vue` | Vue | Vue | �?| �?|

---

## 代码示例

### 1. 渲染进程 (React/Vue)

```typescript
// �?正确 - 使用 client 系列�?
import { GoalClientService } from '@dailyuse/application-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';

// 获取服务
const service = GoalContainer.getInstance().getGoalService();

// 调用方法 (通过 IPC 与主进程通信)
const goals = await service.getActiveGoals(accountUuid);
```

```typescript
// �?错误 - 不要在渲染进程使�?server �?
import { GoalContainer } from '@dailyuse/infrastructure-server'; // 错误!
import { Goal } from '@dailyuse/domain-server/goal'; // 错误!
```

### 2. 主进�?(Electron Main)

```typescript
// �?正确 - 使用 server 系列�?
import { GoalContainer } from '@dailyuse/infrastructure-server';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';

// 获取 Repository
const repository = GoalContainer.getInstance().getGoalRepository();

// 使用聚合�?
const goal = Goal.create({
  accountUuid: 'xxx',
  title: 'New Goal',
  type: GoalType.LONG_TERM,
});
await repository.save(goal);
```

```typescript
// �?错误 - 不要在主进程使用 client �?
import { GoalClientService } from '@dailyuse/application-client/goal'; // 错误!
import { GoalContainer } from '@dailyuse/infrastructure-client'; // 错误!
```

### 3. IPC Handler (主进�?

```typescript
// �?正确 - Handler 连接 client 调用�?server 处理
import { ipcMain } from 'electron';
import { GoalContainer } from '@dailyuse/infrastructure-server';
import type { GoalServerDTO } from '@dailyuse/contracts/goal';

// 注册 IPC 处理�?
ipcMain.handle('goal:getActive', async (_, accountUuid: string) => {
  const service = GoalContainer.getInstance().getGoalService();
  return await service.getActiveGoals(accountUuid);
});
```

### 4. 类型共享

```typescript
// �?contracts 包可以在任何地方使用
import type { 
  GoalClientDTO,      // 客户端使�?
  GoalServerDTO,      // 服务端使�?
  GoalType,           // 枚举
  GoalStatus,         // 枚举
} from '@dailyuse/contracts/goal';
```

---

## Container 使用模式

### Client Container (渲染进程)

```typescript
import { GoalContainer } from '@dailyuse/infrastructure-client';

// 获取已配置的服务
const goalService = GoalContainer.getInstance().getGoalService();
const taskService = TaskContainer.getInstance().getTaskService();

// 服务通过 IPC 与主进程通信
const goals = await goalService.getActiveGoals(accountUuid);
```

### Server Container (主进�?

```typescript
import { GoalContainer } from '@dailyuse/infrastructure-server';
import { SqliteGoalRepository } from './sqlite-adapters';

// 配置阶段 - 注册 Repository
GoalContainer.getInstance()
  .registerGoalRepository(new SqliteGoalRepository())
  .registerGoalFolderRepository(new SqliteGoalFolderRepository())
  .registerStatisticsRepository(new SqliteGoalStatisticsRepository());

// 使用阶段 - 获取依赖
const repository = GoalContainer.getInstance().getGoalRepository();
const service = GoalContainer.getInstance().getGoalService();
```

---

## 模块导入规范

### 推荐: 具体路径导入

```typescript
// �?推荐 - 具体路径，tree-shaking 友好
import { Goal } from '@dailyuse/domain-server/goal';
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
```

### 允许: 顶级导入

```typescript
// ⚠️ 允许但不推荐 - 可能导入不需要的代码
import { Goal, Task, Schedule } from '@dailyuse/domain-server';
```

### 类型导入

```typescript
// �?使用 type 关键字明确标识类型导�?
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import { GoalType, GoalStatus } from '@dailyuse/contracts/goal';
```

---

## 常见错误 FAQ

### Q1: 渲染进程报错 "Cannot find module 'better-sqlite3'"

**原因**: 在渲染进程中错误地导入了 server �?

**解决**: 
```typescript
// �?错误
import { GoalContainer } from '@dailyuse/infrastructure-server';

// �?正确
import { GoalContainer } from '@dailyuse/infrastructure-client';
```

### Q2: 类型不匹�?"Type 'Goal' is not assignable..."

**原因**: 混用�?client �?server 的类�?

**解决**: 确保在正确的上下文使用正确的 DTO�?
- 渲染进程: `GoalClientDTO`
- 主进�? `GoalServerDTO` �?`Goal` 聚合�?

### Q3: Container 未配�?"Repository not registered"

**原因**: 在使用前未调�?`configureMainProcessDependencies()`

**解决**:
```typescript
// 在应用启动时配置
import { configureMainProcessDependencies } from './di/desktop-main.composition-root';

app.whenReady().then(() => {
  configureMainProcessDependencies();
  // ... 其他初始�?
});
```

### Q4: 循环依赖警告

**原因**: 包之间存在循环引�?

**解决**: 
- 使用 `import type` 进行类型导入
- 将共享类型提取到 contracts �?
- 使用动态导�?`require()`

---

## 依赖检查工�?

使用 ESLint 规则检查非法导入：

```javascript
// eslint.config.ts
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@dailyuse/infrastructure-server*'],
            message: '渲染进程不允许导�?server �?,
          },
          {
            group: ['@dailyuse/domain-server*'],
            message: '渲染进程不允许导�?domain-server �?,
          },
        ],
      }],
    },
  },
];
```

---

## 相关文档

- [系统架构概览](./system-overview.md)
- [Desktop 应用架构](./desktop-architecture.md)
- [DDD 类型架构](./ddd-type-architecture.md)

---

**更新日期**: 2025-12-07  
**维护�?*: DailyUse Team

# 🔧 Web 应用层架构修复计划

## 问题总结

1. **Composables 放在错误的层** - 应该在 `presentation/composables` 而不是 `application/composables`
2. **Services 有框架耦合** - ApplicationServices 直接使用 Zustand/Pinia stores
3. **不完整的代码提取** - 8/10 模块的代码还在 Web 中，没有移到 Packages

## 修复步骤

### Phase 1: 修复层级结构 (Goal 模块)

#### 问题：Composables 在错误的位置

```
❌ apps/web/src/modules/goal/application/composables/
✅ apps/web/src/modules/goal/presentation/composables/
```

#### 修复方案：

```bash
# 1. 创建目标目录
mkdir -p apps/web/src/modules/goal/presentation/composables

# 2. 移动文件
mv apps/web/src/modules/goal/application/composables/* \
   apps/web/src/modules/goal/presentation/composables/

# 3. 删除空目录
rmdir apps/web/src/modules/goal/application/composables

# 4. 更新导入路径（所有导入这些 composables 的地方）
# 从: import { useWeightSnapshot } from '../application/composables/useWeightSnapshot'
# 改: import { useWeightSnapshot } from '../presentation/composables/useWeightSnapshot'
```

#### 受影响的文件：

- `apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts`
- `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts`

---

### Phase 2: 处理框架耦合的 Services

#### 问题分析

Services 中的框架耦合来自两个方向：

**方向1：直接导入 Stores**

```typescript
// ❌ 当前：
import { useAuthenticationStore } from '../../presentation/stores/authenticationStore';

export class AuthApplicationService {
  async login() {
    const store = useAuthenticationStore();
    store.setToken(token); // ← 框架特定的 Store API
  }
}
```

**方向2：发布事件更新 Stores**

```typescript
// ❌ 当前：
import { getGoalStore } from '../../presentation/stores/goalStore';

export class GoalSyncApplicationService {
  async syncGoals() {
    const goals = await this.apiClient.getGoals();
    const store = getGoalStore(); // ← 框架依赖
    store.updateGoals(goals); // ← Store 更新逻辑
  }
}
```

---

### Phase 3: 解耦策略

#### 策略 A: 观察者模式（推荐）

**原理：** Service 发送事件，Store 监听事件

**修改前：**

```typescript
// application/services/GoalSyncApplicationService.ts
export class GoalSyncApplicationService {
  async syncGoals() {
    const goals = await this.getGoals();
    const goalStore = getGoalStore(); // ❌ 耦合
    goalStore.updateGoals(goals); // ❌ 框架特定
  }
}
```

**修改后：**

```typescript
// application/services/GoalSyncApplicationService.ts (可提取到 Packages!)
export class GoalSyncApplicationService {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  async syncGoals() {
    const goals = await this.getGoals();
    // ✅ 只发送事件，不涉及框架
    this.eventEmitter.emit('goal:updated', { goals });
  }
}
```

**在 Web 层监听事件：**

```typescript
// presentation/stores/goalStore.ts (Web 特有)
export const useGoalStore = defineStore('goal', () => {
  const eventBus = useEventBus();

  // ✅ Store 监听事件
  eventBus.on('goal:updated', ({ goals }) => {
    // Store 自己更新自己的状态
    state.goals = goals;
  });
});
```

**益处：**

- ✅ Service 完全框架无关
- ✅ 可以提取到 Packages
- ✅ Service 可以在 Desktop、Server 等任何环境中使用

---

#### 策略 B: 依赖注入

**原理：** Service 接收依赖，而不是自己获取

**修改前：**

```typescript
// ❌ Service 自己获取 Store
export class AuthApplicationService {
  async login() {
    const store = useAuthenticationStore(); // ❌ 紧耦合
    store.setToken(token);
  }
}
```

**修改后：**

```typescript
// ✅ Service 接收依赖
export interface AuthStateUpdater {
  setToken(token: string): void;
  setUser(user: User): void;
}

export class AuthApplicationService {
  constructor(private stateUpdater: AuthStateUpdater) {}

  async login(request: LoginRequest) {
    const response = await this.apiClient.login(request);
    // ✅ 使用注入的依赖
    this.stateUpdater.setToken(response.token);
    this.stateUpdater.setUser(response.user);
  }
}

// 在 Web 中创建实现：
class WebAuthStateUpdater implements AuthStateUpdater {
  constructor(private store: AuthStore) {}

  setToken(token: string) {
    this.store.setToken(token);
  }

  setUser(user: User) {
    this.store.setUser(user);
  }
}

// 在 Packages 中可以有 Mock 实现：
class MockAuthStateUpdater implements AuthStateUpdater {
  setToken(token: string) {
    /* Mock */
  }
  setUser(user: User) {
    /* Mock */
  }
}
```

**益处：**

- ✅ Service 不知道 Store 的存在
- ✅ 易于测试（使用 Mock 实现）
- ✅ 可以在任何环境中使用
- ✅ 可以提取到 Packages（带接口）

---

### Phase 4: 实施方案选择

#### 对于有 Store 耦合的 Services

**推荐优先级：**

1. **第一优先：事件驱动** (策略 A)
   - 适用场景：数据同步、状态更新
   - 示例：GoalSyncApplicationService、ReminderSyncApplicationService
   - 好处：最松散的耦合

2. **第二优先：依赖注入** (策略 B)
   - 适用场景：需要立即反馈给用户的操作
   - 示例：AuthenticationService、LoginService
   - 好处：清晰的接口契约

3. **第三优先：保留在 Web** (不提取)
   - 适用场景：很难解耦或需要复杂的框架集成
   - 示例：某些 UI 协调 Services

---

## 具体修复任务

### 任务 1: Goal 模块 - 修复 Composables 位置

**当前状态：** ❌ 2 个 Composables 在 application 层
**目标状态：** ✅ 移到 presentation 层

```bash
# 步骤 1: 创建目标目录
mkdir -p apps/web/src/modules/goal/presentation/composables

# 步骤 2: 移动文件
mv apps/web/src/modules/goal/application/composables/useAutoStatusRules.ts \
   apps/web/src/modules/goal/presentation/composables/

mv apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts \
   apps/web/src/modules/goal/presentation/composables/

# 步骤 3: 删除空目录
rmdir apps/web/src/modules/goal/application/composables

# 步骤 4: 删除 goal/application/index.ts 中的 composables 导出

# 步骤 5: 更新所有导入这些 composables 的地方
grep -r "from.*application.*composables" apps/web/src/modules/goal/
# 更新导入路径为 presentation/composables
```

**验证：**

```bash
# 检查是否还有错误的 composables 位置
find apps/web/src/modules/goal/application -name "*composable*" -o -name "use*.ts"

# 检查所有导入是否正确
grep -r "application/composables" apps/web/src/modules/goal/
# 应该返回空（没有结果）
```

---

### 任务 2: Goal 模块 - 解耦 GoalSyncApplicationService

**当前问题：**

```typescript
// ❌ 当前：直接使用 Store
import { getGoalStore } from '../../presentation/stores/goalStore';

export class GoalSyncApplicationService {
  async initializeSync() {
    const goalStore = getGoalStore(); // ← 框架耦合
    goalStore.loadGoals(); // ← 无法提取
  }
}
```

**修复步骤：**

1. **创建事件定义** (可以在 Packages 中)

   ```typescript
   // packages/contracts/goal/events.ts
   export const GoalEvents = {
     GOALS_SYNCED: 'goal:synced',
     GOAL_UPDATED: 'goal:updated',
   };
   ```

2. **修改 Service** (变为框架无关)

   ```typescript
   // apps/web/src/modules/goal/application/services/GoalSyncApplicationService.ts
   export class GoalSyncApplicationService {
     constructor(
       private apiClient: GoalApiClient,
       private eventBus: EventBus, // ✅ 注入事件总线
     ) {}

     async initializeSync() {
       const goals = await this.apiClient.getGoals();
       // ✅ 只发送事件
       this.eventBus.emit(GoalEvents.GOALS_SYNCED, { goals });
     }
   }
   ```

3. **在 Store 中监听事件** (Web 特有)
   ```typescript
   // apps/web/src/modules/goal/presentation/stores/goalStore.ts
   export const useGoalStore = defineStore('goal', () => {
     const eventBus = useEventBus();

     // ✅ Store 自己处理事件
     eventBus.on(GoalEvents.GOALS_SYNCED, ({ goals }) => {
       state.goals = goals;
     });
   });
   ```

---

### 任务 3: Authentication 模块 - 解耦 AuthApplicationService

**当前问题：** 7 个 Services 都直接使用 `useAuthenticationStore`

**修复优先级：**

1. AuthApplicationService (最关键)
2. LoginApplicationService
3. SessionApplicationService
4. 其他的...

**修复示例 - AuthApplicationService：**

```typescript
// 步骤 1: 创建接口 (可以在 Packages 中)
export interface IAuthStateUpdater {
  setTokens(tokens: AuthTokens): void;
  setUser(user: AccountClientDTO): void;
  clearAuth(): void;
}

// 步骤 2: 修改 Service
export class AuthApplicationService {
  constructor(
    private apiClient: AuthApiService,
    private stateUpdater: IAuthStateUpdater, // ✅ 依赖注入
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await this.apiClient.login(request);
    // ✅ 使用注入的接口
    this.stateUpdater.setTokens(response.tokens);
    this.stateUpdater.setUser(response.user);
    return response;
  }
}

// 步骤 3: 在 Web 中创建具体实现
class WebAuthStateUpdater implements IAuthStateUpdater {
  constructor(private store: ReturnType<typeof useAuthenticationStore>) {}

  setTokens(tokens: AuthTokens) {
    this.store.setTokens(tokens);
  }

  setUser(user: AccountClientDTO) {
    this.store.setUser(user);
  }

  clearAuth() {
    this.store.clearAuth();
  }
}

// 步骤 4: 在初始化时注入
const authService = new AuthApplicationService(
  authApiClient,
  new WebAuthStateUpdater(useAuthenticationStore()),
);
```

---

## 受影响的模块清单

### 立即需要修复的

- [ ] **goal** - 修复 Composables 位置 + 解耦 GoalSyncApplicationService
- [ ] **authentication** - 解耦所有 Services (7个)
- [ ] **account** - 解耦 AccountProfileApplicationService, AccountSubscriptionApplicationService (2个)

### 需要审查的

- [ ] **ai** - KnowledgeGenerationApplicationService (4个有依赖)
- [ ] **reminder** - ReminderSyncApplicationService 等 (4个有依赖)
- [ ] **task** - TaskSyncApplicationService, TaskStatisticsApplicationService (2个有依赖)
- [ ] **schedule** - ScheduleConflictApplicationService (3个)
- [ ] **setting** - ThemeService (Vuetify 依赖) + UserSettingWebApplicationService

---

## 提取完成标准

### 完整提取清单

对于每个模块的每个 Service，必须满足以下条件才能标记为"完整提取"：

#### ✅ 结构检查

- [ ] 没有 composables 在 application 层
- [ ] 没有 Vue/Vuetify 导入在 application 层
- [ ] 没有 Zustand/Pinia Store 导入

#### ✅ 功能检查

- [ ] 对应的 Service 已存在于 Packages
- [ ] Packages 版本与 Web 版本功能一致
- [ ] 所有依赖都来自 contracts 或 infrastructure

#### ✅ 导入检查

- [ ] Web 中的导入指向 Packages (import from '@dailyuse/application-client')
- [ ] Web 中删除了本地副本
- [ ] 没有断裂的导入

#### ✅ 验证检查

- [ ] 类型检查通过 (npx tsc --noEmit)
- [ ] 测试通过 (npm run test)
- [ ] 没有 lint 错误

---

## 总结

**当前状态：** ❌ 远未完成  
**完整提取模块：** 2/10 (notification, repository)  
**部分提取模块：** 8/10 (待修复)

**主要工作：**

1. ✅ 第1步：修复 Goal 模块的 Composables 位置
2. ✅ 第2步：解耦 GoalSyncApplicationService
3. ✅ 第3步：解耦 AuthenticationModule 的所有 Services
4. ✅ 第4步：解耦其他模块的 Services
5. ✅ 第5步：验证所有代码可以提取
6. ✅ 第6步：完成提取到 Packages
7. ✅ 第7步：验证功能无损

**预计工作量：** 4-6小时的仔细重构

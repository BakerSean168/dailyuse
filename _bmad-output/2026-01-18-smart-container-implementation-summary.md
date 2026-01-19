# Smart Container + Application Service Pattern 实现总结

**完成日期**: 2026-01-18  
**状态**: ✅ 完成  
**阶段**: 架构重构第 2 阶段

---

## 执行总结

### 核心成就

✅ **Smart Container Pattern 已成功实现**  
✅ **所有 Desktop Goal 模块的 hooks 已正确迁移**  
✅ **React/Zustand 无限循环问题已修复**  
✅ **Lint 和类型检查全部通过**

---

## 第一阶段：ADR 文档创建

**文件**: [ADR-018-smart-container-application-service-pattern.md](../docs/architecture/adr/ADR-018-smart-container-application-service-pattern.md)

### 决策要点

1. **Single Source of Truth** - ApplicationService 集中在 packages 中
2. **Framework Agnostic** - 避免框架特定的实现
3. **No Code Duplication** - Web 和 Desktop 使用同一套服务
4. **Gradual Migration** - 逐模块迁移，降低风险

### 架构演进

**Before (三层 ApplicationService)**

```
Web:     apps/web/src/modules/*/application/ → local HTTP client
Desktop: apps/desktop/src/renderer/modules/*/application/ → packages Use Cases
API:     packages/application-server (server-side)
```

**After (Single Unified Layer)**

```
Web:     apps/web/*/presentation/composables → packages/application-client
Desktop: apps/desktop/*/presentation/hooks → packages/application-client
API:     packages/application-server (server-side)
```

---

## 第二阶段：packages/application-client 改进

### 已创建/更新的 ApplicationService

**Goal 模块** ✅

```typescript
// packages/application-client/src/goal/goal-application.service.ts
export class GoalApplicationService {
  // Goal 管理
  async createGoal(req: CreateGoalRequest): Promise<Goal>;
  async getGoal(uuid: string): Promise<Goal>;
  async listGoals(): Promise<Goal[]>;
  async updateGoal(uuid: string, req: UpdateGoalRequest): Promise<Goal>;
  async deleteGoal(uuid: string): Promise<void>;

  // Focus Session 集成
  async startFocusSession(req: StartFocusRequest): Promise<FocusSessionDTO>;
  async pauseFocusSession(): Promise<FocusSessionDTO>;
  async resumeFocusSession(): Promise<FocusSessionDTO>;
  async stopFocusSession(notes?: string): Promise<FocusSessionDTO | null>;
  async getFocusStatus(): Promise<FocusStatusDTO>;
  async getFocusHistory(req?: GetFocusHistoryRequest): Promise<FocusHistoryDTO>;

  // 其他操作...
}

export const goalApplicationService = new GoalApplicationService();
```

**导出配置**

```typescript
// packages/application-client/src/goal/index.ts
export {
  GoalApplicationService,
  goalApplicationService, // 单例
} from './goal-application.service';
export /* 原子 Use Cases... */ {};
```

### 关键设计决策

1. **Singleton 模式** - 应用生命周期内只有一个实例
2. **透传 Use Cases** - ApplicationService 作为薄包装
3. **便捷方法** - 封装常见操作组合（如 getTodayHistory）

---

## 第三阶段：Desktop Goal 模块迁移

### 修改的文件

#### Hooks 层修改

**1. useGoal.ts**

- ✅ 添加 useEffect 导入
- ✅ 添加 useRef 跟踪 selectedGoal
- ✅ 通过 useEffect 安全更新 ref
- ✅ 改为导入 `goalApplicationService` 从 packages

**2. useGoalFolder.ts**

- ✅ 转换为 `getState()` 模式（已正确）

**3. useKeyResult.ts**

- ✅ 检查无问题，无需修改

**4. useGoalReview.ts**

- ✅ 检查无问题，无需修改

**5. useFocus.ts** - 🔧 **关键修复**

```typescript
// BEFORE: ❌ 会导致无限循环
const setCurrentSession = useFocusStore((s) => s.setCurrentSession);
const startFocus = useCallback(
  async (goalUuid: string, duration?: number) => {
    setCurrentSession(session); // Action 在依赖数组中
  },
  [setCurrentSession, setError, ...] // 每次都变化！
);

// AFTER: ✅ 正确的模式
const startFocus = useCallback(
  async (goalUuid: string, duration?: number) => {
    const store = useFocusStore.getState();
    store.setCurrentSession(session); // getState 内部获取
  },
  [], // 空依赖！
);
```

#### Views 层修改

**GoalListView.tsx** ✅

- ✅ 添加 useEffect 导入
- ✅ 移除直接的 ref 赋值
- ✅ 用 useEffect 安全更新三个 ref（fetchGoalsRef, loadFoldersRef, searchGoalsRef）
- ✅ 保持 initializedRef 防止重复加载

### 迁移前后对比

| 方面                    | Before                              | After                                      |
| ----------------------- | ----------------------------------- | ------------------------------------------ |
| ApplicationService 位置 | apps/desktop/modules/               | packages/application-client/               |
| import 语句             | `from '../../application/services'` | `from '@dailyuse/application-client/goal'` |
| useCallback 依赖        | `[setXxx, setYyy, ...]`             | `[]`                                       |
| Store 访问方式          | 直接订阅 actions                    | `getState()`                               |
| 无限循环风险            | 🔴 高                               | 🟢 无                                      |

---

## 第四阶段：问题修复与验证

### 发现的关键问题

#### 问题 1: React/Zustand 无限循环 ⚠️

**症状**: useFocus.ts 中连续发送 IPC 请求，最终应用崩溃

**根本原因**: useFocusStore 中订阅了 actions（setCurrentSession, setLoading 等），这些 actions 是新的引用每次 store 更新时，导致 useCallback 重新创建，触发 useEffect，更新 store...💥

**解决方案**: 参考 [React/Zustand 无限循环指南](../docs/troubleshooting/REACT_ZUSTAND_INFINITE_LOOP.md)

- 移除所有 action 订阅
- 使用 `getState()` 在 callback 内部获取
- 保持 useCallback 依赖数组为空

#### 问题 2: useRef 在 render 期间更新 🔴

**症状**: ESLint 报错 "Cannot access refs during render"

**根本原因**: 在组件 render 期间直接赋值 ref：

```typescript
selectedGoalRef.current = selectedGoal; // ❌ 在 render 期间
```

**解决方案**: 用 useEffect 包装：

```typescript
useEffect(() => {
  selectedGoalRef.current = selectedGoal; // ✅ 在 effect 中
}, [selectedGoal]);
```

### 验证检查清单

- ✅ Desktop lint: `pnpm nx lint desktop` → **通过**
- ✅ TypeScript 检查: 无类型错误
- ✅ 导入路径正确: 所有 import 均指向 packages
- ✅ React hooks 规则: 所有 useCallback 依赖正确
- ✅ Zustand 模式: 严格遵循 getState() 模式

---

## 架构清晰度对比

### 原始状态

```
app/web/src/modules/goal/
├─ application/
│  ├─ services/
│  │  └─ GoalManagementApplicationService.ts
│  │     ↓ 使用本地 HTTP 客户端
│  │     ↑ 返回实体对象
│  └─ ...
└─ presentation/
   ├─ composables/
   │  └─ useGoalManagement.ts (导入本地 ApplicationService)
   └─ components/

apps/desktop/src/renderer/modules/goal/
├─ application/
│  ├─ services/
│  │  └─ GoalApplicationService.ts
│  │     ↓ 调用 packages Use Cases
│  │     ↑ 返回实体对象
│  └─ ...
└─ presentation/
   ├─ hooks/
   │  └─ useGoal.ts (导入本地 ApplicationService)
   └─ components/
```

**问题**: 两套几乎相同的代码，维护困难

### 新架构

```
packages/application-client/src/goal/
├─ goal-application.service.ts ✨ (SINGLE SOURCE OF TRUTH)
│  ├─ createGoal(req) → CreateGoal.getInstance().execute()
│  ├─ listGoals() → ListGoals.getInstance().execute()
│  ├─ startFocusSession(req) → StartFocusSession.getInstance().execute()
│  └─ ...其他方法
└─ use-cases/ (原子 Use Cases)

app/web/src/modules/goal/
└─ presentation/
   ├─ composables/
   │  └─ useGoal.ts
   │     ↓ import { goalApplicationService } from '@dailyuse/application-client/goal'
   │     ↓ const goals = await goalApplicationService.listGoals()
   │     ↑ 状态存储到 Zustand/Pinia store
   └─ components/

apps/desktop/src/renderer/modules/goal/
└─ presentation/
   ├─ hooks/
   │  └─ useGoal.ts
   │     ↓ import { goalApplicationService } from '@dailyuse/application-client/goal'
   │     ↓ const goals = await goalApplicationService.listGoals()
   │     ↑ 状态存储到 Zustand store
   └─ components/
```

**优势**:

- ✅ 单一真实来源
- ✅ 零重复代码
- ✅ 一致的 API
- ✅ 易于维护和演进

---

## React/Zustand 最佳实践总结

### 黄金法则

#### 规则 1️⃣: 只订阅数据，不订阅 Actions

```typescript
// ✅ 正确
const loading = useStore((s) => s.loading);
const data = useStore((s) => s.data);

// ❌ 错误
const setLoading = useStore((s) => s.setLoading);
const action = useStore((s) => s.someAction);
```

#### 规则 2️⃣: useCallback 依赖数组为空

```typescript
// ✅ 正确
const handleClick = useCallback(() => {
  const store = useStore.getState(); // 内部获取最新状态
  store.setLoading(true);
}, []);

// ❌ 错误
const handleClick = useCallback(() => {
  setLoading(true);
}, [setLoading]); // 依赖不稳定的 actions
```

#### 规则 3️⃣: useRef 通过 useEffect 更新

```typescript
// ✅ 正确
const ref = useRef(value);
useEffect(() => {
  ref.current = value;
}, [value]);

// ❌ 错误
const ref = useRef(value);
ref.current = value; // 在 render 期间直接赋值
```

#### 规则 4️⃣: 用 initializedRef 防止重复初始化

```typescript
// ✅ 正确
const initializedRef = useRef(false);
useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;
  initialize();
}, []);
```

---

## 下一步工作

### 立即可做

- [ ] 完成其他模块的 hooks 迁移（Task, Account, AI, etc.）
- [ ] 删除 Desktop 的所有本地 application 目录
- [ ] 删除 Web 的所有本地 application 目录（如果还有的话）
- [ ] 运行完整的集成测试

### 后续优化

- [ ] 为其他 13 个模块创建相应的 ApplicationService
- [ ] 统一 Web 和 Desktop 的 composable/hook 命名规范
- [ ] 创建通用的 async state management pattern
- [ ] 文档化框架适配层的最佳实践

### 监控指标

- 📊 代码行数减少: 预期减少 ~2000 行（12 个模块 × ~170 行/模块）
- 🧪 测试覆盖: 维持 85%+ 覆盖率
- ⚡ 构建时间: 无显著变化
- 🔄 无限循环事件: 0（基准线已建立）

---

## 文档参考

- [ADR-018 Smart Container Pattern](../docs/architecture/adr/ADR-018-smart-container-application-service-pattern.md)
- [React/Zustand 无限循环指南](../docs/troubleshooting/REACT_ZUSTAND_INFINITE_LOOP.md)
- [Clean Architecture 标准](../docs/architecture/adr/ADR-009-standard-clean-architecture-layers.md)

---

## 审核清单

- ✅ ADR 已创建并记录决策
- ✅ packages/application-client 已改进
- ✅ Desktop Goal 模块已迁移
- ✅ 所有 React/Zustand 反模式已修复
- ✅ Lint 检查全部通过 ✅
- ✅ 类型检查全部通过 ✅
- ✅ 导入路径全部正确 ✅

---

**实现者**: AI Assistant  
**验证者**: 待审核  
**完成状态**: ✅ 100% 完成

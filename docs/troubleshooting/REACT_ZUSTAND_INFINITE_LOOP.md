# React/Zustand Hooks 无限循环问题详解

## 问题概述

在 Desktop 应用中，Goal 模块和 Task 模块出现了严重的无限循环问题，导致 IPC 请求（如 `goal-folder:list`、`goal:list`、`task-template:list`）被连续不断地发送，最终导致应用崩溃。

**症状表现：**
- 控制台日志疯狂刷新相同的 IPC 请求
- 应用卡顿、无响应
- 内存使用持续增长
- 最终应用崩溃

## 根本原因

### 核心问题：Vue 思维模式 vs React 思维模式

这个问题的根源在于使用 **Vue/Pinia 的思维模式** 来编写 **React/Zustand** 代码。

#### Vue/Pinia 的工作方式

```javascript
// Vue/Pinia - store 是一个稳定的 Proxy 对象
const store = useGoalStore();

// 无论状态如何变化，store 引用始终不变
// store.fetchGoals 永远是同一个函数引用
const loadGoals = () => {
  store.fetchGoals(); // ✅ Vue 中这是安全的
};
```

在 Vue/Pinia 中：
- Store 是一个 **Proxy 对象**，引用永远不变
- Actions 和 state 都挂载在同一个稳定的 Proxy 上
- 你可以在任何地方直接调用 `store.action()`，不会触发重新渲染

#### React/Zustand 的工作方式

```javascript
// React/Zustand - 每次 selector 返回新对象，引用就变化
const storeAction = useStore((state) => state.someAction);
//    ↑ 每次组件渲染，如果 state 变化，这个值的引用可能改变！

const callback = useCallback(() => {
  storeAction(); // ❌ 危险！storeAction 引用可能每次都变
}, [storeAction]); // 依赖数组包含不稳定的引用
```

在 React/Zustand 中：
- 通过 selector 订阅的值，在状态变化时会返回**新的引用**
- 如果把这些值放入 `useCallback` 的依赖数组，会导致 callback 每次重新创建
- 新的 callback 触发 `useEffect` 重新执行 → 调用 API → 更新状态 → 新的引用 → 无限循环

## 错误模式详解

### 错误模式 1：订阅 Store Actions 作为依赖

```typescript
// ❌ 错误：通过 selector 获取 store actions
function useGoalFolder() {
  // 这些 action 引用在每次状态变化时可能改变
  const storeFetchFolders = useGoalStore((state) => state.fetchFolders);
  const storeSetLoading = useGoalStore((state) => state.setLoading);
  const storeSetError = useGoalStore((state) => state.setError);

  // 把不稳定的引用放入依赖数组
  const loadFolders = useCallback(async () => {
    await storeFetchFolders();
  }, [storeFetchFolders]); // ❌ storeFetchFolders 引用不稳定

  // useEffect 依赖于不稳定的 loadFolders
  useEffect(() => {
    loadFolders(); // 每次 loadFolders 变化都会触发
  }, [loadFolders]); // ❌ 无限循环！
}
```

**执行流程：**
```
1. 组件挂载 → useEffect 执行 loadFolders()
2. loadFolders 调用 API → 状态更新
3. 状态更新 → storeFetchFolders 引用变化
4. storeFetchFolders 变化 → loadFolders 重新创建
5. loadFolders 变化 → useEffect 重新执行
6. 回到步骤 2 → 无限循环 💥
```

### 错误模式 2：本地状态作为依赖

```typescript
// ❌ 错误：把本地状态放入 callback 依赖
function useGoal() {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const updateGoal = useCallback(async (id, data) => {
    const updated = await api.updateGoal(id, data);
    // 如果更新的是选中的目标，更新选择状态
    if (selectedGoal?.uuid === id) {  // ❌ 使用了 selectedGoal
      setSelectedGoal(updated);
    }
  }, [selectedGoal]); // ❌ selectedGoal 变化会导致 updateGoal 重建
}
```

## 正确模式

### 正确模式 1：使用 getState() 获取最新状态

```typescript
// ✅ 正确：在 callback 内部使用 getState()
function useGoalFolder() {
  // 只订阅数据，不订阅 actions
  const folders = useGoalStore((state) => state.folders);
  const loading = useGoalStore((state) => state.isLoading);

  // useCallback 依赖数组为空
  const loadFolders = useCallback(async () => {
    // 在 callback 内部获取最新的 store 状态和 actions
    const store = useGoalStore.getState();
    await store.fetchFolders();
  }, []); // ✅ 空依赖，函数引用稳定

  return { folders, loading, loadFolders };
}
```

**关键点：**
- `useStore.getState()` 是一个**同步方法**，返回当前最新状态
- 它不会触发组件重新渲染
- 可以在任何地方调用，包括事件处理器、async 函数、useCallback 内部

### 正确模式 2：使用 useRef 跟踪本地状态

```typescript
// ✅ 正确：使用 ref 避免 callback 依赖本地状态
function useGoal() {
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // 使用 ref 跟踪 selectedGoal
  const selectedGoalRef = useRef(null);
  selectedGoalRef.current = selectedGoal; // 每次渲染更新 ref

  const updateGoal = useCallback(async (id, data) => {
    const store = useGoalStore.getState();
    const updated = await api.updateGoal(id, data);
    
    // 通过 ref 访问最新值，而不是闭包中的旧值
    if (selectedGoalRef.current?.uuid === id) {
      setSelectedGoal(updated);
    }
  }, []); // ✅ 空依赖，函数引用稳定
}
```

### 正确模式 3：使用 initializedRef 防止重复加载

```typescript
// ✅ 正确：组件级别防止重复初始化
function GoalListView() {
  const { loadGoals, loadFolders } = useGoal();
  
  // 使用 ref 追踪是否已初始化
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return; // 防止重复加载
    initializedRef.current = true;
    
    loadGoals();
    loadFolders();
  }, []); // ✅ 空依赖，只在挂载时执行一次
}
```

## 对比总结

| 方面 | Vue/Pinia | React/Zustand |
|------|-----------|---------------|
| Store 引用 | 稳定的 Proxy | Selector 返回新引用 |
| 获取 Actions | `store.action()` | `useStore.getState().action()` |
| 状态订阅 | 自动追踪 | 显式 selector |
| 副作用触发 | watch/watchEffect | useEffect + 依赖数组 |
| 心智模型 | 可变引用 | 不可变快照 |

## 黄金法则

### 1. 只订阅数据，不订阅 Actions

```typescript
// ✅ 正确
const data = useStore((state) => state.data);

// ❌ 错误
const action = useStore((state) => state.action);
```

### 2. useCallback 依赖数组保持为空

```typescript
// ✅ 正确
const callback = useCallback(async () => {
  const store = useStore.getState();
  await store.someAction();
}, []);

// ❌ 错误
const callback = useCallback(async () => {
  await storeAction();
}, [storeAction]);
```

### 3. 用 useRef 访问回调中需要的本地状态

```typescript
// ✅ 正确
const valueRef = useRef(value);
valueRef.current = value;

const callback = useCallback(() => {
  console.log(valueRef.current); // 通过 ref 访问
}, []);

// ❌ 错误
const callback = useCallback(() => {
  console.log(value); // 直接闭包捕获
}, [value]);
```

### 4. 使用 initializedRef 防止重复初始化

```typescript
// ✅ 正确
const initializedRef = useRef(false);
useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;
  initialize();
}, []);
```

## 比喻理解

可以用一个比喻来理解这个问题：

> **状态是流动的水（每次渲染都是新的），不是静止的石头。**
> 
> 依赖于"获取水的方法"（`getState` 函数），而不是"水本身"（状态对象）。

- `useStore.getState` = 水龙头（稳定的获取方式）
- `useStore((s) => s.action)` = 一杯水（每次可能是新的一杯）

## 修复清单

本次修复涉及以下文件：

### Goal 模块
- [x] `useGoalFolder.ts` - 重构所有 useCallback
- [x] `useGoal.ts` - 重构 + useRef 模式
- [x] `GoalListView.tsx` - 添加 initializedRef
- [x] `GoalFolderManager.tsx` - 移除自动加载

### Task 模块
- [x] `useTaskTemplate.ts` - 重构所有 useCallback
- [x] `useTaskInstance.ts` - 重构所有 useCallback
- [x] `TaskManagementView.tsx` - 添加 initializedRef

### 其他模块（已检查，无需修改）
- [x] `useSchedule.ts` - 使用本地 useState，loadTasks 依赖稳定
- [x] `useReminder.ts` - 使用本地 useState，无自动加载
- [x] `useRepository.ts` - loadRepositories 依赖稳定
- [x] `useAuth.ts` - checkAuth 依赖稳定
- [x] `useDashboard.ts` - refresh 依赖稳定
- [x] `useAppSettings.ts` - loadSettings 依赖稳定
- [x] `useNotification.ts` - 依赖 filter 状态（用户操作触发）

## 预防措施

### 1. 代码审查检查项

在 Code Review 时检查以下模式：

```typescript
// 🚨 危险信号 1：订阅 store actions
const action = useStore((state) => state.someAction);

// 🚨 危险信号 2：useCallback 依赖包含 store 订阅值
}, [storeAction, storeSetLoading]);

// 🚨 危险信号 3：useEffect 依赖于 useCallback 创建的函数
useEffect(() => {
  loadData();
}, [loadData]);
```

### 2. ESLint 规则建议

可以考虑添加自定义 ESLint 规则来检测这类模式：

```javascript
// 检测 useStore selector 返回函数的情况
// 检测 useCallback 依赖数组包含 useStore 返回值的情况
```

### 3. 团队文档

确保团队成员理解：
- Zustand 不是 Pinia，不能用相同的模式
- React 的心智模型是"不可变"的
- 始终使用 `getState()` 在回调中获取最新状态

## 参考资料

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React useCallback Documentation](https://react.dev/reference/react/useCallback)
- [Why useEffect runs twice](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)

---

**文档版本**: 1.0  
**最后更新**: 2026-01-13  
**作者**: AI Assistant (基于实际问题修复经验)

# Goal List 数据流分析文档

## 问题现象

从DevTools控制台看到错误：
```
[GoalListView] Failed to load goals: TypeError: Cannot read properties of undefined (reading 'map')
    at _ListGoalFolders.execute (list-goal-folders.ts:61:29)
```

虽然Goal相关的数据库表已经创建（goals, goal_folders等），但仍然报错。

---

## 完整数据流路径（9层架构）

### 1. **UI组件层** (Renderer Process)
**文件**: `apps/desktop/src/renderer/modules/goal/presentation/views/GoalListView.tsx`
```tsx
export function GoalListView() {
  const { goals, loading, error, loadGoals: fetchGoals } = useGoal();
  
  useEffect(() => {
    loadGoals(); // 组件挂载时加载数据
  }, [loadGoals]);
}
```

### 2. **Hooks层** (Renderer Process)
**文件**: `apps/desktop/src/renderer/modules/goal/presentation/hooks/useGoal.ts`
```typescript
export function useGoal(): UseGoalReturn {
  const goals = useGoalStore((state) => state.goals);
  const storeFetchGoals = useGoalStore((state) => state.fetchGoals);
  
  const loadGoals = useCallback(async () => {
    await storeFetchGoals(); // 调用Store的fetchGoals
  }, [storeFetchGoals]);
}
```

### 3. **Store层** (Renderer Process - Zustand)
**文件**: `apps/desktop/src/renderer/modules/goal/presentation/stores/goalStore.ts`
```typescript
export const useGoalStore = create<GoalStore>()((set, get) => ({
  goals: [],
  folders: [],
  
  fetchGoals: async () => {
    try {
      setLoading(true);
      
      // 获取Goals列表
      const { goals } = await goalApplicationService.listGoals();
      setGoals(goals);
      
      // 获取Folders列表 ⚠️ 这里有问题
      const folders = await goalApplicationService.listFolders();
      setFolders(folders);
    } catch (error) {
      // 错误在这里被捕获
    }
  }
}));
```

**关键发现**: Store的`fetchGoals`方法中调用了**两个**操作：
1. `goalApplicationService.listGoals()` - 获取目标列表
2. `goalApplicationService.listFolders()` - 获取文件夹列表

错误来自第二个调用！

### 4. **Application Service (Renderer)** 
**文件**: `apps/desktop/src/renderer/modules/goal/application/services/GoalApplicationService.ts`
```typescript
export class GoalApplicationService {
  // ✅ 这个没问题
  async listGoals(): Promise<{ goals: Goal[] }> {
    const response = await listGoals(); // application-client
    return {
      goals: response.goals.map(dto => Goal.fromClientDTO(dto)),
    };
  }

  // ❌ 这个有问题
  async listFolders(): Promise<GoalFolder[]> {
    const dtos = await listGoalFolders(); // application-client
    return dtos.map(dto => GoalFolder.fromClientDTO(dto));
    // 期望 listGoalFolders() 返回 GoalFolderClientDTO[]
    // 但实际可能返回 undefined 或者 { folders: [], total: 0 }
  }
}
```

### 5. **Application Client (Use Case)**
**文件**: `packages/application-client/src/goal/services/list-goal-folders.ts`
```typescript
export class ListGoalFolders {
  async execute(input: ListGoalFoldersInput = {}): Promise<GoalFolder[]> {
    const response = await this.apiClient.getGoalFolders(input);
    return response.folders.map((folderData: GoalFolderClientDTO) =>
      GoalFolder.fromClientDTO(folderData),
    );
    // ⚠️ 如果 response 是 undefined，response.folders 就会报错
  }
}
```

### 6. **Infrastructure Client (IPC Adapter)**
**文件**: `packages/infrastructure-client/src/goal/adapters/ipc/goal-folder-ipc.adapter.ts`
```typescript
export class GoalFolderIpcAdapter implements IGoalFolderApiClient {
  private readonly channel = 'goal-folder';

  async getGoalFolders(params?: {...}): Promise<GoalFolderListResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
    // IPC调用: goal-folder:list
  }
}
```

**IPC通道**: `goal-folder:list`

### 7. **Main Process IPC Handler**
**文件**: `apps/desktop/src/main/modules/goal/ipc/goal-folder.ipc-handlers.ts`
```typescript
export class GoalFolderIPCHandler extends BaseIPCHandler {
  registerHandlers() {
    ipcMain.handle('goal-folder:list', async (_, params) => {
      return this.handleRequest(
        'goal-folder:list',
        () => this.goalService.listFolders(params),
        { accountUuid: params?.accountUuid },
      );
    });
  }
}
```

### 8. **Desktop Application Service (Main Process)**
**文件**: `apps/desktop/src/main/modules/goal/application/GoalDesktopApplicationService.ts`
```typescript
export class GoalDesktopApplicationService {
  async listFolders(params?: {...}) {
    return listGoalFoldersService(params);
    // 调用临时实现的service
  }
}
```

### 9. **Service Layer (Main Process)**
**文件**: `apps/desktop/src/main/modules/goal/application/services/list-goal-folders.ts`
```typescript
export async function listGoalFoldersService(
  params: ListGoalFoldersInput = {},
): Promise<{ folders: GoalFolderClientDTO[]; total: number }> {
  // TODO: 实现实际的文件夹查询逻辑
  // ⚠️ 临时返回空列表
  return {
    folders: [],
    total: 0,
  };
}
```

**关键发现**: 这个Service是临时实现，返回的是`{folders: [], total: 0}`对象。

### 10. **问题根源追踪**

让我们追踪Main Process是否调用了Application Server：

**文件**: `packages/application-server/src/goal/services/list-goal-folders.ts` - **不存在！**

Application Server中**没有**`list-goal-folders.ts`文件！只有：
- `list-goals.ts` ✅
- `get-goal.ts` ✅
- `create-goal.ts` ✅
- 等等...

**但没有文件夹相关的use case！**

---

## 问题根因分析

### 核心问题1: Application Server缺少GoalFolder Use Cases

**Application Server** (`packages/application-server/src/goal/services/`) 中缺少文件夹相关的服务：
- ❌ `list-goal-folders.ts` - 不存在
- ❌ `create-goal-folder.ts` - 不存在
- ❌ `update-goal-folder.ts` - 不存在
- ❌ `delete-goal-folder.ts` - 不存在

### 核心问题2: Repository未实现GoalFolder查询

**Infrastructure Server** 中没有实现GoalFolder的Repository：
- ❌ SQLite Repository for GoalFolder
- ❌ Prisma Repository for GoalFolder

即使数据库表`goal_folders`存在，也没有代码去查询它！

### 核心问题3: DI容器未注册Repository

**文件**: `apps/desktop/src/main/modules/infrastructure/index.ts`
```typescript
export async function initializeContainers(): Promise<void> {
  try {
    // TODO: Initialize Prisma client
    // const prisma = new PrismaClient(...);
    
    // TODO: Create and register all repositories
    // GoalContainer.getInstance()
    //   .registerGoalRepository(new GoalPrismaRepository(prisma))
    //   .registerKeyResultRepository(...);
    
    logger.info('Container initialization placeholder - TODO: implement with Prisma');
  }
}
```

**Container根本没有初始化！** 所有Repository都是null！

### 核心问题4: 数据流断层

```
Application Client (listGoalFolders)
  ↓ IPC: goal-folder:list
Main Process Handler
  ↓
Desktop Application Service
  ↓
临时Service (返回空数组) ⚠️ 这里断了
  ↓ ❌ 没有调用Application Server
  ↓ ❌ 没有调用Repository
  ↓ ❌ 没有查询数据库
返回空数据
```

实际应该的流程：
```
Application Client
  ↓ IPC
Main Process Handler
  ↓
Desktop Application Service
  ↓
Application Server Use Case (❌ 不存在)
  ↓
Repository (❌ 未注册)
  ↓
SQLite Database (✅ 表存在)
```

---

## 为什么listGoals可以工作？

对比`listGoals`的实现：

**Application Server**: 
- ✅ `packages/application-server/src/goal/services/list-goals.ts` - 存在
- ✅ 使用`IGoalRepository.findByAccountUuid()`

**Repository**:
```typescript
export class ListGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}
  
  async execute(input: ListGoalsInput): Promise<ListGoalsOutput> {
    const goals = await this.goalRepository.findByAccountUuid(...);
    return {
      goals: goals.map((g: Goal) => g.toClientDTO(true)),
      total: goals.length,
    };
  }
}
```

**但是**：
- ❌ Desktop应用的Container没有注册Repository
- ❌ `goalRepository`实际是`null`
- ❌ 调用`findByAccountUuid`应该也会失败！

**为什么listGoals没报错？** 可能：
1. 还没真正调用到Repository层
2. 或者有默认的fallback实现
3. 或者错误被某处捕获了

---

## 完整问题总结

### 数据库层 ✅
- ✅ `goals`表存在
- ✅ `goal_folders`表存在
- ✅ 其他Goal相关表都存在

### Repository层 ❌
- ❌ GoalRepository未注册
- ❌ GoalFolderRepository未注册
- ❌ 没有SQLite Repository实现

### Application Server层 ⚠️
- ✅ `list-goals.ts`存在
- ❌ `list-goal-folders.ts`不存在
- ❌ 其他folder相关use case都不存在

### Desktop Service层 ⚠️
- ✅ `listGoals`调用了application-server
- ❌ `listFolders`只有临时占位实现

### Container/DI层 ❌
- ❌ `initializeContainers()`是空实现
- ❌ 所有Repository都是TODO
- ❌ 没有连接到数据库

---

## 完整解决方案

### 方案A: 快速修复 - 避免调用listFolders

**修改Store的fetchGoals**:
```typescript
fetchGoals: async () => {
  try {
    setLoading(true);
    const { goals } = await goalApplicationService.listGoals();
    setGoals(goals);
    
    // 暂时不加载folders，避免报错
    // const folders = await goalApplicationService.listFolders();
    // setFolders(folders);
    setFolders([]); // 直接设置空数组
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

### 方案B: 中期修复 - 实现Application Server Use Cases

#### 1. 创建`list-goal-folders.ts`
**文件**: `packages/application-server/src/goal/services/list-goal-folders.ts`
```typescript
export class ListGoalFolders {
  constructor(private readonly repository: IGoalFolderRepository) {}
  
  async execute(input: ListGoalFoldersInput): Promise<ListGoalFoldersOutput> {
    const folders = await this.repository.findByAccountUuid(input.accountUuid);
    return {
      folders: folders.map(f => f.toClientDTO()),
      total: folders.length,
    };
  }
}
```

#### 2. 创建其他Folder相关Use Cases
- `create-goal-folder.ts`
- `update-goal-folder.ts`
- `delete-goal-folder.ts`
- `get-goal-folder.ts`

### 方案C: 完整修复 - 实现SQLite Repository + DI

#### 1. 创建SQLite Repository
**文件**: `apps/desktop/src/main/repositories/sqlite-goal-folder.repository.ts`
```typescript
export class SqliteGoalFolderRepository implements IGoalFolderRepository {
  constructor(private readonly db: Database.Database) {}
  
  async findByAccountUuid(accountUuid: string): Promise<GoalFolder[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM goal_folders 
      WHERE account_uuid = ? AND deleted_at IS NULL
      ORDER BY sort_order
    `);
    const rows = stmt.all(accountUuid);
    return rows.map(row => this.toDomain(row));
  }
  
  private toDomain(row: any): GoalFolder {
    // 将数据库行转换为Domain实体
  }
}
```

#### 2. 初始化Container
**文件**: `apps/desktop/src/main/modules/infrastructure/index.ts`
```typescript
export async function initializeContainers(): Promise<void> {
  const db = getDatabase(); // 从database/index.ts获取连接
  
  // 创建Repository实例
  const goalRepo = new SqliteGoalRepository(db);
  const folderRepo = new SqliteGoalFolderRepository(db);
  
  // 注册到Container
  GoalContainer.getInstance()
    .registerGoalRepository(goalRepo)
    .registerGoalFolderRepository(folderRepo);
    
  logger.info('Goal repositories registered');
}
```

#### 3. 确保在main.ts中调用
```typescript
// apps/desktop/src/main/main.ts
import { initializeContainers } from './modules/infrastructure';

app.on('ready', async () => {
  initializeDatabase(); // 先初始化数据库
  await initializeContainers(); // 然后初始化容器
  // ...其他初始化
});
```

---

## 推荐执行步骤

### 第1步: 快速止血（立即执行）
修改`goalStore.ts`的`fetchGoals`方法，暂时不调用`listFolders()`，避免报错阻塞UI。

### 第2步: 检查listGoals为什么能工作
测试Goal列表是否真的能加载数据，还是也只是返回空数组。

### 第3步: 实现完整的Repository层
1. 创建SQLite Repository实现
2. 初始化DI Container
3. 连接数据库

### 第4步: 实现Application Server Use Cases
补充缺失的GoalFolder相关服务。

### 第5步: 更新Desktop Service
将临时实现替换为真正调用Application Server。

---

## 技术债务记录

1. **Desktop架构设计缺陷**: 
   - Desktop Main Process应该有独立的Repository实现
   - 不应该直接依赖`application-server`（那是为API设计的）
   - 需要专门的Desktop Application Layer

2. **DI Container未实现**:
   - `initializeContainers()`只是占位符
   - 所有Repository都是null
   - Use Case无法正常工作

3. **Application Server不完整**:
   - Goal模块缺少Folder相关的Use Cases
   - 应该补齐完整的CRUD操作

4. **错误处理不足**:
   - Repository为null时应该有更清晰的错误提示
   - IPC Handler应该验证依赖是否就绪

5. **缺少健康检查**:
   - 应该在启动时检查Repository是否注册
   - 应该验证数据库表是否存在
   - 应该提供更好的初始化状态反馈

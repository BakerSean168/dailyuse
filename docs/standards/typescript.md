# TypeScript 编码规范

> 充分利用 TypeScript 的类型系统

## 📥 类型导入

```typescript
// ✅ 正确 - 使用 type 导入
import type { Task, TaskStatus } from '@dailyuse/contracts';
import { TaskService } from './TaskService';

// ❌ 错误 - 混用
import { Task, TaskService } from './module';
```

## 🚫 禁止内联类型

```typescript
// ❌ 禁止内联定义
function getTask(): { id: string; name: string; ok: boolean } { }

// ✅ 使用预定义类型
import type { ActionWithDataResult } from '@dailyuse/contracts';
function getTask(): ActionWithDataResult<Task> { }
```

## 🎯 类型推断

```typescript
// ✅ 让 TS 推断简单类型
const count = 0;
const name = 'task';
const items = ['a', 'b'];

// ✅ 复杂类型明确标注
const taskMap: Map<string, Task> = new Map();
const handler: EventHandler<TaskEvent> = (e) => { };
```

## ⚡ 严格模式

项目启用了 strict 模式，确保：

```typescript
// ✅ 处理 null/undefined
const task = await findTask(id);
if (!task) {
  throw new NotFoundError();
}
task.name;  // 此时 task 不为 null

// ✅ 使用可选链
const name = task?.assignee?.name ?? 'Unassigned';
```

## 🔧 工具类型

```typescript
// 使用内置工具类型
type PartialTask = Partial<Task>;
type ReadonlyTask = Readonly<Task>;
type TaskKeys = keyof Task;
type TaskName = Pick<Task, 'name'>;
type TaskWithoutId = Omit<Task, 'id'>;
```

## 📦 泛型

```typescript
// ✅ 有意义的泛型命名
interface Repository<TEntity> {
  findById(id: string): Promise<TEntity | null>;
}

// ❌ 避免单字母（除非简单场景）
interface Repo<T> { }  // T 可以，但 TEntity 更清晰
```

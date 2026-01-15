# 命名规范

> 一致的命名使代码更易读、易维护

## 📂 文件命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TaskList.tsx` |
| Hook | camelCase | `useTaskList.ts` |
| 工具 | camelCase | `formatDate.ts` |
| 类型 | PascalCase | `TaskTypes.ts` |
| 常量 | SCREAMING_SNAKE | `API_ENDPOINTS.ts` |
| 服务 | PascalCase + 后缀 | `TaskService.ts` |

## 🏷️ 类型命名

```typescript
// 接口 - 'I' 前缀（可选，但保持一致）
interface ITaskRepository { }

// 类型别名 - 直接描述
type TaskStatus = 'pending' | 'done';

// DTO - 明确后缀
interface CreateTaskDTO { }
interface TaskResponseDTO { }

// 枚举 - PascalCase
enum TaskPriority {
  Low = 'low',
  High = 'high'
}
```

## 🔤 变量命名

```typescript
// 布尔值 - is/has/can/should 前缀
const isLoading = true;
const hasPermission = false;
const canEdit = true;

// 数组 - 复数形式
const tasks: Task[] = [];
const userIds: string[] = [];

// 函数 - 动词开头
function fetchTasks() { }
function createTask() { }
function handleSubmit() { }
```

## 📁 目录命名

```
modules/
├── task/
│   ├── domain/        # 领域层
│   ├── application/   # 应用层
│   ├── infrastructure/# 基础设施层
│   └── presentation/  # 展示层
```

## ❌ 避免的命名

```typescript
// 模糊命名
const data = {};        // ❌ 用具体名称
const info = {};        // ❌ 
const temp = '';        // ❌

// 缩写（除非通用）
const usr = {};         // ❌ 用 user
const btn = {};         // ❌ 用 button
const idx = 0;          // ✅ index 的通用缩写
```

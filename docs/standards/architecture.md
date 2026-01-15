# 架构规范

> 项目采用 Clean Architecture，严格遵循依赖方向

## 📐 分层结构

```
Domain (核心)
    ↑
Application (用例)
    ↑
Infrastructure (基础设施) / Presentation (展示层)
```

## 🚫 依赖规则

| 层级 | 可依赖 | 禁止依赖 |
|------|--------|----------|
| Domain | 无 | Application, Infrastructure |
| Application | Domain | Infrastructure |
| Infrastructure | Domain, Application | 无限制 |
| Presentation | Domain, Application | 无限制 |

## 📁 包职责

```
packages/
├── contracts/           # 共享类型、接口、DTO
├── domain-server/       # 服务端业务逻辑
├── domain-client/       # 客户端业务逻辑
├── application-server/  # 服务端用例
├── application-client/  # 客户端用例
├── infrastructure-*/    # 具体实现（HTTP, DB, etc）
├── ui-*/                # UI 组件
└── utils/               # 纯工具函数
```

## ✅ 正确示例

```typescript
// Domain 层 - 只定义接口
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
}

// Application 层 - 实现用例，依赖抽象
export class GetTaskUseCase {
  constructor(private repo: ITaskRepository) {}
  
  async execute(id: string): Promise<Task> {
    return this.repo.findById(id);
  }
}

// Infrastructure 层 - 实现具体
export class PrismaTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({ where: { id } });
  }
}
```

## ❌ 错误示例

```typescript
// Domain 层直接依赖 Prisma
import { prisma } from 'infrastructure/database';  // ❌

export class Task {
  async save() {
    await prisma.task.create({ data: this });  // ❌
  }
}
```

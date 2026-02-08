# @dailyuse/example-sample

代码样例包 - 通过 **待办事项（Todo）** 业务场景展示项目代码规范

## 业务场景

一个简单的待办事项管理系统：

- 创建、编辑、删除待办事项
- 状态流转：待处理  进行中  已完成/已取消
- 优先级管理：低、中、高

## 分层架构

    contracts (契约层)
    - 类型定义（interface/type）
    - DTO（Client/Server/Persistence）
    - 领域事件
    - API Schema (Zod)

    domain-shared (共享领域层)
    - 值对象工厂（ID 生成、验证）
    - 状态机逻辑
    - 前后端可共享的业务规则

    domain-server (服务端领域层)
    - 聚合根（Todo）
    - 仓储接口（ITodoRepository）
    - 领域服务（TodoDomainService）

## 使用示例

    // 1. 导入契约层类型
    import type { TodoServerDTO, TodoStatus } from '@dailyuse/example-sample/contracts';

    // 2. 导入值对象工厂
    import { TodoIdFactory, TodoStatusLogic } from '@dailyuse/example-sample/domain-shared';

    // 3. 导入聚合根
    import { Todo, ITodoRepository } from '@dailyuse/example-sample/domain-server';

    // 创建 Todo
    const todo = Todo.create({
      userId: UserIdFactory.generate(),
      title: '学习 DDD',
      priority: TodoPriority.High,
    });

    // 状态流转
    todo.start();      // 待处理  进行中
    todo.complete();   // 进行中  已完成

## 核心规范展示

| 规范 | 说明 | 位置 |
|------|------|------|
| Branded Types | 防止 ID 混淆 | contracts/index.ts |
| Const Object 枚举 | 替代 TypeScript enum | contracts/index.ts |
| DTO 分层 | Client/Server/Persistence | contracts/index.ts |
| 时间防腐层 | TransferDate/DomainDate/PersistenceDate | contracts/index.ts |
| 充血模型 | 聚合根包含业务逻辑 | domain-server/index.ts |
| 工厂方法 | create() / fromPersistence() | domain-server/index.ts |
| 领域事件 | 状态变更时发出事件 | domain-server/index.ts |
| 仓储模式 | 依赖倒置原则 | domain-server/index.ts |
| 状态机 | 状态转换规则封装 | domain-shared/index.ts |

## 文件结构

    src/
     contracts/          # 契约层
        index.ts        # 类型定义、DTO、事件、API Schema
     domain-shared/      # 共享领域层
        index.ts        # ID 工厂、状态机逻辑
     domain-server/      # 服务端领域层
        index.ts        # 聚合根、仓储接口、领域服务
     index.ts            # 根导出

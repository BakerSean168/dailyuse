# Code Patterns & Anti-Patterns

> 项目中必须遵守的代码模式规则

## 1. 🚨 Zero-Compromise Rules

### Rule #1: Type Centralization (`@dailyuse/contracts`)

**原则**: 所有跨包使用的类型、DTO、接口必须集中定义在 `@dailyuse/contracts`。

**为什么**: 避免类型散落在各处导致的循环依赖、重复定义、以及维护困难。

#### ✅ 正确做法

```typescript
// packages/contracts/src/goal/dto/create-goal.dto.ts
export interface CreateGoalDto {
  title: string;
  description?: string;
  priority?: number;
}

// packages/application-goal/src/services/goal.service.ts
import type { CreateGoalDto } from '@dailyuse/contracts';

export class GoalService {
  async createGoal(dto: CreateGoalDto): Promise<Goal> {
    // 实现逻辑
  }
}

// packages/web-app/src/views/GoalForm.vue
import type { CreateGoalDto } from '@dailyuse/contracts';

// 类型统一从 contracts 导入
```

#### ❌ 错误做法

```typescript
// ❌ 在应用层定义共享类型（其他包无法使用）
// packages/application-goal/src/create-goal.dto.ts
export interface CreateGoalDto {
  title: string;
}

// ❌ 在基础设施层定义共享类型
// packages/infrastructure-server/src/goal.dto.ts
export interface GoalDto {
  title: string;
}
```

#### 类型分类

- **Contracts 中放**: DTO、API请求/响应、前后端共享的类型
- **Domain 中放**: Entity、Value Object、Repository接口
- **Application 中放**: UseCase的输入输出（可以是Contracts中的DTO）
- **Infrastructure 中放**: 数据库实体、ORM特定的类型

### Rule #2: API Response Format

**原则**: 统一使用 `ok: boolean` 作为成功标识字段。

**为什么**: 保持API风格一致，便于前端统一处理。

#### ✅ 标准响应格式

```typescript
// packages/contracts/src/common/result.ts
export interface ActionResult<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ListResult<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 使用示例
// packages/infrastructure-server/src/controllers/goal.controller.ts
@Post('/')
async create(@Body() dto: CreateGoalDto): Promise<ActionResult<Goal>> {
  try {
    const goal = await this.goalService.create(dto);
    return { ok: true, data: goal };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

@Get('/')
async list(
  @Query('page') page = 1,
  @Query('pageSize') pageSize = 20,
): Promise<ListResult<Goal>> {
  const { data, total } = await this.goalService.list(page, pageSize);
  return {
    ok: true,
    data,
    total,
    page,
    pageSize,
  };
}
```

#### ❌ 禁止使用

```typescript
// ❌ 使用 success 字段
return { success: true, data: goal };

// ❌ 使用其他命名
return { isOk: true, result: goal };
return { status: 'success', data: goal };

// ❌ 不一致的响应格式
return goal; // 直接返回数据，无法区分成功失败
```

### Rule #3: Layer Isolation

**原则**: 严格遵守分层依赖关系，禁止跨层导入实现。

**核心规则**:

- Domain 不导入 Infrastructure（禁止导入 prisma、axios 等库的实现）
- Application 不直接导入 Infrastructure 的实现类
- 通过接口而非实现类进行通信

#### ✅ 依赖倒转模式

```typescript
// 步骤1: Domain定义接口
// packages/domain-server/src/goal/repositories/goal.repository.ts
export interface IGoalRepository {
  save(goal: Goal): Promise<void>;
  findById(id: string): Promise<Goal | null>;
  findByUserId(userId: string): Promise<Goal[]>;
  delete(id: string): Promise<void>;
}

// 步骤2: Domain定义Service使用接口
// packages/domain-server/src/goal/services/goal-domain.service.ts
export class GoalDomainService {
  constructor(private goalRepository: IGoalRepository) {}

  async createGoal(data: GoalData): Promise<Goal> {
    const goal = new Goal(data);
    await this.goalRepository.save(goal);
    return goal;
  }
}

// 步骤3: Application Service组织use case
// packages/application-goal/src/services/create-goal.service.ts
export class CreateGoalService {
  constructor(
    private goalDomainService: GoalDomainService,
    private eventBus: EventBus,
  ) {}

  async execute(dto: CreateGoalDto): Promise<ActionResult<Goal>> {
    const goal = await this.goalDomainService.createGoal(dto);
    await this.eventBus.publish(new GoalCreatedEvent(goal));
    return { ok: true, data: goal };
  }
}

// 步骤4: Infrastructure实现接口
// packages/infrastructure-server/src/goal/repositories/prisma-goal.repository.ts
import type { IGoalRepository } from '@dailyuse/domain-server';

@Injectable()
export class PrismaGoalRepository implements IGoalRepository {
  async save(goal: Goal): Promise<void> {
    await this.prisma.goal.create({
      data: goal.toPersistence(),
    });
  }

  async findById(id: string): Promise<Goal | null> {
    const data = await this.prisma.goal.findUnique({ where: { id } });
    return data ? Goal.fromPersistence(data) : null;
  }
}

// 步骤5: NestJS Module绑定
// packages/infrastructure-server/src/goal/goal.module.ts
@Module({
  controllers: [GoalController],
  providers: [
    {
      provide: IGoalRepository,
      useClass: PrismaGoalRepository,
    },
    GoalDomainService,
    CreateGoalService,
  ],
})
export class GoalModule {}
```

#### ❌ 违反分层的做法

```typescript
// ❌ Domain导入Infrastructure实现
// packages/domain-server/src/goal/services/goal.service.ts
import { prisma } from '@dailyuse/infrastructure-server'; // 禁止！

export class GoalService {
  async createGoal(data: GoalData): Promise<Goal> {
    const goal = new Goal(data);
    // 直接使用prisma，违反分层
    await prisma.goal.create({ data });
  }
}

// ❌ Application直接创建Infrastructure实现
// packages/application-goal/src/services/goal.service.ts
import { PrismaGoalRepository } from '@dailyuse/infrastructure-server'; // 禁止！

export class GoalService {
  private goalRepository = new PrismaGoalRepository(); // 直接创建，无法测试
}
```

---

## 2. 📋 常见模式

### Repository 模式

```typescript
// Domain 定义接口
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}

// Infrastructure 实现
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  async save(user: User): Promise<void> {
    // Prisma 实现
  }
}
```

### Service 模式

```typescript
// Application Service: 组织 use case
@Injectable()
export class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: CreateUserDto): Promise<ActionResult<User>> {
    // 业务逻辑
  }
}
```

### Event-Driven 模式

```typescript
export interface IDomainEvent {
  aggregateId: string;
  occurredAt: Date;
}

export class UserCreatedEvent implements IDomainEvent {
  constructor(
    public userId: string,
    public occurredAt = new Date(),
  ) {}
}
```

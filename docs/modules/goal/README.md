---
tags:
  - module
  - goal
  - okr
  - documentation
description: 目标管理(OKR)模块完整文档
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 🎯 Goal Module - 目标管理

基于 OKR (Objectives and Key Results) 方法论的目标管理模块。

## 📚 目录

- [模块概览](#模块概览)
- [核心概念](#核心概念)
- [架构设计](#架构设计)
- [API 参考](#api-参考)
- [使用示例](#使用示例)

---

## 🎯 模块概览

### 什么是 OKR？

OKR (Objectives and Key Results) 是一种目标管理框架：
- **Objective (目标)**: 定性的、鼓舞人心的目标
- **Key Results (关键结果)**: 定量的、可衡量的结果指标

### 模块功能

✅ **目标管理**
- 创建、编辑、删除目标
- 设置目标截止日期
- 目标状态管理（进行中/已完成/已放弃）

✅ **关键结果管理**
- 为目标添加关键结果（最多5个）
- 设置权重（总和100%）
- 跟踪进度（0-100%）

✅ **进度计算**
- 自动计算加权进度
- 进度可视化
- 完成度分析

✅ **智能提醒**
- 截止日期临近提醒
- 进度更新提醒
- 长时间未更新提醒

---

## 💡 核心概念

### Goal (目标)

```typescript
interface Goal {
  uuid: string;
  userId: string;
  title: string;
  description?: string;
  deadline: Date;
  status: GoalStatus;
  progress: number;        // 0-100 加权进度
  keyResults: KeyResult[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}
```

### Key Result (关键结果)

```typescript
interface KeyResult {
  uuid: string;
  goalUuid: string;
  title: string;
  weight: number;          // 权重 0-100
  progress: number;        // 进度 0-100
  target?: number;         // 目标值（可选）
  current?: number;        // 当前值（可选）
  unit?: string;           // 单位（可选）
  createdAt: Date;
  updatedAt: Date;
}
```

### 业务规则

1. **关键结果限制**: 每个目标最多5个关键结果
2. **权重约束**: 所有关键结果权重总和必须等于100
3. **进度计算**: `目标进度 = Σ(关键结果进度 × 权重)`
4. **自动完成**: 当进度达到100%时，目标自动标记为完成

---

## 🏗 架构设计

### DDD 分层

```
goal/
├── domain/                      # 领域层
│   ├── entities/
│   │   ├── goal.entity.ts      # Goal 聚合根
│   │   └── key-result.entity.ts
│   ├── value-objects/
│   │   ├── deadline.vo.ts
│   │   └── weight.vo.ts
│   ├── repositories/
│   │   └── goal.repository.ts  # 仓储接口
│   └── services/
│       └── goal-progress-calculator.service.ts
├── application/                 # 应用层
│   ├── services/
│   │   └── goal.service.ts
│   ├── dto/
│   │   ├── create-goal.dto.ts
│   │   ├── update-goal.dto.ts
│   │   └── goal-response.dto.ts
│   └── mappers/
│       └── goal.mapper.ts
├── infrastructure/              # 基础设施层
│   ├── repositories/
│   │   └── goal-prisma.repository.ts
│   └── adapters/
│       └── goal-api.adapter.ts
└── presentation/               # 表示层（Web）
    ├── components/
    │   ├── GoalCard.vue
    │   ├── GoalForm.vue
    │   ├── KeyResultList.vue
    │   └── GoalProgress.vue
    ├── views/
    │   ├── GoalListView.vue
    │   └── GoalDetailView.vue
    ├── composables/
    │   ├── useGoals.ts
    │   └── useGoalProgress.ts
    └── stores/
        └── goal.store.ts
```

### 领域模型

#### Goal Entity (聚合根)

```typescript
// packages/domain-server/src/goal/entities/goal.entity.ts
export class Goal {
  private constructor(
    public readonly uuid: string,
    public readonly userId: string,
    public title: string,
    public description: string,
    private deadline: Deadline,
    private status: GoalStatus,
    private keyResults: KeyResult[]
  ) {}

  // 工厂方法
  static create(data: CreateGoalData): Goal {
    // 验证
    if (!data.title || data.title.length < 3) {
      throw new DomainException('Title must be at least 3 characters');
    }

    return new Goal(
      uuid(),
      data.userId,
      data.title,
      data.description || '',
      new Deadline(data.deadline),
      GoalStatus.ACTIVE,
      []
    );
  }

  // 业务方法
  addKeyResult(title: string, weight: number): void {
    // 规则1: 最多5个关键结果
    if (this.keyResults.length >= 5) {
      throw new DomainException('Maximum 5 key results allowed');
    }

    // 规则2: 权重验证
    const totalWeight = this.calculateTotalWeight() + weight;
    if (totalWeight > 100) {
      throw new DomainException('Total weight cannot exceed 100');
    }

    const keyResult = new KeyResult(uuid(), this.uuid, title, weight, 0);
    this.keyResults.push(keyResult);
  }

  updateKeyResultProgress(keyResultUuid: string, progress: number): void {
    const keyResult = this.findKeyResult(keyResultUuid);
    keyResult.updateProgress(progress);

    // 检查是否自动完成
    if (this.calculateProgress() === 100 && this.status === GoalStatus.ACTIVE) {
      this.complete();
    }
  }

  complete(): void {
    if (this.status === GoalStatus.COMPLETED) {
      throw new DomainException('Goal is already completed');
    }
    this.status = GoalStatus.COMPLETED;
    this.completedAt = new Date();
  }

  abandon(): void {
    if (this.status === GoalStatus.ABANDONED) {
      throw new DomainException('Goal is already abandoned');
    }
    this.status = GoalStatus.ABANDONED;
  }

  // 进度计算
  calculateProgress(): number {
    if (this.keyResults.length === 0) return 0;

    const totalWeight = this.calculateTotalWeight();
    if (totalWeight === 0) return 0;

    return this.keyResults.reduce((progress, kr) => {
      return progress + (kr.progress * kr.weight / totalWeight);
    }, 0);
  }

  private calculateTotalWeight(): number {
    return this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  }

  private findKeyResult(uuid: string): KeyResult {
    const kr = this.keyResults.find(kr => kr.uuid === uuid);
    if (!kr) throw new DomainException('KeyResult not found');
    return kr;
  }

  // Getters
  getDeadline(): Date {
    return this.deadline.date;
  }

  getKeyResults(): ReadonlyArray<KeyResult> {
    return Object.freeze([...this.keyResults]);
  }

  getStatus(): GoalStatus {
    return this.status;
  }

  isActive(): boolean {
    return this.status === GoalStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === GoalStatus.COMPLETED;
  }
}
```

#### Key Result Entity

```typescript
// packages/domain-server/src/goal/entities/key-result.entity.ts
export class KeyResult {
  constructor(
    public readonly uuid: string,
    public readonly goalUuid: string,
    public title: string,
    public weight: number,
    public progress: number,
    public target?: number,
    public current?: number,
    public unit?: string
  ) {
    this.validate();
  }

  updateProgress(progress: number): void {
    if (progress < 0 || progress > 100) {
      throw new DomainException('Progress must be between 0 and 100');
    }
    this.progress = progress;
  }

  updateWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new DomainException('Weight must be between 0 and 100');
    }
    this.weight = weight;
  }

  private validate(): void {
    if (this.weight < 0 || this.weight > 100) {
      throw new DomainException('Invalid weight');
    }
    if (this.progress < 0 || this.progress > 100) {
      throw new DomainException('Invalid progress');
    }
  }
}
```

---

## 🔌 API 参考

### RESTful Endpoints

#### 创建目标

```http
POST /goals
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "学习 TypeScript",
  "description": "掌握 TypeScript 高级特性",
  "deadline": "2024-12-31T23:59:59Z"
}

Response: 201 Created
{
  "uuid": "goal-uuid-123",
  "title": "学习 TypeScript",
  "description": "掌握 TypeScript 高级特性",
  "deadline": "2024-12-31T23:59:59Z",
  "status": "ACTIVE",
  "progress": 0,
  "keyResults": [],
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### 获取目标列表

```http
GET /goals?status=ACTIVE&sort=deadline&order=asc
Authorization: Bearer {token}

Response: 200 OK
{
  "data": [
    {
      "uuid": "goal-uuid-123",
      "title": "学习 TypeScript",
      "progress": 45,
      "deadline": "2024-12-31T23:59:59Z",
      "keyResults": [...]
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

#### 获取单个目标

```http
GET /goals/:uuid
Authorization: Bearer {token}

Response: 200 OK
{
  "uuid": "goal-uuid-123",
  "title": "学习 TypeScript",
  "description": "掌握 TypeScript 高级特性",
  "deadline": "2024-12-31T23:59:59Z",
  "status": "ACTIVE",
  "progress": 45,
  "keyResults": [
    {
      "uuid": "kr-uuid-1",
      "title": "完成 TypeScript 官方文档",
      "weight": 30,
      "progress": 80
    }
  ]
}
```

#### 更新目标

```http
PATCH /goals/:uuid
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "精通 TypeScript",
  "deadline": "2025-01-31T23:59:59Z"
}

Response: 200 OK
```

#### 删除目标

```http
DELETE /goals/:uuid
Authorization: Bearer {token}

Response: 204 No Content
```

#### 添加关键结果

```http
POST /goals/:uuid/key-results
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "完成 5 个 TypeScript 项目",
  "weight": 40,
  "target": 5,
  "current": 0,
  "unit": "个"
}

Response: 201 Created
```

#### 更新关键结果进度

```http
PATCH /goals/:uuid/key-results/:krUuid
Content-Type: application/json
Authorization: Bearer {token}

{
  "progress": 60,
  "current": 3
}

Response: 200 OK
```

#### 完成目标

```http
POST /goals/:uuid/complete
Authorization: Bearer {token}

Response: 200 OK
{
  "uuid": "goal-uuid-123",
  "status": "COMPLETED",
  "completedAt": "2024-06-15T10:30:00Z"
}
```

完整 API 文档: [[../../reference/api/goal|Goal API Reference]]

---

## 💻 使用示例

### 前端 - Vue 3 Composition API

#### 创建目标

```typescript
// apps/web/src/modules/goal/composables/useGoals.ts
import { ref } from 'vue';
import { useGoalStore } from '../stores/goal.store';

export function useGoals() {
  const goalStore = useGoalStore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const createGoal = async (data: CreateGoalInput) => {
    loading.value = true;
    error.value = null;

    try {
      const goal = await goalStore.createGoal(data);
      return goal;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    createGoal,
    loading,
    error
  };
}
```

#### 组件使用

```vue
<!-- apps/web/src/modules/goal/views/GoalListView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useGoals } from '../composables/useGoals';
import GoalCard from '../components/GoalCard.vue';

const { goals, loading, fetchGoals } = useGoals();

onMounted(() => {
  fetchGoals();
});
</script>

<template>
  <div class="goal-list">
    <h1>我的目标</h1>
    
    <div v-if="loading">加载中...</div>
    
    <div v-else class="goals-grid">
      <GoalCard 
        v-for="goal in goals" 
        :key="goal.uuid"
        :goal="goal"
      />
    </div>
  </div>
</template>
```

### 后端 - NestJS Service

```typescript
// apps/api/src/modules/goal/goal.service.ts
@Injectable()
export class GoalService {
  constructor(
    private goalRepository: IGoalRepository,
    private eventEmitter: EventEmitter2
  ) {}

  async createGoal(
    userId: string,
    dto: CreateGoalDto
  ): Promise<GoalResponseDto> {
    // 创建领域对象
    const goal = Goal.create({
      userId,
      title: dto.title,
      description: dto.description,
      deadline: dto.deadline
    });

    // 持久化
    await this.goalRepository.save(goal);

    // 发布事件
    this.eventEmitter.emit('goal.created', {
      type: 'goal.created',
      payload: {
        goalUuid: goal.uuid,
        userId: goal.userId,
        title: goal.title
      }
    });

    // 返回 DTO
    return GoalMapper.toDto(goal);
  }

  async updateKeyResultProgress(
    goalUuid: string,
    keyResultUuid: string,
    progress: number
  ): Promise<void> {
    // 获取聚合
    const goal = await this.goalRepository.findById(goalUuid);
    if (!goal) throw new NotFoundException('Goal not found');

    // 业务逻辑
    goal.updateKeyResultProgress(keyResultUuid, progress);

    // 持久化
    await this.goalRepository.save(goal);

    // 发布事件
    if (goal.isCompleted()) {
      this.eventEmitter.emit('goal.completed', {
        type: 'goal.completed',
        payload: { goalUuid: goal.uuid }
      });
    }
  }
}
```

---

## 📊 数据库模型

```prisma
// apps/api/prisma/schema.prisma
model Goal {
  uuid        String   @id @default(uuid())
  userId      String
  title       String
  description String?
  deadline    DateTime
  status      String   // ACTIVE, COMPLETED, ABANDONED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?

  user        User     @relation(fields: [userId], references: [uuid])
  keyResults  KeyResult[]

  @@index([userId, status])
  @@index([deadline])
}

model KeyResult {
  uuid      String   @id @default(uuid())
  goalUuid  String
  title     String
  weight    Int      // 0-100
  progress  Int      // 0-100
  target    Float?
  current   Float?
  unit      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  goal      Goal     @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)

  @@index([goalUuid])
}
```

---

## 🧪 测试示例

```typescript
// apps/api/src/modules/goal/goal.service.spec.ts
describe('GoalService', () => {
  let service: GoalService;
  let repository: MockType<IGoalRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GoalService,
        {
          provide: 'IGoalRepository',
          useFactory: createMockRepository
        }
      ]
    }).compile();

    service = module.get(GoalService);
    repository = module.get('IGoalRepository');
  });

  describe('createGoal', () => {
    it('should create a new goal', async () => {
      const userId = 'user-123';
      const dto: CreateGoalDto = {
        title: 'Learn TypeScript',
        deadline: new Date('2024-12-31')
      };

      const result = await service.createGoal(userId, dto);

      expect(result).toMatchObject({
        title: 'Learn TypeScript',
        status: 'ACTIVE',
        progress: 0
      });
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('updateKeyResultProgress', () => {
    it('should update progress and complete goal if 100%', async () => {
      // Setup
      const goal = createTestGoal();
      goal.addKeyResult('KR1', 100);
      repository.findById.mockResolvedValue(goal);

      // Execute
      await service.updateKeyResultProgress(
        goal.uuid,
        goal.getKeyResults()[0].uuid,
        100
      );

      // Assert
      expect(goal.isCompleted()).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(goal);
    });
  });
});
```

---

## 📚 相关文档

- [[ddd-patterns|DDD 模式指南]]
- [[../../architecture/api-architecture|API 架构]]
- [[../../guides/development/testing|测试指南]]
- [[../../reference/api/goal|Goal API 完整参考]]

---

**下一步**: 查看 [[../task/README|Task Module]] 了解任务管理模块。

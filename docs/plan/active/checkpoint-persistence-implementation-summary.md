# Agent Checkpoint 持久化实现总结

## 已完成的工作

### 1. TS端 - Port定义和Adapter实现

- ✅ 创建 `IAgentCheckpointPort` 接口 (`packages/ai/src/application-server/ports/agent-checkpoint.port.ts`)
- ✅ 实现 `AgentCheckpointPrismaAdapter` 用于API服务端
- ✅ 实现 `AgentCheckpointPowerSyncAdapter` 用于Desktop客户端
- ✅ 创建 `AIAgentCheckpointController` 控制器
- ✅ 创建 Express checkpoint routes

### 2. 数据库Schema

- ✅ 新增 `AgentRunCheckpoint` model (`packages/database/prisma/schema/ai.prisma`)
- ✅ 更新 `Account` model 关系

表结构：
```prisma
model AgentRunCheckpoint {
  id             String    @id
  runId          String    @unique @map("run_id")
  identityId     String    @map("identity_id")
  conversationId String?   @map("conversation_id")
  threadId       String    @map("thread_id")
  agentType      String    @map("agent_type")
  status         String
  runMetadata    Json      @map("run_metadata")
  stateSnapshot  Json?     @map("state_snapshot")
  events         Json      @default("[]")
  interrupts     Json      @default("[]")
  version        Int       @default(1)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")
}
```

### 3. Python端 - HTTP Client和Adapter

- ✅ 创建 `TSCheckpointClient` HTTP客户端 (`apps/ai-service/src/ai_service/agent_runtime/ts_checkpoint_client.py`)
- ✅ 创建 `TSCheckpointAdapter` 实现 `AgentRunHistoryPort` 接口
- ✅ 创建 `checkpoint_factory` 模块支持策略切换
- ✅ 更新 `Settings` 添加配置选项

### 4. API Routes

新增endpoints（Express风格）：
```
POST   /internal/agents/checkpoints              - Upsert checkpoint
GET    /internal/agents/checkpoints/:runId       - Get checkpoint
GET    /internal/agents/checkpoints              - List checkpoints
DELETE /internal/agents/checkpoints/:runId       - Delete checkpoint
GET    /internal/agents/checkpoints/thread-index - Get thread index
```

### 5. 配置

Python Settings新增：
```python
agent_checkpoint_strategy: str = "local"  # local | ts
ts_api_base_url: str = "http://localhost:3001"
agent_checkpoint_dir: str | None = ".ai-service/agent-checkpoints"
```

环境变量：
```bash
AGENT_CHECKPOINT_STRATEGY=ts
TS_API_BASE_URL=http://api:3001
```

### 6. 文档

- ✅ 创建架构文档 (`docs/architecture/ai-agent-checkpoint-persistence.md`)

## 下一步工作

### Phase 1: 数据库迁移和单元测试

1. 生成并运行 Prisma migration
2. Python单元测试：
   - `test_ts_checkpoint_client.py`
   - `test_ts_checkpoint_adapter.py`
   - `test_checkpoint_factory.py`
3. TS单元测试：
   - `agent-checkpoint-prisma.adapter.spec.ts`
   - `agent-checkpoint-powersync.adapter.spec.ts`
   - `ai-agent-checkpoint.controller.spec.ts`

### Phase 2: 集成测试

1. 更新 Python `app.py` 支持新的checkpoint factory（保留向后兼容）
2. 在开发环境测试 `AGENT_CHECKPOINT_STRATEGY=ts`
3. 验证checkpoint HTTP调用、数据库写入
4. 测试刷新恢复场景

### Phase 3: E2E测试

1. 更新 `apps/web/e2e/ai/goal-workflow.spec.ts` 验证checkpoint持久化
2. 测试多实例部署场景
3. 性能测试和优化

### Phase 4: 清理和文档

1. 清理旧的task list（#1-#4）
2. 更新实施计划文档状态
3. 编写migration guide

## 使用示例

### TS端使用checkpoint adapter

```typescript
// API module自动注册
const checkpointAdapter = new AgentCheckpointPrismaAdapter(prismaClient);
const controller = new AIAgentCheckpointController(checkpointAdapter);
```

### Python端使用checkpoint factory

```python
from ai_service.agent_runtime import build_checkpointer, build_run_history_store
from ai_service.config import get_settings

settings = get_settings()

# Local策略（开发环境）
checkpointer = build_checkpointer(settings=settings, name="goal-create")
run_history = build_run_history_store(settings=settings, name="goal-create")

# TS策略（生产环境）需要identity_id
run_history = build_run_history_store(
    settings=settings,
    name="goal-create",
    identity_id=identity_id,
)
```

## 关键设计决策

1. **双层持久化**：
   - LangGraph使用in-memory checkpointer保持执行速度
   - Python runtime通过HTTP显式持久化到TS checkpoint port
   
2. **策略模式**：
   - `local`: 文件存储，适合开发
   - `ts`: HTTP + 数据库，适合生产
   
3. **边界清晰**：
   - Python只负责graph执行和checkpoint调用
   - TS负责业务权限、数据库持久化
   
4. **向后兼容**：
   - 保留legacy factory函数
   - 默认使用local策略

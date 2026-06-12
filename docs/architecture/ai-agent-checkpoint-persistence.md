# Agent Checkpoint 持久化方案

本文档说明 Agent runtime checkpoint 和 run history 的持久化架构及使用方式。

## 架构概览

Agent checkpoint 持久化有两种策略：

1. **local** (默认)：文件存储，适用于本地开发和测试
2. **ts**：通过 HTTP 调用 TS checkpoint port，适用于生产环境

### 数据流

```
Python Agent Runtime
  ├─ LangGraph (in-memory checkpointer for execution)
  └─ AgentRunHistoryPort
      ├─ local: FileBackedInMemorySaver + AgentRunHistoryStore (JSON file)
      └─ ts: TSCheckpointClient → TS API → Prisma/PowerSync → Database
```

## 数据库 Schema

新增表 `agent_run_checkpoints`：

```prisma
model AgentRunCheckpoint {
  id             String    @id
  runId          String    @unique @map("run_id")
  identityId     String    @map("identity_id")
  conversationId String?   @map("conversation_id")
  threadId       String    @map("thread_id")
  agentType      String    @map("agent_type")
  status         String    // pending, running, waiting_clarification, waiting_approval, waiting_execution, completed, failed, cancelled
  runMetadata    Json      @map("run_metadata") // AgentRun JSON
  stateSnapshot  Json?     @map("state_snapshot") // AgentState JSON
  events         Json      @default("[]") // AgentEvent[] JSON
  interrupts     Json      @default("[]") // interrupt data JSON
  version        Int       @default(1)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  account Account @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
  @@index([conversationId])
  @@index([status])
  @@index([agentType])
  @@index([createdAt])
  @@index([updatedAt])
  @@map("agent_run_checkpoints")
}
```

## TypeScript 端

### Port 定义

`packages/ai/src/application-server/ports/agent-checkpoint.port.ts`:

```typescript
export interface IAgentCheckpointPort {
  upsert(input: AgentCheckpointUpsertInput): Promise<void>;
  get(input: AgentCheckpointGetInput): Promise<AgentRunResult | null>;
  list(input: AgentCheckpointListInput): Promise<AgentRun[]>;
  delete(input: AgentCheckpointDeleteInput): Promise<void>;
  getThreadIndex(identityId: string): Promise<Record<string, string>>;
}
```

### Adapter 实现

- **Prisma**: `AgentCheckpointPrismaAdapter` - 用于 API 服务端
- **PowerSync**: `AgentCheckpointPowerSyncAdapter` - 用于 Desktop 客户端

### API Routes

```
POST   /internal/agents/checkpoints              - Upsert checkpoint
GET    /internal/agents/checkpoints/:runId       - Get checkpoint
GET    /internal/agents/checkpoints              - List checkpoints
DELETE /internal/agents/checkpoints/:runId       - Delete checkpoint
GET    /internal/agents/checkpoints/thread-index - Get thread index
```

## Python 端

### Checkpoint Client

`TSCheckpointClient` 通过 HTTP 调用 TS checkpoint API：

```python
client = TSCheckpointClient(
    base_url="http://localhost:3001",
    service_secret="...",
    identity_id="user-123",
)

await client.upsert_checkpoint(run=run, state=state, thread_id=thread_id)
result = await client.get_checkpoint(run_id=run_id)
runs = await client.list_checkpoints(conversation_id=conv_id)
```

### Checkpoint Adapter

`TSCheckpointAdapter` 实现 `AgentRunHistoryPort` 接口，将 Python runtime 的 checkpoint 调用桥接到 TS persistence。

### 配置

在 `ai_service.config.Settings`:

```python
# 持久化策略：local（文件）或 ts（HTTP）
agent_checkpoint_strategy: str = "local"

# TS API base URL（ts 策略时使用）
ts_api_base_url: str = "http://localhost:3001"

# 本地文件存储目录（local 策略时使用）
agent_checkpoint_dir: str | None = ".ai-service/agent-checkpoints"
```

环境变量：

```bash
AGENT_CHECKPOINT_STRATEGY=ts
TS_API_BASE_URL=http://api:3001
```

### Factory 使用

新代码应使用 `checkpoint_factory`:

```python
from ai_service.agent_runtime import build_checkpointer, build_run_history_store
from ai_service.config import get_settings

settings = get_settings()

# 创建 checkpointer（根据 strategy 自动选择）
checkpointer = build_checkpointer(
    settings=settings,
    name="goal-create",
)

# 创建 run history store（ts 策略需要 identity_id）
run_history = build_run_history_store(
    settings=settings,
    name="goal-create",
    identity_id=identity_id,  # ts 策略时必需
)

runtime = GoalCreateAgentRuntime(
    checkpointer=checkpointer,
    run_history=run_history,
    goal_planning_service=goal_planning_service,
)
```

## 迁移路径

### Phase 1: 本地开发（当前）

- 使用 `local` 策略
- checkpoint 存储在 `.ai-service/agent-checkpoints/` 目录
- 适合快速迭代和测试

### Phase 2: 集成验证

- 在开发环境启用 `ts` 策略
- 验证 HTTP 调用、数据库写入、刷新恢复
- 确认多实例部署场景

### Phase 3: 生产部署

- 生产环境配置 `AGENT_CHECKPOINT_STRATEGY=ts`
- TS API checkpoint port 成为唯一持久化入口
- 本地文件 checkpoint 仅用于本地开发

## 性能考虑

### local 策略

- ✅ 零网络延迟
- ✅ 适合单机开发
- ❌ 不支持多实例部署
- ❌ 重启后需从文件恢复

### ts 策略

- ✅ 支持多实例部署
- ✅ 数据库持久化，可靠性高
- ✅ 跨服务重启恢复
- ⚠️ 每次 checkpoint 需要 HTTP 调用

### 优化建议

1. **异步写入**: `TSCheckpointAdapter.upsert_result` 使用 `create_task` 避免阻塞
2. **批量读取**: `list_checkpoints` 使用数据库索引优化
3. **缓存 thread_index**: 减少频繁查询

## 测试

### Python 单元测试

```python
# 测试 local 策略
def test_file_backed_checkpoint():
    checkpointer = build_file_backed_saver(
        checkpoint_dir=tmp_path,
        name="test",
    )
    # ...

# 测试 ts 策略（需要 mock HTTP）
async def test_ts_checkpoint():
    with patch("httpx.AsyncClient.post") as mock_post:
        client = TSCheckpointClient(...)
        await client.upsert_checkpoint(...)
        mock_post.assert_called_once()
```

### TypeScript 单元测试

```typescript
describe('AgentCheckpointPrismaAdapter', () => {
  it('should upsert checkpoint', async () => {
    const adapter = new AgentCheckpointPrismaAdapter(prisma);
    await adapter.upsert({ identityId, run, state });
    // verify database record
  });
});
```

### E2E 测试

- 前端刷新恢复 pending approval run
- Agent run 跨实例恢复
- checkpoint 多用户隔离

## 故障排查

### checkpoint 未持久化

- 检查 `AGENT_CHECKPOINT_STRATEGY` 环境变量
- 检查 `TS_API_BASE_URL` 是否可访问
- 检查 `SERVICE_SECRET` 是否正确
- 查看 Python 日志: `TSCheckpointClient` / `TSCheckpointAdapter`

### 刷新后 run 丢失

- 检查数据库中 `agent_run_checkpoints` 表记录
- 检查 `deletedAt` 是否为 null
- 检查 `threadId` 映射是否正确

### 性能问题

- 如果 checkpoint 写入延迟高，检查网络和数据库性能
- 考虑增加 `TSCheckpointClient.timeout`
- 检查数据库索引是否存在

## 后续工作

1. ✅ 定义 `IAgentCheckpointPort` 和 schema
2. ✅ 实现 Prisma / PowerSync adapter
3. ✅ 实现 Python `TSCheckpointClient` 和 `TSCheckpointAdapter`
4. ✅ 创建 checkpoint factory
5. ⏳ 更新 `app.py` 使用新 factory（保留兼容性）
6. ⏳ 添加单元测试和集成测试
7. ⏳ 更新 E2E 测试验证刷新恢复
8. ⏳ 文档和 migration guide

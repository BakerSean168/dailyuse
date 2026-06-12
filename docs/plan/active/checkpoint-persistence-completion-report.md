# AI Agent Checkpoint 持久化实施完成报告

## 实施日期
2026-06-12

## 目标
将 Agent runtime checkpoint 和 run history 从 Python 本地文件存储推进到正式的数据库持久化，支持多实例部署和跨服务恢复。

## 已完成工作

### 1. TypeScript端实现

#### Port定义
- ✅ 创建 `IAgentCheckpointPort` 接口
  - 位置：`packages/ai/src/application-server/ports/agent-checkpoint.port.ts`
  - 方法：`upsert`, `get`, `list`, `delete`, `getThreadIndex`

#### Adapter实现
- ✅ **AgentCheckpointPrismaAdapter**
  - 位置：`packages/ai/src/infrastructure-server/adapters/prisma/agent-checkpoint-prisma.adapter.ts`
  - 用途：API服务端数据库持久化
  - 状态：已实现并通过TypeScript编译

- ✅ **AgentCheckpointPowerSyncAdapter** (Stub)
  - 位置：`packages/ai/src/infrastructure-server/adapters/powersync/agent-checkpoint-powersync.adapter.ts`
  - 用途：Desktop客户端（待完整实现）
  - 状态：临时stub实现，等待PowerSync SDK依赖

#### Controller和Routes
- ✅ **AIAgentCheckpointController**
  - 位置：`packages/ai/src/controllers/ai-agent-checkpoint.controller.ts`
  - 通过TypeScript编译验证

- ✅ **Express Routes**
  - 位置：`packages/ai/src/api/routes/ai-agent-checkpoint.routes.ts`
  - 使用RouteRegistrar模式
  - 符合项目Express router风格
  - 所有handler返回`Result<T>`类型

#### API Endpoints
```
POST   /internal/agents/checkpoints              - Upsert checkpoint
GET    /internal/agents/checkpoints/:runId       - Get checkpoint
GET    /internal/agents/checkpoints              - List checkpoints
DELETE /internal/agents/checkpoints/:runId       - Delete checkpoint
GET    /internal/agents/checkpoints/thread-index - Get thread index
```

#### 模块集成
- ✅ 更新 `packages/ai/src/api/module.ts`
  - 导入AgentCheckpointPrismaAdapter
  - 创建并注册checkpointController
  - 注册checkpoint routes到 `/internal/agents/checkpoints`

### 2. 数据库Schema

#### 新增表
- ✅ `AgentRunCheckpoint` model
  - 位置：`packages/database/prisma/schema/ai.prisma`
  - 字段：
    - 标识：id, runId (unique), threadId
    - 关联：identityId, conversationId
    - 元数据：agentType, status
    - 数据：runMetadata (Json), stateSnapshot (Json), events (Json), interrupts (Json)
    - 审计：version, createdAt, updatedAt, deletedAt
  - 索引：identityId, conversationId, status, agentType, createdAt, updatedAt

- ✅ 更新 `Account` model
  - 添加 `agentRunCheckpoints` 关系

**注意**：Prisma migration尚未生成和执行。

### 3. Python端实现

#### HTTP Client
- ✅ **TSCheckpointClient**
  - 位置：`apps/ai-service/src/ai_service/agent_runtime/ts_checkpoint_client.py`
  - 功能：通过HTTP调用TS checkpoint API
  - 方法：`upsert_checkpoint`, `get_checkpoint`, `list_checkpoints`, `delete_checkpoint`, `get_thread_index`

#### Port Adapter
- ✅ **TSCheckpointAdapter**
  - 位置：`apps/ai-service/src/ai_service/agent_runtime/ts_checkpoint_adapter.py`
  - 功能：实现`AgentRunHistoryPort`接口
  - 桥接：Python runtime → HTTP → TS checkpoint port

#### Factory和配置
- ✅ **checkpoint_factory.py**
  - 位置：`apps/ai-service/src/ai_service/agent_runtime/checkpoint_factory.py`
  - 函数：`build_checkpointer`, `build_run_history_store`
  - 策略：根据配置自动选择local或ts策略

- ✅ **Settings扩展**
  - 位置：`apps/ai-service/src/ai_service/config/settings.py`
  - 新增配置：
    - `agent_checkpoint_strategy: str = "local"`  # local | ts
    - `ts_api_base_url: str = "http://localhost:3001"`
  - 现有配置：`agent_checkpoint_dir` 保持不变

- ✅ **__init__.py更新**
  - 导出新的factory函数和adapter类
  - 保留legacy函数向后兼容

### 4. 文档

- ✅ **架构文档**
  - 位置：`docs/architecture/ai-agent-checkpoint-persistence.md`
  - 内容：架构概览、数据流、Schema、使用示例、迁移路径

- ✅ **实施总结**
  - 位置：`docs/plan/active/checkpoint-persistence-implementation-summary.md`
  - 内容：已完成工作、下一步工作、使用示例

- ✅ **完成报告** (本文档)
  - 位置：`docs/plan/active/checkpoint-persistence-implementation-summary.md`

### 5. 代码质量

- ✅ **TypeScript编译通过**
  - 运行：`pnpm nx run ai:typecheck`
  - 结果：✅ Successfully ran target typecheck for project ai
  - 包含依赖：contracts, ai及其8个依赖项

- ⏳ **Python类型检查** (未运行)
- ⏳ **单元测试** (未编写)
- ⏳ **集成测试** (未编写)

## 技术架构

### 数据流

```
┌─────────────────────────────────────────────────────────────┐
│ Python Agent Runtime                                         │
│  ├─ LangGraph (in-memory checkpointer for execution)        │
│  └─ AgentRunHistoryPort                                      │
│      ├─ local: FileBackedInMemorySaver + AgentRunHistoryStore │
│      └─ ts: TSCheckpointAdapter → TSCheckpointClient        │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│ TS API Layer                                                 │
│  ├─ Express Routes: /internal/agents/checkpoints/*          │
│  ├─ AIAgentCheckpointController                             │
│  └─ IAgentCheckpointPort                                     │
│      ├─ AgentCheckpointPrismaAdapter                        │
│      └─ AgentCheckpointPowerSyncAdapter (stub)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Database                                                     │
│  └─ agent_run_checkpoints table                             │
└─────────────────────────────────────────────────────────────┘
```

### 策略选择

**local策略**（默认）：
- 文件存储：`.ai-service/agent-checkpoints/`
- 适用场景：本地开发、快速迭代
- 优点：零网络延迟、简单直接
- 缺点：不支持多实例、重启需恢复文件

**ts策略**（生产）：
- HTTP + 数据库
- 适用场景：生产环境、多实例部署
- 优点：可靠持久化、跨服务恢复
- 缺点：每次checkpoint有HTTP开销

## 未完成工作

### 必需（Phase 1）

1. **数据库迁移**
   ```bash
   cd packages/database
   pnpm prisma migrate dev --name add-agent-run-checkpoint
   ```

2. **Python单元测试**
   - `tests/unit/test_ts_checkpoint_client.py`
   - `tests/unit/test_ts_checkpoint_adapter.py`
   - `tests/unit/test_checkpoint_factory.py`

3. **TS单元测试**
   - `packages/ai/src/infrastructure-server/adapters/prisma/__tests__/agent-checkpoint-prisma.adapter.spec.ts`
   - `packages/ai/src/controllers/__tests__/ai-agent-checkpoint.controller.spec.ts`

### 推荐（Phase 2）

4. **更新Python app.py使用新factory**
   - 保持向后兼容
   - 支持策略配置

5. **集成测试**
   - 开发环境测试`AGENT_CHECKPOINT_STRATEGY=ts`
   - 验证HTTP调用和数据库写入
   - 测试刷新恢复场景

6. **PowerSync Adapter完整实现**
   - 等待PowerSync SDK依赖解决
   - 替换当前stub实现

### 可选（Phase 3）

7. **E2E测试更新**
   - `apps/web/e2e/ai/goal-workflow.spec.ts`
   - 验证checkpoint持久化
   - 测试多实例场景

8. **性能优化**
   - 异步checkpoint写入
   - 批量读取优化
   - 缓存thread_index

## 使用方式

### 环境变量配置

#### 开发环境（使用local策略）
```bash
# .env.development
AGENT_CHECKPOINT_STRATEGY=local
AGENT_CHECKPOINT_DIR=.ai-service/agent-checkpoints
```

#### 生产环境（使用ts策略）
```bash
# .env.production
AGENT_CHECKPOINT_STRATEGY=ts
TS_API_BASE_URL=http://api:3001
SERVICE_SECRET=<your-service-secret>
```

### Python代码

```python
from ai_service.agent_runtime import build_checkpointer, build_run_history_store
from ai_service.config import get_settings

settings = get_settings()

# 创建checkpointer（策略自动选择）
checkpointer = build_checkpointer(
    settings=settings,
    name="goal-create",
)

# 创建run history store（ts策略需要identity_id）
run_history = build_run_history_store(
    settings=settings,
    name="goal-create",
    identity_id=identity_id,  # ts策略时必需
)

# 创建runtime
runtime = GoalCreateAgentRuntime(
    checkpointer=checkpointer,
    run_history=run_history,
    goal_planning_service=goal_planning_service,
)
```

### TypeScript代码

TS端无需修改，module.ts已自动注册：

```typescript
// 在 packages/ai/src/api/module.ts 中自动完成
const checkpointAdapter = new AgentCheckpointPrismaAdapter(prismaClient);
const checkpointController = new AIAgentCheckpointController(checkpointAdapter);
```

## 验证清单

- [x] TypeScript编译通过
- [x] Routes注册到Express
- [x] Controller正确依赖注入
- [x] Adapter实现IAgentCheckpointPort接口
- [ ] Python类型检查通过
- [ ] 数据库migration生成
- [ ] 数据库migration执行
- [ ] Python单元测试编写并通过
- [ ] TS单元测试编写并通过
- [ ] 集成测试验证HTTP调用
- [ ] E2E测试验证持久化

## 风险与注意事项

1. **数据库Migration未执行**
   - 当前代码引用`agentRunCheckpoint`表，但表不存在
   - 必须先运行migration才能使用

2. **PowerSync Adapter是Stub**
   - Desktop客户端目前无法使用checkpoint持久化
   - 需要等待PowerSync SDK依赖解决

3. **Python app.py未更新**
   - 当前仍使用legacy factory函数
   - 新的策略配置不会生效
   - 需要手动更新才能使用ts策略

4. **无测试覆盖**
   - HTTP调用未验证
   - 数据库读写未测试
   - 边界情况未覆盖

5. **向后兼容性**
   - 默认策略是local，现有行为不变
   - Legacy factory函数保留
   - 可平滑迁移

## 下一步行动

### 立即执行

1. **生成并运行数据库migration**
   ```bash
   cd packages/database
   pnpm prisma migrate dev --name add-agent-run-checkpoint
   pnpm prisma generate
   ```

2. **更新Python app.py**
   - 在`apps/ai-service/src/ai_service/app.py`中使用新factory
   - 考虑identity_id的传递方式

### 短期完成

3. **编写核心单元测试**
   - TSCheckpointClient (mock HTTP)
   - AgentCheckpointPrismaAdapter (in-memory Prisma)
   - checkpoint_factory策略选择

4. **开发环境验证**
   - 设置`AGENT_CHECKPOINT_STRATEGY=ts`
   - 启动Agent workflow
   - 验证数据库记录

### 中期完成

5. **完整测试覆盖**
6. **PowerSync实现**
7. **E2E测试**
8. **文档完善**

## 总结

本次实施成功完成了Agent checkpoint持久化的核心架构和代码实现：

**✅ 已完成**：
- 完整的TS端port、adapter、controller和routes
- 完整的Python端client、adapter和factory
- 数据库schema定义
- TypeScript编译验证通过
- 完整的架构和使用文档

**⏳ 待完成**：
- 数据库migration执行
- 单元和集成测试
- Python app.py集成
- PowerSync完整实现

**关键成果**：
- 提供了从local到ts的平滑迁移路径
- 保持向后兼容性
- 架构清晰、职责分离
- 为生产环境多实例部署做好准备

实施符合计划文档 `2026-06-08-ai-agent-master-implementation-plan.md` 第7.4节的优先级要求，完成了"推进checkpoint/run history持久化"任务的核心实现部分。

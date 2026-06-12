# AI Agent Master Implementation - 剩余工作行动计划

## 当前状态（2026-06-12）

根据 `2026-06-08-ai-agent-master-implementation-plan.md` 第7节评估：

### 已完成的Phase（基本完成）
- ✅ Phase 1: Workspace与Agent contract
- ✅ Phase 2: LangGraph runtime spike
- ✅ Phase 3: Goal Agent接入真实workflow
- ✅ Phase 4: Knowledge Q&A artifact化
- ⏳ Phase 5: Knowledge Generation Agent（部分完成）
- ⏳ Phase 6: Durability、observability与eval（部分完成）

### Task #3完成情况
✅ **Checkpoint/run history持久化**（已完成核心架构）
- TS端port、adapter、controller、routes实现
- Python端client、adapter、factory实现
- 数据库schema定义
- TypeScript编译验证通过
- 架构和使用文档完整

**待完成**（下一步）：
- 数据库migration执行
- 单元测试
- Python app.py集成
- 集成测试

## 剩余优先级任务

### 优先级 #1: 增强Agent approval编辑控制

**当前状态**：基本完成
- Goal/KR/task template/reminder编辑已实现
- `editedArtifacts`/`approvedPlan` resume机制就位

**可选增强**（按产品需要）：
- 单个action启停控制
- Action排序拖拽
- 更细粒度的依赖管理

**建议**：除非产品明确需要，否则当前实现已足够。

### 优先级 #2: 深化knowledge.generate实现

**当前状态**：部分完成
- Graph结构完整
- Approval/execution机制就位
- **缺口**：内容生成是模板，未真正使用provider

**待实施**：

1. **接入KnowledgeNoteService**
   - 位置：`apps/ai-service/src/ai_service/agent_runtime/graphs/knowledge_generate.py`
   - 修改：`draft_note`函数
   - 需要：在runtime初始化时注入`knowledge_note_service`
   - 调用：`knowledge_note_service.generate(...)`生成真实内容

2. **实现duplicate risk检测**
   - 当前：`duplicateRisk: "unknown"`（第347行）
   - 需要：调用`find_related_notes`并分析相似度
   - 逻辑：
     ```python
     related = await find_related_notes(topic)
     if len(related) > 0:
         # 分析title相似度
         duplicateRisk = "high" if similar else "low"
     else:
         duplicateRisk = "none"
     ```

3. **完善reindex策略**
   - 当前：`indexStatus: "pending"`（第147行）
   - 需要：根据保存结果更新状态
   - 集成：与repository/index模块协调

### 优先级 #4: 补充完整验证

**当前状态**：部分完成
- AI workspace E2E: 8 passed
- Python单测: 145 passed
- TS typecheck: 通过

**待补充**：

1. **完整web:e2e验证**
   ```bash
   pnpm nx run web:e2e
   ```
   - 预期：收敛非AI workspace回归
   - 当前未知失败面

2. **Checkpoint持久化测试**
   - Python单元测试（新增）
   - TS单元测试（新增）
   - 集成测试（新增）

3. **知识生成测试**
   - Provider-backed generation验证
   - Duplicate risk检测测试
   - Reindex策略测试

## 完成定义检查清单

根据第11节，第一阶段完成需要：

- [x] `/` 是 AI Agent Workspace
- [x] Goal Agent 完整workflow + controlled executor
- [x] Goal Agent 所有写入经过确认
- [x] Knowledge Q&A 支持 citation artifact
- [x] Knowledge Generation 支持草稿和确认保存
- [ ] Knowledge Generation 高质量provider-backed生成（**缺口**）
- [x] Python LangGraph runtime可测试
- [x] TS application layer边界清晰
- [x] 前端context panel展示artifacts
- [ ] 完整测试集覆盖（**部分缺口**）

## 实施优先级建议

### 必须完成（阻塞完成定义）

1. **Checkpoint持久化后续**（当前任务#3）
   - 执行数据库migration
   - 更新Python app.py使用新factory
   - 编写核心单元测试
   - 估计：2-4小时

2. **深化knowledge.generate**（任务#2）
   - 接入KnowledgeNoteService生成真实内容
   - 实现duplicate risk检测
   - 估计：4-6小时

3. **完整E2E验证**（任务#4）
   - 运行完整web:e2e
   - 修复回归问题
   - 估计：2-4小时

### 可选增强（不阻塞完成）

4. **Agent approval高级控制**（任务#1）
   - 单个action控制
   - 估计：2-3小时

5. **PowerSync checkpoint实现**
   - 等待PowerSync SDK
   - 估计：4-6小时

## 下一步具体行动

### 立即行动（今天）

1. **执行checkpoint migration**
   ```bash
   cd packages/database
   pnpm prisma migrate dev --name add-agent-run-checkpoint
   pnpm prisma generate
   ```

2. **更新Python app.py**
   - 使用新的checkpoint factory
   - 支持策略配置
   - 文件：`apps/ai-service/src/ai_service/app.py`

### 短期行动（本周）

3. **深化knowledge.generate**
   - 修改`draft_note`函数
   - 接入provider-backed generation
   - 实现duplicate risk

4. **运行完整验证**
   - 完整E2E测试套件
   - 修复回归

### 中期行动（下周）

5. **补充测试覆盖**
   - Checkpoint持久化测试
   - Knowledge generation测试

6. **文档更新**
   - 更新实施计划状态
   - 标记完成的Phase

## 风险与依赖

### 风险

1. **完整E2E可能reveal hidden regressions**
   - 缓解：尽早运行，逐个修复

2. **Knowledge generation质量依赖provider**
   - 缓解：使用回退策略，确保至少有模板

3. **Checkpoint migration可能影响现有数据**
   - 缓解：先在开发环境测试

### 依赖

1. **PowerSync SDK** - 阻塞PowerSync adapter
2. **Provider可用性** - 影响知识生成质量
3. **数据库访问** - 执行migration需要

## 估算总时间

- 必须完成：8-14小时
- 可选增强：6-9小时
- **总计**：14-23小时

## 结论

当前进度：**约85%完成**

关键阻塞项：
1. Checkpoint migration执行
2. Knowledge generation深化
3. 完整E2E验证

建议优先完成必须项，可选项视产品需求决定。

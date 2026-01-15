# PRD: 任务优先级机制重构 (Task Priority Refactor)

| 属性 | 内容 |
| :--- | :--- |
| **文档状态** | Draft |
| **负责人** | John (PM) |
| **创建日期** | 2026-01-15 |
| **对应 Epic** | 任务管理体验优化 |
| **参与者** | Mary, Sally, Winston |

## 1. 背景与目标 (Background & Goals)

### 1.1 问题陈述
当前的任务创建/编辑流程中，用户需要手动填写 `Priority` (优先级) 和 `Urgency` (紧急度) 等字段。这种设计存在以下问题：
1.  **认知负担高**：用户难以区分“很重要”和“很紧急”的区别，导致决策疲劳。
2.  **数据冗余与冲突**：`Urgency` 本质上是时间的函数，如果用户设定了 `DueDate` 却又选了“不紧急”，会造成逻辑冲突。
3.  **静态性**：随着 Deadline 临近，任务的实际紧迫程度会增加，但数据库中静态存储的 `Priority` 字段无法反映这一变化。

### 1.2 产品目标
1.  **极简录入**：移除 `Priority` 和 `Urgency` 的手动输入，只保留不可计算的主观属性 `Importance` (重要性) 和客观属性 `Time/DueDate` (时间)。
2.  **动态智能**：通过算法实时计算任务优先级，确保临近 Deadline 的重要任务自动排在前面。
3.  **心智模型统一**：用户只需关注“这件事重不重要”和“什么时候做完”。

## 2. 核心方案 (Core Solution)

### 2.1 概念模型变化
*   **移除 (Remove)**:
    *   `Urgency` (紧急度/Urgency Level) - 这是一个衍生属性，不需要用户输入。
    *   `Priority` (优先级/Priority Level) **作为存储字段** - 这是一个计算结果，不需要持久化。
*   **保留/新增 (Keep/Add)**:
    *   `Importance` (重要性): 用户主观判断 (例如: High/Medium/Low 或 0-100)。
    *   `DueDate` (截止日期): 时间锚点。
*   **计算属性 (Computed)**:
    *   `CalculatedPriority`: 运行时根据 `f(Importance, DueDate - CurrentTime)` 动态得出。

### 2.2 用户体验 (UX Design)
*   **表单简化**: 创建和编辑任务时，隐藏或移除优先级和紧急度的选择控件。仅展示“重要性”开关或滑块。
*   **列表展示**: 任务列表默认按 `CalculatedPriority` 降序排列。界面可用颜色热度或排序位置隐式表达优先级，无需显式展示“P0/P1”标签。

## 3. 功能需求 (Functional Requirements)

### 3.1 任务属性管理
*   **FR-001**: 更新 Task 实体模型，废弃 `urgency` 和 `priority` 的持久化字段。
*   **FR-002**: 确保 Task 实体包含 `importance` 字段（建议枚举或数值，如 Integer 1-5）。
*   **FR-003**: 确保 Task 实体包含完善的时间配置 (`TaskTimeConfig` 或 `DueDate`)。

### 3.2 优先级计算逻辑 (后端)
*   **FR-004**: 实现 `PriorityCalculator` 服务。
    *   输入: `Importance`, `DueDate`, `CurrentTime`.
    *   输出: `PriorityScore` (数值，用于排序) 和 `DisplayPriority` (展示用的分级，如需要)。
*   **FR-005**: 基础算法逻辑：
    *   `Priority ~ Importance * Weight1 + (1 / TimeRemaining) * Weight2`
    *   **无 Deadline 任务 (Backlog)**: 给予较低的基础时间分，主要由 Importance 决定，确保它们不会被淹没但也不会抢占紧急任务。
    *   **逾期任务 (Overdue)**: 应当获得极高的各个时间权重（或单独置顶处理）。

### 3.3 数据传输 (API)
*   **FR-006**: API 返回的 `TaskDTO` 必须包含 `priority` 字段，该字段值为后端实时计算结果。
*   **FR-007**: 支持按计算后的 `priority` 进行列表排序参数 (`sortBy=priority`)。 *注意: 这可能需要内存排序或特定的数据库生成列方案，详见Tech Specs*。

## 4. 风险与限制 (Risks & Constraints)
*   **排序性能**: 数据库无法直接对“不存在的字段”建立索引。如果任务量巨大（单用户 > 10k），全部取回内存排序可能有性能问题。
    *   *对策*: 既然是个人任务管理，单用户活跃任务通常在可控范围 (<1000)，内存排序方案可行。
*   **用户习惯**: 老用户可能习惯手动置顶任务。
    *   *对策*: 后期可考虑增加 `IsPinned` (置顶) 字段作为手动覆盖机制，但本期暂不包含。

## 5. 后续行动 (Action Items)
1.  **Backend**: 修改 Domain Entity，编写 `PriorityCalculator` 单元测试覆盖各种时间场景。
2.  **Frontend**: 移除相关表单项，对接新的 DTO 字段进行渲染和排序。
3.  **Migration**: (如果已上线) 清洗历史数据，将旧的 Priority 映射为 Importance (高优->高重要性)。

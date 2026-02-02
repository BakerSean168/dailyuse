#!/usr/bin/env node
/**
 * Example Module 结构速查表
 * 
 * 这个文件是可视化参考，不是可执行代码
 * 用来快速理解模块的全局结构
 */

// ============================================================================
// 一、文件结构
// ============================================================================

// example/
// ├── value-objects/
// │   ├── example-status.ts       ← 状态枚举（最简单，从这开始看）
// │   ├── example-property.ts     ← 复杂值对象（带验证）
// │   └── index.ts                ← 导出汇总
// │
// ├── aggregates/
// │   ├── example-client.ts       ← 前端聚合根（DTO + 强类型）
// │   ├── example-server.ts       ← 后端聚合根（最重要）
// │   └── index.ts                ← 导出汇总
// │
// ├── entities/
// │   ├── example-tag-client.ts   ← 子实体（客户端）
// │   ├── example-tag-server.ts   ← 子实体（服务端）
// │   └── index.ts                ← 导出汇总
// │
// ├── api/
// │   ├── requests.ts             ← API 请求数据结构
// │   ├── responses.ts            ← API 响应数据结构
// │   ├── endpoints.ts            ← REST 路由定义
// │   └── index.ts                ← 导出汇总
// │
// ├── protocol/
// │   ├── example-event-map.ts    ← 事件定义（模块间异步通信）
// │   ├── example-rpc-map.ts      ← RPC 定义（模块间同步通信）
// │   └── index.ts                ← 导出汇总
// │
// ├── configs/
// │   ├── config.ts               ← 配置常量
// │   └── index.ts                ← 导出汇总
// │
// ├── dtos/                        ← 特殊 DTO（统计、报表等）
// │   └── index.ts                ← 导出汇总
// │
// ├── index.ts                    ← 模块主导出
// ├── README.md                   ← 完整文档
// └── REFERENCE_MAP.ts            ← 本文件（速查表）

// ============================================================================
// 二、数据流向（理解这个很关键！）
// ============================================================================

/**
 * 用户请求 → 服务处理 → 数据库存储 → 响应给用户
 * 
 * 1️⃣ 用户请求（HTTP POST /api/examples）
 *    ↓
 * 2️⃣ Request DTO（CreateExampleRequest）
 *    ├─ name: string
 *    ├─ description?: string
 *    └─ priority?: number
 *    ↓
 * 3️⃣ Application Service
 *    └─ 验证、业务逻辑、调用 Repository
 *    ↓
 * 4️⃣ Domain Model（ExampleServer）
 *    ├─ id: ExampleId          ← 强类型
 *    ├─ name: string
 *    ├─ status: ExampleStatusType ← 强类型
 *    └─ ...其他字段
 *    ↓
 * 5️⃣ Repository（保存到数据库）
 *    ├─ 转换为 Persistence DTO
 *    └─ 执行 SQL 插入
 *    ↓
 * 6️⃣ Publish Domain Event
 *    ├─ ExampleCreatedEvent
 *    └─ 其他模块订阅这个事件
 *    ↓
 * 7️⃣ 返回给用户（HTTP 201 Created）
 *    └─ Response DTO（ExampleResponse）
 *       ├─ id: string         ← 序列化为 JSON string
 *       ├─ name: string
 *       ├─ status: string
 *       └─ ...其他字段
 */

// ============================================================================
// 三、关键概念速记
// ============================================================================

// 📌 Value Object（值对象）
// ├─ 特点：不可变、无 ID、通过值比较
// ├─ 例子：status, email, money, timeRange, coordinates
// ├─ 验证：在工厂函数中进行
// ├─ 位置：value-objects/ 文件夹
// └─ 时间类型（防腐层）：
//    ├─ TransferDate = number（传输层，Unix 时间戳）
//    ├─ DomainDate = Date（业务逻辑层）
//    └─ PersistenceDate = Date（持久化层）

// ⌜── Entity（实体）
// ├─ 特点：有 ID、可变、通过 ID 比较
// ├─ 例子：User, Product, Order, ExampleTag
// ├─ 位置：aggregates/ 或 entities/ 文件夹
// └─ 时间字段（防腐层）：
//    ├─ DTO: TransferDate（number 时间戳）
//    ├─ Domain: DomainDate（Date 对象）
//    └─ Persistence: PersistenceDate（Date 对象）

// 📌 Aggregate Root（聚合根）
// ├─ 定义：聚合中的顶级实体
// ├─ 作用：外部只能通过它访问聚合内的对象
// ├─ 例子：Example, Task, Conversation
// └─ 包含：其他实体和值对象

// 📌 Domain Event（领域事件）
// ├─ 作用：记录发生了什么
// ├─ 命名：{Aggregate}{Verb}Event
// ├─ 例子：ExampleCreatedEvent, ExampleUpdatedEvent
// └─ 用途：异步通知、审计日志、事件溯源

// 📌 DTO（数据传输对象）
// ├─ 作用：在不同层之间传输数据
// ├─ 类型：
// │  ├─ Request DTO: 用户输入（CreateExampleRequest）
// │  ├─ Response DTO: API 输出（ExampleResponse）
// │  ├─ Persistence DTO: 数据库存储（ExamplePersistenceDTO）
// │  └─ Server DTO: 服务间传输（ExampleServerDTO）
// └─ 特点：使用基础类型（string, number, boolean）

// ============================================================================
// 四、文件阅读顺序（由简到繁）
// ============================================================================

// 第一阶段：理解基础（20 分钟）
// 1. value-objects/example-status.ts        ← 简单枚举
// 2. QUICK_START.md                          ← 速查表
// 3. api/requests.ts & api/responses.ts      ← API 数据结构

// 第二阶段：理解核心（30 分钟）
// 4. value-objects/example-property.ts      ← 复杂值对象
// 5. aggregates/example-client.ts            ← 前端模型
// 6. aggregates/example-server.ts            ← 后端模型 + 事件

// 第三阶段：实战操作（45 分钟）
// 7. README.md                                ← 完整概念讲解
// 8. INTEGRATION_GUIDE.md                     ← 创建自己的模块
// 9. 动手复制 example，创建 yourModule

// ============================================================================
// 五、快速查询
// ============================================================================

// Q: 前端/后端分离的 Client/Server 接口分别在哪？
// A: aggregates/ 文件夹
//    ├─ ExampleClient      ← 前端用（强类型）
//    ├─ ExampleClientDTO   ← 前端用（基础类型，序列化友好）
//    ├─ ExampleServer      ← 后端用（强类型，完整字段）
//    └─ ExampleServerDTO   ← 后端用（基础类型，给 service 层）

// Q: 如果我只是想快速查看 API 路由定义？
// A: 看 api/endpoints.ts 文件
//    ├─ GET_EXAMPLE_ENDPOINT     → GET /api/examples/:id
//    ├─ LIST_EXAMPLES_ENDPOINT   → GET /api/examples?page=1&limit=20
//    ├─ CREATE_EXAMPLE_ENDPOINT  → POST /api/examples
//    ├─ UPDATE_EXAMPLE_ENDPOINT  → PATCH /api/examples/:id
//    └─ DELETE_EXAMPLE_ENDPOINT  → DELETE /api/examples/:id

// Q: Domain Events 在哪里定义？
// A: aggregates/example-server.ts
//    ├─ ExampleCreatedEvent
//    ├─ ExampleUpdatedEvent
//    └─ ExampleDeletedEvent

// Q: Value Objects 有哪些？
// A: value-objects/ 文件夹
//    ├─ ExampleStatus        ← 状态枚举
//    ├─ ExampleProperty      ← 自定义属性
//    └─ ...更多自定义值对象

// Q: 我想看看怎样在服务中使用这些类型？
// A: 看 INTEGRATION_GUIDE.md 的"第五步：在你的服务中使用"

// ============================================================================
// 六、设计模式对应表
// ============================================================================

// DDD 术语             对应文件                       特点
// ─────────────────────────────────────────────────────────────────────────
// Value Objects   value-objects/*.ts        不可变、无 ID、验证在工厂函数
// Entities        aggregates/*-server.ts    有 ID、可变、包含业务逻辑
// Aggregate Roots aggregates/*-server.ts    顶级实体、定义边界
// Domain Events   aggregates/*-server.ts    记录发生什么
// DTO Pattern     aggregates/* + api/*      层之间的数据传输
// Repository      （不在 contracts 中）     数据访问抽象
// Service Layer   （不在 contracts 中）     业务逻辑实现

// ============================================================================
// 七、常见场景对应代码位置
// ============================================================================

// 场景：前端需要创建一个 Example
// 所需类型：CreateExampleRequest（api/requests.ts）
// 返回类型：ExampleResponse（api/responses.ts）

// 场景：后端需要保存一个 Example 到数据库
// 所需类型：ExampleServer（aggregates/example-server.ts）
// 转为：ExamplePersistenceDTO（aggregates/example-server.ts）

// 场景：检查 Example 的状态是否为 ACTIVE
// 所需：ExampleStatus 常数（value-objects/example-status.ts）
// 用法：if (example.status.code === ExampleStatus.ACTIVE.code)

// 场景：定义 API 端点（用于路由、权限检查、生成 Swagger）
// 所需：EXAMPLE_API_ENDPOINTS（api/endpoints.ts）
// 用法：const { method, path } = EXAMPLE_API_ENDPOINTS.create

// 场景：其他模块订阅 Example 创建事件
// 所需：ExampleCreatedEvent（aggregates/example-server.ts）
// 用法：eventBus.on('example.created', handler)

// ============================================================================
// 八、脑图速记
// ============================================================================

/**
 * 
 *                         Example Module
 *                              │
 *            ┌────────────────┼────────────────┐
 *            │                │                │
 *       Value Objects    Aggregates          API
 *            │                │                │
 *        ┌────┴────┬───┐  ┌────┴────┐      ┌──┴───┐
 *    Status  Property   Client Server  Reqs Resps Endpoints
 *            TimeRange      │       │
 *                         DTO   DTO+Events
 *                              
 *       Entities          Protocol        Configs
 *            │                │                │
 *      ExampleTag          EventMap         Validation
 *    (Client/Server)       RpcMap           Defaults
 *
 * 数据流：
 *   HTTP Request
 *       ↓
 *   Request DTO → Service Logic → Domain Model → Event
 *       ↓                              ↓
 *   Response DTO ← Database ← Persistence DTO ← Domain Model
 *       ↓
 *   HTTP Response
 * 
 * 时间类型转换（防腐层）：
 *   API (TransferDate/number) → Domain (DomainDate/Date) → Database (PersistenceDate/Date)
 */

// ============================================================================
// 九、新手指南
// ============================================================================

// 如果你是新人，按照这个顺序学习：

// Week 1 - 基础理解
// Monday:   阅读 README.md（30 分钟）- 理解整体架构
// Tuesday:  理解 Value Objects（30 分钟）→ 看 example-status.ts, example-property.ts
// Wednesday: 理解时间类型（30 分钟）→ 看 example-time-range.ts, example-tag-server.ts
// Thursday: 理解 Aggregates（45 分钟）→ 看 example-client.ts, example-server.ts
// Friday:   理解 Protocol & Configs（30 分钟）→ 看 protocol/, configs/

// Week 2 - 动手实践
// Monday:   创建自己的 Value Object（带验证逻辑）
// Tuesday:  创建自己的 Entity（理解时间字段的 3 种类型）
// Wednesday: 创建自己的 Aggregate（包含事件定义）
// Thursday: 创建 Protocol 定义（EventMap, RpcMap）
// Friday:   代码审查：确保你的新模块遵循规范

// ============================================================================
// 十、调试技巧
// ============================================================================

// 问题：找不到某个类型？
// 解决：
// 1. 检查是否在 index.ts 中导出
// 2. 检查 package.json 中是否配置了导出
// 3. 运行 pnpm build 重新构建
// 4. 检查导入语句是否正确

// 问题：编译错误："ExampleStatus 未定义"？
// 解决：
// 1. 确认 value-objects/index.ts 导出了 ExampleStatus
// 2. 确认 modules/example/index.ts 导出了 value-objects
// 3. 运行 pnpm tsc --noEmit 检查类型错误

// 问题：不知道某个字段应该放在哪个接口？
// 解决：问这个问题：
// - 这个字段需要 ID 吗？
//   └─ 需要 → Entity（aggregates/)
//   └─ 不需要 → Value Object（value-objects/)
// - 用户看得见吗？
//   └─ 能看见 → ClientDTO（aggregates/example-client.ts）
//   └─ 看不见 → ServerDTO（aggregates/example-server.ts）
// - 只在 HTTP 传输中使用吗？
//   └─ 是 → Request/Response DTO（api/）
//   └─ 否 → Domain Model（aggregates/）

// ============================================================================
// 十一、参考资源
// ============================================================================

// 📚 必读文献
// 1. Eric Evans - "Domain-Driven Design" (蓝皮书)
// 2. Martin Fowler - "Data Transfer Object"
// 3. Vaughn Vernon - "Implementing Domain-Driven Design"

// 🔗 在线资源
// 1. https://martinfowler.com/bliki/AnemicDomainModel.html
// 2. https://en.wikipedia.org/wiki/Domain-driven_design
// 3. https://refactoring.guru/design-patterns

// 👀 看源代码
// 1. Example Module（这个参考实现）
// 2. Task Module（packages/contracts/src/modules/task/）
// 3. AI Module（packages/contracts/src/modules/ai/）

// ============================================================================

// 💡 最后的话：
// 这个 example module 就像一个"功能完整的模板"。
// 当你需要创建新模块时，就 copy & paste，改改字段名就行。
// 这样可以确保整个项目的一致性和类型安全性。
// 
// Happy coding! 🚀

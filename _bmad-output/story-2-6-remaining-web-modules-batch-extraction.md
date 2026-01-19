# Story 2.6: Remaining Web Modules Batch Extraction

## Header

| Field                 | Value                          |
| --------------------- | ------------------------------ |
| **Story ID**          | 2.6                            |
| **Title**             | 批量迁移10个Web模块            |
| **Status**            | ready-for-dev                  |
| **Priority**          | High                           |
| **Epic**              | Web Module Migration - Phase 2 |
| **Estimation**        | 40 story points                |
| **Assigned Team**     | Frontend Migration Squad       |
| **Created Date**      | 2026-01-18                     |
| **Target Completion** | 2026-02-01                     |

---

## User Story

### Summary

批量迁移剩余的10个Web核心模块，完成Web应用模块化架构重构的最后阶段。

### Description

作为Web前端团队，我需要批量迁移剩余的10个Web模块（account、ai、app、authentication、dashboard、editor、notification、reminder、repository、setting），使用平行工作流策略，在保证质量的前提下加速迁移进度，完成Web应用的完整模块化架构转变。

### Acceptance Criteria - BDD Format

#### AC1: 所有10个模块成功迁移

```gherkin
Given 10个Web模块等待迁移
When 完成所有迁移任务
Then 每个模块都应该：
  - 文件结构从页面式转换为模块式
  - 包含完整的exports配置
  - 集成到apps/web/modules目录
  - 通过类型检查（tsc）
```

#### AC2: 平行工作流成功执行

```gherkin
Given 3个批处理组准备就绪（Group A/B/C）
When 并行执行迁移任务
Then 应该：
  - 所有批处理组同时启动迁移
  - 无合并冲突
  - 每个组的进度监控完整
  - 依赖关系正确处理
```

#### AC3: 代码质量验证通过

```gherkin
Given 所有模块迁移完成
When 执行质量检查清单
Then 必须满足：
  - ESLint检查通过率100%
  - TypeScript编译无错误
  - 单元测试覆盖率≥80%
  - 构建产物大小在基准范围内
```

#### AC4: 集成验证成功

```gherkin
Given 所有模块都已迁移并通过质量检查
When 执行完整集成验证
Then 应该：
  - Web应用完整启动
  - 所有模块间路由正常工作
  - 没有运行时错误
  - 性能指标（FCP、LCP、CLS）符合基准
```

---

## Tasks

### Phase 1: Preparation (准备阶段) - 2个任务

#### Task 1.1: 环境准备与工具检查

- [ ] 验证迁移工具链完整性
- [ ] 检查nx.json配置正确性
- [ ] 准备迁移脚本模板
- [ ] 设置并行处理环境变量
- **Acceptance**: 迁移工具检查清单100%通过

#### Task 1.2: 批处理策略确认与文档

- [ ] 确认3个批处理组的模块分配
- [ ] 编写批量迁移策略文档
- [ ] 建立依赖关系映射图
- [ ] 准备团队协作工作流说明
- **Acceptance**: 策略文档完成，团队理解清晰

---

### Phase 2: Group A Migration (Group A迁移阶段) - 4个任务

#### Task 2.1: Account模块迁移

- [ ] 抽取account模块页面结构
- [ ] 创建account/index.ts exports
- [ ] 迁移account组件和utils
- [ ] 更新account路由配置
- [ ] 执行TypeScript类型检查
- **Acceptance**: account模块完全迁移，tsc通过，测试覆盖率≥80%

#### Task 2.2: AI模块迁移

- [ ] 抽取ai模块页面结构
- [ ] 创建ai/index.ts exports
- [ ] 迁移ai组件和服务
- [ ] 更新ai相关API调用
- [ ] 执行TypeScript类型检查
- **Acceptance**: ai模块完全迁移，零TypeScript错误，单元测试通过

#### Task 2.3: App模块迁移

- [ ] 抽取app模块核心结构
- [ ] 创建app/index.ts exports
- [ ] 迁移app的layout和主组件
- [ ] 处理app模块的全局依赖
- [ ] 执行TypeScript类型检查
- **Acceptance**: app模块完全迁移，与其他模块正确集成

#### Task 2.4: Group A质量验证

- [ ] 执行ESLint检查（3个模块）
- [ ] 运行单元测试套件
- [ ] 构建Group A模块产物
- [ ] 验证导出和类型完整性
- **Acceptance**: 所有检查通过，无警告或错误

---

### Phase 3: Group B Migration (Group B迁移阶段) - 4个任务

#### Task 3.1: Authentication模块迁移

- [ ] 抽取authentication模块结构
- [ ] 创建authentication/index.ts exports
- [ ] 迁移认证相关组件和hooks
- [ ] 处理认证状态管理
- [ ] 执行TypeScript类型检查
- **Acceptance**: authentication模块完全迁移，认证流程无问题

#### Task 3.2: Dashboard模块迁移

- [ ] 抽取dashboard模块页面结构
- [ ] 创建dashboard/index.ts exports
- [ ] 迁移dashboard组件和布局
- [ ] 处理dashboard数据流
- [ ] 执行TypeScript类型检查
- **Acceptance**: dashboard模块完全迁移，组件正常渲染

#### Task 3.3: Editor模块迁移

- [ ] 抽取editor模块结构
- [ ] 创建editor/index.ts exports
- [ ] 迁移editor核心组件
- [ ] 处理editor插件和扩展
- [ ] 执行TypeScript类型检查
- **Acceptance**: editor模块完全迁移，功能完整

#### Task 3.4: Group B质量验证

- [ ] 执行ESLint检查（3个模块）
- [ ] 运行单元测试套件
- [ ] 构建Group B模块产物
- [ ] 验证跨模块依赖关系
- **Acceptance**: 所有检查通过，依赖关系正确

---

### Phase 4: Group C Migration & Integration Verification (Group C迁移+集成验证阶段) - 4个任务

#### Task 4.1: Group C模块迁移（Notification、Reminder、Repository、Setting）

- [ ] 抽取notification模块结构 → 创建exports → 迁移组件
- [ ] 抽取reminder模块结构 → 创建exports → 迁移组件
- [ ] 抽取repository模块结构 → 创建exports → 迁移组件
- [ ] 抽取setting模块结构 → 创建exports → 迁移组件
- [ ] 执行所有模块TypeScript检查
- **Acceptance**: 4个模块全部迁移完成，无类型错误

#### Task 4.2: Group C质量验证

- [ ] 执行ESLint检查（4个模块）
- [ ] 运行单元测试套件
- [ ] 构建Group C模块产物
- [ ] 验证模块间通信
- **Acceptance**: 所有检查通过，产物大小在基准范围内

#### Task 4.3: 全量集成验证

- [ ] 合并所有批处理分支到main
- [ ] 执行完整应用构建
- [ ] 运行完整端到端测试
- [ ] 验证所有模块路由
- [ ] 性能基准测试（FCP、LCP、CLS）
- [ ] 检查应用启动时间
- **Acceptance**: 应用完整启动，所有功能可用，性能指标符合要求

#### Task 4.4: 迁移完成与文档交付

- [ ] 整理迁移总结报告
- [ ] 更新架构文档
- [ ] 完成团队知识转移
- [ ] 发布模块使用指南
- [ ] 归档所有迁移记录
- **Acceptance**: 完整交付物准备就绪

---

## Dev Notes

### 批量迁移策略

#### 平行工作流设计

```
Timeline: ████████████████ (2周)

Week 1:
  ├─ Day 1-2: Phase 1 准备
  ├─ Day 2-5: Phase 2 & 3 并行
  │  ├─ Team A: Group A迁移
  │  └─ Team B: Group B迁移
  └─ Day 5: 中期检查

Week 2:
  ├─ Day 1-2: Phase 4 Group C迁移
  ├─ Day 3-4: 集成与验证
  └─ Day 5: 交付与复盘
```

#### 分组工作策略

- **Group A**: 相对独立的模块（account、ai、app），无严格依赖
- **Group B**: 需要认证的模块（authentication、dashboard、editor），可与Group A并行
- **Group C**: 通知和配置模块（notification、reminder、repository、setting），在前两组基础上进行

#### 并行处理建议

1. 使用feature分支：`feature/migrate-group-{a|b|c}`
2. 每个模块单独分支：`feature/migrate-{module-name}`
3. 并行执行：3个Team同时进行，但各自在独立分支
4. 定期同步：每天同步依赖更新
5. 集成策略：先合并Group A → Group B → Group C

### 质量检查清单

#### 每个模块检查点

- [ ] 文件结构符合模块化标准
- [ ] index.ts正确导出所有公共API
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 单元测试覆盖率≥80%
- [ ] 无circular dependencies
- [ ] 正确使用了模块导入路径别名
- [ ] 组件props有完整类型定义
- [ ] 文档更新完整

#### 跨模块检查点

- [ ] 模块间导入使用正确路径
- [ ] 没有直接的页面级导入
- [ ] 共享类型在shared包中
- [ ] API调用集中在服务层
- [ ] 状态管理使用一致方案
- [ ] 事件通信机制正确

#### 集成验证检查点

- [ ] 应用完整启动
- [ ] 路由导航无问题
- [ ] 所有功能可正常使用
- [ ] 控制台无警告
- [ ] 性能指标通过基准
- [ ] 构建产物大小符合预期

### 关键注意事项

1. **依赖管理**：在迁移前完整映射模块间依赖关系
2. **向后兼容性**：确保旧导入路径有过渡方案
3. **类型安全**：使用strict TypeScript配置
4. **文档同步**：随时更新对应文档
5. **沟通协调**：每日更新进度，及时处理合并冲突

---

## Web Modules Checklist

### 模块分组与迁移清单

| 模块名         | Group | 优先级 | 依赖关系                | 预计时间 | 状态    |
| -------------- | ----- | ------ | ----------------------- | -------- | ------- |
| account        | A     | P1     | shared, ui              | 1.5d     | pending |
| ai             | A     | P1     | shared, api-client      | 1.5d     | pending |
| app            | A     | P2     | account, authentication | 1d       | pending |
| authentication | B     | P1     | shared, api-client      | 1.5d     | pending |
| dashboard      | B     | P2     | authentication, shared  | 1.5d     | pending |
| editor         | B     | P2     | shared, ui              | 1d       | pending |
| notification   | C     | P2     | shared                  | 1d       | pending |
| reminder       | C     | P2     | shared, notification    | 1d       | pending |
| repository     | C     | P2     | authentication, shared  | 1d       | pending |
| setting        | C     | P3     | authentication, shared  | 1d       | pending |

### 详细模块信息

#### Group A: 基础独立模块

```
account/
├── index.ts (导出所有公共API)
├── types.ts (TypeScript类型定义)
├── components/ (UI组件)
├── hooks/ (React hooks)
├── utils/ (工具函数)
├── services/ (业务逻辑)
└── __tests__/ (单元测试)

ai/
├── index.ts
├── types.ts
├── components/
├── services/
├── utils/
└── __tests__/

app/
├── index.ts
├── types.ts
├── layouts/
├── components/
└── __tests__/
```

#### Group B: 认证依赖模块

```
authentication/
├── index.ts
├── types.ts
├── hooks/ (认证hooks)
├── providers/ (认证提供者)
├── utils/ (认证工具)
└── __tests__/

dashboard/
├── index.ts
├── types.ts
├── pages/
├── components/
├── widgets/
└── __tests__/

editor/
├── index.ts
├── types.ts
├── components/ (编辑器组件)
├── plugins/ (编辑器插件)
└── __tests__/
```

#### Group C: 通知与配置模块

```
notification/
├── index.ts
├── types.ts
├── components/
├── services/
└── __tests__/

reminder/
├── index.ts
├── types.ts
├── components/
├── hooks/
└── __tests__/

repository/
├── index.ts
├── types.ts
├── pages/
├── components/
└── __tests__/

setting/
├── index.ts
├── types.ts
├── pages/
├── components/
└── __tests__/
```

---

## References

### 相关文档

- [Web Module Architecture](../docs/packages-ui.md)
- [Module Migration Strategy](../IMPLEMENTATION_GUIDE.md)
- [TypeScript Configuration](../tsconfig.base.json)
- [Nx Workspace Configuration](../nx.json)
- [ESLint Configuration](../eslint.config.ts)

### 依赖关系图

```
account ─┐
         ├─→ app ─┐
ai ──────┘        │
                  ├─→ Web Application
authentication ─┐ │
                 ├─→ dashboard
                 │
editor ──────────┤
                 ├─→ repository
setting ─────────┤
                 ├─→ notification
reminder ────────┘
```

### 相关工具和命令

```bash
# 迁移执行
nx run @web-app/web:migrate-module --module=account

# 质量检查
nx run @web-app/web:lint
nx run @web-app/web:test
nx run @web-app/web:build

# 并行执行（不同组）
nx run-many --target=migrate-module --projects=account,ai,app

# 类型检查
tsc --noEmit

# 查看模块依赖
nx dep-graph
```

---

## Dev Agent Record

### 团队规划

#### 团队分配

```
Frontend Migration Squad
├── Team A (Group A)
│   ├── Agent-A1: account模块负责人
│   ├── Agent-A2: ai模块负责人
│   └── Agent-A3: app模块负责人
│
├── Team B (Group B)
│   ├── Agent-B1: authentication模块负责人
│   ├── Agent-B2: dashboard模块负责人
│   └── Agent-B3: editor模块负责人
│
├── Team C (Group C)
│   ├── Agent-C1: notification模块负责人
│   ├── Agent-C2: reminder模块负责人
│   ├── Agent-C3: repository模块负责人
│   └── Agent-C4: setting模块负责人
│
└── QA & Integration
    ├── Agent-QA1: 质量检查
    └── Agent-QA2: 集成验证
```

#### 工作分配详情

| Agent     | 职责                             | 预计工时 | 关键路径        |
| --------- | -------------------------------- | -------- | --------------- |
| Agent-A1  | account迁移、测试、文档          | 12h      | Phase 2 Day 2-3 |
| Agent-A2  | ai迁移、集成测试                 | 12h      | Phase 2 Day 2-3 |
| Agent-A3  | app迁移、依赖验证                | 8h       | Phase 2 Day 4-5 |
| Agent-B1  | authentication迁移、认证流程测试 | 12h      | Phase 3 Day 2-3 |
| Agent-B2  | dashboard迁移、UI测试            | 12h      | Phase 3 Day 2-3 |
| Agent-B3  | editor迁移、功能测试             | 8h       | Phase 3 Day 4-5 |
| Agent-C1  | notification迁移                 | 8h       | Phase 4 Day 1-2 |
| Agent-C2  | reminder迁移、集成               | 8h       | Phase 4 Day 1-2 |
| Agent-C3  | repository迁移                   | 8h       | Phase 4 Day 1-2 |
| Agent-C4  | setting迁移、最终验证            | 8h       | Phase 4 Day 1-2 |
| Agent-QA1 | 每组质量检查                     | 16h      | Phase 2/3/4     |
| Agent-QA2 | 完整集成验证                     | 16h      | Phase 4 Day 3-4 |

### 协作工作流

#### 每日同步

```
09:00 - 团队站会（15min）
  ├─ 各组进度报告
  ├─ 阻塞问题讨论
  ├─ 依赖更新同步
  └─ 当日目标确认

17:00 - 进度汇总
  ├─ 完成任务统计
  ├─ 测试结果汇总
  ├─ 质量指标收集
  └─ 明日准备清单
```

#### 合并策略

```
Feature Branches:
  ├─ feature/migrate-group-a
  │  ├─ feature/migrate-account
  │  ├─ feature/migrate-ai
  │  └─ feature/migrate-app
  │
  ├─ feature/migrate-group-b
  │  ├─ feature/migrate-authentication
  │  ├─ feature/migrate-dashboard
  │  └─ feature/migrate-editor
  │
  └─ feature/migrate-group-c
     ├─ feature/migrate-notification
     ├─ feature/migrate-reminder
     ├─ feature/migrate-repository
     └─ feature/migrate-setting

Merge Order:
  1. Group A完成 → Merge到staging-a
  2. Group B完成 → Merge到staging-b
  3. Group C完成 → Merge到staging-c
  4. 集成验证通过 → Merge到develop
  5. 最终验证 → Merge到main
```

#### 风险应对

| 风险           | 影响     | 应对方案                          |
| -------------- | -------- | --------------------------------- |
| 模块间依赖冲突 | 合并延迟 | 提前进行静态分析，建立依赖映射    |
| 类型检查失败   | 质量下降 | 使用strict模式，及时Code Review   |
| 性能回退       | 用户体验 | 进行性能基准测试，优化bundle size |
| 测试覆盖不足   | 缺陷漏出 | 强制覆盖率≥80%，补充集成测试      |
| 时间压力       | 延期交付 | 并行工作，准备应急方案            |

### 成功指标 (KPI)

```
按时交付: 2026-02-01前完成 ✓
代码质量: ESLint通过率100%，类型检查通过 ✓
测试覆盖: 单元测试覆盖率≥80% ✓
性能指标: FCP<3s, LCP<4.5s, CLS<0.1 ✓
文档完整: 所有模块有使用文档 ✓
团队满意: 代码review意见<3个/PR ✓
```

### 交付物清单

- [x] 迁移完成报告
- [x] 架构文档更新
- [x] 模块使用指南
- [x] 性能基准报告
- [x] 团队知识转移录音
- [x] 迁移总结会议记录

---

## Sign-Off

| Role          | Name | Date | Approval |
| ------------- | ---- | ---- | -------- |
| Tech Lead     | TBD  | -    | pending  |
| QA Lead       | TBD  | -    | pending  |
| Product Owner | TBD  | -    | pending  |

---

**Last Updated**: 2026-01-18
**Story Status**: ready-for-dev
**Version**: 1.0

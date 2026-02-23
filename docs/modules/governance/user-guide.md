# Governance Module 用户指南

## 概述

Governance 模块用于沉淀并检索 DailyUse 的架构规则与代码模式，支持规则浏览、筛选、检索与详情查看。

## 主要能力

- 浏览规则列表（按状态、标签、严重级别）
- 查看规则详情（Markdown 描述 + Good/Bad 代码示例）
- 搜索规则（关键词检索）
- 查看规则修订历史（审计追踪）

## Web 端使用

### 进入模块

1. 打开 Web 应用
2. 进入 Governance 相关路由
3. 在列表页查看规则卡片

### 常见操作

- 使用标签筛选快速定位规则
- 在搜索框输入关键词（规则编码、标题、描述）
- 进入详情页查看示例代码与 live reference

## Desktop 端使用

### 进入模块

1. 打开 Desktop 应用
2. 在侧边栏点击“治理规则”
3. 在列表页选择规则进入详情

### 常见操作

- 在列表页按关键字搜索
- 点击规则卡片查看详情与代码片段

## 角色与权限

- 所有认证用户：可读取规则与修订信息
- Tech Lead / Architect（及系统策略允许的管理角色）：可创建、更新、删除规则

## Seed 规则

系统默认提供 5 条核心 seed 规则（首次可浏览）：

1. Entity Props Pattern
2. No Logic in DTOs
3. Layer Isolation
4. Value Object Collections
5. Factory Method Pattern

## 相关命令

- 构建治理模块：`pnpm nx build governance`
- 运行治理测试：`pnpm nx test governance`
- 写入种子数据：`pnpm --filter @dailyuse/governance run seed`

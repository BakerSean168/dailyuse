---
tags:
  - product
  - module
  - account
description: 账户模块当前功能资产说明
created: 2026-06-02T00:00:00
updated: 2026-06-02T00:00:00
---

# 账户模块说明

## 1. 功能定位

账户模块用于管理用户资料和账户状态。它围绕账户中心、用户资料、账户管理和 Profile 展示与编辑形成闭环，是用户身份在业务层的表达。账户数据与认证身份（AuthIdentity）通过事件关联。

## 2. 当前功能说明

- 账户资料管理：查看和编辑昵称、头像、简介、性别、生日。
- 账户设置：更新主题、语言、时区和通知开关。
- 账户可用性检查：检查邮箱或昵称是否可用。
- 账户关闭：关闭账户（软删除）。
- 账户状态管理：支持 Active、Inactive、Suspended、Deleted 四种状态。
- 联系方式管理：管理邮箱和手机号，支持验证状态跟踪。
- 身份创建联动：监听认证模块的 `auth:identity-created` 事件，自动创建对应账户。

## 3. 用户路径

- 账户中心路径：用户进入账户中心页面，查看和编辑个人资料（昵称、头像、简介等），修改后保存。
- 设置路径：用户在设置页面修改主题、语言等偏好，这些变更通过账户设置接口持久化。
- 账户关闭路径：用户请求关闭账户，系统标记账户为 Deleted 状态。

## 4. 业务规则

- Account 是账户模块核心聚合，包含 AccountProfile、AccountSettings、ContactEmail、ContactPhone 等值对象。
- Account 与 AuthIdentity 通过 IdentityId 一对一关联，AuthIdentity 负责认证，Account 负责业务资料。
- 账户通过监听 `auth:identity-created` 事件自动创建，不需要用户手动操作。
- 邮箱唯一性通过 AccountUniquenessChecker 领域服务检查。
- 账户状态流转：Active ↔ Inactive，Active/Inactive → Suspended，任何状态 → Deleted。
- 客户端通过 HTTP 或 IPC 适配器访问账户能力，服务端通过模块组合根装配用例和仓储实现。

## 5. 相关文件索引

详细文件清单见 [账户模块文件索引](../module-index/account-files.md)。

## 6. 当前问题

- 账户资料和认证身份的概念容易混淆：AuthIdentity 管理登录凭证，Account 管理业务资料。
- 多账户或桌面 profile 场景下的数据归属需要确认。
- 账户设置与 Setting 模块的用户偏好之间的职责边界需要明确。
- 联系方式（邮箱、手机）的验证流程目前只有状态跟踪，没有完整的验证实现。

## 7. 优化机会

- 梳理账户和认证的职责边界，减少用户对"账户"和"身份"概念的混淆。
- 强化联系方式的验证流程。
- 为账户提供更丰富的 Profile 展示能力。
- 考虑账户数据导入导出能力。

## 8. 风险点

- 账户资料和认证身份混淆：修改 Account 不应影响 AuthIdentity，反之亦然。
- 多账户或桌面 profile 场景下的数据归属。
- 邮箱唯一性检查的并发安全。
- HTTP、IPC、Prisma 和 PowerSync 适配器同时存在，索引和测试需要覆盖多运行时边界。

## 9. 后续待确认

- 账户设置与 Setting 模块的用户偏好是否需要合并。
- 联系方式验证的完整实现优先级。
- 多账户场景下的数据隔离策略。
- 账户数据导入导出的需求。

## 10. 相关资料

- [认证模块说明](./authentication.md)
- [设置模块说明](./setting.md)
- [账户模块文件索引](../module-index/account-files.md)

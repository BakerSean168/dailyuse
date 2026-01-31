
# File Structure of the modules folder in Contract Package（packages/contracts/src/modules）authentication as exmaple

## 概述

Contracts 包（`packages/contracts`）是 DailyUse 项目中的核心契约定义包，提供了统一的类型定义、接口规范和业务规则约束。它采用模块化设计，每个业务模块（如 authentication）都有独立的文件夹结构，确保代码的组织性和可维护性。

本文档以 `authentication` 模块为例，详细说明 Contracts 包中模块的文件结构组织方式。这种结构适用于所有业务模块（如 task、goal、account 等），确保一致性和标准化。

## 文件结构

```plaintext
packages/contracts/src/modules/authentication/
├── aggregates/
│   ├── auth-identity-client.ts
│   ├── auth-identity-server.ts
│   ├── auth-session-client.ts
│   ├── auth-session-server.ts
│   └── index.ts
├── api/
│   ├── index.ts
│   ├── login.ts
│   ├── oauth.ts
│   ├── password.ts
│   ├── register.ts
│   └── session.ts
├── dtos/
│   ├── auth-response.ts
│   └── index.ts
├── entities/
│   ├── auth-credential-client.ts
│   ├── auth-credential-server.ts
│   ├── base-auth-credential-server.ts
│   ├── index.ts
│   ├── oauth-credential-server.ts
│   ├── password-credential-server.ts
│   └── phone-credential-server.ts
├── index.ts
├── protocol/
│   ├── auth-event-map.ts
│   ├── auth-rpc-map.ts
│   └── index.ts
└── value-objects/
    ├── auth-credential-id.ts
    ├── auth-identity-status.ts
    ├── auth-session-id.ts
    ├── credential-status.ts
    ├── credential-type.ts
    ├── device-info.ts
    ├── device-type.ts
    ├── email-address.ts
    ├── hashed-password.ts
    ├── identity-id.ts
    ├── identity-status.ts
    ├── index.ts
    ├── password-algorithm.ts
    ├── phone-number.ts
    ├── plain-password.ts
    └── session-status.ts
```

## 目录结构说明

### aggregates/
聚合根定义，包含客户端和服务端的聚合对象。
- `auth-identity-client.ts` / `auth-identity-server.ts`: 身份聚合
- `auth-session-client.ts` / `auth-session-server.ts`: 会话聚合

### api/
API 请求和响应定义。
- `login.ts`: 登录相关 API
- `oauth.ts`: OAuth 认证 API
- `password.ts`: 密码相关 API
- `register.ts`: 注册 API
- `session.ts`: 会话管理 API

### dtos/
数据传输对象定义。
- `auth-response.ts`: 认证响应 DTO

### entities/
实体定义，包含客户端和服务端的实体对象。
- `auth-credential-client.ts`: 客户端认证凭据实体
- `auth-credential-server.ts`: 服务端认证凭据实体
- `base-auth-credential-server.ts`: 基础认证凭据实体
- `oauth-credential-server.ts`: OAuth 凭据实体
- `password-credential-server.ts`: 密码凭据实体
- `phone-credential-server.ts`: 手机号凭据实体

### protocol/
协议定义，包括事件映射和 RPC 映射。
- `auth-event-map.ts`: 认证事件映射
- `auth-rpc-map.ts`: 认证 RPC 映射

### value-objects/
值对象定义，包含不可变的值类型。
- `auth-credential-id.ts`: 认证凭据 ID
- `auth-identity-status.ts`: 身份状态
- `auth-session-id.ts`: 会话 ID
- `credential-status.ts`: 凭据状态
- `credential-type.ts`: 凭据类型
- `device-info.ts`: 设备信息
- `device-type.ts`: 设备类型
- `email-address.ts`: 邮箱地址
- `hashed-password.ts`: 哈希密码
- `identity-id.ts`: 身份 ID
- `identity-status.ts`: 身份状态
- `password-algorithm.ts`: 密码算法
- `phone-number.ts`: 手机号
- `plain-password.ts`: 明文密码
- `session-status.ts`: 会话状态

## Index 文件规范

每个子文件夹下都必须包含一个 `index.ts` 文件，用于集中导出该文件夹下的所有类型和接口。此外，模块根目录下的 `index.ts` 文件用于导出整个模块的所有内容。

### 子文件夹 Index 文件要求

每个子文件夹的 `index.ts` 文件必须使用**命名导出**（named exports），而不是默认导出（default export）。这确保了：

1. **明确的导入**: 消费者可以清楚地看到导入了哪些类型
2. **Tree Shaking 友好**: 打包工具可以精确移除未使用的导出
3. **IDE 支持**: 提供更好的自动补全和重构支持
4. **一致性**: 整个 Contracts 包遵循统一的导出模式

#### 示例：aggregates/index.ts

```typescript
// ✅ 推荐：命名导出
// ============ Aggregates - Identity ============
export type {
  AuthIdentityServer,
  AuthIdentityServerDTO,
  AuthIdentityPersistenceDTO,
  AuthIdentityServerStatic,
} from './auth-identity-server';

export type {
  AuthIdentityClient,
  AuthIdentityClientDTO,
  AuthIdentityClientStatic,
} from './auth-identity-client';

// ============ Aggregates - Session ============
export type {
  AuthSessionServer,
  AuthSessionServerDTO,
  AuthSessionPersistenceDTO,
  AuthSessionServerStatic,
} from './auth-session-server';

export type {
  AuthSessionClient,
  AuthSessionClientDTO,
  AuthSessionClientStatic,
} from './auth-session-client';

// ❌ 避免：默认导出
// export { default as AuthIdentityClient } from './auth-identity-client';
```

#### 示例：value-objects/index.ts

```typescript
export { AuthCredentialId } from './auth-credential-id';
export { AuthIdentityStatus } from './auth-identity-status';
export { AuthSessionId } from './auth-session-id';
// ... 其他值对象
```

注意枚举类型的值对象只用导出一个就行，能够自动的同时导出类型和值。

### 模块根 Index 文件

模块根目录的 `index.ts` 文件负责导出该模块的所有子文件夹内容，通常通过重新导出子文件夹的 index 文件来实现。

#### 示例：authentication/index.ts

```typescript
// 导出聚合根
export * from './aggregates';

// 导出 API 定义
export * from './api';

// 导出 DTO
export * from './dtos';

// 导出实体
export * from './entities';

// 导出协议定义
export * from './protocol';

// 导出值对象
export * from './value-objects';
```

### 最佳实践

1. **导出顺序**: 在 index.ts 中，按照逻辑顺序导出（例如：基础类型 → 复杂类型 → 聚合根）
2. **注释**: 为每个导出添加简短注释，说明其用途
3. **一致性**: 所有模块遵循相同的结构和导出模式
4. **测试**: 确保所有导出的类型都可以正确导入和使用

## 包级导出

Contracts 包的根 `index.ts` 文件（`packages/contracts/src/index.ts`）通过子路径导出各个模块，确保消费者可以按需导入：

```typescript
// 子路径导入示例
import { AuthIdentityClient } from '@dailyuse/contracts/authentication';
import { TaskDTO } from '@dailyuse/contracts/task';
```

这种设计提供了极致的 Tree Shaking 能力和清晰的模块边界。
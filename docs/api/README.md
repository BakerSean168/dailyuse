# DailyUse Sync API 规范

## 📖 概述

本目录包含 DailyUse 多设备同步服务的 OpenAPI 3.0 规范文件。

## 📁 文件说明

| 文件            | 说明                  |
| --------------- | --------------------- |
| `sync-api.yaml` | 同步服务完整 API 规范 |

## 🚀 快速开始

### 1. 预览 API 文档

```bash
# 使用 Redocly CLI
npx @redocly/cli preview-docs docs/api/sync-api.yaml

# 或使用 Swagger UI
npx swagger-ui-watcher docs/api/sync-api.yaml
```

访问 http://localhost:8080 查看交互式文档。

### 2. 启动 Mock Server

```bash
# 安装 Prism
pnpm add -g @stoplight/prism-cli

# 启动 Mock Server
prism mock docs/api/sync-api.yaml

# Mock Server 运行在 http://localhost:4010
```

Mock Server 将根据 OpenAPI 规范自动返回示例响应，前端可以立即开始开发。

### 3. 验证 API 规范

```bash
# 验证规范文件格式
npx @redocly/cli lint docs/api/sync-api.yaml

# 验证实际 API 是否符合规范
prism proxy docs/api/sync-api.yaml http://localhost:3000
```

### 4. 生成客户端 SDK

```bash
# 安装 OpenAPI Generator
pnpm add -g @openapitools/openapi-generator-cli
```

### 5. 生成服务端接口

```bash
# 生成 NestJS 控制器接口
openapi-generator-cli generate \
  -i docs/api/sync-api.yaml \
  -g typescript-nestjs \
  -o apps/api/src/sync/generated
```

## 📊 API 端点概览

### 同步操作

| 方法 | 端点         | 说明         |
| ---- | ------------ | ------------ |
| POST | `/sync/push` | 推送本地变更 |
| POST | `/sync/pull` | 拉取远程变更 |

### 设备管理

| 方法   | 端点                           | 说明         |
| ------ | ------------------------------ | ------------ |
| POST   | `/sync/devices`                | 注册设备     |
| GET    | `/sync/devices`                | 获取设备列表 |
| PUT    | `/sync/devices/{id}`           | 更新设备信息 |
| DELETE | `/sync/devices/{id}`           | 远程登出     |
| POST   | `/sync/devices/{id}/heartbeat` | 设备心跳     |

### 冲突处理

| 方法 | 端点                           | 说明           |
| ---- | ------------------------------ | -------------- |
| GET  | `/sync/conflicts`              | 获取未解决冲突 |
| GET  | `/sync/conflicts/{id}`         | 获取冲突详情   |
| POST | `/sync/conflicts/{id}/resolve` | 解决冲突       |
| GET  | `/sync/conflicts/history`      | 冲突历史       |

## 🔐 认证方式

所有 API 需要在请求头中添加：

```http
Authorization: Bearer <jwt_token>
X-Device-ID: <device_uuid>
```

## 📝 使用示例

### 拉取变更

```typescript
// 增量拉取
let hasMore = true;
let lastVersion = localStorage.getItem('lastSyncVersion') || 0;

while (hasMore) {
  const response = await api.pullChanges({
    deviceId: 'your-device-uuid',
    lastSyncVersion: lastVersion,
    limit: 100,
  });

  // 应用变更到本地
  for (const change of response.data.changes) {
    await applyChange(change);
  }

  lastVersion = response.data.currentVersion;
  hasMore = response.data.hasMore;
}

localStorage.setItem('lastSyncVersion', lastVersion);
```

## 🔗 相关文档

- [EPIC-004 客户端同步设计](../sprint-artifacts/EPIC-004-offline-sync.md)
- [EPIC-005 后端同步服务设计](../sprint-artifacts/EPIC-005-backend-sync-service.md)
- [技术评审决策记录](../sprint-artifacts/tech-review/decision-log.md)

## 📋 版本历史

| 版本  | 日期       | 说明                           |
| ----- | ---------- | ------------------------------ |
| 1.0.0 | 2025-12-07 | 初始版本，基于技术评审决策创建 |

---

**维护者**: DailyUse Team  
**最后更新**: 2025-12-07

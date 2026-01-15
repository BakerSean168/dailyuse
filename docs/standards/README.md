# 代码规范索引

> 本目录包含 DailyUse 项目的所有代码规范。AI 助手和开发者必须遵循这些规范。

## 📚 规范目录

| 规范 | 说明 | 优先级 |
|------|------|--------|
| [api-response](./api-response.md) | API 响应格式统一 (`ok` vs `success`) | 🔴 高 |
| [architecture](./architecture.md) | Clean Architecture 分层与依赖规则 | 🔴 高 |
| [contracts](./contracts.md) | 类型集中在 contracts 包中定义 | 🔴 高 |
| [naming](./naming.md) | 文件、变量、类型命名规范 | 🟡 中 |
| [typescript](./typescript.md) | TypeScript 编码规范 | 🟡 中 |
| [error-handling](./error-handling.md) | 错误处理与错误码规范 | 🟡 中 |
| [testing](./testing.md) | 测试编写规范 | 🟢 低 |

## ⚡ 快速检查清单

修改代码前，确认：

- [ ] API 响应使用 `ok` 而非 `success`
- [ ] 使用 `@dailyuse/contracts` 中定义的类型
- [ ] 遵循 Clean Architecture 依赖方向
- [ ] 类型导入使用 `import type`
- [ ] 无内联类型定义

## 🔗 相关文档

- [架构概览](../ARCHITECTURE_SUMMARY.md)
- [开发指南](../development-instructions.md)

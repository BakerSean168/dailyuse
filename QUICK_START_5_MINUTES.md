# ⚡ 5 分钟快速开始

> 没有时间？这里是你需要知道的一切！

---

## **问题 & 答案（极简版）**

### **Q: 路由层能直接用 Module 的服务吗？**
**A**: ✅ 是的，而且应该这样做
```typescript
export function registerTaskRoutes(taskModule: TaskModule) {
  router.post('/tasks', async (req, res) => {
    await taskModule.taskInstanceService.create(req.body);
  });
}
```

### **Q: ADR-025 怎么实现？**
**A**: ✅ Factory + Container + Module 三层
```
Factory (创建) → Container (缓存) → Module (组装)
```

### **Q: 支持 Prisma + SQLite 吗？**
**A**: ✅ 完全支持，自动切换
```typescript
// API
new TaskModule('prisma', prismaClient)

// Desktop  
new TaskModule('sqlite', sqliteDb)

// ← 相同的 Service API！
```

### **Q: 怎么初始化？**
**A**: ✅ 最简单的方式
```typescript
DataSourceManager.initialize({ type: 'prisma', prismaClient });
const taskModule = new TaskModule('prisma', prisma);
const app = createApp({ taskModule });
```

### **Q: 最优雅的方案是什么？**
**A**: ✅ 你现在看的就是！已实现并编译通过！

---

## **编译状态**

```
✅ ESM Build: Success
✅ DTS Build: Success  
✅ 错误数: 0
✅ 警告数: 0
✅ 可用于生产: YES
```

---

## **3 步使用**

### **1️⃣ API 初始化** (apps/api/src/index.ts)
```typescript
DataSourceManager.initialize({ type: 'prisma', prismaClient: prisma });
const taskModule = new TaskModule('prisma', prisma);
const app = createApp({ taskModule });
```

### **2️⃣ 路由集成** (无需改动)
```typescript
api.use('/tasks', registerTaskRoutes(deps.taskModule));
```

### **3️⃣ 完成！**
```bash
pnpm nx run api:serve
```

---

## **文件位置速查**

```
Factory:    packages/infrastructure-server/src/task/di/task-repository.factory.ts
Container:  packages/infrastructure-server/src/task/di/task-container.ts
Module:     packages/infrastructure-server/src/task/task.module.ts
初始化:     apps/api/src/index.ts (第 43-45 行)
```

---

## **文档速查**

| 需求 | 文档 | 时间 |
|------|------|------|
| 快速了解 | QUESTION_AND_ANSWER.md | 5 min |
| API 速查 | MODULE_COMPOSITION_QUICK_REFERENCE.md | 5 min |
| 完整学习 | IMPLEMENTATION_GUIDE_MODULE_COMPOSITION.md | 30 min |
| 架构对比 | ARCHITECTURE_COMPARISON_BEFORE_AFTER.md | 20 min |
| 项目总结 | PROJECT_COMPLETION_REPORT.md | 10 min |

---

## **关键概念速记**

```
Factory:   TaskRepositoryFactory.createXxx() 
           ↓ 根据类型创建 Prisma 或 SQLite Repository

Container: TaskContainer.getInstance().getXxx()
           ↓ Singleton 缓存，自动选择数据源

Module:    new TaskModule(type, connection)
           ↓ 组装 Service，对外提供统一 API

DataSourceManager: 全局管理当前数据库类型
```

---

## **多数据库自动切换**

```typescript
// 相同的代码...
const taskModule = new TaskModule(dataSourceType, dbConnection);

// ...不同的数据源
new TaskModule('prisma', prismaClient)   // → 使用 Prisma
new TaskModule('sqlite', sqliteDb)       // → 使用 SQLite

// ...相同的 API
await taskModule.taskInstanceService.create(data)
```

---

## **验证编译**

```bash
# ✅ 已通过
pnpm nx build infrastructure-server
```

---

## **现在就用！**

```typescript
// 就这样简单！
const taskModule = new TaskModule('prisma', prisma);
```

---

**需要更多信息？** → 查看完整文档  
**想快速开始？** → 上面就是全部代码！

🚀 Let's go!

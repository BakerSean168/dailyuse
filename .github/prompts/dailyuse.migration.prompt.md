---
agent: agent
---

# DailyUse - 迁移指南

## 迁移指南

### 从单体应用到Nx Monorepo迁移

#### 迁移前准备

1. **备份数据**

   ```bash
   # 备份数据库
   pg_dump dailyuse > dailyuse_backup.sql

   # 备份代码
   git tag pre-monorepo-migration
   ```

2. **分析依赖关系**

   ```bash
   # 分析package.json依赖
   npx depcheck

   # 分析代码依赖
   npx madge --ts-config tsconfig.json src/
   ```

#### 迁移步骤

1. **初始化Nx Workspace**

   ```bash
   npx create-nx-workspace@latest dailyuse-monorepo --preset=empty --package-manager=pnpm
   cd dailyuse-monorepo
   ```

2. **迁移应用**

   ```bash
   # 创建应用
   npx nx g @nx/web:app web --framework=vue --bundler=vite
   npx nx g @nx/node:app api --framework=express
   npx nx g @nx/electron:app desktop --bundler=vite

   # 迁移源代码
   cp -r ../old-app/src/* apps/web/src/
   cp -r ../old-app/server/* apps/api/src/
   cp -r ../old-app/electron/* apps/desktop/src/
   ```

3. **迁移共享代码**

   ```bash
   # 创建共享库
   npx nx g @nx/js:lib shared-types --import-path=@dailyuse/shared-types
   npx nx g @nx/js:lib shared-utils --import-path=@dailyuse/shared-utils
   npx nx g @nx/js:lib domain-core --import-path=@dailyuse/domain-core

   # 迁移共享代码
   cp -r ../old-app/shared/* packages/shared/
   ```

4. **更新依赖**

   ```bash
   # 更新package.json
   pnpm add -D @nx/vite @nx/vue @nx/electron @nx/node
   pnpm add vue vue-router pinia @vueuse/core
   pnpm add express prisma @prisma/client
   ```

5. **配置Nx**
   ```json
   // nx.json
   {
     "namedInputs": {
       "default": ["{projectRoot}/**/*", "sharedGlobals"],
       "production": [
         "default",
         "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
         "!{projectRoot}/tsconfig.spec.json",
         "!{projectRoot}/jest.config.[jt]s",
         "!{projectRoot}/src/test-setup.[jt]s",
         "!{projectRoot}/test-setup.[jt]s",
         "!{projectRoot}/.eslintrc.json",
         "!{projectRoot}/eslint.config.js"
       ],
       "sharedGlobals": []
     },
     "targetDefaults": {
       "build": {
         "dependsOn": ["^build"],
         "inputs": ["production", "^production"],
         "cache": true
       },
       "test": {
         "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
         "cache": true
       }
     }
   }
   ```

#### 迁移后验证

1. **构建验证**

   ```bash
   # 构建所有应用
   npx nx run-many --target=build

   # 构建特定应用
   npx nx build web
   npx nx build api
   npx nx build desktop
   ```

2. **测试验证**

   ```bash
   # 运行所有测试
   npx nx run-many --target=test

   # 运行特定应用的测试
   npx nx test web
   ```

3. **依赖关系验证**

   ```bash
   # 查看项目依赖图
   npx nx graph

   # 查看特定应用的依赖
   npx nx graph --focus=web
   ```

### 从Vue2到Vue3迁移

#### 迁移前准备

1. **兼容性检查**

   ```bash
   # 检查Vue2语法
   npx vue2-migration-helper src/
   ```

2. **依赖更新**
   ```bash
   # 更新Vue相关依赖
   pnpm add vue@next vue-router@4 pinia @vue/composition-api
   pnpm add -D @vue/compiler-sfc @vue/tsconfig
   ```

#### 迁移步骤

1. **更新main.ts**

   ```typescript
   // Vue2
   import Vue from 'vue';
   import App from './App.vue';
   import router from './router';
   import store from './store';

   new Vue({
     router,
     store,
     render: (h) => h(App),
   }).$mount('#app');

   // Vue3
   import { createApp } from 'vue';
   import { createRouter, createWebHistory } from 'vue-router';
   import { createPinia } from 'pinia';
   import App from './App.vue';
   import router from './router';
   import pinia from './store';

   const app = createApp(App);
   app.use(router);
   app.use(pinia);
   app.mount('#app');
   ```

2. **组件迁移**

   ```vue
   <!-- Vue2 -->
   <template>
     <div>
       <button @click="count++">{{ count }}</button>
     </div>
   </template>

   <script>
   export default {
     data() {
       return {
         count: 0,
       };
     },
   };
   </script>

   <!-- Vue3 -->
   <template>
     <div>
       <button @click="count++">{{ count }}</button>
     </div>
   </template>

   <script setup>
   import { ref } from 'vue';

   const count = ref(0);
   </script>
   ```

3. **路由迁移**

   ```typescript
   // Vue2
   import VueRouter from 'vue-router'

   const router = new VueRouter({
     mode: 'history',
     routes: [...]
   })

   // Vue3
   import { createRouter, createWebHistory } from 'vue-router'

   const router = createRouter({
     history: createWebHistory(),
     routes: [...]
   })
   ```

4. **状态管理迁移**

   ```typescript
   // Vuex (Vue2)
   import Vuex from 'vuex';

   const store = new Vuex.Store({
     state: { count: 0 },
     mutations: {
       increment(state) {
         state.count++;
       },
     },
   });

   // Pinia (Vue3)
   import { defineStore } from 'pinia';

   export const useCounterStore = defineStore('counter', {
     state: () => ({ count: 0 }),
     actions: {
       increment() {
         this.count++;
       },
     },
   });
   ```

#### 迁移后验证

1. **类型检查**

   ```bash
   npx vue-tsc --noEmit
   ```

2. **运行时验证**
   ```bash
   npx nx serve web
   ```

### 从Express到Fastify迁移

#### 迁移前准备

1. **API分析**

   ```bash
   # 分析现有路由
   npx express-route-parser server/
   ```

2. **性能基准测试**
   ```bash
   # 记录当前性能
   npx autocannon -c 100 -d 10 http://localhost:3000/api/test
   ```

#### 迁移步骤

1. **依赖更新**

   ```bash
   pnpm add fastify @fastify/cors @fastify/helmet
   pnpm remove express cors helmet
   ```

2. **服务器迁移**

   ```typescript
   // Express
   import express from 'express';
   import cors from 'cors';
   import helmet from 'helmet';

   const app = express();
   app.use(cors());
   app.use(helmet());
   app.use(express.json());

   app.get('/api/users', (req, res) => {
     res.json({ users: [] });
   });

   app.listen(3000);

   // Fastify
   import Fastify from 'fastify';
   import cors from '@fastify/cors';
   import helmet from '@fastify/helmet';

   const fastify = Fastify({ logger: true });
   await fastify.register(cors);
   await fastify.register(helmet);

   fastify.get('/api/users', async (request, reply) => {
     return { users: [] };
   });

   await fastify.listen({ port: 3000 });
   ```

3. **路由迁移**

   ```typescript
   // Express路由
   app.get('/api/users/:id', (req, res) => {
     const { id } = req.params;
     const { filter } = req.query;
     res.json({ id, filter });
   });

   // Fastify路由
   fastify.get('/api/users/:id', async (request, reply) => {
     const { id } = request.params;
     const { filter } = request.query;
     return { id, filter };
   });
   ```

4. **中间件迁移**

   ```typescript
   // Express中间件
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.path}`);
     next();
   });

   // Fastify中间件
   fastify.addHook('preHandler', async (request, reply) => {
     console.log(`${request.method} ${request.url}`);
   });
   ```

#### 迁移后验证

1. **性能测试**

   ```bash
   # 对比性能
   npx autocannon -c 100 -d 10 http://localhost:3000/api/test
   ```

2. **功能测试**
   ```bash
   # API测试
   npx nx test api
   ```

### 数据库迁移策略

#### 从SQLite到PostgreSQL迁移

1. **数据导出**

   ```bash
   # 导出SQLite数据
   sqlite3 dailyuse.db .dump > sqlite_dump.sql
   ```

2. **模式迁移**

   ```bash
   # 生成Prisma迁移
   npx prisma migrate dev --name migrate-to-postgres
   ```

3. **数据导入**
   ```bash
   # 导入到PostgreSQL
   psql -d dailyuse < sqlite_dump.sql
   ```

#### 迁移后验证

1. **数据完整性检查**

   ```sql
   -- 检查数据量
   SELECT 'users' as table_name, COUNT(*) as count FROM users
   UNION ALL
   SELECT 'goals', COUNT(*) FROM goals
   UNION ALL
   SELECT 'tasks', COUNT(*) FROM tasks;
   ```

2. **应用功能测试**
   ```bash
   # 端到端测试
   npx nx e2e api
   ```

### 部署迁移策略

#### 从传统部署到容器化部署

1. **Dockerfile创建**

   ```dockerfile
   # 多阶段构建
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS runner
   WORKDIR /app
   COPY --from=builder /app/node_modules ./node_modules
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Docker Compose配置**

   ```yaml
   version: '3.8'
   services:
     api:
       build: ./apps/api
       ports:
         - '3000:3000'
       environment:
         - DATABASE_URL=postgresql://user:pass@db:5432/dailyuse
       depends_on:
         - db

     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=dailyuse
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=pass
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

3. **CI/CD配置**

   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Build and push Docker image
           run: |
             docker build -t dailyuse-api .
             docker tag dailyuse-api ghcr.io/username/dailyuse-api:latest
             docker push ghcr.io/username/dailyuse-api:latest
   ```

### 迁移风险控制

#### 回滚策略

1. **数据库回滚**

   ```bash
   # 创建恢复点
   pg_dump dailyuse > pre_migration_backup.sql

   # 回滚脚本
   psql -d dailyuse < pre_migration_backup.sql
   ```

2. **代码回滚**

   ```bash
   # Git回滚
   git revert HEAD~3  # 回滚最近3个提交
   git push origin main
   ```

3. **渐进式部署**
   ```bash
   # 蓝绿部署
   kubectl set image deployment/api api=ghcr.io/username/dailyuse-api:v2
   kubectl rollout status deployment/api
   ```

#### 监控和告警

1. **应用监控**

   ```typescript
   // 健康检查端点
   fastify.get('/health', async () => {
     const dbHealth = await checkDatabaseHealth();
     const cacheHealth = await checkCacheHealth();

     return {
       status: dbHealth && cacheHealth ? 'healthy' : 'unhealthy',
       timestamp: new Date().toISOString(),
       services: { database: dbHealth, cache: cacheHealth },
     };
   });
   ```

2. **性能监控**
   ```typescript
   // 响应时间监控
   fastify.addHook('onResponse', (request, reply, done) => {
     const responseTime = reply.getResponseTime();
     if (responseTime > 1000) {
       console.warn(`Slow response: ${request.method} ${request.url} - ${responseTime}ms`);
     }
     done();
   });
   ```

### 迁移时间表

#### Phase 1: 准备阶段 (1-2周)

- [ ] 备份数据和代码
- [ ] 分析依赖关系
- [ ] 制定详细迁移计划
- [ ] 搭建测试环境

#### Phase 2: 核心迁移 (2-3周)

- [ ] 初始化Nx Workspace
- [ ] 迁移应用代码
- [ ] 迁移共享库
- [ ] 更新配置文件

#### Phase 3: 测试和优化 (1-2周)

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 性能测试通过
- [ ] 端到端测试通过

#### Phase 4: 部署和监控 (1周)

- [ ] 生产环境部署
- [ ] 监控告警配置
- [ ] 回滚方案验证
- [ ] 文档更新

### 迁移后的项目结构

```
dailyuse-monorepo/
├── apps/
│   ├── web/           # Vue3 + Vite 前端应用
│   ├── api/           # Fastify API服务
│   └── desktop/       # Electron桌面应用
├── packages/
│   ├── shared-types/  # 共享类型定义
│   ├── shared-utils/  # 共享工具函数
│   ├── domain-core/   # 领域核心逻辑
│   ├── domain-client/ # 客户端领域逻辑
│   └── domain-server/ # 服务端领域逻辑
├── tools/
│   └── scripts/       # 构建和部署脚本
├── nx.json            # Nx配置
├── package.json       # 工作区配置
└── pnpm-workspace.yaml # pnpm工作区配置
```

这个迁移指南提供了从单体应用到现代Nx Monorepo的完整路径，包括技术栈升级、架构重构和部署策略。每一步都包含了具体的命令和代码示例，以及风险控制措施。

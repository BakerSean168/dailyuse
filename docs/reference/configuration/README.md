---
tags:
  - reference
  - configuration
  - environment
  - settings
description: 配置参考文档 - 环境变量、配置文件与系统设置完整说明
created: 2025-11-23T17:50:00
updated: 2025-11-23T17:50:00
---

# ⚙️ 配置参考 - Configuration Reference

> 项目配置文件、环境变量与系统设置完整参考

## 📋 目录

- [环境变量](#环境变量)
- [Nx配置](#nx配置)
- [TypeScript配置](#typescript配置)
- [数据库配置](#数据库配置)
- [应用配置](#应用配置)

---

## 🔑 环境变量

### 环境文件

项目使用多个环境文件管理不同环境的配置：

```
.env.example          # 环境变量模板
.env.local            # 本地开发（不提交）
.env.test             # 测试环境
.env.staging          # 预发布环境
.env.production       # 生产环境
```

所有 `.env*` 文件统一放在项目根目录。

### 核心环境变量

**.env.local 示例**:

```bash
# ============================================
# 应用配置
# ============================================
NODE_ENV=development
API_PORT=3000
API_PREFIX=api
API_BASE_URL=http://localhost:3000

WEB_PORT=4200
WEB_BASE_URL=http://localhost:4200

# ============================================
# 数据库配置
# ============================================
DATABASE_URL="postgresql://dailyuse:dailyuse123@localhost:5432/dailyuse_dev"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000

# ============================================
# Redis配置
# ============================================
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=dailyuse:

# ============================================
# JWT认证
# ============================================
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=dailyuse
JWT_AUDIENCE=dailyuse-api

# ============================================
# Cookie配置
# ============================================
COOKIE_SECRET="your-cookie-secret-key"
COOKIE_SECURE=false
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict
COOKIE_DOMAIN=localhost

# ============================================
# CORS配置
# ============================================
CORS_ORIGINS=http://localhost:4200,http://localhost:4300
CORS_CREDENTIALS=true

# ============================================
# 日志配置
# ============================================
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_FILE_ENABLED=false
LOG_FILE_PATH=./logs

# ============================================
# 邮件配置
# ============================================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@dailyuse.local
EMAIL_FROM_NAME=DailyUse

# ============================================
# 文件上传
# ============================================
UPLOAD_PROVIDER=local
UPLOAD_DIR=./uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# AWS S3（生产环境）
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=dailyuse-uploads

# ============================================
# 外部服务
# ============================================
# Sentry错误追踪
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Datadog监控
DATADOG_API_KEY=
DATADOG_APP_KEY=
DATADOG_SITE=datadoghq.com

# Firebase Cloud Messaging
FCM_PROJECT_ID=
FCM_PRIVATE_KEY=
FCM_CLIENT_EMAIL=

# ============================================
# 功能开关
# ============================================
FEATURE_NOTIFICATIONS_ENABLED=true
FEATURE_REMINDERS_ENABLED=true
FEATURE_SSE_ENABLED=true
FEATURE_WEBSOCKET_ENABLED=false
FEATURE_EMAIL_ENABLED=true
FEATURE_PUSH_ENABLED=false

# ============================================
# 安全配置
# ============================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

BCRYPT_SALT_ROUNDS=10
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_DIGIT=true
PASSWORD_REQUIRE_SPECIAL=true

# ============================================
# 缓存配置
# ============================================
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000

# ============================================
# 会话配置
# ============================================
SESSION_SECRET="your-session-secret-key"
SESSION_MAX_AGE=86400000
SESSION_STORE=redis

# ============================================
# API限流配置
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=5
THROTTLE_PUBLIC_LIMIT=10
```

### 环境特定配置

**生产环境** (.env.production):

```bash
NODE_ENV=production
API_PORT=3000
API_BASE_URL=https://api.dailyuse.com

DATABASE_URL="postgresql://user:pass@prod-db.cluster.amazonaws.com:5432/dailyuse_prod"
REDIS_URL="redis://prod-redis.cluster.amazonaws.com:6379"

JWT_SECRET="${AWS_SECRETS_MANAGER_JWT_SECRET}"
LOG_LEVEL=info
LOG_FORMAT=json

SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_ENVIRONMENT=production

CORS_ORIGINS=https://app.dailyuse.com
COOKIE_SECURE=true
COOKIE_DOMAIN=.dailyuse.com

UPLOAD_PROVIDER=s3
AWS_S3_BUCKET=dailyuse-prod-uploads

FEATURE_PUSH_ENABLED=true
RATE_LIMIT_ENABLED=true
```

---

## ⚡ Nx配置

### nx.json

项目根目录的Nx配置文件：

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "e2e": {
      "cache": false
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  },
  "generators": {
    "@nx/vue": {
      "application": {
        "linter": "eslint",
        "style": "scss",
        "unitTestRunner": "vitest"
      },
      "component": {
        "style": "scss"
      }
    },
    "@nx/nest": {
      "application": {
        "linter": "eslint",
        "unitTestRunner": "jest"
      }
    }
  },
  "plugins": [
    {
      "plugin": "@nx/eslint/plugin",
      "options": {
        "targetName": "lint"
      }
    }
  ],
  "defaultProject": "api",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"],
        "parallel": 4,
        "cacheDirectory": ".nx/cache"
      }
    }
  }
}
```

### 项目配置 (project.json)

**apps/api/project.json**:

```json
{
  "name": "api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/api/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/js:node",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "api:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "api:build:development"
        },
        "production": {
          "buildTarget": "api:build:production"
        }
      }
    },
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "target": "node",
        "compiler": "tsc",
        "outputPath": "dist/apps/api",
        "main": "apps/api/src/main.ts",
        "tsConfig": "apps/api/tsconfig.app.json",
        "assets": ["apps/api/src/assets"],
        "webpackConfig": "apps/api/webpack.config.js"
      },
      "configurations": {
        "development": {
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true
        },
        "production": {
          "optimization": true,
          "extractLicenses": true,
          "sourceMap": false,
          "fileReplacements": [
            {
              "replace": "apps/api/src/environments/environment.ts",
              "with": "apps/api/src/environments/environment.prod.ts"
            }
          ]
        }
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/api/jest.config.ts",
        "passWithNoTests": true
      },
      "configurations": {
        "ci": {
          "ci": true,
          "codeCoverage": true
        }
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/api/**/*.ts"]
      }
    },
    "prisma:generate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma generate",
        "cwd": "apps/api"
      }
    },
    "prisma:migrate:dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma migrate dev",
        "cwd": "apps/api"
      }
    },
    "prisma:studio": {
      "executor": "nx:run-commands",
      "options": {
        "command": "prisma studio",
        "cwd": "apps/api"
      }
    }
  },
  "tags": ["type:app", "scope:api"]
}
```

---

## 📘 TypeScript配置

### tsconfig.base.json

工作区根配置：

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2021",
    "module": "ESNext",
    "lib": ["ES2021"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@dailyuse/contracts": ["packages/contracts/src/index.ts"],
      "@dailyuse/domain-shared": ["packages/domain-shared/src/index.ts"],
      "@dailyuse/governance": ["packages/governance/src/index.ts"],
      "@dailyuse/utils": ["packages/utils/src/index.ts"],
      "@dailyuse/ui": ["packages/ui/src/index.ts"],
      "@dailyuse/assets": ["packages/assets/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

### API TypeScript配置

**apps/api/tsconfig.json**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "../../dist/out-tsc",
    "types": ["node", "jest"],
    "emitDecoratorMetadata": true,
    "target": "ES2021"
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.ts",
    "prisma/*.ts"
  ],
  "exclude": [
    "jest.config.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts"
  ]
}
```

### Web TypeScript配置

**apps/web/tsconfig.json**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "types": ["vite/client", "node"],
    "isolatedModules": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue"
  ],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

---

## 🗄️ 数据库配置

### Prisma Schema

**apps/api/prisma/schema.prisma**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  name              String
  avatar            String?
  role              UserRole  @default(USER)
  isActive          Boolean   @default(true) @map("is_active")
  isEmailVerified   Boolean   @default(false) @map("is_email_verified")
  lastLoginAt       DateTime? @map("last_login_at")
  loginAttempts     Int       @default(0) @map("login_attempts")
  lockedUntil       DateTime? @map("locked_until")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  goals             Goal[]
  tasks             Task[]
  scheduleEvents    ScheduleEvent[]
  reminders         Reminder[]
  notifications     Notification[]

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

model Goal {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  title       String
  description String?
  status      GoalStatus  @default(ACTIVE)
  progress    Int         @default(0)
  startDate   DateTime?   @map("start_date")
  endDate     DateTime?   @map("end_date")
  weight      Float       @default(1.0)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks       Task[]
  keyResults  KeyResult[]

  @@index([userId])
  @@index([status])
  @@map("goals")
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
  CANCELLED
}

// ... 其他模型定义
```

### 连接池配置

```typescript
// apps/api/src/config/prisma-client.ts
import { PrismaClient } from '@prisma/client';
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
}
```

---

## 🎛️ 应用配置

### Express配置模块

**apps/api/src/config/configuration.ts**:

```typescript
export default () => ({
  app: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    prefix: process.env.API_PREFIX || 'api',
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },
  
  database: {
    url: process.env.DATABASE_URL,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'dailyuse:',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'dailyuse',
    audience: process.env.JWT_AUDIENCE || 'dailyuse-api',
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  upload: {
    provider: process.env.UPLOAD_PROVIDER || 'local',
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [],
  },
  
  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME,
    },
  },
  
  features: {
    notifications: process.env.FEATURE_NOTIFICATIONS_ENABLED === 'true',
    reminders: process.env.FEATURE_REMINDERS_ENABLED === 'true',
    sse: process.env.FEATURE_SSE_ENABLED === 'true',
    email: process.env.FEATURE_EMAIL_ENABLED === 'true',
    push: process.env.FEATURE_PUSH_ENABLED === 'true',
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },
});
```

### Vite配置

**apps/web/vite.config.ts**:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@dailyuse/contracts': fileURLToPath(new URL('../../packages/contracts/src', import.meta.url)),
      '@dailyuse/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
    },
  },
  
  server: {
    port: 4200,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify': ['vuetify'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['@dailyuse/contracts', '@dailyuse/ui'],
  },
});
```

---

## 📚 相关文档

- [[guides/development/setup|开发环境配置]]
- [[guides/deployment/local|本地部署]]
- [[reference/cli/README|CLI命令参考]]
- [[ops/docker/DOCKER_CONFIG_UNIFIED|Docker配置]]

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0

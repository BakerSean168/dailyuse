# PRD: Desktop 账号登录系统 (Steam-Like Authentication)

## 📋 产品概述

### 产品定位
DailyUse Desktop 采用 **离线优先 (Offline-First)** + **可选云同步 (Optional Cloud Sync)** 的混合架构，类似 Steam 的登录模式：
- 🎯 **本地离线为主**：无需注册即可使用完整功能
- ☁️ **云同步为辅**：可选择注册账号，实现跨设备数据同步
- 🔒 **安全便捷**：记住登录状态，支持自动登录

---

## 🎯 核心目标

### 业务目标
1. **降低使用门槛**：用户无需注册即可立即使用
2. **提升用户粘性**：通过云同步功能吸引用户注册
3. **保护数据安全**：本地数据加密，云端数据同步安全可靠
4. **优化用户体验**：类似 Steam 的无感知登录体验

### 技术目标
1. **离线优先**：完整功能可离线使用
2. **混合认证**：支持本地账户 + 云账户并存
3. **状态同步**：登录状态持久化，自动恢复会话
4. **安全加密**：本地数据加密存储，Token 安全管理

---

## 👥 用户场景

### 场景 1：新用户首次使用（离线模式）

**用户故事**：作为新用户，我希望无需注册即可立即使用应用，体验完整功能

**用户流程**：
1. 用户下载并启动 Desktop 应用
2. 应用自动创建本地账户（`local-user`）
3. 用户直接进入主界面，开始使用

**技术实现**：
```typescript
// 首次启动自动创建本地账户
LocalAccountManager.createLocalAccount() {
  return {
    uuid: 'local-user',
    type: 'LOCAL',
    username: 'Desktop User',
    email: 'local@desktop.app',
    createdAt: Date.now(),
    isOnline: false,
  }
}
```

**验收标准**：
- ✅ 应用启动后无需任何操作即可使用
- ✅ 本地账户信息保存在本地数据库
- ✅ 所有功能可正常使用（Goal、Task、Schedule 等）

---

### 场景 2：用户注册云账户（在线模式）

**用户故事**：作为现有用户，我希望注册云账户以便在多设备间同步数据

**用户流程**：
1. 用户在设置页面点击"注册账号"
2. 填写邮箱、密码、用户名
3. 提交注册请求到 API 服务器
4. 注册成功后自动登录，本地数据迁移到云账户

**技术实现**：
```typescript
// 注册流程
async register(request: RegisterRequest) {
  // 1. 调用 API 注册
  const result = await apiClient.post('/auth/register', request);
  
  // 2. 保存 Token 和账户信息
  await TokenManager.saveTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
  });
  
  // 3. 迁移本地数据
  await DataMigration.migrateLocalToCloud({
    localAccountUuid: 'local-user',
    cloudAccountUuid: result.account.uuid,
  });
  
  // 4. 切换到云账户
  await AuthStateManager.switchToCloudAccount(result.account);
}
```

**数据迁移策略**：
- 本地 Goal/Task 数据关联到云账户
- 保留本地账户作为备份
- 标记数据已同步，避免重复上传

**验收标准**：
- ✅ 注册成功后本地数据完整迁移
- ✅ 数据同步到云端
- ✅ UI 显示云账户信息（头像、用户名）

---

### 场景 3：用户登录已有云账户

**用户故事**：作为已注册用户，我在新设备上登录以同步数据

**用户流程**：
1. 用户点击"登录"
2. 输入邮箱和密码
3. 登录成功后，云端数据自动同步到本地
4. 应用显示云账户信息

**技术实现**：
```typescript
async login(credentials: LoginCredentials) {
  // 1. 调用 API 登录
  const result = await apiClient.post('/auth/login', {
    identifier: credentials.email,
    password: credentials.password,
    deviceInfo: {
      deviceId: await DeviceId.get(),
      deviceName: os.hostname(),
      deviceType: 'desktop',
      os: process.platform,
      appVersion: app.getVersion(),
    },
  });
  
  // 2. 保存 Session
  await SessionManager.saveSession({
    accountUuid: result.account.uuid,
    sessionUuid: result.session.uuid,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
  });
  
  // 3. 启动数据同步
  await SyncManager.startSync();
  
  // 4. 更新 UI 状态
  await AuthStateManager.setCloudAccount(result.account);
}
```

**会话管理**：
- Session 保存在本地数据库
- Token 存储在加密文件
- 支持 30 天自动续期

**验收标准**：
- ✅ 登录成功后显示云账户信息
- ✅ 云端数据自动同步到本地
- ✅ Session 持久化，下次启动自动登录

---

### 场景 4：自动登录（记住密码）

**用户故事**：作为已登录用户，我希望下次启动应用时自动登录

**用户流程**：
1. 用户启动应用
2. 应用检测到有效的 Session
3. 自动恢复登录状态（无需输入密码）
4. 在后台刷新 Token

**技术实现**：
```typescript
async autoLogin() {
  // 1. 读取本地 Session
  const session = await SessionManager.getActiveSession();
  
  if (!session) {
    // 无 Session，使用本地账户
    return await this.useLocalAccount();
  }
  
  // 2. 检查 Token 是否过期
  if (session.isExpired()) {
    // Token 过期，尝试刷新
    try {
      const newToken = await this.refreshToken(session.refreshToken);
      await SessionManager.updateSession(newToken);
    } catch (error) {
      // 刷新失败，回退到本地账户
      return await this.useLocalAccount();
    }
  }
  
  // 3. 恢复登录状态
  await AuthStateManager.restoreSession(session);
  
  // 4. 启动后台同步
  SyncManager.startBackgroundSync();
}
```

**Token 刷新策略**：
- Access Token 有效期：1 小时
- Refresh Token 有效期：30 天
- 自动刷新：Token 过期前 10 分钟自动刷新

**验收标准**：
- ✅ 应用启动后自动恢复登录状态
- ✅ Token 过期前自动刷新
- ✅ 无网络时回退到本地账户

---

### 场景 5：离线模式 & 在线模式切换

**用户故事**：作为用户，我希望在无网络时继续使用应用，有网络时自动同步

**离线模式**：
- 所有数据保存在本地数据库
- UI 显示"离线模式"标识
- 记录本地修改，待联网后同步

**在线模式**：
- 实时同步数据到云端
- UI 显示"已同步"标识
- 冲突检测与解决

**模式切换逻辑**：
```typescript
class NetworkStateManager {
  private isOnline = navigator.onLine;
  
  initialize() {
    // 监听网络状态变化
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  async handleOnline() {
    // 1. 网络恢复，尝试刷新 Token
    await TokenManager.refreshIfNeeded();
    
    // 2. 启动数据同步
    await SyncManager.syncPendingChanges();
    
    // 3. 更新 UI 状态
    EventBus.emit('network:online');
  }
  
  async handleOffline() {
    // 1. 切换到离线模式
    await AuthStateManager.switchToOfflineMode();
    
    // 2. 停止同步
    SyncManager.pauseSync();
    
    // 3. 更新 UI 状态
    EventBus.emit('network:offline');
  }
}
```

**验收标准**：
- ✅ 离线时所有功能正常使用
- ✅ 联网后自动同步数据
- ✅ UI 清晰显示当前模式

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Desktop App                         │
│  ┌────────────────────────────────────────────────────┐│
│  │              Renderer Process (UI)                 ││
│  │  ┌──────────────┐  ┌────────────────────────────┐ ││
│  │  │ Login View   │  │  Auth Status Indicator     │ ││
│  │  └──────────────┘  └────────────────────────────┘ ││
│  │  ┌────────────────────────────────────────────────┐││
│  │  │        Auth Store (Zustand)                    │││
│  │  │  - currentUser: User | null                    │││
│  │  │  - authMode: 'local' | 'cloud'                 │││
│  │  │  - isOnline: boolean                           │││
│  │  └────────────────────────────────────────────────┘││
│  └────────────────────────────────────────────────────┘│
│         │                                    ▲          │
│         │ IPC                                │ IPC      │
│         ▼                                    │          │
│  ┌────────────────────────────────────────────────────┐│
│  │              Main Process (Node.js)                ││
│  │  ┌────────────────────────────────────────────┐   ││
│  │  │  AuthenticationModule                      │   ││
│  │  │  - login()                                 │   ││
│  │  │  - register()                              │   ││
│  │  │  - logout()                                │   ││
│  │  │  - autoLogin()                             │   ││
│  │  └────────────────────────────────────────────┘   ││
│  │  ┌────────────────────────────────────────────┐   ││
│  │  │  AccountModule                             │   ││
│  │  │  - LocalAccountManager                     │   ││
│  │  │  - CloudAccountManager                     │   ││
│  │  └────────────────────────────────────────────┘   ││
│  │  ┌────────────────────────────────────────────┐   ││
│  │  │  SessionManager                            │   ││
│  │  │  - sessions (SQLite)                       │   ││
│  │  │  - accessToken, refreshToken               │   ││
│  │  └────────────────────────────────────────────┘   ││
│  │  ┌────────────────────────────────────────────┐   ││
│  │  │  TokenManager                              │   ││
│  │  │  - 加密存储 Token                           │   ││
│  │  │  - 自动刷新逻辑                             │   ││
│  │  └────────────────────────────────────────────┘   ││
│  │  ┌────────────────────────────────────────────┐   ││
│  │  │  LocalDatabase (SQLite)                    │   ││
│  │  │  - accounts                                │   ││
│  │  │  - sessions                                │   ││
│  │  │  - sync_log                                │   ││
│  │  └────────────────────────────────────────────┘   ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
         │                                      ▲
         │ HTTPS                                │
         ▼                                      │
┌─────────────────────────────────────────────────────────┐
│                  API Server (Backend)                    │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │  Auth API       │  │  Account API                 │ │
│  │  - /auth/login  │  │  - /accounts/me              │ │
│  │  - /auth/       │  │  - /accounts/{uuid}          │ │
│  │    register     │  └──────────────────────────────┘ │
│  │  - /auth/       │                                    │
│  │    refresh      │  ┌──────────────────────────────┐ │
│  │  - /auth/logout │  │  Sync API                    │ │
│  └─────────────────┘  │  - /sync/pull                │ │
│                       │  - /sync/push                │ │
│                       └──────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database                    │  │
│  │  - accounts                                      │  │
│  │  - auth_sessions                                 │  │
│  │  - auth_credentials                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 数据模型

### 本地数据库 Schema (SQLite)

#### accounts 表
```sql
CREATE TABLE IF NOT EXISTS accounts (
  uuid TEXT PRIMARY KEY,
  type TEXT NOT NULL,              -- 'LOCAL' | 'CLOUD'
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_path TEXT,
  cloud_account_uuid TEXT,         -- 关联的云账户 UUID
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### sessions 表
```sql
CREATE TABLE IF NOT EXISTS sessions (
  uuid TEXT PRIMARY KEY,
  account_uuid TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_accessed_at INTEGER NOT NULL,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid)
);
```

#### auth_credentials 表 (可选，用于本地密码)
```sql
CREATE TABLE IF NOT EXISTS auth_credentials (
  account_uuid TEXT PRIMARY KEY,
  password_hash TEXT,              -- 本地密码哈希（可选）
  salt TEXT,
  last_password_change INTEGER,
  FOREIGN KEY (account_uuid) REFERENCES accounts(uuid)
);
```

---

### 云端数据库 Schema (PostgreSQL)

#### accounts 表
```sql
CREATE TABLE accounts (
  uuid UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  profile JSONB,
  preferences JSONB,
  storage JSONB,
  security JSONB,
  history JSONB,
  stats JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### auth_sessions 表
```sql
CREATE TABLE auth_sessions (
  uuid UUID PRIMARY KEY,
  account_uuid UUID NOT NULL REFERENCES accounts(uuid),
  access_token TEXT NOT NULL,
  access_token_expires_at TIMESTAMP NOT NULL,
  refresh_token TEXT NOT NULL,
  refresh_token_expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  device JSONB,
  ip_address VARCHAR(45),
  user_agent JSONB,
  history JSONB,
  last_accessed_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

#### auth_credentials 表
```sql
CREATE TABLE auth_credentials (
  account_uuid UUID PRIMARY KEY REFERENCES accounts(uuid),
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  password_algorithm VARCHAR(20) DEFAULT 'bcrypt',
  password_created_at TIMESTAMP NOT NULL,
  password_updated_at TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  failed_attempts INTEGER DEFAULT 0,
  locked_at TIMESTAMP,
  last_login_at TIMESTAMP
);
```

---

## 🔐 安全设计

### Token 管理

**Access Token**:
- 有效期：1 小时
- 存储位置：内存 + 加密文件
- 用途：API 请求认证

**Refresh Token**:
- 有效期：30 天
- 存储位置：本地数据库（sessions 表）
- 用途：刷新 Access Token

**Token 加密存储**:
```typescript
class TokenManager {
  private static ENCRYPTION_KEY = 'derived-from-machine-id';
  
  // 加密存储 Token
  static async saveTokens(tokens: Tokens) {
    const encrypted = await crypto.encrypt(
      JSON.stringify(tokens),
      this.ENCRYPTION_KEY
    );
    
    await fs.writeFile(
      path.join(app.getPath('userData'), 'tokens.enc'),
      encrypted
    );
  }
  
  // 解密读取 Token
  static async loadTokens(): Promise<Tokens | null> {
    try {
      const encrypted = await fs.readFile(
        path.join(app.getPath('userData'), 'tokens.enc')
      );
      
      const decrypted = await crypto.decrypt(
        encrypted,
        this.ENCRYPTION_KEY
      );
      
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }
}
```

### 密码安全

**本地密码（可选功能）**:
- 算法：bcrypt (saltRounds = 10)
- 用途：本地数据加密（如用户希望多人共用一台电脑）
- 存储：auth_credentials 表

**云端密码**:
- 算法：bcrypt (saltRounds = 12)
- 传输：HTTPS 加密
- 存储：API 服务器 auth_credentials 表

### 设备指纹

```typescript
class DeviceId {
  // 生成设备唯一标识
  static async get(): Promise<string> {
    const machineId = await getMachineId();
    const hostname = os.hostname();
    const platform = os.platform();
    
    return crypto
      .createHash('sha256')
      .update(`${machineId}-${hostname}-${platform}`)
      .digest('hex');
  }
}
```

---

## 🔄 同步策略

### 数据同步流程

**Push (上传)**:
```typescript
async syncPush() {
  // 1. 获取本地待同步数据
  const pendingChanges = await SyncLog.getPendingChanges();
  
  // 2. 批量上传到服务器
  const result = await apiClient.post('/sync/push', {
    changes: pendingChanges,
    deviceId: await DeviceId.get(),
    lastSyncVersion: await SyncState.getVersion(),
  });
  
  // 3. 更新同步状态
  await SyncLog.markAsSynced(result.syncedIds);
  await SyncState.updateVersion(result.newVersion);
}
```

**Pull (下载)**:
```typescript
async syncPull() {
  // 1. 获取服务器最新数据
  const result = await apiClient.post('/sync/pull', {
    lastSyncVersion: await SyncState.getVersion(),
    deviceId: await DeviceId.get(),
  });
  
  // 2. 应用到本地数据库
  for (const change of result.changes) {
    await this.applyChange(change);
  }
  
  // 3. 更新同步版本
  await SyncState.updateVersion(result.newVersion);
}
```

### 冲突解决

**冲突检测**:
- 比较 `updated_at` 时间戳
- 服务器时间为准

**解决策略**:
1. **Last-Write-Wins**：最新修改优先（默认）
2. **Manual Merge**：用户手动选择（复杂数据）
3. **Keep Both**：保留两个版本（特殊情况）

---

## 📱 UI/UX 设计

### 登录界面

**初次启动（离线模式）**:
```
┌─────────────────────────────────────────┐
│          欢迎使用 DailyUse              │
│                                         │
│   ┌───────────────────────────────┐    │
│   │                               │    │
│   │   🎉 立即开始使用              │    │
│   │   无需注册，所有功能可用       │    │
│   │                               │    │
│   └───────────────────────────────┘    │
│                                         │
│   已经有账号？ [登录]                   │
└─────────────────────────────────────────┘
```

**登录界面**:
```
┌─────────────────────────────────────────┐
│          登录 DailyUse                  │
│                                         │
│   邮箱: [________________]              │
│   密码: [________________]              │
│                                         │
│   [x] 记住我                            │
│                                         │
│   [          登录          ]           │
│                                         │
│   还没有账号？ [注册]                   │
│   忘记密码？ [重置密码]                 │
└─────────────────────────────────────────┘
```

**注册界面**:
```
┌─────────────────────────────────────────┐
│          注册 DailyUse                  │
│                                         │
│   用户名: [________________]            │
│   邮箱:   [________________]            │
│   密码:   [________________]            │
│   确认:   [________________]            │
│                                         │
│   [x] 我同意服务条款和隐私政策          │
│                                         │
│   [          注册          ]           │
│                                         │
│   已有账号？ [登录]                     │
└─────────────────────────────────────────┘
```

### 账户状态指示器

**离线模式**:
```
┌────────────────┐
│ 👤 本地用户    │
│ 🔒 离线模式    │
└────────────────┘
```

**在线模式**:
```
┌────────────────┐
│ 👤 张三        │
│ ✅ 已同步      │
└────────────────┘
```

**同步中**:
```
┌────────────────┐
│ 👤 张三        │
│ 🔄 同步中...   │
└────────────────┘
```

---

## 🧪 测试计划

### 功能测试

**登录测试**:
- ✅ 正确的邮箱+密码 → 登录成功
- ✅ 错误的密码 → 提示错误
- ✅ 不存在的邮箱 → 提示错误
- ✅ 记住我 → 下次自动登录

**注册测试**:
- ✅ 合法信息 → 注册成功
- ✅ 已存在的邮箱 → 提示错误
- ✅ 弱密码 → 提示加强密码
- ✅ 注册后自动登录

**Token 测试**:
- ✅ Token 过期前 10 分钟自动刷新
- ✅ Refresh Token 过期后回退到登录界面
- ✅ Token 刷新失败后回退到本地模式

**同步测试**:
- ✅ 本地修改自动上传
- ✅ 云端修改自动下载
- ✅ 冲突正确解决
- ✅ 离线修改在联网后同步

---

## 📅 实施计划

### Phase 1: 基础架构 (Week 1-2)

**Sprint 1.1: 数据库 Schema**
- [ ] 创建本地数据库表（accounts, sessions, auth_credentials）
- [ ] 编写数据库迁移脚本
- [ ] 实现 Repository 层

**Sprint 1.2: Token 管理**
- [ ] 实现 TokenManager（加密存储、解密读取）
- [ ] 实现 SessionManager（Session CRUD）
- [ ] 实现 Token 自动刷新逻辑

---

### Phase 2: 认证功能 (Week 3-4)

**Sprint 2.1: 本地账户**
- [ ] 实现 LocalAccountManager
- [ ] 首次启动自动创建本地账户
- [ ] 本地账户持久化

**Sprint 2.2: 在线认证**
- [ ] 实现注册接口调用
- [ ] 实现登录接口调用
- [ ] 实现登出逻辑
- [ ] 实现自动登录

---

### Phase 3: UI 实现 (Week 5-6)

**Sprint 3.1: 登录/注册界面**
- [ ] 设计登录界面
- [ ] 设计注册界面
- [ ] 实现表单验证
- [ ] 实现错误提示

**Sprint 3.2: 账户状态指示器**
- [ ] 实现离线/在线状态显示
- [ ] 实现同步进度显示
- [ ] 实现账户信息展示

---

### Phase 4: 同步功能 (Week 7-8)

**Sprint 4.1: 数据迁移**
- [ ] 本地数据迁移到云账户
- [ ] 云端数据下载到本地
- [ ] 冲突检测与解决

**Sprint 4.2: 后台同步**
- [ ] 实现 SyncManager
- [ ] 实现增量同步
- [ ] 实现网络状态监听

---

### Phase 5: 测试 & 优化 (Week 9-10)

**Sprint 5.1: 功能测试**
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 手动测试所有场景

**Sprint 5.2: 性能优化**
- [ ] 优化 Token 刷新逻辑
- [ ] 优化数据同步性能
- [ ] 优化 UI 响应速度

---

## 📊 成功指标

### 业务指标
- **注册转化率**: ≥ 30% (离线用户转为注册用户)
- **登录成功率**: ≥ 98%
- **用户满意度**: ≥ 4.5/5

### 技术指标
- **自动登录成功率**: ≥ 99%
- **Token 刷新成功率**: ≥ 99.5%
- **同步成功率**: ≥ 98%
- **平均同步时间**: ≤ 3 秒

---

## 🔗 相关文档

- [Account Module API 文档](./API-ACCOUNT.md)
- [Authentication Module API 文档](./API-AUTH.md)
- [Sync Module 设计文档](./SYNC-DESIGN.md)
- [安全最佳实践](./SECURITY-BEST-PRACTICES.md)

---

**文档版本**: v1.0  
**最后更新**: 2026-01-13  
**负责人**: DailyUse Team

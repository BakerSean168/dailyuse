# Domain-Server 包重构状态与规划

**当前日期**: 2026年2月4日  
**状态**: 部分完成，进行中

---

## 📊 重构进度总览

| 模块 | 状态 | 完成度 | 备注 |
|------|------|-------|------|
| **Account** ✅ | 已完成 | 100% | 完整实现 AccountServer 聚合根 |
| **Authentication** ✅ | 已完成 | 100% | AuthIdentity & AuthSession 聚合根 |
| **Goal** ⚠️ | 部分完成 | ~40% | 老代码风格，需要现代化 |
| **Task** 🔴 | 未开始 | 0% | TaskInstance/TaskTemplate 需重构 |
| **Dashboard** 🔴 | 未开始 | 0% | DashboardConfig 需重构 |
| **Editor** 🔴 | 未开始 | 0% | EditorWorkspace 需重构 |
| **AI** 🔴 | 未开始 | 0% | 需评估 |
| **Notification** 🔴 | 未开始 | 0% | 需评估 |
| **Reminder** 🔴 | 未开始 | 0% | 需评估 |
| **Schedule** 🔴 | 未开始 | 0% | 需评估 |
| **Setting** 🔴 | 未开始 | 0% | 需评估 |
| **Sync** 🔴 | 未开始 | 0% | 需评估 |

---

## ✅ 已完成模块详情

### 1. Account 模块
**文件**: `packages/domain-server/src/account/aggregates/account.ts`

**已实现特性**:
- ✅ AccountServer 聚合根 (Rich Domain Model)
- ✅ 私有 backing fields + 公共 getters
- ✅ Private constructor + 工厂方法模式
- ✅ 值对象集成 (AccountProfile, ContactEmail, AccountSettings, 等)
- ✅ 符合 DDD 依赖规则 (无基础设施依赖)

**关键特点**:
```typescript
// 强制不变量、状态管理、值对象
class Account extends AggregateRoot<IdentityId> implements AccountServer {
  private _profile: AccountProfile;
  private _email: ContactEmail;
  private _settings: AccountSettings;
  
  private constructor(props: AccountServerDTO) { ... }
  
  public static create(params): Account { ... }
  public static reconstruct(dto): Account { ... }
}
```

### 2. Authentication 模块
**文件**: 
- `packages/domain-server/src/authentication/aggregates/auth-identity.ts`
- `packages/domain-server/src/authentication/aggregates/auth-session.ts`

**已实现特性**:
- ✅ AuthIdentity 聚合根 (凭证管理)
- ✅ AuthSession 聚合根 (会话管理)
- ✅ 多种凭证支持 (密码、OAuth、手机)
- ✅ 子实体管理 (AuthCredential, PasswordCredential, OAuthCredential, PhoneCredential)
- ✅ 业务规则强制 (最大登录失败次数、锁定逻辑)
- ✅ 领域事件发出

**关键特点**:
```typescript
// 管理凭证生命周期，强制业务规则
class AuthIdentity extends AggregateRoot<IdentityId> implements AuthIdentityServer {
  private _credentials: AuthCredentialServer[];
  private _failedLoginAttempts: number;
  private _lockedUntil: Date | null;
  
  // 复杂的凭证管理逻辑
  public addCredential(cred): void { ... }
  public removeCredential(credId): void { ... }
  public isLocked(): boolean { ... }
}
```

---

## 🎯 示例代码参考（Example 包）

**位置**: `packages/example-sample/src/domain-server/`

**提供的示例**:
1. **aggregates/example.ts** (380行) - 完整聚合根模板
   - 详细的文档说明
   - 所有必要的模式：Backing Fields, 工厂方法, 值对象, 领域事件
   - 展示时间类型处理 (DomainDate vs TransferDate vs PersistenceDate)

2. **services/feature-one.ts** - 服务示例
3. **entities/index.ts** - 子实体示例

**关键示例模式**:
```typescript
// 1. 时间字段类型管理
private _createdAt: DomainDate;   // ✅ 内部使用 DomainDate
// 转换为 DTO 时转换格式

// 2. 私有构造函数强制工厂模式
private constructor(props: ExampleServerDTO) { ... }

// 3. 工厂方法
public static create(params): Example { ... }
public static reconstruct(dto): Example { ... }

// 4. 子实体集合管理
private _exampleTags: ExampleTag[] = [];
public get tags(): readonly ExampleTag[] { return this._exampleTags; }

// 5. 领域事件
this.addDomainEvent(new ExampleCreatedEvent(...));
```

---

## 🚀 建议的下一步行动

### 第一阶段：收集更多信息
1. **检查现有代码风格**
   - 查看 Goal 聚合根当前实现（1195行）
   - 比对与 Account/Authentication 的差异
   - 评估所需的改造工作量

2. **评估其他模块**
   - Task: 需要 TaskInstance/TaskTemplate 重构
   - Dashboard: DashboardConfig 规模评估
   - Editor: EditorWorkspace 复杂度评估

### 第二阶段：制定优先级
**建议优先级** (基于依赖关系和使用频率):
1. **Task** - 核心业务模块，依赖最多
2. **Goal** - 现代化升级（已有基础）
3. **Reminder** - Task 的依赖
4. **Schedule** - Task 的依赖
5. **Dashboard** - 相对独立
6. **Editor** - 中等复杂度
7. **Notification** / **AI** / **Sync** - 后续

### 第三阶段：逐个重构
每个模块按照统一的模式：
1. 复制 Account/Authentication 的结构
2. 参考 Example 包的模式
3. 实现 Server 接口
4. 添加领域事件
5. 写单元测试

---

## 📋 重构模板检查清单

重构时需要确保的要点：

```typescript
// ✅ 类声明与接口实现
export class [Name] extends AggregateRoot<[IdType]> implements [NameServer] {

  // ✅ 1. Backing Fields（私有，加下划线前缀）
  private _fieldName: TypeName;
  
  // ✅ 2. 私有构造函数
  private constructor(props: [Name]ServerDTO) {
    super(/* id */);
    // 从 DTO 初始化
  }
  
  // ✅ 3. 公共 Getters
  public get fieldName(): TypeName { return this._fieldName; }
  
  // ✅ 4. 工厂方法 (至少两个)
  public static create(params): [Name] { ... }
  public static reconstruct(dto): [Name] { ... }
  
  // ✅ 5. 业务方法 (强制不变量)
  public businessMethod(): void {
    // 验证不变量
    if (!this.isValidState()) {
      throw new InvalidStateError(...);
    }
    // 修改状态
    this._fieldName = newValue;
    // 发出事件
    this.addDomainEvent(new EventClass(...));
  }
  
  // ✅ 6. 持久化转换
  public toDTO(): [Name]ServerDTO { ... }
  public toPersistenceDTO(): [Name]PersistenceDTO { ... }
}
```

---

## 🤔 下一步建议

**请告诉我**:
1. 你想从哪个模块开始重构？(Task / Goal / Dashboard / Editor / 其他)
2. 是否需要我先分析某个特定模块的当前代码？
3. 是否需要生成完整的重构计划文档？
4. 是否需要我协助实现某个模块的重构？

---

## 📚 相关文档

- Account 实现: [account.ts](../../packages/domain-server/src/account/aggregates/account.ts)
- Authentication 实现: [auth-identity.ts](../../packages/domain-server/src/authentication/aggregates/auth-identity.ts)
- Example 参考: [example.ts](../../packages/example-sample/src/domain-server/aggregates/example.ts)
- 现有 Goal: [goal.ts](../../packages/domain-server/src/goal/aggregates/goal.ts) (1195 行)

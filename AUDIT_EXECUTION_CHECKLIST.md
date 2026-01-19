# 执行清单 - Web 应用代码提取和清理

**状态**: 准备就绪  
**优先级**: 高  
**预计时间**: 4-6 小时（包括测试）

---

## 📋 预检查清单

在开始之前，确保完成以下事项：

- [ ] 创建新的 Git 分支: `git checkout -b refactor/extract-app-infra-layers`
- [ ] 查看审计报告: [AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md](AUDIT_APPLICATION_INFRASTRUCTURE_LAYERS.md)
- [ ] 备份当前状态: `git add . && git commit -m "backup: before app/infra extraction"`
- [ ] 确保所有测试通过: `npm run test`
- [ ] 检查是否有未提交的更改: `git status`

---

## 🔧 第 1 阶段: 验证 packages 中的实现

### 步骤 1.1: 验证 packages/infrastructure-client

```bash
# 检查每个模块是否有对应的实现
cd /workspaces/dailyuse

for module in account ai authentication goal notification reminder repository schedule setting task; do
  echo "=== $module ==="
  ls -la packages/infrastructure-client/src/$module/ 2>/dev/null | head -5
done
```

**预期结果**: 每个模块都应该有对应的 adapter 和 port 文件

- [ ] account: 存在
- [ ] ai: 存在
- [ ] authentication: 存在
- [ ] goal: 存在
- [ ] notification: 存在
- [ ] reminder: 存在
- [ ] repository: 存在
- [ ] schedule: 存在
- [ ] setting: 存在
- [ ] task: 存在

### 步骤 1.2: 验证 packages/application-client

```bash
for module in account ai authentication goal notification reminder repository schedule setting task; do
  echo "=== $module ==="
  ls -la packages/application-client/src/$module/ 2>/dev/null | head -5
done
```

**预期结果**: 每个模块都应该有对应的 services 文件

- [ ] account: 存在
- [ ] ai: 存在
- [ ] authentication: 存在
- [ ] goal: 存在
- [ ] notification: 存在
- [ ] reminder: 存在
- [ ] repository: 存在
- [ ] schedule: 存在
- [ ] setting: 存在
- [ ] task: 存在

### 步骤 1.3: 检查导出完整性

```bash
# 验证所有必要的导出都存在
cat packages/infrastructure-client/src/index.ts | grep -E "^export|from.*account|from.*ai"
cat packages/application-client/src/index.ts | grep -E "^export|from.*account|from.*ai"
```

**预期结果**:

- [ ] infrastructure-client 导出了所有模块
- [ ] application-client 导出了所有模块

---

## 🗑️ 第 2 阶段: 删除重复的 API 客户端

### 步骤 2.1: Account 模块

```bash
# 检查当前文件
ls -la apps/web/src/modules/account/infrastructure/api/

# 删除重复实现
rm -f apps/web/src/modules/account/infrastructure/api/accountApiClient.ts
rm -f apps/web/src/modules/account/infrastructure/api/ApiClient.ts

# 更新 index.ts - 改为从 packages 导入
cat > apps/web/src/modules/account/infrastructure/api/index.ts << 'EOF'
/**
 * Account Infrastructure Layer Exports
 * 账户基础设施层导出
 */

export { accountApiClient, AccountApiClient } from '@dailyuse/infrastructure-client/account';
EOF
```

**验证**:

- [ ] accountApiClient.ts 已删除
- [ ] index.ts 已更新为从 packages 导入

### 步骤 2.2: AI 模块

```bash
# 删除 API 客户端
rm -f apps/web/src/modules/ai/infrastructure/api/aiProviderApiClient.ts
rm -f apps/web/src/modules/ai/infrastructure/api/aiGenerationApiClient.ts
rm -f apps/web/src/modules/ai/infrastructure/api/goalGenerationApiClient.ts
rm -f apps/web/src/modules/ai/infrastructure/api/aiConversationApiClient.ts

# 更新 index.ts
# (创建新的 index.ts，从 packages 重新导出)
```

**验证**:

- [ ] 所有 4 个 API 客户端文件已删除

### 步骤 2.3: Authentication 模块

```bash
# 删除
rm -f apps/web/src/modules/authentication/infrastructure/api/authApiClient.ts
rm -f apps/web/src/modules/authentication/infrastructure/api/ApiClient.ts

# 更新 index.ts
cat > apps/web/src/modules/authentication/infrastructure/api/index.ts << 'EOF'
/**
 * Authentication Infrastructure Layer Exports
 */

export * from '@dailyuse/infrastructure-client/authentication';
EOF
```

**验证**:

- [ ] authApiClient.ts 已删除
- [ ] index.ts 已更新

### 步骤 2.4: Goal 模块

```bash
# 删除
rm -f apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts
rm -f apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts
rm -f apps/web/src/modules/goal/infrastructure/api/focusModeApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] 3 个 API 客户端文件已删除

### 步骤 2.5: Notification 模块

```bash
# 删除
rm -f apps/web/src/modules/notification/infrastructure/api/notificationApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] notificationApiClient.ts 已删除

### 步骤 2.6: Repository 模块

```bash
# 删除
rm -f apps/web/src/modules/repository/infrastructure/api/repositoryApiClient.ts
rm -f apps/web/src/modules/repository/infrastructure/api/ResourceApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] 2 个 API 客户端文件已删除

### 步骤 2.7: Schedule 模块

```bash
# 删除
rm -f apps/web/src/modules/schedule/infrastructure/api/scheduleApiClient.ts
rm -f apps/web/src/modules/schedule/infrastructure/api/scheduleEventApiClient.ts
rm -f apps/web/src/modules/schedule/infrastructure/api/scheduleTaskApi.ts

# 更新 index.ts
```

**验证**:

- [ ] 3 个 API 客户端文件已删除

### 步骤 2.8: Setting 模块

```bash
# 删除
rm -f apps/web/src/modules/setting/infrastructure/api/userPreferencesApi.ts
rm -f apps/web/src/modules/setting/infrastructure/api/SettingSyncApiClient.ts
rm -f apps/web/src/modules/setting/infrastructure/api/userSettingApi.ts
rm -f apps/web/src/modules/setting/infrastructure/api/userSettingApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] 4 个 API 客户端文件已删除

### 步骤 2.9: Task 模块

```bash
# 删除
rm -f apps/web/src/modules/task/infrastructure/api/taskApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] taskApiClient.ts 已删除

### 步骤 2.10: Reminder 模块

```bash
# 删除
rm -f apps/web/src/modules/reminder/infrastructure/api/reminderApiClient.ts

# 更新 index.ts
```

**验证**:

- [ ] reminderApiClient.ts 已删除

### 清理空目录

```bash
# 删除可能为空的目录（但保留 index.ts）
find apps/web/src/modules -type d -empty -delete
```

**验证**:

- [ ] 没有空目录

---

## 📝 第 3 阶段: 更新导入语句

### 步骤 3.1: 更新 Account 模块的导入

```bash
# 在 accountEventHandlers.ts 中
# 检查导入
grep "accountApiClient" apps/web/src/modules/account/application/events/accountEventHandlers.ts

# 更新为
sed -i "s|from '../../infrastructure/api/accountApiClient'|from '@dailyuse/infrastructure-client/account'|g" \
  apps/web/src/modules/account/application/events/accountEventHandlers.ts
```

**验证**:

- [ ] 导入已更新

### 步骤 3.2: 其他模块的导入

对于每个 Composables 文件，检查是否有本地基础设施导入：

```bash
# 检查所有导入
grep -r "from '.*infrastructure" apps/web/src/modules/*/presentation/composables --include="*.ts"

# 替换为 packages 导入
# (这通常已经完成，但需要验证)
```

**验证**:

- [ ] 没有从本地 infrastructure 导入

---

## 🧪 第 4 阶段: 测试验证

### 步骤 4.1: Linting

```bash
cd /workspaces/dailyuse

# 运行 eslint
npm run lint

# 预期结果: 没有 "Cannot find module" 错误
```

**验证**:

- [ ] 没有导入相关的 lint 错误
- [ ] 没有 TypeScript 编译错误

### 步骤 4.2: 构建

```bash
# 构建 Web 应用
npm run build:web

# 或单独构建
cd apps/web
npm run build
```

**验证**:

- [ ] 构建成功
- [ ] 没有运行时错误

### 步骤 4.3: 运行测试

```bash
# 运行所有测试
npm run test

# 或运行特定模块的测试
npm run test -- account
npm run test -- ai
# ... 等等
```

**预期结果**: 所有测试通过

**验证**:

- [ ] Account 模块测试通过
- [ ] AI 模块测试通过
- [ ] Authentication 模块测试通过
- [ ] Goal 模块测试通过
- [ ] Notification 模块测试通过
- [ ] Reminder 模块测试通过
- [ ] Repository 模块测试通过
- [ ] Schedule 模块测试通过
- [ ] Setting 模块测试通过
- [ ] Task 模块测试通过

### 步骤 4.4: 本地开发测试

```bash
# 启动开发服务器
npm run dev

# 手动测试：
# 1. 登录账户
# 2. 检查浏览器控制台是否有错误
# 3. 测试各个模块的功能
# 4. 检查网络请求是否正常
```

**验证**:

- [ ] Web 应用启动正常
- [ ] 浏览器控制台无错误
- [ ] 各模块功能正常
- [ ] API 调用正常

### 步骤 4.5: 检查导入引用

```bash
# 验证没有遗漏的 API 客户端导入
grep -r "from '.*accountApiClient'" apps/web/src/modules --include="*.ts"
grep -r "from '.*goalApiClient'" apps/web/src/modules --include="*.ts"
grep -r "from '.*taskApiClient'" apps/web/src/modules --include="*.ts"

# 预期结果: 没有匹配项（都应该从 packages 导入）
```

**验证**:

- [ ] 没有遗漏的本地 API 客户端导入

---

## 📊 第 5 阶段: 代码审查和文档更新

### 步骤 5.1: 代码审查

```bash
# 查看所有更改
git diff apps/web/src/modules

# 查看删除的文件
git status | grep deleted
```

**审查清单**:

- [ ] API 客户端都已从 Web 应用中删除
- [ ] infrastructure/api/index.ts 都已更新为从 packages 导入
- [ ] 没有意外删除其他重要文件
- [ ] 所有导入都已更新

### 步骤 5.2: 更新 README

```bash
# 更新项目文档，说明 Application/Infrastructure 代码已从 Web 应用中提取
echo "
## 架构改进

- Application 层代码已集中在 \`packages/application-client\`
- Infrastructure 层代码已集中在 \`packages/infrastructure-client\`
- Web 应用仅保留 UI 特定的实现（Composables、初始化器、浏览器 API）

参考: [AUDIT_QUICK_REFERENCE.md](AUDIT_QUICK_REFERENCE.md)
" >> docs/ARCHITECTURE.md
```

**验证**:

- [ ] 文档已更新

### 步骤 5.3: 提交更改

```bash
# 分阶段提交
git add apps/web/src/modules/account/
git commit -m "refactor(account): extract API client to packages"

git add apps/web/src/modules/ai/
git commit -m "refactor(ai): extract API clients to packages"

# ... 对每个模块重复

# 最后提交整体更改
git add AUDIT_*.md
git commit -m "docs: add audit reports for application/infrastructure extraction"
```

**验证**:

- [ ] 所有更改都已提交
- [ ] 提交消息清晰

---

## ✅ 最终验证清单

在合并代码之前，完成以下检查：

### 静态分析

- [ ] `npm run lint` 通过，没有导入错误
- [ ] `npm run type-check` 通过，没有 TypeScript 错误
- [ ] 没有 `Cannot find module` 错误

### 测试

- [ ] `npm run test` 通过，所有测试通过
- [ ] 没有弃用警告
- [ ] 覆盖率没有下降

### 功能测试

- [ ] 应用启动正常
- [ ] 登录流程正常
- [ ] 各模块功能可用
- [ ] 网络请求正常
- [ ] 浏览器存储正常

### 代码质量

- [ ] 没有代码重复（API 客户端）
- [ ] 没有循环导入
- [ ] 所有必要的导出都在 packages 中

### 文档

- [ ] 审计报告已生成
- [ ] 迁移指南已更新
- [ ] README 已更新

---

## 🚀 完成标志

当以下所有条件都满足时，重构完成：

✅ **代码提取完成**

- 所有 API 客户端都从 Web 应用中删除
- 所有导入都已更新为使用 packages
- 没有代码重复

✅ **测试通过**

- 所有单元测试通过
- 集成测试通过
- 端到端测试通过

✅ **应用运行正常**

- Web 应用启动无错误
- 所有功能正常工作
- 没有控制台错误

✅ **文档更新**

- 审计报告已创建
- 迁移指南已提供
- 架构文档已更新

---

## 📞 疑难排除

### 问题: "Cannot find module" 错误

**解决**:

```bash
# 检查 packages 导出
cat packages/infrastructure-client/src/index.ts | grep account

# 检查导入语句
grep -r "from '@dailyuse/infrastructure-client/account'" apps/web/src/modules
```

### 问题: 测试失败

**解决**:

```bash
# 检查是否有 mock 依赖于本地实现
grep -r "accountApiClient" apps/web/src --include="*.test.ts"

# 更新 mock 以使用 packages
```

### 问题: 应用无法启动

**解决**:

```bash
# 检查初始化顺序
grep -r "accountApiClient\|accountApiClient" apps/web/src/modules/account/initialization

# 确保导入的是正确的模块
```

---

## 📈 预期改进

完成此重构后，预期会看到：

| 指标             | 之前 | 之后 | 改进 |
| ---------------- | ---- | ---- | ---- |
| Web 应用 TS 文件 | ~200 | ~150 | -25% |
| API 客户端重复   | 是   | 否   | ✅   |
| 代码共享程度     | 部分 | 完全 | ✅   |
| 包导入比例       | 60%  | 100% | +40% |

---

## 📅 时间表

| 阶段     | 任务            | 预计时间     | 状态 |
| -------- | --------------- | ------------ | ---- |
| 1        | 验证 packages   | 30 分钟      | ⬜   |
| 2        | 删除 API 客户端 | 60 分钟      | ⬜   |
| 3        | 更新导入        | 45 分钟      | ⬜   |
| 4        | 测试验证        | 90 分钟      | ⬜   |
| 5        | 审查和提交      | 45 分钟      | ⬜   |
| **总计** |                 | **4.5 小时** |      |

---

**清单创建时间**: 2026-01-18  
**目标完成时间**: 2026-01-19  
**优先级**: 高  
**状态**: 准备执行

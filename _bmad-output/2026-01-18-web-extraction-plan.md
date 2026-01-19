# Web 项目代码提取行动计划

**日期**: 2026-01-18  
**紧急等级**: 🔴 **CRITICAL**  
**状态**: 需要立即执行

---

## 代码对比分析

### 📊 代码行数对比表

| 模块               | Web 代码行 | Packages 代码行 | 差异         | 优先级  |
| ------------------ | ---------- | --------------- | ------------ | ------- |
| **notification**   | 3,045      | 546             | Web 多 2,499 | 🔴 最高 |
| **repository**     | 2,053      | 476             | Web 多 1,577 | 🔴 最高 |
| **setting**        | 707        | 366             | Web 多 341   | 🔴 高   |
| **goal**           | 4,297      | 4,526           | 平衡         | 🟡 中   |
| **authentication** | 1,425      | 1,581           | 平衡         | 🟡 中   |
| **reminder**       | 1,001      | 1,865           | Pkg 多       | 🟢 低   |
| **ai**             | 1,149      | 1,427           | Pkg 多       | 🟢 低   |
| **account**        | 645        | 1,307           | Pkg 多       | 🟢 低   |
| **task**           | 2,736      | 6,774           | Pkg 多       | 🟢 低   |
| **schedule**       | 286        | 2,293           | Pkg 多       | 🟢 低   |

---

## 关键发现

### 情况 A: Web 包含 Packages 中没有的逻辑 (最危险)

**模块**: Notification, Repository, Setting

**症状**: Web 中的代码行数 > Packages 中的代码行数，差异很大

**原因**:

- Packages 中的实现不完整
- Web 中有额外的业务逻辑没有提取到 Packages
- 如果直接删除 Web 代码，功能会丢失

**例子 - Notification**:

```
Web: 3,045 行
Packages: 546 行
缺失: ~2,500 行代码

这意味着 Packages 中的 Notification 实现只是简化版本！
```

**必须的操作**:

1. ✅ 分析 Web 中有什么额外功能
2. ✅ 提取这些功能到 Packages
3. ✅ 修改 Web Composables 导入 Packages
4. ✅ 验证功能一致
5. ✅ 才能删除 Web 代码

### 情况 B: 代码量平衡 (需要对比)

**模块**: Goal, Authentication

**症状**: 代码行数接近

**操作**: 需要详细对比两个版本的实现，找出差异

### 情况 C: Packages 包含更多代码 (相对安全)

**模块**: Task, Schedule, Reminder, AI, Account

**症状**: Packages 代码行数 > Web 代码行数

**可能原因**:

- Packages 中的实现已经超越 Web
- Web 中的代码是旧版本
- 可能可以直接删除 Web 代码

**但需要验证**: 确保 Web 中没有遗漏的逻辑

---

## 执行计划

### 🔴 Phase 1: 高优先级模块 (必须先做)

#### Notification 模块

**步骤 1: 分析差异**

```bash
diff -u \
  packages/application-client/src/notification \
  apps/web/src/modules/notification/application | head -100
```

**步骤 2: 找出新增的服务**

```bash
ls apps/web/src/modules/notification/application/services/
# 与 packages 中的比对，找出新增的
```

**步骤 3: 如果有新服务，提取到 Packages**

```
复制新增文件到:
packages/application-client/src/notification/services/
```

**步骤 4: 修改 Web Composables**

```typescript
// 从这样：
import { notificationService } from '../../application/services';

// 改成这样：
import { notificationApplicationService } from '@dailyuse/application-client/notification';
```

**步骤 5: 删除 Web 本地代码**

```bash
rm -rf apps/web/src/modules/notification/application
```

#### Repository 模块

同上

#### Setting 模块

同上

### 🟡 Phase 2: 平衡模块

#### Goal 模块

**详细对比**:

```bash
diff -r apps/web/src/modules/goal/application/services \
        packages/application-client/src/goal/services
```

- 如果有差异，合并到 Packages
- 然后按 Phase 1 的步骤进行

#### Authentication 模块

同上

### 🟢 Phase 3: Packages 为主的模块

#### Task、Schedule、Reminder、AI、Account

**验证步骤**:

1. 检查 Web Composables 是否依赖 Web 的 services
2. 如果是，更改导入指向 Packages
3. 删除 Web 本地代码

---

## 立即行动清单

### ✅ 今天必须做的

- [ ] **不要删除任何代码**
- [ ] 运行对比脚本，找出 Notification、Repository、Setting 的新增逻辑
- [ ] 列出具体的新增文件名
- [ ] 为每个新增文件创建提取清单

### ✅ 本周必须做的

- [ ] Notification 新增逻辑提取到 Packages
- [ ] Repository 新增逻辑提取到 Packages
- [ ] Setting 新增逻辑提取到 Packages
- [ ] 修改这三个模块的 Web Composables 导入
- [ ] 测试功能正常

### ✅ 后续可做的

- [ ] Goal、Authentication 逐个处理
- [ ] 其他模块处理
- [ ] 最后删除 Web 中的重复代码

---

## 风险评估

### 🔴 高风险

- **Notification** (2,499 行差异)
  - 风险: 大量功能缺失
  - 影响: 通知功能可能完全失效
  - 建议: 必须完全分析

- **Repository** (1,577 行差异)
  - 风险: 仓库功能不完整
  - 影响: 数据管理功能缺失
  - 建议: 必须完全分析

### 🟡 中风险

- **Setting** (341 行差异)
  - 风险: 设置功能不完整
  - 影响: 某些设置项可能无法使用
  - 建议: 逐项对比

### 🟢 低风险

- 其他模块: 相对安全，但仍需验证

---

## 命令速查表

### 快速对比两个目录

```bash
# 差异总数
diff -r apps/web/src/modules/notification/application/services \
        packages/application-client/src/notification/services | wc -l

# 显示只在 Web 中的文件
diff -r apps/web/src/modules/notification/application \
        packages/application-client/src/notification | grep "^<" | head -20

# 详细差异
diff -u apps/web/src/modules/notification/application \
         packages/application-client/src/notification | less
```

### 提取新增文件

```bash
# 复制 Web 中的新增文件到 Packages
cp apps/web/src/modules/notification/application/services/NEW_FILE.ts \
   packages/application-client/src/notification/services/
```

### 搜索导入

```bash
# 找所有导入 Web 本地 service 的文件
grep -r "from ['\"]../../application" \
  apps/web/src/modules/notification/application/composables

# 替换为 Packages 导入
sed -i "s|from ['\"]../../application|from '@dailyuse/application-client/notification|g" \
  apps/web/src/modules/notification/application/composables/*.ts
```

---

## 下一步

**请确认**:

1. 是否同意先不删除任何代码，而是先进行详细分析？
2. 是否同意优先处理 Notification、Repository、Setting 三个高风险模块？
3. 是否需要我生成详细的对比报告（逐个模块的具体差异）？

**我可以立即执行**:

1. 为 Notification、Repository、Setting 生成详细的差异报告
2. 识别每个新增文件
3. 制定具体的提取步骤

---

**状态**: 准备执行，等待确认  
**预期时间**: 新增逻辑提取 1-2 天，修改导入 1 天，测试 1 天  
**总计**: 3-4 天完成所有 Web 代码的正确迁移

---
tags:
  - guide
  - development
  - git
  - workflow
  - version-control
description: DailyUse Git工作流 - 分支策略、提交规范、协作流程
created: 2025-11-23T16:20:00
updated: 2025-01-22T00:00:00
---

# 🌿 Git工作流 (Git Workflow)

> 规范的Git工作流，高效的团队协作
>
> **关联标准**: 📐 [standards/naming.md](../../standards/naming.md) | 参考Conventional Commits规范

## 📋 目录

- [分支策略](#分支策略)
- [提交规范](#提交规范)
- [工作流程](#工作流程)
- [代码审查](#代码审查)
- [常见问题](#常见问题)

---

## 🌳 分支策略

### 分支模型

项目采用 **GitHub Flow** 简化分支策略：

```
main (受保护)
  ├── feature/goal-management
  ├── feature/task-scheduling
  ├── bugfix/goal-status-update
  └── hotfix/security-patch
```

### 分支类型

| 分支类型     | 命名格式          | 用途                 | 示例                       |
| ------------ | ----------------- | -------------------- | -------------------------- |
| **main**     | `main`            | 生产分支，始终可部署 | `main`                     |
| **feature**  | `feature/<描述>`  | 新功能开发           | `feature/goal-archive`     |
| **bugfix**   | `bugfix/<描述>`   | Bug修复              | `bugfix/task-status-error` |
| **hotfix**   | `hotfix/<描述>`   | 紧急修复             | `hotfix/security-patch`    |
| **refactor** | `refactor/<描述>` | 代码重构             | `refactor/goal-service`    |

### 分支保护

**`main` 分支规则**:

- ✅ 必须通过PR合并
- ✅ 需要至少1人审查
- ✅ 必须通过CI检查
- ✅ 必须解决所有评论
- ❌ 禁止直接推送
- ❌ 禁止强制推送

---

## 📝 提交规范

### Commit Message格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

| Type       | Emoji | 描述                          | 影响版本 |
| ---------- | ----- | ----------------------------- | -------- |
| `feat`     | ✨    | 新功能                        | Minor    |
| `fix`      | 🐛    | Bug修复                       | Patch    |
| `docs`     | 📝    | 文档更新                      | -        |
| `style`    | 💄    | 代码格式（不影响功能）        | -        |
| `refactor` | ♻️    | 重构（不新增功能，不修复Bug） | -        |
| `perf`     | ⚡    | 性能优化                      | Patch    |
| `test`     | ✅    | 测试相关                      | -        |
| `build`    | 📦    | 构建系统/依赖更新             | -        |
| `ci`       | 👷    | CI配置更新                    | -        |
| `chore`    | 🔧    | 其他杂项                      | -        |
| `revert`   | ⏪    | 回滚提交                      | -        |

### Scope范围

常用的scope：

- `goal` - 目标模块
- `task` - 任务模块
- `schedule` - 日程模块
- `reminder` - 提醒模块
- `auth` - 认证模块
- `api` - API层
- `web` - 前端应用
- `deps` - 依赖更新
- `config` - 配置文件

### Subject主题

- 使用祈使句，现在时态："add"而非"added"或"adds"
- 首字母小写
- 不加句号
- 不超过50个字符

### Body正文

- 详细描述修改内容
- 说明修改原因
- 与之前行为对比

### Footer脚注

- 关联Issue：`Closes #123`、`Fixes #456`
- 不兼容变更：`BREAKING CHANGE: 描述`

### 提交示例

#### 新功能

```bash
git commit -m "feat(goal): 添加目标批量删除功能

实现批量删除目标的API和前端交互：
- 添加批量删除API端点
- 实现前端多选功能
- 添加确认对话框
- 添加批量删除测试

Closes #123"
```

#### Bug修复

```bash
git commit -m "fix(task): 修复任务状态更新不生效的问题

问题描述：
任务状态更新后，前端状态未同步更新

问题原因：
缺少TaskUpdated事件发布逻辑

解决方案：
在任务状态更新后发布TaskUpdated事件

Fixes #456"
```

#### 重构

```bash
git commit -m "refactor(goal): 重构目标实体为DDD模式

将GoalEntity重构为DDD聚合根：
- 提取GoalTitle为值对象
- 实现领域事件发布
- 添加业务规则验证
- 提升代码可测试性

无功能变更，仅改进代码结构。"
```

#### 文档更新

```bash
git commit -m "docs(architecture): 更新架构决策记录

添加ADR-004: 采用CQRS模式
- 说明CQRS选型原因
- 描述实现方案
- 列出替代方案"
```

#### 不兼容变更

```bash
git commit -m "feat(api): 重构认证API为HttpOnly Cookie

BREAKING CHANGE: 认证Token从localStorage迁移到HttpOnly Cookie

迁移指南：
1. 前端删除localStorage相关代码
2. 后端配置Cookie选项
3. 更新API调用方式

详见迁移文档：docs/HTTPONLY_COOKIE_MIGRATION_GUIDE.md

Closes #789"
```

---

## 🔄 工作流程

### 1. 创建分支

```bash
# 更新main分支
git checkout main
git pull origin main

# 创建新分支
git checkout -b feature/goal-archive

# 或使用命令简写
git checkout -b feat/goal-archive
```

### 2. 开发功能

```bash
# 查看修改状态
git status

# 添加修改到暂存区
git add apps/api/src/goal/

# 提交修改
git commit -m "feat(goal): 添加目标归档功能"

# 继续开发...
git add .
git commit -m "test(goal): 添加目标归档测试"
```

### 3. 保持同步

```bash
# 定期同步main分支
git fetch origin main
git rebase origin/main

# 解决冲突（如果有）
# 1. 编辑冲突文件
# 2. 标记为已解决
git add <冲突文件>
git rebase --continue

# 取消rebase
git rebase --abort
```

### 4. 推送分支

```bash
# 首次推送
git push -u origin feature/goal-archive

# 后续推送
git push

# 强制推送（rebase后）
git push --force-with-lease
```

### 5. 创建Pull Request

在GitHub上创建PR：

1. 点击 "New Pull Request"
2. 选择 `main` ← `feature/goal-archive`
3. 填写PR模板：
   - 功能描述
   - 测试说明
   - 相关Issue
   - 截图/录屏（如适用）
4. 请求审查者
5. 等待CI检查通过

### 6. 代码审查

**审查者职责**:

- 检查代码质量
- 验证测试覆盖率
- 提出改进建议
- 批准或请求修改

**作者职责**:

- 及时响应评论
- 修改代码
- 推送更新
- 解决所有评论

### 7. 合并PR

```bash
# 审查通过后，在GitHub上合并PR
# 选择合并策略：
# - Squash and merge (推荐) - 压缩提交
# - Rebase and merge - 保持线性历史
# - Create a merge commit - 创建合并提交

# 合并后删除远程分支
git push origin --delete feature/goal-archive

# 本地删除分支
git checkout main
git pull origin main
git branch -d feature/goal-archive
```

---

## 👀 代码审查

### PR模板

**`.github/pull_request_template.md`**

```markdown
## 📝 变更描述

简要描述本次PR的变更内容。

## 🎯 相关Issue

Closes #(issue编号)

## 📋 变更类型

- [ ] ✨ 新功能 (feature)
- [ ] 🐛 Bug修复 (bugfix)
- [ ] ♻️ 重构 (refactor)
- [ ] 📝 文档更新 (docs)
- [ ] ⚡ 性能优化 (perf)
- [ ] ✅ 测试相关 (test)

## 🧪 测试

- [ ] 添加/更新了单元测试
- [ ] 添加/更新了集成测试
- [ ] 添加/更新了E2E测试
- [ ] 所有测试通过

## 📸 截图/录屏

如适用，添加截图或录屏。

## ✅ 检查清单

- [ ] 代码遵循项目规范
- [ ] 代码通过ESLint检查
- [ ] 代码通过Prettier格式化
- [ ] 提交信息符合规范
- [ ] 更新了相关文档
- [ ] 测试覆盖率达标

## 💭 备注

其他需要说明的内容。
```

### 审查清单

#### 功能性

- [ ] 代码实现是否符合需求
- [ ] 是否有边界情况未处理
- [ ] 错误处理是否完善
- [ ] 是否有潜在Bug

#### 代码质量

- [ ] 代码是否易于理解
- [ ] 命名是否清晰
- [ ] 是否有冗余代码
- [ ] 是否遵循设计模式

#### 性能

- [ ] 是否有性能问题
- [ ] 是否有内存泄漏风险
- [ ] 数据库查询是否优化
- [ ] 是否有不必要的计算

#### 安全性

- [ ] 是否有SQL注入风险
- [ ] 是否有XSS风险
- [ ] 是否有权限校验
- [ ] 敏感信息是否加密

#### 测试

- [ ] 测试覆盖率是否达标
- [ ] 测试是否充分
- [ ] 测试是否可维护

#### 文档

- [ ] 代码注释是否充分
- [ ] API文档是否更新
- [ ] 用户文档是否更新

### 审查意见模板

````markdown
#### 必须修改 (MUST) 🔴

- [ ] **安全问题**: 未验证用户权限

  ```typescript
  // 当前代码
  async deleteGoal(id: string) {
    await this.repository.delete(id);
  }

  // 建议修改
  async deleteGoal(id: string, userId: string) {
    const goal = await this.repository.findById(id);
    if (goal.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.repository.delete(id);
  }
  ```
````

#### 建议修改 (SHOULD) 🟡

- [ ] **代码重复**: 可以提取为公共方法
  ```typescript
  // 建议提取validateGoalOwnership方法
  ```

#### 可选优化 (COULD) 🟢

- [ ] **性能优化**: 可以使用缓存提升查询性能

````

---

## ❓ 常见问题

### 如何修改最后一次提交？

```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件
git add forgotten-file.ts
git commit --amend --no-edit

# 推送修改（如果已推送）
git push --force-with-lease
````

### 如何合并多个提交？

```bash
# 合并最近3个提交
git rebase -i HEAD~3

# 在编辑器中，将pick改为squash
# pick abc123 第一个提交
# squash def456 第二个提交
# squash ghi789 第三个提交

# 编辑合并后的提交信息
# 保存并退出
```

### 如何撤销提交？

```bash
# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（不保留修改）
git reset --hard HEAD~1

# 撤销已推送的提交（创建新提交）
git revert HEAD
git push
```

### 如何解决冲突？

```bash
# 1. 拉取最新代码
git fetch origin main
git rebase origin/main

# 2. 查看冲突文件
git status

# 3. 编辑冲突文件
# <<<<<<< HEAD
# 你的修改
# =======
# 别人的修改
# >>>>>>> origin/main

# 4. 标记为已解决
git add <冲突文件>
git rebase --continue

# 5. 推送修改
git push --force-with-lease
```

### 如何暂存当前工作？

```bash
# 暂存修改
git stash save "WIP: 正在开发的功能"

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop

# 应用暂存（保留stash）
git stash apply stash@{0}

# 删除暂存
git stash drop stash@{0}
```

### 如何查看提交历史？

```bash
# 查看提交历史
git log

# 美化输出
git log --oneline --graph --decorate --all

# 查看某个文件的历史
git log --follow -- path/to/file

# 查看某个作者的提交
git log --author="张三"

# 查看某个时间范围的提交
git log --since="2025-01-01" --until="2025-01-31"
```

### 如何查找引入Bug的提交？

```bash
# 使用git bisect二分查找
git bisect start
git bisect bad                  # 当前版本有Bug
git bisect good v1.0.0         # v1.0.0版本没有Bug

# Git会自动切换到中间版本
# 测试是否有Bug

git bisect bad  # 有Bug，继续二分
# 或
git bisect good # 没有Bug，继续二分

# 找到问题提交后
git bisect reset
```

---

## 🛠 Git配置

### 全局配置

```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 配置默认编辑器
git config --global core.editor "code --wait"

# 配置默认分支名
git config --global init.defaultBranch main

# 配置自动换行
git config --global core.autocrlf input  # Mac/Linux
git config --global core.autocrlf true   # Windows

# 配置别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate --all"
```

### 项目配置

**`.gitignore`**

```gitignore
# 依赖
node_modules/
.pnpm-store/

# 构建输出
dist/
build/
.next/
.nuxt/

# 日志
*.log
npm-debug.log*
pnpm-debug.log*

# 环境变量
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# 测试覆盖率
coverage/
.nyc_output/

# 临时文件
tmp/
temp/
*.tmp
```

### Git Hooks

使用 [Husky](https://typicode.github.io/husky/) 配置Git Hooks：

**`package.json`**

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"]
  }
}
```

**`.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

**`.husky/commit-msg`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 验证提交信息格式
pnpm commitlint --edit $1
```

---

## 📚 参考资源

### Git文档

- [Git官方文档](https://git-scm.com/doc)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Git工具

- [GitHub Desktop](https://desktop.github.com/) - Git GUI客户端
- [GitKraken](https://www.gitkraken.com/) - 跨平台Git客户端
- [Sourcetree](https://www.sourcetreeapp.com/) - 免费Git GUI

### Git教程

- [Pro Git Book](https://git-scm.com/book/zh/v2) - Git权威指南
- [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN) - 交互式Git教程

---

**最后更新**: 2025-11-23  
**维护者**: @BakerSean168  
**版本**: v2.0

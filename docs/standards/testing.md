# 测试编写规范

> 好的测试是代码质量的保障

## 📁 测试文件组织

```
src/
├── services/
│   ├── TaskService.ts
│   └── __tests__/
│       ├── TaskService.test.ts       # 单元测试
│       └── TaskService.integration.ts # 集成测试
```

## 🏷️ 测试命名

```typescript
describe('TaskService', () => {
  describe('createTask', () => {
    it('should create task with valid data', async () => { });
    it('should throw ValidationError when name is empty', async () => { });
    it('should return ActionResult with ok: true on success', async () => { });
  });
});
```

## ✅ 测试结构 (AAA)

```typescript
it('should update task status', async () => {
  // Arrange - 准备
  const task = createMockTask({ status: 'pending' });
  mockRepo.findById.mockResolvedValue(task);

  // Act - 执行
  const result = await service.updateStatus(task.id, 'done');

  // Assert - 断言
  expect(result.ok).toBe(true);
  expect(mockRepo.save).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'done' })
  );
});
```

## 🎭 Mock 规范

```typescript
// ✅ 使用工厂函数创建 mock
function createMockTaskRepository(): jest.Mocked<ITaskRepository> {
  return {
    findById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
}

// ✅ 每个测试重置 mock
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 📊 覆盖率要求

| 类型 | 最低要求 |
|------|---------|
| Domain 层 | 80% |
| Application 层 | 70% |
| 关键业务逻辑 | 90% |

## 🚫 避免的做法

```typescript
// ❌ 测试实现细节
expect(service._internalMethod).toHaveBeenCalled();

// ❌ 过度 mock
// 如果需要 mock 太多东西，考虑重构

// ❌ 不稳定的测试
await new Promise(r => setTimeout(r, 1000));  // 避免固定等待
```

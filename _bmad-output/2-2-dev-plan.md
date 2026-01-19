# Story 2.2 开发执行计划

## 📊 情况分析

### 源代码清单
- **web中的infrastructure**: 仅包含`taskApiClient.ts` (499行)
  - 包含4个类: TaskTemplateApiClient, TaskInstanceApiClient, TaskDependencyApiClient, TaskStatisticsApiClient
  - 包含单例实例导出

### 目标代码清单
- **application-client中的infrastructure**: 已有HTTP适配器骨架
  - 4个HTTP适配器文件: task-template-http.adapter.ts (120行), task-instance-http.adapter.ts (82行), task-dependency-http.adapter.ts (73行), task-statistics-http.adapter.ts (89行)
  - 4个港口接口定义
  - 依赖容器已配置

## ✅ 关键发现

1. **HTTP适配器已存在**: application-client中的HTTP适配器已经实现了核心方法
2. **港口接口已定义**: 所有4个港口接口都已定义
3. **容器已配置**: DI容器已经设置好

## 🎯 迁移策略

### 第1阶段: 对比分析 (任务2)
- 确认HTTP适配器中的实现与web中taskApiClient的实现是否一致
- 验证所有方法都已迁移

### 第2阶段: API响应格式验证 (任务3)  
- 检查web中的API调用是否使用统一的响应格式
- 确保httpClient类型定义正确

### 第3阶段: 完成迁移 (任务4-6)
- 确保所有方法都正确实现
- 更新导出配置
- 配置容器以使用正确的适配器和HTTP客户端

### 第4阶段: 整合Web (任务7-8)
- 更新web中的导入路径，使用@dailyuse/infrastructure-client
- 配置web使用容器中的API客户端

### 第5阶段: 验证 (任务9-10)
- 检查依赖关系
- 运行测试

## 📋 具体行动项

### 任务2: 验证infrastructure-client中的骨架结构 ✅ (部分完成)
- ✓ 已确认HTTP适配器存在
- ✓ 已确认港口接口存在
- 🔲 需要完整对比web中的实现

### 任务3: 分析API响应格式
- 检查web中httpClient的响应处理
- 确认httpClient类型定义

### 任务4-6: 迁移和更新配置
- 复制web中taskApiClient中任何缺失的方法
- 更新导出
- 验证容器配置

### 任务7-8: 更新Web导入
- 更改web中application/index.ts以从@dailyuse/infrastructure-client导入
- 确保web中的composables使用新导入

### 任务9-10: 验证和测试
- 运行lint和build检查
- 运行测试

## 🚀 开始实施
准备启动任务2...

# 前端国际化实现指南

## 概述

此文档展示如何在前端实现国际化翻译，配合后端只返回枚举值的设计。

## 文件结构

```
frontend/
├── i18n/
│   ├── index.ts                 # I18N 主入口
│   ├── enums/
│   │   ├── task.ts             # Task 相关枚举翻译
│   │   ├── goal.ts             # Goal 相关枚举翻译
│   │   ├── reminder.ts         # Reminder 相关枚举翻译
│   │   └── ...
│   ├── messages/
│   │   ├── en-US.ts
│   │   ├── zh-CN.ts
│   │   ├── ja-JP.ts
│   │   └── ...
│   └── useI18n.ts              # React Hook for i18n
```

## 实现示例

### 1. Task 枚举翻译

**i18n/enums/task.ts**

```typescript
export type TaskType = 'ONE_TIME' | 'RECURRING';
export type TaskTemplateStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED';
export type ImportanceLevel = 'vital' | 'important' | 'moderate' | 'minor' | 'trivial';

export const taskI18n = {
  'en-US': {
    taskType: {
      'ONE_TIME': 'One-time Task',
      'RECURRING': 'Recurring Task',
    } as Record<TaskType, string>,
    
    status: {
      'ACTIVE': 'Active',
      'PAUSED': 'Paused',
      'ARCHIVED': 'Archived',
      'DELETED': 'Deleted',
    } as Record<TaskTemplateStatus, string>,
    
    importance: {
      'vital': 'Vital',
      'important': 'Important',
      'moderate': 'Moderate',
      'minor': 'Minor',
      'trivial': 'Trivial',
    } as Record<ImportanceLevel, string>,
    
    recurrence: {
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'MONTHLY': 'Monthly',
      'YEARLY': 'Yearly',
      'CUSTOM': 'Custom',
    },
  },
  
  'zh-CN': {
    taskType: {
      'ONE_TIME': '单次任务',
      'RECURRING': '重复任务',
    } as Record<TaskType, string>,
    
    status: {
      'ACTIVE': '活跃',
      'PAUSED': '暂停',
      'ARCHIVED': '归档',
      'DELETED': '已删除',
    } as Record<TaskTemplateStatus, string>,
    
    importance: {
      'vital': '极其重要',
      'important': '非常重要',
      'moderate': '中等重要',
      'minor': '不太重要',
      'trivial': '无关紧要',
    } as Record<ImportanceLevel, string>,
    
    recurrence: {
      'DAILY': '每天',
      'WEEKLY': '每周',
      'MONTHLY': '每月',
      'YEARLY': '每年',
      'CUSTOM': '自定义',
    },
  },
  
  'ja-JP': {
    taskType: {
      'ONE_TIME': 'ワンタイムタスク',
      'RECURRING': '繰り返しタスク',
    } as Record<TaskType, string>,
    
    status: {
      'ACTIVE': 'アクティブ',
      'PAUSED': '一時停止',
      'ARCHIVED': 'アーカイブ',
      'DELETED': '削除済み',
    } as Record<TaskTemplateStatus, string>,
    
    importance: {
      'vital': '極めて重要',
      'important': '非常に重要',
      'moderate': '中程度',
      'minor': 'わずかに重要',
      'trivial': '重要でない',
    } as Record<ImportanceLevel, string>,
    
    recurrence: {
      'DAILY': '毎日',
      'WEEKLY': '毎週',
      'MONTHLY': '毎月',
      'YEARLY': '毎年',
      'CUSTOM': 'カスタム',
    },
  },
};
```

### 2. Goal 枚举翻译

**i18n/enums/goal.ts**

```typescript
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | 'ARCHIVED';
export type ImportanceLevel = 'vital' | 'important' | 'moderate' | 'minor' | 'trivial';

export const goalI18n = {
  'en-US': {
    status: {
      'ACTIVE': 'In Progress',
      'PAUSED': 'On Hold',
      'COMPLETED': 'Completed',
      'ABANDONED': 'Abandoned',
      'ARCHIVED': 'Archived',
    } as Record<GoalStatus, string>,
    
    importance: {
      'vital': 'Critical',
      'important': 'High',
      'moderate': 'Medium',
      'minor': 'Low',
      'trivial': 'Trivial',
    } as Record<ImportanceLevel, string>,
  },
  
  'zh-CN': {
    status: {
      'ACTIVE': '进行中',
      'PAUSED': '暂停',
      'COMPLETED': '已完成',
      'ABANDONED': '已放弃',
      'ARCHIVED': '已归档',
    } as Record<GoalStatus, string>,
    
    importance: {
      'vital': '关键',
      'important': '高',
      'moderate': '中',
      'minor': '低',
      'trivial': '极低',
    } as Record<ImportanceLevel, string>,
  },
};
```

### 3. React Hook 实现

**i18n/useI18n.ts**

```typescript
import { useContext } from 'react';
import { taskI18n } from './enums/task';
import { goalI18n } from './enums/goal';

export type SupportedLanguage = 'en-US' | 'zh-CN' | 'ja-JP';

interface I18nContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useI18n = () => {
  // 从 Context 或 Redux 获取当前语言
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  
  const { currentLanguage } = context;
  
  return {
    currentLanguage,
    
    // Task 翻译函数
    getTaskTypeText: (taskType: string): string => {
      return taskI18n[currentLanguage]?.taskType?.[taskType as any] ?? taskType;
    },
    
    getTaskStatusText: (status: string): string => {
      return taskI18n[currentLanguage]?.status?.[status as any] ?? status;
    },
    
    getImportanceText: (importance: string): string => {
      return taskI18n[currentLanguage]?.importance?.[importance as any] ?? importance;
    },
    
    getRecurrenceText: (recurrence: string): string => {
      return taskI18n[currentLanguage]?.recurrence?.[recurrence as any] ?? recurrence;
    },
    
    // Goal 翻译函数
    getGoalStatusText: (status: string): string => {
      return goalI18n[currentLanguage]?.status?.[status as any] ?? status;
    },
    
    getGoalImportanceText: (importance: string): string => {
      return goalI18n[currentLanguage]?.importance?.[importance as any] ?? importance;
    },
  };
};
```

### 4. React 组件使用示例

**components/TaskDisplay.tsx**

```typescript
import React from 'react';
import { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import { useI18n } from '../i18n/useI18n';

interface TaskDisplayProps {
  task: TaskTemplateClientDTO;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ task }) => {
  const { getTaskTypeText, getTaskStatusText, getImportanceText } = useI18n();
  
  return (
    <div className="task-card">
      <h3>{task.name}</h3>
      
      <div className="task-meta">
        {/* 使用翻译后的文本而不是后端返回的硬编码文本 */}
        <span className="task-type badge">
          {getTaskTypeText(task.taskType)}
        </span>
        
        <span className="task-status badge">
          {getTaskStatusText(task.status)}
        </span>
        
        <span className="task-importance badge">
          {getImportanceText(task.importance)}
        </span>
      </div>
      
      <p className="description">{task.description}</p>
      
      <div className="task-stats">
        <span>Instances: {task.instanceCount}</span>
        <span>Completed: {task.completedInstanceCount}</span>
        <span>Rate: {task.completionRate}%</span>
      </div>
    </div>
  );
};
```

### 5. 语言切换实现

**components/LanguageSwitcher.tsx**

```typescript
import React from 'react';
import { I18nContext } from '../i18n/context';
import { SupportedLanguage } from '../i18n/useI18n';

export const LanguageSwitcher: React.FC = () => {
  const context = React.useContext(I18nContext);
  
  const languages: { code: SupportedLanguage; name: string }[] = [
    { code: 'en-US', name: 'English' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'ja-JP', name: '日本語' },
  ];
  
  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => context?.setLanguage(lang.code)}
          className={context?.currentLanguage === lang.code ? 'active' : ''}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};
```

## 关键点

### ✅ 优势

1. **完全客户端切换** - 无需重新请求数据
2. **多语言支持** - 轻松添加新语言
3. **同一 API** - Web、App、小程序共享后端API
4. **职责清晰** - 后端：数据，前端：展示
5. **性能优化** - 减少网络传输（无硬编码文本）

### ❌ 避免的做法

```typescript
// ❌ 不要这样做：使用后端返回的硬编码文本
<span>{task.taskTypeText}</span>  // 中文硬编码，英文用户看不懂
<span>{task.importanceText}</span>
<span>{task.statusText}</span>

// ✅ 应该这样做：前端动态翻译
const { getTaskTypeText } = useI18n();
<span>{getTaskTypeText(task.taskType)}</span>
```

## 后续步骤

1. 在项目中创建 `i18n` 目录
2. 复制上述文件结构和示例代码
3. 创建 `I18nProvider` 用于提供语言上下文
4. 将现有组件改为使用 `useI18n` Hook
5. 移除所有对后端翻译字段的依赖（taskTypeText、importanceText 等）

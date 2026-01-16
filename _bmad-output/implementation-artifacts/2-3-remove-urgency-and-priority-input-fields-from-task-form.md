# Story 2.3: 移除任务表单中的 Urgency 和 Priority 输入字段

## Metadata

- **Epic:** Epic 2 - Intelligent Sorting & UX
- **Story ID:** 2.3
- **Title:** 移除任务表单中的 Urgency 和 Priority 输入字段
- **Status:** ready-for-dev
- **Dependencies:** Stories 2.1 ✓, 2.2 ✓
- **Priority:** HIGH
- **Estimate:** 1-2 days (Web + Desktop + Testing)
- **Owner:** UI/UX Engineer & Frontend Developer

---

## User Story

**As a** UI/UX 工程师,
**I want** 从任务创建/编辑表单中移除 `Urgency` 和 `Priority` 选择框，仅保留 `Importance` 控件,
**So that** 用户在填写任务时认知负担降低，表单更加极简。

---

## Acceptance Criteria

### AC1: Remove Urgency Field

**Given** 任务表单存在于 Web/Desktop 应用
**When** 用户打开任务创建或编辑对话框
**Then** 不显示 "紧急性" (Urgency) 选择字段
**And** 用户无法设置或修改 urgency 值

### AC2: Remove Priority Field

**Given** 任务表单中原有 Priority 输入控件
**When** 用户打开任务创建或编辑对话框
**Then** 不显示 "优先级" (Priority) 输入控件
**And** Priority 字段由后端根据 Importance 和 DueDate 自动计算

### AC3: Keep Importance Field

**Given** 新的数据模型
**When** 用户打开任务创建或编辑对话框
**Then** 仍显示 "重要性" (Importance) 选择字段
**And** Importance 字段功能保持不变（5 级选择或滑块）

### AC4: Form Layout & UX

**Given** 表单移除了两个字段
**When** 表单重新渲染
**Then** 表单布局仍然清晰美观（无空白、对齐良好）
**And** 剩余字段自然填充表单空间

### AC5: Data Persistence

**Given** 用户修改任务
**When** 保存任务
**Then** Urgency 和 Priority 不被发送到后端（如果之前存在，应该被忽略）
**And** Importance 值正确保存

### AC6: Backward Compatibility

**Given** 现有任务数据可能包含 urgency 值
**When** 编辑现有任务
**Then** 现有 urgency 值被忽略（不显示，不覆盖）
**And** 新保存的任务不包含 urgency 字段

### AC7: Visual Testing

**Given** 表单已更新
**When** 进行视觉回归测试
**Then** 表单在 Light/Dark 主题下都显示正确
**And** 表单在不同屏幕尺寸上布局正确

---

## Brownfield Context

### Web Application

**File:** [apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.vue](apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.vue)

✅ **Current State:**
- Shows both Importance and Urgency select dropdowns
- Importance: 5 levels (Vital, Important, Moderate, Minor, Trivial)
- Urgency: 5 levels (Critical, High, Medium, Low, None)
- Both have descriptive subtitles
- Tags field is also present (keep this)

✅ **Related Files:**
- Parent component: [TaskTemplateForm.vue](TaskTemplateForm.vue) - imports MetadataSection
- BasicInfoSection.vue - title and description (keep)
- TimeConfigSection.vue - due date and time (keep)
- Other sections (Recurrence, Reminder, KeyResultLinks) - keep as is

⚠️ **What to Remove:**
- `<v-col>` containing "紧急性" (Urgency) select field (lines ~16-19)
- `urgencyOptions` array definition (lines ~74-80)
- `urgency` computed property getter/setter (lines ~121-128)
- Watch statement on urgency (if separate)
- Imports of `UrgencyLevel` enum (if no longer needed)

⚠️ **What to Keep:**
- Importance select field (全部保留)
- Tags field (全部保留)
- Form validation logic (may need adjustment)

---

### Desktop Application

**Directory:** [apps/desktop/src/renderer/modules/task/presentation/](apps/desktop/src/renderer/modules/task/presentation/)

Similar structure to Web app, need to:
1. Find Task creation/edit form components
2. Remove Urgency and Priority fields
3. Keep Importance field
4. Update component layout

---

## Refactoring Strategy

### Decision: Directly Remove Urgency & Priority from Forms

**Option A (Chosen):** Remove urgency/priority fields directly from MetadataSection
- **Rationale:** Simplest approach; fields are isolated in one section
- **Benefit:** Minimal code changes; focused on one component
- **Trade-off:** May leave empty space if not careful with layout

**Option B (Rejected):** Create new "ImportanceOnlySection"
- **Rationale:** More modular separation
- **Downside:** Unnecessary refactoring for simple removal

---

## Task Breakdown

### Task 2.3.1: Update Web App MetadataSection Component

**Objective:** Remove urgency and priority fields from form

**File:** [apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.vue](apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.vue)

**Changes Required:**

```vue
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      任务属性
    </v-card-title>
    <v-card-text>
      <v-row>
        <!-- 重要性 - 保留 -->
        <v-col cols="12" md="6">
          <v-select 
            v-model="importance" 
            label="重要性" 
            :items="importanceOptions" 
            item-title="title" 
            item-value="value"
            variant="outlined" 
            required 
          />
        </v-col>

        <!-- 紧急性 - 移除此 v-col (lines ~16-19) -->
        <!-- <v-col cols="12" md="6">
          <v-select v-model="urgency" label="紧急性" ...
        </v-col> -->

        <!-- 任务标签 - 保留并调整列宽 -->
        <!-- 修改: cols="12" md="6" -> cols="12" (让标签占满整行，因为紧急性被删除) -->
        <v-col cols="12">
          <v-combobox 
            v-model="tags" 
            label="任务标签" 
            variant="outlined" 
            multiple 
            chips 
            closable-chips
            :items="tagSuggestions" 
            prepend-inner-icon="mdi-tag-multiple-outline" 
            hint="按回车键添加新标签" 
            persistent-hint 
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { TaskTemplate } from '@dailyuse/domain-client/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
// 移除导入: UrgencyLevel

interface Props {
  modelValue: TaskTemplate;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplate): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplate) => void) => {
  const updatedTemplate = props.modelValue.clone();
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 重要性选项 - 保留
const importanceOptions = [
  {
    title: '极其重要',
    value: ImportanceLevel.Vital,
    subtitle: '对生活/工作有重大影响，如健康检查、家人重要日子',
  },
  {
    title: '非常重要',
    value: ImportanceLevel.Important,
    subtitle: '对目标实现很关键，如职业发展相关任务',
  },
  {
    title: '中等重要',
    value: ImportanceLevel.Moderate,
    subtitle: '值得做但不是关键，如技能提升、社交活动',
  },
  { title: '不太重要', value: ImportanceLevel.Minor, subtitle: '可做可不做，如日常琐事' },
  { title: '无关紧要', value: ImportanceLevel.Trivial, subtitle: '纯粹消遣，如游戏娱乐' },
];

// 紧急性选项 - 移除此数组 (lines ~74-80)
// const urgencyOptions = [ ... ]

// 标签建议 - 保留
const tagSuggestions = [
  '重要',
  '紧急',
  '例行',
  '学习',
  '工作',
  '会议',
  '运动',
  '阅读',
  '编程',
  '设计',
  '写作',
  '思考',
  '计划',
  '回顾',
  '沟通',
  '创作',
];

// 重要性 - 保留
const importance = computed({
  get: () => props.modelValue.importance,
  set: (value: ImportanceLevel) => {
    updateTemplate((template) => {
      template.updateImportance(value);
    });
  },
});

// 紧急性 - 移除此计算属性 (lines ~121-128)
// const urgency = computed({ ... })

// 标签 - 保留
const tags = computed({
  get: () => props.modelValue.tags || [],
  set: (value: string[]) => {
    updateTemplate((template) => {
      template.updateTags(value);
    });
  },
});

// 简单验证 - 更新：仅检查 importance（urgency 已移除）
const isValid = computed(() => {
  // OLD: return Boolean(importance.value && urgency.value);
  // NEW: 只检查 importance
  return Boolean(importance.value);
});

// 监听验证状态变化 - 更新：仅监听 importance
watch(
  () => importance.value,
  () => {
    emit('update:validation', isValid.value);
  },
  { immediate: true },
);
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
```

**Key Changes:**
1. Remove `<v-col>` for urgency field
2. Adjust tags field `cols` from "md:6" to "12" to utilize full width
3. Remove `UrgencyLevel` import
4. Remove `urgencyOptions` array
5. Remove `urgency` computed property
6. Update `isValid` to only check importance
7. Update watch dependency to only importance

---

### Task 2.3.2: Update Web App Validation Rules

**Objective:** Adjust form validation since urgency is no longer required

**Files to Check:**
- [apps/web/src/modules/task/composables/](apps/web/src/modules/task/composables/)
- Any validation composables that reference urgency

**Changes:**
- Remove urgency from validation checks
- Ensure importance is still required
- Update error messages if any reference urgency

---

### Task 2.3.3: Update Web App Task Creation/Edit Pages

**Objective:** Verify task creation/edit workflows work correctly without urgency

**Files to Update:**
- [apps/web/src/modules/task/presentation/views/](apps/web/src/modules/task/presentation/views/)
- Task creation dialog/modal
- Task edit modal

**Verification:**
- Create new task → form displays correctly (no urgency field)
- Edit existing task → urgency value ignored (not shown, not sent back)
- Save task → only importance, not urgency, sent to API

---

### Task 2.3.4: Update Desktop App Form Components

**Objective:** Remove urgency and priority from Desktop app forms

**Directory:** [apps/desktop/src/renderer/modules/task/presentation/components/](apps/desktop/src/renderer/modules/task/presentation/components/)

**Process:**
1. Find task form component (likely TaskForm.tsx or TaskTemplateForm.tsx)
2. Remove Urgency select field
3. Keep Importance field
4. Keep Tags field
5. Update column layout (similar to Web)
6. Update validation logic

**Expected Structure (React/TypeScript):**
```typescript
// TaskForm.tsx or similar
interface TaskFormProps {
  task?: TaskTemplate;
  onSubmit: (data: CreateTaskRequest) => Promise<void>;
}

function TaskForm({ task, onSubmit }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    importance: task?.importance || ImportanceLevel.Moderate,
    // REMOVE: urgency: task?.urgency || UrgencyLevel.None,
    tags: task?.tags || [],
    // ... other fields
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Info */}
      <TextField label="Task Title" />
      <TextField label="Description" />
      
      {/* Importance - Keep */}
      <Select label="Importance" value={formData.importance} />
      
      {/* Urgency - REMOVE this Select */}
      {/* <Select label="Urgency" value={formData.urgency} /> */}
      
      {/* Tags - Keep */}
      <TextField label="Tags" />
      
      {/* Submit button */}
      <button type="submit">Save</button>
    </form>
  );
}
```

---

### Task 2.3.5: Update Type Definitions & Request DTOs

**Objective:** Ensure CreateTaskTemplateRequest doesn't include urgency

**File:** [packages/contracts/src/modules/task/](packages/contracts/src/modules/task/)

**Check/Update:**
- `CreateTaskTemplateRequest` type - should NOT include urgency
- `UpdateTaskTemplateRequest` type - should NOT include urgency
- If DTOs still have urgency field, add JSDoc note that it's ignored/deprecated

**Example:**
```typescript
export interface CreateTaskTemplateRequest {
  title: string;
  description?: string;
  importance: ImportanceLevel; // Keep - user input
  // REMOVE or DEPRECATE: urgency?: UrgencyLevel;
  dueDate?: number;
  tags?: string[];
  // ... other fields
}

export interface UpdateTaskTemplateRequest {
  title?: string;
  description?: string;
  importance?: ImportanceLevel; // Keep
  // REMOVE or DEPRECATE: urgency?: UrgencyLevel;
  dueDate?: number;
  tags?: string[];
  // ... other fields
}
```

---

### Task 2.3.6: Unit Tests - Web App

**Objective:** Verify MetadataSection component works without urgency

**Test File:** [apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.spec.ts](MetadataSection.spec.ts)

**Test Scenarios:**

1. **Test Case 2.3.6.1: Urgency Field Not Rendered**
   ```typescript
   it('should not render urgency field', () => {
     const wrapper = mount(MetadataSection, {
       props: { modelValue: createMockTask() }
     });
     
     expect(wrapper.find('[data-testid="urgency-select"]').exists()).toBe(false);
   });
   ```

2. **Test Case 2.3.6.2: Importance Field Still Renders**
   ```typescript
   it('should render importance field', () => {
     const wrapper = mount(MetadataSection, {
       props: { modelValue: createMockTask() }
     });
     
     expect(wrapper.find('[data-testid="importance-select"]').exists()).toBe(true);
   });
   ```

3. **Test Case 2.3.6.3: Tags Field Still Renders**
   ```typescript
   it('should render tags field', () => {
     const wrapper = mount(MetadataSection, {
       props: { modelValue: createMockTask() }
     });
     
     expect(wrapper.find('[data-testid="tags-input"]').exists()).toBe(true);
   });
   ```

4. **Test Case 2.3.6.4: Validation Only Checks Importance**
   ```typescript
   it('should validate with only importance set', async () => {
     const task = createMockTask({ importance: ImportanceLevel.VITAL });
     const wrapper = mount(MetadataSection, {
       props: { modelValue: task }
     });
     
     await wrapper.vm.$nextTick();
     
     expect(wrapper.emitted('update:validation')[0]).toEqual([true]);
   });
   ```

5. **Test Case 2.3.6.5: Form Layout Responsive**
   ```typescript
   it('should layout properly on mobile', () => {
     // Test at narrow viewport
     // Verify importance field is full width
     // Verify tags field is full width
     // No white space or misalignment
   });
   ```

---

### Task 2.3.7: Integration Tests - Form Workflow

**Objective:** Test complete create/edit workflow without urgency

**Test File:** [apps/web/src/modules/task/presentation/views/__tests__/TaskFormPage.spec.ts](TaskFormPage.spec.ts)

**Test Scenarios:**

1. **Test Case 2.3.7.1: Create Task Without Urgency**
   ```typescript
   it('should create task with only importance, no urgency', async () => {
     const form = renderTaskForm();
     
     await form.fillTitle('New Task');
     await form.selectImportance(ImportanceLevel.VITAL);
     await form.clickSave();
     
     expect(mockApiClient.createTaskTemplate).toHaveBeenCalledWith({
       title: 'New Task',
       importance: ImportanceLevel.VITAL,
       // urgency NOT included
     });
   });
   ```

2. **Test Case 2.3.7.2: Edit Existing Task Ignores Urgency**
   ```typescript
   it('should edit task and ignore existing urgency value', async () => {
     const existingTask = createMockTask({
       importance: ImportanceLevel.MODERATE,
       urgency: UrgencyLevel.HIGH, // has old urgency value
     });
     
     const form = renderTaskForm({ task: existingTask });
     
     // Urgency field not visible
     expect(form.queryByTestId('urgency-select')).toBeNull();
     
     // Can edit importance
     await form.selectImportance(ImportanceLevel.IMPORTANT);
     await form.clickSave();
     
     // Request doesn't include urgency
     expect(mockApiClient.updateTaskTemplate).toHaveBeenCalledWith({
       uuid: existingTask.uuid,
       importance: ImportanceLevel.IMPORTANT,
       // urgency NOT included
     });
   });
   ```

---

### Task 2.3.8: Visual Regression Testing

**Objective:** Ensure form layout is correct after field removal

**Tools:** Visual testing tool (Chromatic, Percy, or manual screenshots)

**Scenarios:**

1. **Light Theme - Desktop**
   - Verify spacing and alignment
   - Verify field labels are clear
   - Verify tags field uses full width

2. **Light Theme - Tablet**
   - Verify responsive layout
   - Verify form doesn't overflow

3. **Light Theme - Mobile**
   - Verify all fields stack vertically
   - Verify buttons are clickable

4. **Dark Theme - All Screen Sizes**
   - Verify text contrast
   - Verify field colors visible
   - Verify no dark theme specific issues

**Baseline:** Capture current (with urgency) screenshot  
**Target:** Verify new (without urgency) screenshot matches expectations

---

### Task 2.3.9: Update Desktop App Tests

**Objective:** Similar to Web app tests, but for Desktop (React)

**Files to Create/Update:**
- [apps/desktop/src/renderer/modules/task/presentation/__tests__/TaskForm.spec.tsx](TaskForm.spec.tsx)
- [apps/desktop/src/renderer/modules/task/presentation/__tests__/TaskFormPage.spec.tsx](TaskFormPage.spec.tsx)

**Test Structure Similar to Web App (adjust for React syntax)**

---

### Task 2.3.10: Update API Response Handling

**Objective:** Ensure frontend gracefully handles API responses with/without urgency

**Implementation:**
```typescript
// In API response handling, strip urgency if present
function cleanTaskDTO(dto: TaskTemplateClientDTO): TaskTemplateClientDTO {
  // If API accidentally includes urgency (for backward compatibility),
  // we should ignore it on the frontend
  const { urgency, ...rest } = dto;
  return rest as TaskTemplateClientDTO;
}
```

**Placement:** In taskApiClient.ts or response interceptor

---

### Task 2.3.11: Documentation & Migration Notes

**Objective:** Document the UI changes for developers and users

**Files to Create/Update:**

1. [docs/CHANGELOG.md](docs/CHANGELOG.md) - Add entry
   ```markdown
   ## [Unreleased]
   
   ### Removed
   - Removed "Urgency" field from task creation/edit forms
   - Removed "Priority" input field (now computed automatically)
   
   ### Changed
   - Task forms now focus on "Importance" only for user input
   - Priority is calculated automatically based on importance and due date
   - UI simplified for better user experience
   ```

2. [docs/USER-GUIDE.md](docs/USER-GUIDE.md) - Update task management section
   ```markdown
   ### Creating a Task
   
   The new task form has been simplified. When creating a task, you now only need to set:
   - **Title**: Task name
   - **Description**: Optional details
   - **Importance**: How important is this task? (Vital, Important, Moderate, Minor, Trivial)
   - **Due Date**: When should it be done? (optional)
   - **Tags**: Labels for organization
   
   The system automatically calculates the task's priority based on its importance and due date.
   ```

3. [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) - Add note about removal
   ```markdown
   ### Task Form Changes (Story 2.3)
   
   The task form in both Web and Desktop apps has been updated:
   - Urgency field removed
   - Priority input removed (now computed)
   - Importance field retained
   - Form validation adjusted to not require urgency
   
   See MetadataSection.vue and TaskForm.tsx for implementation details.
   ```

---

## Dev Notes

### Why Remove Urgency?

From the PRD and Epic requirements:
1. **Cognitive Load:** Users don't need to set both importance AND urgency
2. **Redundancy:** Priority calculation already incorporates time aspect (due date)
3. **Simplification:** New algorithm (Importance * 0.6 + TimeRemaining * 0.4) handles both dimensions
4. **UX Improvement:** Fewer form fields = faster task creation

### Importance vs Priority vs Urgency

**Old Model (Deprecated):**
- User sets: Importance + Urgency + Priority
- System: Stores both

**New Model (Recommended):**
- User sets: Importance + Due Date
- System: Calculates Priority automatically
- Urgency: Implicit in due date (tasks with near/past due dates get priority boost)

### Backward Compatibility

Existing tasks with urgency values will:
1. Continue to work on backend (data preserved)
2. Show in list view correctly (priority recalculated without urgency)
3. Cannot be edited to set urgency again (field not in form)
4. Will gradually transition to new system as users re-save tasks

---

## Acceptance Validation Checklist

- [ ] **AC1 Validation:** Urgency field not visible in Web form
- [ ] **AC2 Validation:** Priority field not in form (computed by backend)
- [ ] **AC3 Validation:** Importance field still visible and functional
- [ ] **AC4 Validation:** Form layout clean and well-organized
- [ ] **AC5 Validation:** API requests don't include urgency/priority
- [ ] **AC6 Validation:** Editing existing task with urgency works correctly
- [ ] **AC7 Validation:** Visual tests pass for all themes/sizes
- [ ] **Code Review:** Peer review confirms clean removal, no orphaned code
- [ ] **Web App Tests:** All unit and integration tests passing
- [ ] **Desktop App Tests:** All tests passing
- [ ] **Merge to Main:** All tests passing, PR approved

---

## Related Stories & Dependencies

**Prerequisite (Complete ✓):**
- Story 2.1: Implement In-Memory Sorting ✓
- Story 2.2: Frontend API Integration ✓

**Downstream (Enabled by this story):**
- Story 2.4: Task List Visual Optimization (can now focus purely on importance-based colors)
- Story 2.5: Backend API Parameter Support (fewer parameters to handle)
- Story 2.6: Performance Testing (simpler form = faster load times)

---

## Commit Strategy

### Commit 1: Remove MetadataSection Urgency Field (Web)
```
feat(web/task): remove urgency field from task form

- Remove urgency select dropdown from MetadataSection.vue
- Remove urgency computed property and validations
- Remove UrgencyLevel import
- Adjust tags field to full width
- Update form validation to not require urgency
```

### Commit 2: Update Web App Validation & Types
```
feat(web/task): update form validation and types

- Remove urgency from form validation rules
- Update CreateTaskTemplateRequest type
- Update UpdateTaskTemplateRequest type
- Add deprecation note if urgency still in schema
```

### Commit 3: Update Desktop App
```
feat(desktop/task): remove urgency field from task form

- Remove urgency field from TaskForm component
- Update form validation
- Update request types
- Adjust layout similar to Web app
```

### Commit 4: Add Unit Tests
```
test(task): add tests for urgency field removal

- Test that urgency field not rendered (Web)
- Test that importance field still functional (Web)
- Test that validation passes without urgency (Web)
- Similar tests for Desktop app
```

### Commit 5: Add Integration Tests
```
test(task): add integration tests for form workflow

- Test create task without urgency
- Test edit task ignores existing urgency
- Test API request doesn't include urgency
```

### Commit 6: Update Documentation
```
docs: update documentation for task form changes

- Update changelog
- Update user guide
- Update developer guide
- Add migration notes
```

---

## References

- [MetadataSection Component](apps/web/src/modules/task/presentation/components/TaskTemplateForm/sections/MetadataSection.vue)
- [Task Form Component](apps/web/src/modules/task/presentation/components/TaskTemplateForm/TaskTemplateForm.vue)
- [Epic 2 Requirements](epics.md#epic-2-intelligent-sorting--ux)
- [Story 1.5: Application Layer Integration](1-5-integrate-priority-calculation-in-application-layer-task-query-service.md)

---

## Sign-Off

**Created by:** SM Agent (Sprint Planning)
**Date:** 2026-01-16
**Status:** READY FOR DEVELOPMENT
**Next Step:** Assign to Frontend Engineer → Implement Story 2.3 → Merge to main

# Goal Module Component Migration Guide

## Quick Start

All Goal module components are now available in the shared UI package:

```typescript
import {
  AIKeyResultsSection,
  ActivateFocusModeDialog,
  FocusModeHistoryPanel,
  KRPreviewList,
  GoalCard,
  KeyResultCard,
  // ... and 33+ more
} from '@dailyuse/ui-vue-shadcn/goal';
```

## Migration Status

### ✅ Fully Converted (4 components - Production Ready)
These components use shadcn/ui and are decoupled from stores/router:

1. **AIKeyResultsSection** - AI key results management
2. **ActivateFocusModeDialog** - Focus mode activation
3. **FocusModeHistoryPanel** - Focus mode history
4. **KRPreviewList** - Key results preview list

### 🔄 Available (34 components - Needs Conversion)
Copied from source, may still use Vuetify. Convert as needed.

## Using Converted Components

### Example: AIKeyResultsSection

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { AIKeyResultsSection } from '@dailyuse/ui-vue-shadcn/goal';
import { useToast } from '@dailyuse/ui-vue-shadcn';

const { toast } = useToast();
const acceptedResults = ref([]);

function handleSuccess(message: string) {
  toast({ title: '成功', description: message });
}

function handleError(message: string) {
  toast({ 
    title: '错误', 
    description: message, 
    variant: 'destructive' 
  });
}

function handleResultsUpdated(results) {
  acceptedResults.value = results;
  // Save to store or call API
}
</script>

<template>
  <AIKeyResultsSection
    :goal-title="goalData.title"
    :goal-description="goalData.description"
    :on-success="handleSuccess"
    :on-error="handleError"
    @results-updated="handleResultsUpdated"
    @manual-add="showManualDialog"
  />
</template>
```

### Example: ActivateFocusModeDialog

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ActivateFocusModeDialog } from '@dailyuse/ui-vue-shadcn/goal';
import type { ActivateFocusModeRequest } from '@dailyuse/contracts/goal';

const isOpen = ref(false);
const goals = ref([
  { uuid: '1', title: 'Goal 1' },
  { uuid: '2', title: 'Goal 2' },
]);

async function activateFocusMode(request: ActivateFocusModeRequest) {
  // Call your API or store action
  const response = await goalService.activateFocusMode(request);
  return response;
}

function handleActivated(focusMode) {
  console.log('Focus mode activated:', focusMode);
}
</script>

<template>
  <ActivateFocusModeDialog
    v-model="isOpen"
    :goals="goals"
    :on-activate="activateFocusMode"
    @activated="handleActivated"
  />
</template>
```

## Converting Remaining Components

### Conversion Pattern

1. **Replace Vuetify Components:**
```vue
<!-- Before -->
<v-card>
  <v-card-title>Title</v-card-title>
  <v-card-text>Content</v-card-text>
</v-card>

<!-- After -->
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

2. **Replace Icons:**
```vue
<!-- Before -->
<v-icon>mdi-check-circle</v-icon>

<!-- After -->
<CheckCircle class="w-4 h-4" />
```

3. **Replace CSS Classes:**
```vue
<!-- Before -->
<div class="d-flex align-center justify-space-between pa-4 mb-2">

<!-- After -->
<div class="flex items-center justify-between p-4 mb-2">
```

4. **Remove Store Dependencies:**
```vue
<!-- Before -->
import { useGoalStore } from '@dailyuse/domain-client';
const goalStore = useGoalStore();
goalStore.updateGoal(data);

<!-- After -->
interface Props {
  onUpdate?: (data: GoalData) => Promise<void>;
}
const props = defineProps<Props>();
await props.onUpdate?.(data);
```

5. **Remove Router Dependencies:**
```vue
<!-- Before -->
import { useRouter } from 'vue-router';
const router = useRouter();
router.push('/goals/123');

<!-- After -->
const emit = defineEmits<{
  navigate: [path: string];
}>();
emit('navigate', '/goals/123');
```

## Component API Pattern

All converted components follow this pattern:

```typescript
interface Props {
  // Data props
  data?: DataType;
  items?: ItemType[];
  
  // Callback props for actions
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onSave?: (data: DataType) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const emit = defineEmits<{
  // UI events
  update: [value: any];
  change: [value: any];
  
  // Navigation events
  navigate: [path: string];
  
  // Data events
  saved: [data: DataType];
  deleted: [id: string];
}>();
```

## Import Types

Always import types from contracts:

```typescript
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  FocusModeClientDTO,
  ActivateFocusModeRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
} from '@dailyuse/contracts/goal';
```

## Component Reference

See `packages/ui-vue-shadcn/src/components/custom/goal/README.md` for:
- Complete component list (38 components)
- Detailed conversion notes
- Full API documentation
- Additional examples

## Next Steps

1. Use fully converted components immediately
2. Convert remaining components as needed
3. Follow the conversion patterns above
4. Test thoroughly
5. Update documentation

## Support

For questions or issues:
1. Check README.md in goal directory
2. Review GOAL_EXTRACTION_COMPLETE.md
3. Examine converted component examples
4. Follow established patterns

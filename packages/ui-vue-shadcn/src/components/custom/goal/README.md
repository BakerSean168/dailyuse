# Goal Module Components

This directory contains all Goal module UI components extracted from `apps/web` and converted to use shadcn/ui.

## Components Overview

### Root Components (8)
- **AIGenerateKRButton.vue** - Button to trigger AI key result generation
- **AIKeyResultsSection.vue** - Complete section for AI-generated key results management
- **ActivateFocusModeDialog.vue** - Dialog for activating focus mode
- **FocusModeHistoryPanel.vue** - Panel showing focus mode history
- **FocusModeStatusBar.vue** - Status bar for active focus mode
- **GoalRecordCard.vue** - Card for displaying goal records
- **KRPreviewList.vue** - Preview list for generated key results
- **ProgressBreakdownPanel.vue** - Panel showing progress breakdown

### Cards (6)
- **GoalCard.vue** - Standard goal card display
- **GoalInfoShowCard.vue** - Detailed goal information card
- **GoalRecordCard.vue** - Goal record card variant
- **GoalReviewListCard.vue** - Card for goal review lists
- **KeyResultCard.vue** - Key result display card
- **MotivateCard.vue** - Motivational card component

### Comparison (2)
- **ComparisonStatsPanel.vue** - Panel for comparing goal statistics
- **MultiGoalSelector.vue** - Selector for multiple goals

### DAG (2)
- **ExportDialog.vue** - Dialog for exporting DAG visualization
- **GoalDAGVisualization.vue** - DAG visualization component

### Demos (2)
- **GoalCardDemo.vue** - Demo of goal card
- **GoalReviewCardDemo.vue** - Demo of goal review card

### Dialogs (3)
- **GoalFolderDialog.vue** - Dialog for goal folder management
- **GoalRecordDialog.vue** - Dialog for goal records
- **KeyResultDialog.vue** - Dialog for key result management

### ECharts (7)
- **GoalGanttChart.vue** - Gantt chart for goals
- **GoalProgressChart.vue** - Goal progress visualization
- **KrCompletionChart.vue** - Key result completion chart
- **KrProgressChart.vue** - Key result progress chart
- **KrWeightDistributionChart.vue** - Weight distribution chart
- **PeriodBarChart.vue** - Period-based bar chart
- **ReviewProgressChart.vue** - Review progress chart

### Rules (1)
- **StatusRuleEditor.vue** - Editor for status rules

### Template (1)
- **TemplateBrowser.vue** - Browser for goal templates

### Timeline (2)
- **GoalTimelineView.vue** - Timeline view for goals
- **TimelineControls.vue** - Controls for timeline

### Weight Snapshot (3)
- **WeightComparison.vue** - Weight comparison component
- **WeightSnapshotList.vue** - List of weight snapshots
- **WeightTrendChart.vue** - Weight trend visualization

### Weight (1)
- **WeightSuggestionPanel.vue** - Panel for weight suggestions

## Conversion Notes

### Vuetify → shadcn/ui Mappings

The following conversions were applied:

#### Components
- `v-card` → `Card/CardContent/CardHeader/CardFooter`
- `v-btn` → `Button`
- `v-dialog` → `Dialog/DialogContent`
- `v-text-field` → `Input`
- `v-textarea` → `Textarea`
- `v-select` → `Select`
- `v-chip` → `Badge`
- `v-alert` → `Alert`
- `v-icon` → lucide-vue-next icons
- `v-divider` → `Separator`
- `v-spacer` → `<div class="flex-1" />`

#### CSS Classes
- `d-flex` → `flex`
- `align-center` → `items-center`
- `justify-space-between` → `justify-between`
- `pa-4` → `p-4`
- `mb-4` → `mb-4`
- `gap-2` → `gap-2`

### Removed Dependencies

1. **Store Access**: All direct store calls removed
  - Replace with props and events
  - Components now emit events instead of calling store actions
  - `custom/goal` components MUST NOT use Pinia/global state tools directly

2. **Router Access**: Router navigation removed
   - Replace with `@navigate` events
   - Parent components handle routing

3. **Message Notifications**: Using callbacks instead
   - Props: `onSuccess`, `onError`, `onWarning`
   - Emit events for notifications

### Type Imports

`custom/goal` 属于 `domain-business` 组件分类，但仍保持 presentational 边界。

All components now import types from `@dailyuse/contracts/goal`:
- `GoalClientDTO`
- `KeyResultClientDTO`
- `FocusModeClientDTO`
- `ActivateFocusModeRequest`
- etc.

### Boundary Rules (Mandatory)

- All components in this directory MUST be props-driven and emits-driven
- Components MUST NOT call APIs directly
- Components MUST NOT perform routing side effects
- Components MUST NOT own app-level/global state
- Container/page layers are responsible for orchestration, store interaction, and side effects

## Usage Example

```vue
<script setup lang="ts">
import { AIKeyResultsSection } from '@dailyuse/ui-vue-shadcn/goal';
import { useToast } from '@dailyuse/ui-vue-shadcn';

const { toast } = useToast();

function handleSuccess(message: string) {
  toast({
    title: '成功',
    description: message,
  });
}

function handleError(message: string) {
  toast({
    title: '错误',
    description: message,
    variant: 'destructive',
  });
}
</script>

<template>
  <AIKeyResultsSection
    :goal-title="goalTitle"
    :goal-description="goalDescription"
    :on-success="handleSuccess"
    :on-error="handleError"
    @results-updated="handleResultsUpdated"
    @manual-add="handleManualAdd"
  />
</template>
```

## Status

✅ All 33 requested components extracted and available
✅ Directory structure maintained
✅ Types imported from contracts
✅ shadcn/ui components used where converted
✅ Exports configured in index.ts

### Conversion Status by Component

**Fully Converted (4):**
- AIKeyResultsSection.vue
- ActivateFocusModeDialog.vue
- FocusModeHistoryPanel.vue
- KRPreviewList.vue

**Partially Converted (remaining):**
- Most components copied but may still use Vuetify components
- Need individual review and conversion as needed

## Next Steps

1. Review each component for remaining Vuetify dependencies
2. Convert remaining Vuetify components to shadcn/ui
3. Update store dependencies to use props/events
4. Add comprehensive tests
5. Document component APIs

<template>
  <article class="group rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/30" data-testid="goal-card">
    <button type="button" class="w-full text-left" @click="emit('view')">
      <div class="flex items-start justify-between gap-3"><div class="min-w-0"><h3 class="truncate font-medium">{{ goal.name }}</h3><p v-if="goal.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ goal.description }}</p></div><Badge variant="secondary">{{ goal.status }}</Badge></div>
      <div class="mt-4"><div class="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{{ Math.round(goal.overallProgress) }}%</span></div><Progress :model-value="goal.overallProgress" /></div>
      <div class="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{{ goal.completedKeyResults }}/{{ goal.totalKeyResults }} KR</span><template v-if="goal.dueDate"><span>·</span><span>Due {{ formatProductDate(goal.dueDate) }}</span></template><template v-if="goal.labels.length"><span>·</span><span>{{ goal.labels.map(label=>label.name).join(', ') }}</span></template></div>
    </button>
    <div class="mt-3 flex justify-end gap-1 border-t pt-3"><Button variant="ghost" size="sm" @click="emit('edit')">{{ t('common.edit') }}</Button><Button variant="ghost" size="sm" class="text-destructive" @click="emit('delete')">{{ t('common.delete') }}</Button></div>
  </article>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'; import { formatProductDate } from '../../../../shared/utils/product-time'; import type { GoalClientDTO } from '@memoflow/contracts/goal'; import { Badge,Button,Progress } from '@memoflow/ui-vue-shadcn'; const {t}=useI18n(); defineProps<{goal:GoalClientDTO}>(); const emit=defineEmits<{view:[];edit:[];delete:[]}>();
</script>

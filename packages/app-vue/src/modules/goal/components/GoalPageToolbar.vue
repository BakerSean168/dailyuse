<template>
  <header class="z-10 flex min-h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur-sm @2xl/panel:px-6" data-testid="goal-page-toolbar">
    <DropdownMenu>
      <DropdownMenuTrigger as-child><Button variant="ghost" size="sm" class="h-8 gap-1.5"><LayoutGrid class="h-4 w-4"/><span>{{ currentLabel }}</span><span class="text-xs text-muted-foreground">{{ visibleGoalCount }}</span><ChevronDown class="h-3.5 w-3.5"/></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-56">
        <DropdownMenuItem v-for="view in systemViews" :key="view.id" :class="activeSystemView === view.id ? 'bg-accent' : ''" @click="emit('select-system-view', view.id)"><span class="flex-1">{{ view.label }}</span><span class="text-xs text-muted-foreground">{{ view.count }}</span></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <div class="relative ml-auto w-48"><Search class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input :model-value="searchQuery" data-testid="goal-search-input" class="h-8 pl-8" :placeholder="t('goal.list.searchGoals')" @update:model-value="emit('search', String($event))"/></div>
    <Button variant="ghost" size="icon" class="h-8 w-8" data-testid="goal-refresh-entry" :aria-label="t('common.refresh')" @click="emit('refresh')"><RefreshCw class="h-4 w-4"/></Button>
    <Button size="sm" class="h-8" data-testid="create-goal-entry" data-primary-action="create-goal" @click="emit('create-goal')"><Plus class="mr-1 h-4 w-4"/>{{ t('goal.list.newGoal') }}</Button>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue'; import { useI18n } from 'vue-i18n'; import { ChevronDown, LayoutGrid, Plus, RefreshCw, Search } from '@lucide/vue';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from '@memoflow/ui-vue-shadcn';
import type { GoalSystemView } from '@memoflow/contracts/goal';
const props=defineProps<{systemViews:Array<{id:GoalSystemView;label:string;count:number}>;activeSystemView:GoalSystemView;visibleGoalCount:number;searchQuery:string}>();
const emit=defineEmits<{ 'create-goal':[];'select-system-view':[GoalSystemView];refresh:[];search:[string]}>(); const {t}=useI18n();
const currentLabel=computed(()=>props.systemViews.find(v=>v.id===props.activeSystemView)?.label ?? t('goal.systemFolders.active'));
</script>

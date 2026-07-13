<template>
  <div
    class="flex h-12 shrink-0 items-center gap-1 border-b bg-sidebar/60 px-2"
    data-testid="reminder-group-switcher-bar"
  >
    <!-- 分组切换下拉：窄档形态的第二侧栏（V2 §6.4 / §7） -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 min-w-0 gap-1.5 px-2 font-medium"
          data-testid="reminder-group-switcher-trigger"
        >
          <component :is="currentIcon" class="h-4 w-4 shrink-0 text-primary" />
          <span class="truncate">{{ currentLabel }}</span>
          <span v-if="currentCount !== null" class="text-xs text-muted-foreground">
            {{ currentCount }}
          </span>
          <ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-56">
        <DropdownMenuItem
          data-testid="reminder-group-option-all"
          :class="!selectedGroupId ? 'bg-accent' : ''"
          @click="$emit('select-group', null)"
        >
          <LayoutGrid class="mr-2 h-4 w-4" />
          <span class="flex-1 truncate">{{ t('reminder.linear.allReminders') }}</span>
          <span class="text-xs text-muted-foreground">{{ templateCount }}</span>
        </DropdownMenuItem>

        <template v-if="groups.length > 0">
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="group in groups"
            :key="group.id"
            :data-testid="`reminder-group-option-${group.id}`"
            :class="selectedGroupId === group.id ? 'bg-accent' : ''"
            @click="$emit('select-group', group.id)"
          >
            <Folder class="mr-2 h-4 w-4" />
            <span class="flex-1 truncate">{{ group.name }}</span>
            <span class="text-xs text-muted-foreground">{{ group.stats.totalTemplates }}</span>
          </DropdownMenuItem>
        </template>

        <DropdownMenuSeparator />
        <DropdownMenuItem data-testid="reminder-create-group-entry" @click="$emit('create-group')">
          <FolderPlus class="mr-2 h-4 w-4" />
          {{ t('reminder.action.createGroup') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div class="ml-auto flex items-center gap-1">
      <!-- 主操作：新建提醒（testid 契约随迁，e2e 窄/宽两档都可用） -->
      <Button
        size="sm"
        class="h-8"
        data-testid="create-reminder-template-button"
        :title="t('reminder.action.createReminder')"
        @click="$emit('create-template')"
      >
        <Plus class="mr-1 h-4 w-4" />
        {{ t('reminder.action.createReminder') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReminderGroupSwitcherBar — 提醒模块第二侧栏的窄档形态（UI 重构 V2 §6.4 / §7）
 *
 * split 窄档下分组侧栏（w-64）在 320–750px 面板里放不下，收敛为
 * 一行顶栏：分组下拉（全部提醒 + 各组计数）+ 新建提醒。
 * 与宽档侧栏共用 selectedGroupId / create 动作；由 ReminderLinearView 按
 * 面板档位二选一渲染；`create-reminder-template-button` testid 契约随迁（V2 §8-1）。
 */
import { computed, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown, Folder, FolderPlus, LayoutGrid, Plus } from 'lucide-vue-next';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import type { ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';

const props = defineProps<{
  groups: ReminderGroupClientDTO[];
  selectedGroupId: string | null;
  templateCount: number;
}>();

defineEmits<{
  'select-group': [groupId: string | null];
  'create-template': [];
  'create-group': [];
}>();

const { t } = useI18n();

const selectedGroup = computed(
  () => props.groups.find((group) => group.id === props.selectedGroupId) ?? null,
);

const currentLabel = computed(() => {
  if (selectedGroup.value) return selectedGroup.value.name;
  return t('reminder.linear.allReminders');
});

const currentCount = computed<number | null>(() => {
  if (selectedGroup.value) return selectedGroup.value.stats.totalTemplates;
  return props.templateCount;
});

const currentIcon = computed<Component>(() => {
  if (selectedGroup.value) return Folder;
  return LayoutGrid;
});
</script>

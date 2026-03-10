<template>
  <ActionableWrapper :actions="menuActions" :show-more-button="false">
    <div
      :class="[
        'flex gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50 border-b last:border-b-0',
        !notification.isRead && 'bg-info/10 dark:bg-info/20',
      ]"
      @click="$emit('click', notification)"
    >
      <!-- Icon -->
      <div
        :class="[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          typeColorClass,
        ]"
      >
        <component :is="typeIcon" class="h-5 w-5 text-white" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <!-- Unread indicator dot -->
          <span v-if="!notification.isRead" class="h-2 w-2 shrink-0 rounded-full bg-info" />
          <span :class="['text-sm', !notification.isRead && 'font-semibold']">
            {{ notification.title }}
          </span>
          <Badge
            v-if="
              notification.importance === ImportanceLevel.Vital ||
              notification.importance === ImportanceLevel.Important
            "
            :variant="priorityVariant"
            class="text-xs"
          >
            {{ priorityText }}
          </Badge>
        </div>

        <p class="text-sm text-muted-foreground line-clamp-2">
          {{ notification.content }}
        </p>

        <p class="text-xs text-muted-foreground mt-1">
          {{ timeDisplay }}
        </p>
      </div>
    </div>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS, ja, ko, zhTW } from 'date-fns/locale';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import {
  Info,
  CheckCircle2,
  Target,
  BellRing,
  CalendarClock,
  Bell,
  Check,
  Trash2,
} from 'lucide-vue-next';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

interface Props {
  notification: NotificationClientDTO;
}

const props = defineProps<Props>();

const { t, locale } = useI18n();

const dateFnsLocaleMap: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': ja,
  'ko-KR': ko,
  'zh-TW': zhTW,
};

const emit = defineEmits<{
  click: [notification: NotificationClientDTO];
  'mark-read': [id: string];
  delete: [id: string];
}>();

const menuActions = computed<MenuAction[]>(() => {
  const actions: MenuAction[] = [];

  if (!props.notification.isRead) {
    actions.push({
      key: 'markRead',
      label: menuLabel('markRead'),
      icon: Check,
      handler: () => emit('mark-read', props.notification.id),
    });
  }

  actions.push({
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: actions.length > 0,
    handler: () => emit('delete', props.notification.id),
  });

  return actions;
});

const typeIconMap: Record<string, any> = {
  SYSTEM: Info,
  TASK: CheckCircle2,
  GOAL: Target,
  REMINDER: BellRing,
  SCHEDULE: CalendarClock,
};

const typeColorClassMap: Record<string, string> = {
  SYSTEM: 'bg-info',
  TASK: 'bg-success',
  GOAL: 'bg-warning',
  REMINDER: 'bg-purple-500',
  SCHEDULE: 'bg-cyan-500',
};

const typeIcon = computed(() => typeIconMap[props.notification.type] || Bell);
const typeColorClass = computed(() => typeColorClassMap[props.notification.type] || 'bg-muted-foreground');

const priorityVariant = computed(() => {
  switch (props.notification.importance) {
    case ImportanceLevel.Vital:
    case ImportanceLevel.Important:
      return 'destructive';
    case ImportanceLevel.Moderate:
      return 'secondary';
    default:
      return 'outline';
  }
});

const priorityText = computed(() => {
  switch (props.notification.importance) {
    case ImportanceLevel.Vital:
      return t('notification.item.priorityVital');
    case ImportanceLevel.Important:
      return t('notification.item.priorityImportant');
    default:
      return '';
  }
});

const timeDisplay = computed(() => {
  try {
    return formatDistanceToNow(new Date(props.notification.createdAt), {
      addSuffix: true,
      locale: dateFnsLocaleMap[locale.value] || zhCN,
    });
  } catch {
    return props.notification.createdAt;
  }
});
</script>

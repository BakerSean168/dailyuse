<template>
  <ActionableWrapper :actions="menuActions" :show-more-button="false">
    <div
      :class="[
        'flex gap-3 border-b border-l-4 p-4 cursor-pointer transition-all last:border-b-0',
        notification.isRead
          ? 'border-l-transparent bg-background/70 opacity-75 hover:bg-muted/40 hover:opacity-100'
          : 'border-l-info bg-info/12 shadow-sm hover:bg-info/16',
      ]"
      @click="$emit('click', notification)"
    >
      <!-- Icon -->
      <div
        :class="[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
          typeColorClass,
          notification.isRead ? 'opacity-55 saturate-50' : 'ring-4 ring-info/12 shadow-sm',
        ]"
      >
        <component :is="typeIcon" class="h-5 w-5 text-white" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <!-- Unread indicator dot -->
          <span
            v-if="!notification.isRead"
            class="h-2.5 w-2.5 shrink-0 rounded-full bg-info shadow-[0_0_0_4px_hsl(var(--info)/0.16)]"
          />
          <span
            :class="[
              'text-sm transition-colors',
              notification.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground',
            ]"
          >
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

        <p
          :class="[
            'text-sm line-clamp-2 transition-colors',
            notification.isRead ? 'text-muted-foreground/80' : 'text-foreground/80',
          ]"
        >
          {{ notification.content }}
        </p>

        <p
          :class="[
            'mt-1 text-xs transition-colors',
            notification.isRead ? 'text-muted-foreground/70' : 'font-medium text-info/90',
          ]"
        >
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

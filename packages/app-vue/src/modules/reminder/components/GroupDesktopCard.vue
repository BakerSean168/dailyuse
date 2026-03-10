<template>
  <ActionableWrapper
    v-if="group"
    :actions="menuActions"
    more-button-position="bottom-left"
    wrapper-class="rounded-2xl"
  >
    <div
      class="relative group cursor-pointer rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl"
      :style="{ backgroundColor: getBackgroundColor() }"
      @click="$emit('click', group)"
    >
      <!-- Icon and Title -->
      <div class="flex flex-col items-center mb-4">
        <div
          class="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center mb-3"
        >
          <component :is="getIcon()" class="h-8 w-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-center line-clamp-2">{{ group.name }}</h3>
        <p
          v-if="group.description"
          class="text-xs text-muted-foreground text-center mt-1 line-clamp-2"
        >
          {{ group.description }}
        </p>
      </div>

      <!-- Template Count Badge -->
      <div class="absolute top-3 right-3">
        <Badge variant="secondary" class="font-medium">
          {{ templateCount }}
        </Badge>
      </div>

      <!-- Status Indicator -->
      <div class="absolute top-3 left-3">
        <div :class="['w-3 h-3 rounded-full', group.enabled ? 'bg-success' : 'bg-gray-400']" />
      </div>

      <!-- Control Mode Badge -->
      <div class="absolute bottom-3 right-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Badge variant="outline" class="text-xs">
                <component
                  :is="group.controlMode === 'Group' ? Users : User"
                  class="h-3 w-3 mr-1"
                />
                {{ group.controlMode === 'Group' ? 'Group' : 'Individual' }}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {{
                group.controlMode === 'Group'
                  ? 'All templates controlled together'
                  : 'Templates controlled individually'
              }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Folder,
  Briefcase,
  Home,
  School,
  Heart,
  ShoppingCart,
  Gamepad,
  Plane,
  DollarSign,
  Users as UsersIcon,
  User,
  Users,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

interface ReminderGroup {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  enabled: boolean;
  controlMode: string;
}

const props = withDefaults(
  defineProps<{
    group: ReminderGroup;
    templateCount?: number;
  }>(),
  {
    templateCount: 0,
  },
);

const emit = defineEmits<{
  click: [group: ReminderGroup];
  edit: [group: ReminderGroup];
  delete: [group: ReminderGroup];
}>();

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'edit',
    label: menuLabel('editGroup'),
    icon: Pencil,
    handler: () => emit('edit', props.group),
  },
  {
    key: 'delete',
    label: menuLabel('deleteGroup'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => emit('delete', props.group),
  },
]);

const getIcon = () => {
  const iconMap: Record<string, any> = {
    'mdi-folder': Folder,
    'mdi-briefcase': Briefcase,
    'mdi-home': Home,
    'mdi-school': School,
    'mdi-heart': Heart,
    'mdi-cart': ShoppingCart,
    'mdi-gamepad': Gamepad,
    'mdi-airplane': Plane,
    'mdi-currency-usd': DollarSign,
    'mdi-account-group': UsersIcon,
  };
  return iconMap[props.group.icon || 'mdi-folder'] || Folder;
};

const getBackgroundColor = (): string => {
  if (!props.group.enabled) {
    return 'rgb(245, 245, 245)';
  }
  const color = props.group.color || '#2196F3';
  // Convert hex to rgba with opacity
  return `${color}20`;
};
</script>

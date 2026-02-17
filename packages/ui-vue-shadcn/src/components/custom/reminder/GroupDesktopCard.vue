<template>
  <div
    v-if="group"
    class="relative group cursor-pointer rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl"
    :style="{ backgroundColor: getBackgroundColor() }"
    @click="$emit('click', group)"
  >
    <!-- Icon and Title -->
    <div class="flex flex-col items-center mb-4">
      <div class="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center mb-3">
        <component :is="getIcon()" class="h-8 w-8 text-primary" />
      </div>
      <h3 class="text-lg font-semibold text-center line-clamp-2">{{ group.name }}</h3>
      <p v-if="group.description" class="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
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
      <div
        :class="[
          'w-3 h-3 rounded-full',
          group.enabled ? 'bg-green-500' : 'bg-gray-400'
        ]"
      />
    </div>

    <!-- Control Mode Badge -->
    <div class="absolute bottom-3 right-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Badge variant="outline" class="text-xs">
              <component :is="group.controlMode === 'GROUP' ? Users : User" class="h-3 w-3 mr-1" />
              {{ group.controlMode === 'GROUP' ? 'Group' : 'Individual' }}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {{ group.controlMode === 'GROUP' ? 'All templates controlled together' : 'Templates controlled individually' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Edit Button (appears on hover) -->
    <Button
      variant="ghost"
      size="icon"
      class="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
      @click.stop="$emit('edit', group)"
    >
      <Pencil class="h-4 w-4" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Folder, Briefcase, Home, School, Heart, ShoppingCart, Gamepad, Plane, DollarSign, Users as UsersIcon, User, Users, Pencil } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReminderGroup {
  uuid: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  enabled: boolean;
  controlMode: 'GROUP' | 'INDIVIDUAL';
}

interface Props {
  group: ReminderGroup;
  templateCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  templateCount: 0,
});

const emit = defineEmits<{
  'click': [group: ReminderGroup];
  'edit': [group: ReminderGroup];
}>();

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

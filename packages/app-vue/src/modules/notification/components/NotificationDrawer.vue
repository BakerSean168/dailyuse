<template>
  <Sheet :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <SheetContent side="right" class="w-[400px] sm:w-[540px]">
      <SheetHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
        <SheetTitle>通知中心</SheetTitle>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            :disabled="unreadCount === 0"
            @click="$emit('mark-all-read')"
          >
            <CheckCheck class="h-4 w-4" />
          </Button>
          <SheetClose as-child>
            <Button variant="ghost" size="icon">
              <X class="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto py-4">
        <slot />
      </div>

      <SheetFooter class="pt-4 border-t">
        <Button
          variant="ghost"
          class="w-full"
          @click="handleViewAll"
        >
          查看全部通知
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { CheckCheck, X } from 'lucide-vue-next';

interface Props {
  modelValue: boolean;
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  unreadCount: 0,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'mark-all-read': [];
  'view-all': [];
}>();

const handleViewAll = () => {
  emit('view-all');
  emit('update:modelValue', false);
};
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { _getConfirmState, _resolveConfirm } from '@dailyuse/ui-vue-shadcn';
import { buttonVariants } from '@dailyuse/ui-vue-shadcn';
import { cn } from '@dailyuse/ui-vue-shadcn';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@dailyuse/ui-vue-shadcn';

const state = _getConfirmState();

const actionClass = computed(() =>
  state.variant === 'destructive'
    ? cn(buttonVariants({ variant: 'destructive' }))
    : cn(buttonVariants()),
);
</script>

<template>
  <AlertDialog :open="state.open" @update:open="(v) => { if (!v) _resolveConfirm(false) }">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.description">
          {{ state.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="_resolveConfirm(false)">
          {{ state.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction :class="actionClass" @click="_resolveConfirm(true)">
          {{ state.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

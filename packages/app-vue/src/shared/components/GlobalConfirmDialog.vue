<script setup lang="ts">
import { computed, watch } from 'vue';
import { _getConfirmState, _resolveConfirm } from '@dailyuse/ui-vue-shadcn';
import { buttonVariants } from '@dailyuse/ui-vue-shadcn';
import { cn } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@dailyuse/ui-vue-shadcn';

const state = _getConfirmState();
let resolvedByAction = false;

watch(
  () => state.open,
  (open) => {
    if (open) {
      resolvedByAction = false;
    }
  },
);

function handleCancel(): void {
  resolvedByAction = true;
  _resolveConfirm(false);
}

function handleConfirm(): void {
  resolvedByAction = true;
  _resolveConfirm(true);
}

function handleOpenUpdate(open: boolean): void {
  if (!open && !resolvedByAction) {
    _resolveConfirm(false);
  }
}

const actionClass = computed(() =>
  state.variant === 'destructive'
    ? cn(buttonVariants({ variant: 'destructive' }))
    : cn(buttonVariants()),
);
</script>

<template>
  <AlertDialog :open="state.open" @update:open="handleOpenUpdate">
    <AlertDialogContent data-testid="global-confirm-dialog">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.description">
          {{ state.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button
          data-testid="global-confirm-cancel"
          variant="outline"
          class="mt-2 sm:mt-0"
          @click="handleCancel"
        >
          {{ state.cancelText }}
        </Button>
        <Button data-testid="global-confirm-confirm" :class="actionClass" @click="handleConfirm">
          {{ state.confirmText }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

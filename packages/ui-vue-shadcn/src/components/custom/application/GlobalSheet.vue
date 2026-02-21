<script setup lang="ts">
/**
 * GlobalSheet.vue
 *
 * 全局侧边抽屉组件。通过 useSheet() 命令式打开，
 * 支持动态传入任意 Vue 组件进行渲染。
 */
import { _getSheetState, _closeSheet } from '../../../composables/useSheet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { cn } from '../../../lib/utils';

const state = _getSheetState();
</script>

<template>
  <Sheet :open="state.open" @update:open="(v) => { if (!v) _closeSheet() }">
    <SheetContent :side="state.side" :class="cn(state.class)">
      <SheetHeader v-if="state.title || state.description">
        <SheetTitle v-if="state.title">{{ state.title }}</SheetTitle>
        <SheetDescription v-if="state.description">{{ state.description }}</SheetDescription>
      </SheetHeader>
      <div class="flex-1 overflow-y-auto py-4">
        <component
          v-if="state.component"
          :is="state.component"
          v-bind="state.componentProps"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>

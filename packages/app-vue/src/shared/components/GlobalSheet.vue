<script setup lang="ts">
/**
 * GlobalSheet.vue
 *
 * 全局侧边抽屉组件。通过 useSheet() 命令式打开，
 * 支持动态传入任意 Vue 组件进行渲染。
 */
import { computed, defineComponent, h, type Component, type PropType } from 'vue';
import { _getSheetState, _closeSheet } from '@dailyuse/ui-vue-shadcn';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@dailyuse/ui-vue-shadcn';
import { cn } from '@dailyuse/ui-vue-shadcn';

const state = _getSheetState();
const componentProps = computed<Record<string, unknown>>(() => state.componentProps ?? {});

const DynamicSheetBody = defineComponent({
  name: 'DynamicSheetBody',
  props: {
    component: {
      type: [Object, Function, String] as PropType<Component | string | null>,
      default: null,
    },
    componentProps: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
  },
  setup(props) {
    return () => (props.component ? h(props.component, props.componentProps) : null);
  },
});
</script>

<template>
  <Sheet
    :open="state.open"
    @update:open="
      (v) => {
        if (!v) _closeSheet();
      }
    "
  >
    <SheetContent
      :side="state.side"
      :class="cn('flex h-full min-h-0 flex-col overflow-hidden', state.class)"
    >
      <SheetHeader v-if="state.title || state.description">
        <SheetTitle v-if="state.title">{{ state.title }}</SheetTitle>
        <SheetDescription v-if="state.description">{{ state.description }}</SheetDescription>
      </SheetHeader>
      <div class="min-h-0 flex-1 overflow-y-auto py-4">
        <DynamicSheetBody
          v-if="state.component"
          :component="state.component"
          :component-props="componentProps"
        />
      </div>
    </SheetContent>
  </Sheet>
</template>

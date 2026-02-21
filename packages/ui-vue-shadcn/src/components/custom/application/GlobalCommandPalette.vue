<script setup lang="ts">
/**
 * GlobalCommandPalette.vue
 *
 * 全局命令面板，Ctrl+K / Cmd+K 唤起。
 * 基于 shadcn-vue 的 CommandDialog 组件。
 *
 * 使用方式：
 *   1. 在 App.vue 中挂载 <GlobalCommandPalette />
 *   2. 通过 registerStaticCommands / registerDynamicCommands 注册命令
 *   3. 用户按 Ctrl+K 即可呼出
 */
import { onMounted, onUnmounted } from 'vue';
import {
  _getCommandPaletteState,
  _setOpen,
  useCommandGroups,
} from '../../../composables/useCommandPalette';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../../ui/command';

const state = _getCommandPaletteState();
const groups = useCommandGroups();

function handleSelect(action: () => void) {
  _setOpen(false);
  // Execute after dialog closes for smooth transition
  setTimeout(action, 150);
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    _setOpen(!state.open);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <CommandDialog :open="state.open" @update:open="_setOpen">
    <CommandInput placeholder="输入命令或搜索..." />
    <CommandList>
      <CommandEmpty>没有找到匹配的命令</CommandEmpty>
      <template v-for="(group, index) in groups" :key="group.id">
        <CommandSeparator v-if="index > 0" />
        <CommandGroup :heading="group.label">
          <CommandItem
            v-for="item in group.items"
            :key="item.id"
            :value="item.label"
            @select="() => handleSelect(item.action)"
          >
            <span class="flex-1">{{ item.label }}</span>
            <kbd
              v-if="item.shortcut"
              class="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
            >
              {{ item.shortcut }}
            </kbd>
          </CommandItem>
        </CommandGroup>
      </template>
    </CommandList>
  </CommandDialog>
</template>

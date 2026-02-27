<template>
  <!--
    ActionableWrapper — adds right-click ContextMenu + hover "..." DropdownMenu
    to any wrapped element. Both menus render the same `actions` array.

    Usage:
      <ActionableWrapper :actions="menuActions">
        <GoalCard :goal="goal" />
      </ActionableWrapper>
  -->
  <ContextMenu>
    <ContextMenuTrigger as-child :disabled="disabled">
      <div class="group/actionable relative" :class="wrapperClass">
        <!-- Wrapped content -->
        <slot />

        <!-- Hover-reveal "..." button -->
        <div
          v-if="showMoreButton && actions.length > 0"
          class="absolute z-10"
          :class="positionClasses[moreButtonPosition]"
        >
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                class="inline-flex items-center justify-center rounded-md h-6 w-6 text-muted-foreground bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm opacity-0 group-hover/actionable:opacity-100 transition-opacity duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                @click.stop
              >
                <MoreHorizontal class="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent :align="dropdownAlign" :side="dropdownSide" :class="menuWidth">
              <template v-for="action in actions" :key="action.key">
                <DropdownMenuSeparator v-if="action.separator" />
                <DropdownMenuItem
                  :disabled="action.disabled"
                  :class="{
                    'text-destructive focus:text-destructive focus:bg-destructive/10':
                      action.destructive,
                  }"
                  @click="action.handler"
                >
                  <component :is="action.icon" v-if="action.icon" class="mr-2 h-4 w-4" />
                  <span class="flex-1">{{ action.label }}</span>
                  <DropdownMenuShortcut v-if="action.shortcut">{{
                    action.shortcut
                  }}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </ContextMenuTrigger>

    <ContextMenuContent :class="menuWidth">
      <template v-for="action in actions" :key="action.key">
        <ContextMenuSeparator v-if="action.separator" />
        <ContextMenuItem
          :disabled="action.disabled"
          :class="{
            'text-destructive focus:text-destructive focus:bg-destructive/10': action.destructive,
          }"
          @click="action.handler"
        >
          <component :is="action.icon" v-if="action.icon" class="mr-2 h-4 w-4" />
          <span class="flex-1">{{ action.label }}</span>
          <ContextMenuShortcut v-if="action.shortcut">{{ action.shortcut }}</ContextMenuShortcut>
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import { MoreHorizontal } from 'lucide-vue-next';
import type { MenuAction } from './types';

interface Props {
  /** Menu items rendered in both ContextMenu and DropdownMenu */
  actions: MenuAction[];
  /** Disable right-click trigger (e.g. while dragging) */
  disabled?: boolean;
  /** Show the hover "..." button (default: true) */
  showMoreButton?: boolean;
  /** Extra CSS classes on the wrapper div */
  wrapperClass?: string;
  /** Position of the "..." button */
  moreButtonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** DropdownMenuContent align */
  dropdownAlign?: 'start' | 'center' | 'end';
  /** DropdownMenuContent side */
  dropdownSide?: 'top' | 'right' | 'bottom' | 'left';
  /** Width class for both menus */
  menuWidth?: string;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  showMoreButton: true,
  wrapperClass: '',
  moreButtonPosition: 'top-right',
  dropdownAlign: 'end',
  dropdownSide: 'bottom',
  menuWidth: 'w-48',
});

const positionClasses = {
  'top-right': 'top-2 right-2',
  'top-left': 'top-2 left-2',
  'bottom-right': 'bottom-2 right-2',
  'bottom-left': 'bottom-2 left-2',
} as const;
</script>

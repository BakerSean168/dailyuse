import { reactive, computed, type ComputedRef } from 'vue';

export interface PaletteCommandItem {
  /** Unique id */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon name (lucide) */
  icon?: string;
  /** The group this command belongs to */
  group?: string;
  /** Keyboard shortcut hint, e.g. '⌘D' */
  shortcut?: string;
  /** Action to execute when selected */
  action: () => void;
}

export interface PaletteCommandGroup {
  id: string;
  label: string;
  items: PaletteCommandItem[];
}

interface CommandPaletteState {
  open: boolean;
  search: string;
  /** Static commands that always appear */
  staticCommands: PaletteCommandItem[];
  /** Dynamic commands registered / unregistered by pages */
  dynamicCommands: PaletteCommandItem[];
}

const _state = reactive<CommandPaletteState>({
  open: false,
  search: '',
  staticCommands: [],
  dynamicCommands: [],
});

// ── Internal API for <GlobalCommandPalette /> ──

export function _getCommandPaletteState(): CommandPaletteState {
  return _state;
}

export function _setOpen(value: boolean): void {
  _state.open = value;
  if (!value) _state.search = '';
}

export function _setSearch(value: string): void {
  _state.search = value;
}

// ── Computed: grouped commands ──

function groupCommands(items: PaletteCommandItem[]): PaletteCommandGroup[] {
  const groups = new Map<string, PaletteCommandItem[]>();
  for (const item of items) {
    const key = item.group ?? '操作';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([id, items]) => ({
    id,
    label: id,
    items,
  }));
}

/** Grouped commands for rendering */
export function useCommandGroups(): ComputedRef<PaletteCommandGroup[]> {
  return computed(() => {
    const all = [..._state.staticCommands, ..._state.dynamicCommands];
    return groupCommands(all);
  });
}

// ── Public API ──

/**
 * Open the global command palette. Typically triggered by Ctrl+K / Cmd+K.
 *
 * @example
 * ```ts
 * import { openCommandPalette } from '@dailyuse/ui-vue-shadcn'
 * openCommandPalette()
 * ```
 */
export function openCommandPalette(): void {
  _state.open = true;
  _state.search = '';
}

/**
 * Close the global command palette.
 */
export function closeCommandPalette(): void {
  _setOpen(false);
}

/**
 * Toggle the global command palette (for keybinding usage).
 */
export function toggleCommandPalette(): void {
  _setOpen(!_state.open);
}

/**
 * Register static commands that always appear in the palette.
 * Call once at app startup.
 *
 * @example
 * ```ts
 * registerStaticCommands([
 *   { id: 'nav-home', label: '首页', group: '导航', action: () => router.push('/') },
 *   { id: 'nav-settings', label: '设置', group: '导航', action: () => router.push('/settings') },
 * ])
 * ```
 */
export function registerStaticCommands(commands: PaletteCommandItem[]): void {
  _state.staticCommands = commands;
}

/**
 * Register dynamic commands (e.g. page-specific actions).
 * Returns an unregister function — call it on `onUnmounted` or route leave.
 *
 * @example
 * ```ts
 * import { registerDynamicCommands } from '@dailyuse/ui-vue-shadcn'
 * import { onUnmounted } from 'vue'
 *
 * const unregister = registerDynamicCommands([
 *   { id: 'user-create', label: '新增用户', group: '用户管理', action: openCreateDialog },
 * ])
 * onUnmounted(unregister)
 * ```
 */
export function registerDynamicCommands(commands: PaletteCommandItem[]): () => void {
  const ids = new Set(commands.map((c) => c.id));
  // Remove any existing commands with same ids, then add
  _state.dynamicCommands = [..._state.dynamicCommands.filter((c) => !ids.has(c.id)), ...commands];

  // Return cleanup function
  return () => {
    _state.dynamicCommands = _state.dynamicCommands.filter((c) => !ids.has(c.id));
  };
}

import type { Component } from 'vue';

/**
 * MenuAction — data-driven menu item definition.
 *
 * Used by `ActionableWrapper` to render identical items in both
 * the right-click ContextMenu and the hover-reveal DropdownMenu.
 */
export interface MenuAction {
  /** Unique key for v-for */
  key: string;
  /** Display label */
  label: string;
  /** Lucide icon component (optional) */
  icon?: Component;
  /** Keyboard shortcut hint (optional, display-only) */
  shortcut?: string;
  /** Render with destructive (red) styling */
  destructive?: boolean;
  /** Greyed out and non-interactive */
  disabled?: boolean;
  /** Render a separator line BEFORE this item */
  separator?: boolean;
  /** Click handler */
  handler: () => void;
}

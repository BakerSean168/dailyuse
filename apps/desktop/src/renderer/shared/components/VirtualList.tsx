/**
 * VirtualList Component
 *
 * A reusable component for efficiently rendering large lists using virtual scrolling.
 * It wraps the `useVirtualList` hook to provide a simple, declarative API.
 * Automatically switches between virtualized and standard rendering based on item count.
 *
 * @module renderer/shared/components/VirtualList
 */

import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useVirtualList, type VirtualItem } from '../hooks/useVirtualList';

/**
 * Props for the VirtualList component.
 *
 * @template T The type of the items in the list.
 */
export interface VirtualListProps<T> {
  /** Array of items to render. */
  items: T[];
  /** Function to render each item. */
  renderItem: (item: T, index: number, virtualItem?: VirtualItem) => ReactNode;
  /** Function to generate a unique key for each item. */
  getItemKey: (item: T, index: number) => string | number;
  /** Estimated height of an item in pixels. Defaults to 80. */
  estimateSize?: number;
  /** Number of items to render outside the visible area. Defaults to 5. */
  overscan?: number;
  /** Minimum number of items required to enable virtualization. Defaults to 50. */
  threshold?: number;
  /** CSS class for the scroll container. */
  className?: string;
  /** CSS class for the inner list wrapper. */
  listClassName?: string;
  /** CSS class for each item container. */
  itemClassName?: string;
  /** Function to render content when the list is empty. */
  renderEmpty?: () => ReactNode;
  /** Whether to show the item index (debug/helper). */
  showIndex?: boolean;
  /** Explicit height of the container (e.g., '400px', 500). Defaults to '100%'. */
  height?: string | number;
}

/**
 * Virtual Scrolling List Component.
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={goals}
 *   renderItem={(goal) => <GoalCard goal={goal} />}
 *   getItemKey={(goal) => goal.id}
 *   estimateSize={100}
 *   threshold={30}
 *   height="500px"
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  renderItem,
  getItemKey,
  estimateSize = 80,
  overscan = 5,
  threshold = 50,
  className,
  listClassName,
  itemClassName,
  renderEmpty,
  height = '100%',
}: VirtualListProps<T>) {
  const getKey = useCallback(
    (index: number, item: T) => getItemKey(item, index),
    [getItemKey]
  );

  const {
    parentRef,
    virtualItems,
    isVirtualized,
    getContainerStyle,
    getListStyle,
    getItemStyle,
  } = useVirtualList({
    items,
    estimateSize,
    overscan,
    threshold,
    getItemKey: getKey,
  });

  // Merge container style with explicit height prop
  const containerStyle = useMemo(
    () => ({
      ...getContainerStyle(),
      height: typeof height === 'number' ? `${height}px` : height,
    }),
    [getContainerStyle, height]
  );

  // Render empty state
  if (items.length === 0) {
    return renderEmpty ? (
      <>{renderEmpty()}</>
    ) : (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No data available
      </div>
    );
  }

  // Virtualized rendering mode
  if (isVirtualized) {
    return (
      <div
        ref={parentRef}
        className={`overflow-auto ${className || ''}`}
        style={containerStyle}
      >
        <div className={`relative ${listClassName || ''}`} style={getListStyle()}>
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                className={`absolute w-full ${itemClassName || ''}`}
                style={getItemStyle(virtualItem)}
                data-index={virtualItem.index}
              >
                {renderItem(item, virtualItem.index, virtualItem)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard rendering mode (for small lists)
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {items.map((item, index) => (
        <div key={getItemKey(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

/**
 * Props for the VirtualGroupedList component.
 *
 * @template T Type of items.
 * @template G Type of group (unused in generic but kept for consistency).
 */
export interface VirtualGroupedListProps<T, G> {
  /** Array of grouped data. */
  groups: Array<{
    key: string | number;
    label: string;
    items: T[];
  }>;
  /** Function to render a regular item. */
  renderItem: (item: T, index: number) => ReactNode;
  /** Function to render a group header. */
  renderGroupHeader: (group: { key: string | number; label: string; items: T[] }) => ReactNode;
  /** Function to get a unique key for an item. */
  getItemKey: (item: T) => string | number;
  /** Estimated height of an item. */
  estimateItemSize?: number;
  /** Estimated height of a group header. */
  estimateHeaderSize?: number;
  /** Threshold for enabling virtualization. */
  threshold?: number;
  /** Container CSS class. */
  className?: string;
  /** Container height. */
  height?: string | number;
}

/** Internal type for flattening grouped lists. */
type GroupedItem<T> =
  | { type: 'header'; key: string | number; label: string; itemCount: number }
  | { type: 'item'; data: T; groupKey: string | number };

/**
 * A virtual list that supports grouped data with sticky headers (conceptually, though sticky logic is CSS).
 * Flattens the group structure into a single virtualized list.
 */
export function VirtualGroupedList<T, G>({
  groups,
  renderItem,
  renderGroupHeader,
  getItemKey,
  estimateItemSize = 80,
  estimateHeaderSize = 40,
  threshold = 50,
  className,
  height = '100%',
}: VirtualGroupedListProps<T, G>) {
  // Flatten groups into a single array of items and headers
  const flatItems = useMemo(() => {
    const result: GroupedItem<T>[] = [];
    for (const group of groups) {
      result.push({
        type: 'header',
        key: group.key,
        label: group.label,
        itemCount: group.items.length,
      });
      for (const item of group.items) {
        result.push({
          type: 'item',
          data: item,
          groupKey: group.key,
        });
      }
    }
    return result;
  }, [groups]);

  // Dynamic size estimation based on item type
  const getEstimateSize = useCallback(
    (index: number) => {
      // Note: This logic assumes VirtualList supports dynamic sizing per index,
      // which `useVirtualList` (based on react-virtual) usually does via `estimateSize` function if passed correctly.
      // However, our `VirtualList` currently takes a static number.
      // TODO: Enhance VirtualList to accept `(index: number) => number` for `estimateSize`.
      // For now, using average or static size.
      return estimateItemSize;
    },
    [estimateItemSize]
  );

  const renderGroupedItem = useCallback(
    (item: GroupedItem<T>, index: number) => {
      if (item.type === 'header') {
        return renderGroupHeader({
          key: item.key,
          label: item.label,
          items: groups.find((g) => g.key === item.key)?.items || [],
        });
      }
      return renderItem(item.data, index);
    },
    [renderGroupHeader, renderItem, groups]
  );

  const getKey = useCallback(
    (item: GroupedItem<T>, index: number) => {
      if (item.type === 'header') {
        return `header-${item.key}`;
      }
      return `item-${getItemKey(item.data)}`;
    },
    [getItemKey]
  );

  return (
    <VirtualList
      items={flatItems}
      renderItem={renderGroupedItem}
      getItemKey={getKey}
      estimateSize={estimateItemSize}
      threshold={threshold}
      className={className}
      height={height}
    />
  );
}

/**
 * Shared UI Components
 *
 * Exports all reusable UI components available for the renderer process.
 * Includes layouts, skeletons for loading states, virtual lists, performance optimizations, and sync-related UI.
 *
 * @module renderer/shared/components
 */

// Layout Components
export { Layout } from './Layout';
export * from './layouts';

// Common Components
export * from './common';

// Skeleton Components
export {
  Skeleton,
  DashboardSkeleton,
  StatCardSkeleton,
  GoalCardSkeleton,
  GoalListSkeleton,
  TaskCardSkeleton,
  TaskListSkeleton,
  ScheduleItemSkeleton,
  ReminderItemSkeleton,
  ListItemSkeleton,
  TableSkeleton,
} from './Skeleton';

// Virtual List
export { VirtualList, VirtualGroupedList, type VirtualListProps, type VirtualGroupedListProps } from './VirtualList';

// EPIC-003: Performance Optimization Components
export {
  LazyImage,
  type LazyImageProps,
} from './LazyImage';

// EPIC-004: Sync UI Components
export { SyncStatusIndicator } from './SyncStatusIndicator';
export { ConflictResolverDialog } from './ConflictResolverDialog';
export { SyncConfigWizard } from './SyncConfigWizard';

// EPIC-004: Account Status Components
export { AccountStatusIndicator } from './AccountStatusIndicator';

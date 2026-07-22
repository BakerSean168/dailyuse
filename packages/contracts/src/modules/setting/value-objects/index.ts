/**
 * Setting Value Objects
 *
 * Preference categories and field enums live in Zod preference schemas.
 * Parallel const-enum VOs and the per-key definition registry were retired
 * with packages/editor and the Zod-first preference surface.
 */

// ============ Typed IDs (from primitives) ============
export type { SettingId, SettingGroupId } from '../../../primitives';

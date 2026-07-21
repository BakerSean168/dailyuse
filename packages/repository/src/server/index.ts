/**
 * Canonical repository server seam.
 *
 * Knowledge-runtime composition only. Legacy database Repository/Folder/Resource
 * domain models were removed with the Obsidian vault migration; portable backup
 * of old rows remains in data-portability.
 */

export * from './infrastructure';
export type * from './application';

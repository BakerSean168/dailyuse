/**
 * Item Server DTO
 * Contains all fields including sensitive ones (if any)
 */
import type { ItemEntity } from '../entities';

export interface ItemServerDTO extends ItemEntity {
  // Add server-only fields if any
  version: number;
}

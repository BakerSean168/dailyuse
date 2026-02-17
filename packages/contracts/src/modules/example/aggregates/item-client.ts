/**
 * Item Client DTO
 * Safe for frontend consumption
 */
import type { ItemEntity } from '../entities';

export interface ItemClientDTO extends ItemEntity {
  // Add client-specific computed fields if any
}

/**
 * Item Entity Interface
 */
import type { ItemName } from '../value-objects';

export interface ItemEntity {
  itemId: string;
  name: ItemName;
  createdAt: Date;
  updatedAt: Date;
}

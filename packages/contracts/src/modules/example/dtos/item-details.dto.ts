/**
 * Item Details Composite DTO
 */
import type { ItemClientDTO } from '../aggregates';

export interface ItemDetailsDTO {
  item: ItemClientDTO;
  // Example of composite data
  metadata: {
    viewCount: number;
  };
}

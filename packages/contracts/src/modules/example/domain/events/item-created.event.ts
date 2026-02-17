/**
 * Item Created Event
 */
import type { ItemClientDTO } from '../../aggregates';

export interface ItemCreatedEvent {
  itemId: string;
  payload: {
    item: ItemClientDTO;
  };
  occurredAt: Date;
}

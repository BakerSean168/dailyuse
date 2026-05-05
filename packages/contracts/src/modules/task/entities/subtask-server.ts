import type { SubtaskId } from '../../../primitives';

export interface SubtaskServerDTO {
  id: SubtaskId;
  name: string;
  isCompleted: boolean;
  order: number;
}

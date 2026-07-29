import type { KeyResultClientDTO } from '@memoflow/contracts/goal';

export interface KeyResultDraft {
  id?: KeyResultClientDTO['id'] | string;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  weight?: number;
  importance?: string;
  selected?: boolean;
}

export type KeyResultPreview = KeyResultDraft & {
  selected: boolean;
};

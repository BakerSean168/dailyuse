import type {
  ReminderGroupClientDTO,
  ReminderTemplateClientDTO,
} from '@dailyuse/contracts/reminder';

export type ReminderTemplateViewItem = Pick<
  ReminderTemplateClientDTO,
  'id' | 'name' | 'effectiveEnabled'
>;

export type ReminderTemplateCardModel = Pick<
  ReminderTemplateClientDTO,
  | 'id'
  | 'name'
  | 'description'
  | 'icon'
  | 'color'
  | 'effectiveEnabled'
  | 'groupId'
  | 'trigger'
  | 'createdAt'
  | 'updatedAt'
> & {
  triggerText?: string;
};

export type ReminderGroupOption = Pick<ReminderGroupClientDTO, 'id' | 'name'>;

export interface ReminderGroupFormModel {
  id?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  controlMode: string;
  order?: number;
}

export type ReminderMoveTemplate = Pick<ReminderTemplateClientDTO, 'id' | 'name' | 'groupId'>;

export type ReminderMoveGroup = Pick<
  ReminderGroupClientDTO,
  'id' | 'name' | 'description' | 'icon' | 'enabled'
>;

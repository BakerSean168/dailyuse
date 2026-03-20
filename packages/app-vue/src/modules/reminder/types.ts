export interface ReminderGroupFormModel {
  id?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  controlMode: string;
  enabled?: boolean;
  order?: number;
}
